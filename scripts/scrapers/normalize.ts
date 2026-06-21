/**
 * Scraper normalizer.
 *
 * Turns loosely-typed RawPerformance records (from adapters) into validated
 * Performance records ready to upsert. Responsibilities:
 *   - parse human date strings into ISO YYYY-MM-DD using date-fns
 *   - coerce / default fields
 *   - validate with zod and REJECT invalid rows (never throw on bad input)
 *   - derive a stable id when an adapter doesn't supply one
 *
 * normalizeMany() returns the valid rows plus a list of rejection reasons so
 * the CLI / workflow can report what was dropped without crashing.
 */
import { z } from 'zod'
import { parse as parseDate, isValid, format } from 'date-fns'
import type { Performance } from '../../src/lib/types'
import type { RawPerformance } from './types'

/** Longest plausible single-production run (days). Beyond this, a row is almost
 *  certainly two separate engagements merged in error and is rejected. */
const MAX_RUN_DAYS = 200

/** Date formats we accept from scraped pages, in priority order. */
const DATE_FORMATS = [
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'yyyy.MM.dd', // Asian dot-notation, year-first (e.g. "2026.06.21")
  'd MMMM yyyy',
  'dd MMMM yyyy',
  // Day-with-period + full month name (Danish/German/Dutch: "21. juni 2026").
  // Non-English month names are mapped to English before parsing (see toIsoDate),
  // because date-fns in the 'en' locale only matches English month names.
  'd. MMMM yyyy',
  'dd. MMMM yyyy',
  'd MMM yyyy',
  'dd MMM yyyy',
  'MMMM d, yyyy',
  'MMMM d yyyy',
  'MMM d, yyyy',
  'MMM d yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'd/M/yyyy',
  'M/d/yyyy',
  'dd.MM.yyyy',
  'd.M.yyyy',
  'dd-MM-yyyy',
  // Two-digit-year variants (date-fns maps 'yy' to the current century).
  'dd.MM.yy',
  'd.M.yy',
  'dd/MM/yy',
  'MM/dd/yy',
]

/** Leading weekday tokens (English / German / French, abbreviated or full) that
 *  some calendars prefix to a date ("Sat, 21 Jun 2026", "Samstag 21.06.2026",
 *  "Sa. 21.06."). Stripped before parsing so the date itself can be read. */
const WEEKDAY_PREFIX_RE =
  /^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun|mar|mer|jeu|ven|sam|dim)\.?,?\s+/i

/** Correct a 2-digit / zero-padded low year to the 2000s ("26"/"0026" → 2026).
 *  The crawl only ever ingests current/future seasons, so a sub-100 year is
 *  always a stripped century, never a literal year 26 AD. */
function fixLowYear(year: number): number {
  return year < 100 ? 2000 + year : year
}

/** Apply the low-year correction to a parsed Date in place-safe fashion. */
function withFixedYear(d: Date): Date {
  const y = d.getFullYear()
  if (y >= 100) return d
  const nd = new Date(d)
  nd.setFullYear(fixLowYear(y))
  return nd
}

/** Non-English month names → English. date-fns in the 'en' locale only parses
 *  English month names, so Danish / Dutch / German listings (juni, maart, März,
 *  dezember…) are rewritten to English before the format list runs. Keys are
 *  lowercased; matching is case-insensitive and whole-word. */
const MONTH_NAME_MAP: Record<string, string> = {
  // Danish / Dutch (overlapping spellings collapse to the same English month)
  januar: 'January',
  januari: 'January',
  februar: 'February',
  februari: 'February',
  marts: 'March',
  maart: 'March',
  maj: 'May',
  mei: 'May',
  juni: 'June',
  juli: 'July',
  oktober: 'October',
  // German (only the spellings that differ from the entries above)
  märz: 'March',
  mai: 'May',
  dezember: 'December',
  // Shared spellings across Danish / Dutch / German and close to English
  april: 'April',
  august: 'August',
  september: 'September',
  november: 'November',
  december: 'December',
}

const MONTH_NAME_RE = new RegExp(
  `\\b(${Object.keys(MONTH_NAME_MAP).join('|')})\\b`,
  'gi'
)

/** Rewrite any non-English month name in a date string to its English form. */
function anglicizeMonths(raw: string): string {
  return raw.replace(MONTH_NAME_RE, (m) => MONTH_NAME_MAP[m.toLowerCase()] ?? m)
}

