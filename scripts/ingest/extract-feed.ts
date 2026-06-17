/**
 * Feed extractor — the cheap, deterministic, NO-LLM path.
 *
 * Feeds are 10× more robust than scraping HTML and never cost a model call, so
 * the pipeline always prefers them. Supports the three feed kinds a season page
 * commonly exposes: iCal (.ics), RSS/Atom, and inline JSON-LD `Event` objects.
 *
 * Each returns RawPerformance[] in the same shape an adapter's parse() does, so
 * the rest of the pipeline (normalize → resolve → diff) is identical.
 */
import * as cheerio from 'cheerio'
import type { RawPerformance } from '../scrapers/types'

export type FeedKind = 'ical' | 'rss' | 'jsonld'

/** Parse an iCal (.ics) document into raw performances. */
export function extractIcal(ics: string, companySlug: string): RawPerformance[] {
  const out: RawPerformance[] = []
  // Unfold folded lines (RFC 5545: a leading space continues the previous line).
  const unfolded = ics.replace(/\r?\n[ \t]/g, '')
  for (const block of unfolded.split('BEGIN:VEVENT').slice(1)) {
    const body = block.split('END:VEVENT')[0]
    const get = (key: string) => {
      const m = body.match(new RegExp(`^${key}[^:\\n]*:(.*)$`, 'm'))
      return m ? m[1].trim() : undefined
    }
    const title = get('SUMMARY')
    const start = icalDate(get('DTSTART'))
    if (!title || !start) continue
    out.push({
      company_slug: companySlug,
      title,
      start_date: start,
      end_date: icalDate(get('DTEND')) ?? start,
      venue: get('LOCATION'),
      ticket_url: get('URL'),
    })
  }
  return out
}

/** iCal date (YYYYMMDD or YYYYMMDDThhmmssZ) → ISO YYYY-MM-DD. */
function icalDate(v?: string): string | undefined {
  if (!v) return undefined
  const m = v.match(/(\d{4})(\d{2})(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined
}

/** Parse an RSS/Atom feed into raw performances (title + first date found). */
export function extractRss(xml: string, companySlug: string): RawPerformance[] {
  const $ = cheerio.load(xml, { xmlMode: true })
  const out: RawPerformance[] = []
  $('item, entry').each((_, el) => {
    const node = $(el)
    const title = node.find('title').first().text().trim()
    const dateText =
      node.find('pubDate, published, updated, dc\\:date').first().text().trim()
    const start = isoFromLoose(dateText)
    if (!title || !start) return
    out.push({
      company_slug: companySlug,
      title,
      start_date: start,
      ticket_url: node.find('link').first().attr('href') ?? (node.find('link').first().text().trim() || undefined),
    })
  })
  return out
}

/** Extract schema.org Event objects embedded as <script type="application/ld+json">. */
export function extractJsonLd(html: string, companySlug: string): RawPerformance[] {
  const $ = cheerio.load(html)
  const out: RawPerformance[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    let parsed: unknown
    try {
      parsed = JSON.parse($(el).contents().text())
    } catch {
      return
    }
    for (const node of flattenJsonLd(parsed)) {
      const type = String((node['@type'] ?? '')).toLowerCase()
      if (!type.includes('event')) continue
      const title = typeof node.name === 'string' ? node.name : undefined
      const start = isoFromLoose(typeof node.startDate === 'string' ? node.startDate : undefined)
      if (!title || !start) continue
      const offers = node.offers as Record<string, unknown> | undefined
      const location = node.location as Record<string, unknown> | undefined
      out.push({
        company_slug: companySlug,
        title,
        start_date: start,
        end_date: isoFromLoose(typeof node.endDate === 'string' ? node.endDate : undefined) ?? start,
        venue: typeof location?.name === 'string' ? location.name : undefined,
        ticket_url: typeof offers?.url === 'string' ? offers.url : undefined,
        price_range: typeof offers?.price === 'string' || typeof offers?.price === 'number' ? String(offers.price) : undefined,
      })
    }
  })
  return out
}

/** Walk a JSON-LD value (object, array, or @graph) into a flat list of objects. */
function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const graph = obj['@graph']
    if (Array.isArray(graph)) return graph.flatMap(flattenJsonLd)
    return [obj]
  }
  return []
}

/** Best-effort ISO date from an ISO-8601 or RFC-822 string. */
function isoFromLoose(v?: string): string | undefined {
  if (!v) return undefined
  const iso = v.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

/** Dispatch on feed kind. */
export function extractFeed(kind: FeedKind, content: string, companySlug: string): RawPerformance[] {
  if (kind === 'ical') return extractIcal(content, companySlug)
  if (kind === 'rss') return extractRss(content, companySlug)
  return extractJsonLd(content, companySlug)
}
