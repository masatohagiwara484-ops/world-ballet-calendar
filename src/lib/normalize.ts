/**
 * Normalization helpers — the bridge from messy free-text credits to the clean
 * entity graph. These are pure, dependency-free functions shared by the graph
 * builder (src/lib/graph.ts) and, later, the scraper ingestion pipeline so a
 * scraped "Kenneth MacMillan" resolves to the SAME person id as a seeded one.
 */
import type { PriceBand } from './types'

/** URL-safe slug: lowercased, ASCII-folded, hyphen-separated. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * "Surname, Forename" for alphabetical ordering. Best-effort: takes the last
 * whitespace token as the surname. Particles (van, von, de, della) stay with
 * the surname.
 */
export function sortName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ')
  const parts = clean.split(' ')
  if (parts.length < 2) return clean
  const particles = new Set(['van', 'von', 'de', 'della', 'del', 'di', 'da', 'le', 'la'])
  let i = parts.length - 1
  while (i > 1 && particles.has(parts[i - 1].toLowerCase())) i--
  const surname = parts.slice(i).join(' ')
  const forename = parts.slice(0, i).join(' ')
  return `${surname}, ${forename}`
}

/**
 * A credited name extracted from a free-text credit string, flagged with
 * whether it was an attribution ("after Petipa") vs. a primary author.
 */
export interface ParsedCredit {
  name: string
  /** true when introduced by "after" / "d'après" — i.e. the source author. */
  isAfter: boolean
}

const NOISE =
  /\b(production|version|staging|staged|restaged|revived|revival|new|original|revised|reconstructed|additional|choreography|choreographed|directed|director|by)\b/gi

/**
 * Split a credit field like
 *   "Liam Scarlett after Marius Petipa and Lev Ivanov"
 * into individual people:
 *   [{Liam Scarlett, after:false}, {Marius Petipa, after:true}, {Lev Ivanov, after:true}]
 *
 * Handles separators: "after" / "d'après", "and" / "&", commas, slashes.
 * Returns de-duplicated, trimmed names in source order.
 */
export function parseCredits(raw?: string): ParsedCredit[] {
  if (!raw) return []
  const cleaned = raw.replace(NOISE, ' ').replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  // Partition into the "primary" segment and the "after" segment.
  const afterSplit = cleaned.split(/\s+(?:after|d['’]apr[eè]s|nach)\s+/i)
  const out: ParsedCredit[] = []

  const LEADING_ATTR = /^(?:after|d['’]apr[eè]s|nach)\s+/i
  const pushNames = (segment: string, isAfter: boolean) => {
    segment
      .split(/\s*(?:,|&|\/| and | with | y | et )\s*/i)
      .map((n) => n.trim())
      .map((n) => {
        // A leading "after" survives when the whole credit only names a source
        // ("after Marius Petipa"): strip it and mark the name as attribution.
        if (LEADING_ATTR.test(n)) return { name: n.replace(LEADING_ATTR, '').trim(), after: true }
        return { name: n, after: isAfter }
      })
      .filter((c) => c.name.length > 1 && /[A-Za-zÀ-ÿ]/.test(c.name))
      .forEach((c) => out.push({ name: c.name, isAfter: c.after }))
  }

  pushNames(afterSplit[0] ?? '', false)
  for (let i = 1; i < afterSplit.length; i++) pushNames(afterSplit[i], true)

  // De-dup by normalized name, keeping the first (primary wins over after).
  const seen = new Set<string>()
  return out.filter((c) => {
    const key = slugify(c.name)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const CURRENCY_BY_SYMBOL: Record<string, string> = {
  '£': 'GBP',
  '€': 'EUR',
  '$': 'USD',
  '¥': 'JPY',
  '₩': 'KRW',
  '₽': 'RUB',
  '₣': 'CHF',
  'kr': 'SEK',
}

/**
 * Parse a free-text price range — "£18 – £150", "€25–€210", "$30 - $295",
 * "¥3,000–¥27,000" — into a normalized band. Tolerant of en/em dashes,
 * thousands separators, and a single open-ended value.
 */
export function parsePrice(raw?: string): PriceBand {
  if (!raw) return {}
  const symbolMatch = raw.match(/[£€$¥₩₽₣]|kr/i)
  const currency = symbolMatch ? CURRENCY_BY_SYMBOL[symbolMatch[0].toLowerCase()] ?? CURRENCY_BY_SYMBOL[symbolMatch[0]] : undefined

  const numbers = (raw.match(/\d[\d,.\s]*/g) ?? [])
    .map((n) => Number(n.replace(/[,\s]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0)

  if (numbers.length === 0) return { currency }
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  return { min, max, currency }
}

/**
 * Approximate conversion to a single comparison currency (EUR) so a price
 * filter expressed in one currency can sieve runs priced in another. These are
 * coarse, static rates — good enough for "under €80" style filtering, never
 * shown to the user as a real price.
 */
const TO_EUR: Record<string, number> = {
  EUR: 1,
  GBP: 1.17,
  USD: 0.92,
  JPY: 0.0062,
  KRW: 0.00069,
  RUB: 0.0098,
  CHF: 1.04,
  SEK: 0.088,
}

export function toEur(amount: number, currency?: string): number {
  const rate = currency ? TO_EUR[currency] ?? 1 : 1
  return amount * rate
}

/** Leading articles to fold so "The Nutcracker" merges with "Nutcracker". */
const LEADING_ARTICLE =
  /^(the|le|la|les|l['’]|der|die|das|den|il|lo|gli|i|el|los|las|un|une|une?)\s+/i

/**
 * Stable merge key for a work title: lowercased, article-stripped, slugified.
 * Used to unify the same work staged by different companies into one Work,
 * which is what powers the "every Swan Lake on earth" cross-cut. The original
 * title is preserved for display; only the grouping key is folded.
 */
export function workTitleKey(title: string): string {
  return slugify(title.trim().replace(LEADING_ARTICLE, ''))
}
