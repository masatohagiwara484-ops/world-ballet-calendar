/**
 * Scraper platform — shared contracts.
 *
 * Each company gets one ScraperAdapter. An adapter knows how to turn a page
 * of HTML from that company's website into a list of RawPerformance records.
 * Adapters are deliberately dumb: they extract strings and let the shared
 * normalizer (./normalize.ts) validate, parse dates, and reject bad rows.
 */

/** A loosely-typed performance straight out of an adapter's parser. */
export interface RawPerformance {
  /** Stable, human-readable id, e.g. 'p-rb-swan-lake-2026'. */
  id?: string
  company_slug: string
  title: string
  title_original?: string
  /** 'ballet' | 'opera' — adapters should set this explicitly. */
  kind?: string
  composer?: string
  choreographer?: string
  /** Free-form date strings; the normalizer parses them with date-fns. */
  start_date: string
  end_date?: string
  venue?: string
  ticket_url?: string
  price_range?: string
  is_featured?: boolean
}

export interface ScraperAdapter {
  /** Company slug — must match a slug in src/data/companies.ts. */
  companySlug: string
  /** The live URL this adapter fetches in --live mode. */
  sourceUrl: string
  /** Parse a page of HTML into raw performance records. Must not throw. */
  parse(html: string): RawPerformance[]
}