/** Parse a free-form date string to ISO (YYYY-MM-DD), or null if unparseable. */
export function toIsoDate(input: string | undefined): string | null {
  if (!input) return null
  let raw = input.trim()
  if (!raw) return null
  // Drop a leading weekday name so "Sat, 21 Jun 2026" parses as "21 Jun 2026".
  raw = raw.replace(WEEKDAY_PREFIX_RE, '').trim()
  if (!raw) return null

  // Japanese dates ("2026年6月21日") — convert to ISO directly; date-fns can't
  // parse the CJK era/month/day markers.
  const jpMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (jpMatch) {
    const year = fixLowYear(parseInt(jpMatch[1], 10))
    const month = jpMatch[2].padStart(2, '0')
    const day = jpMatch[3].padStart(2, '0')
    const candidate = `${String(year).padStart(4, '0')}-${month}-${day}`
    const d = new Date(candidate)
    return Number.isNaN(d.getTime()) ? null : candidate
  }

  // Map Danish / Dutch / German month names to English so the locale-bound
  // date-fns format list (and the native fallback) can read them.
  raw = anglicizeMonths(raw)

  // ISO-shaped (accept a 1–4 digit year so a stripped "0026" is recoverable).
  const isoMatch = raw.match(/^(\d{1,4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const year = fixLowYear(parseInt(isoMatch[1], 10))
    const candidate = `${String(year).padStart(4, '0')}-${isoMatch[2]}-${isoMatch[3]}`
    const d = new Date(candidate)
    return Number.isNaN(d.getTime()) ? null : candidate
  }

  for (const fmt of DATE_FORMATS) {
    const parsed = parseDate(raw, fmt, new Date())
    if (isValid(parsed)) return format(withFixedYear(parsed), 'yyyy-MM-dd')
  }

  // Last resort: the JS engine's own parser handles many residual shapes
  // ("June 21, 2026", "21 Jun 2026 19:30"). Only trusted after the explicit
  // formats above, so well-known ambiguous cases are already resolved.
  const native = new Date(raw)
  if (!Number.isNaN(native.getTime())) {
    return format(withFixedYear(native), 'yyyy-MM-dd')
  }
  return null
}

/** kebab-case a string for id derivation. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const PerformanceSchema = z
  .object({
    id: z.string().min(1),
    company_id: z.string().min(1),
    company_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    title_original: z.string().min(1).optional(),
    kind: z.enum(['ballet', 'opera']),
    composer: z.string().min(1).optional(),
    choreographer: z.string().min(1).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    venue: z.string().min(1).optional(),
    ticket_url: z.string().url().optional(),
    affiliate_url: z.string().url().optional(),
    description: z.string().min(1).optional(),
    image_url: z.string().url().optional(),
    price_range: z.string().min(1).optional(),
    is_featured: z.boolean(),
  })
  .refine((p) => p.end_date >= p.start_date, {
    message: 'end_date must be >= start_date',
    path: ['end_date'],
  })

export interface NormalizeResult {
  valid: Performance[]
  rejected: { raw: RawPerformance; reason: string }[]
}

/**
 * Normalize a single raw record. Returns the Performance or a rejection
 * reason. companyId maps the adapter's slug to the canonical company id.
 */
export function normalizeOne(
  raw: RawPerformance,
  companyId: string
): { ok: true; value: Performance } | { ok: false; reason: string } {
  const start = toIsoDate(raw.start_date)
  if (!start) {
    return { ok: false, reason: `unparseable start_date "${raw.start_date}"` }
  }
  // Default a missing end_date to the start date (single-day run).
  const end = toIsoDate(raw.end_date) ?? start

  // Sanity guard: a single production almost never runs longer than a few weeks.
  // A span beyond ~6 months is the signature of two SEPARATE engagements wrongly
  // merged into one row (e.g. a 2026 show and a 2027 show collapsed to
  // 2026→2027). Reject rather than publish a fabricated multi-year run — better a
  // missing row the next clean crawl re-adds than a wrong one on the live site.
  const spanDays = (Date.parse(end) - Date.parse(start)) / 86_400_000
  if (spanDays > MAX_RUN_DAYS) {
    return {
      ok: false,
      reason: `implausible run span (${Math.round(spanDays)}d > ${MAX_RUN_DAYS}d) — likely two merged engagements`,
    }
  }

  const kindRaw = (raw.kind ?? '').toLowerCase().trim()
  const kind = kindRaw === 'ballet' || kindRaw === 'opera' ? kindRaw : undefined
  if (!kind) {
    return { ok: false, reason: `invalid kind "${raw.kind ?? ''}"` }
  }

  const title = (raw.title ?? '').trim()
  if (!title) return { ok: false, reason: 'missing title' }

  const id =
    raw.id?.trim() ||
    `p-${raw.company_slug}-${slugify(title)}-${start.slice(0, 4)}`

  const candidate: Performance = {
    id,
    company_id: companyId,
    company_slug: raw.company_slug,
    title,
    title_original: raw.title_original?.trim() || undefined,
    kind,
    composer: raw.composer?.trim() || undefined,
    choreographer: raw.choreographer?.trim() || undefined,
    start_date: start,
    end_date: end,
    venue: raw.venue?.trim() || undefined,
    ticket_url: raw.ticket_url?.trim() || undefined,
    price_range: raw.price_range?.trim() || undefined,
    is_featured: raw.is_featured ?? false,
  }

  const result = PerformanceSchema.safeParse(candidate)
  if (!result.success) {
    const reason = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return { ok: false, reason }
  }
  return { ok: true, value: result.data as Performance }
}

/**
 * Normalize a batch. companyIdBySlug resolves slugs to canonical ids; a row
 * whose company slug is unknown is rejected rather than thrown.
 */
export function normalizeMany(
  raws: RawPerformance[],
  companyIdBySlug: Map<string, string>
): NormalizeResult {
  const valid: Performance[] = []
  const rejected: { raw: RawPerformance; reason: string }[] = []

  for (const raw of raws) {
    const companyId = companyIdBySlug.get(raw.company_slug)
    if (!companyId) {
      rejected.push({ raw, reason: `unknown company_slug "${raw.company_slug}"` })
      continue
    }
    const res = normalizeOne(raw, companyId)
    if (res.ok) valid.push(res.value)
    else rejected.push({ raw, reason: res.reason })
  }

  return { valid, rejected }
}
