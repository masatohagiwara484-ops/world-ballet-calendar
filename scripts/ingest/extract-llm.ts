/**
 * LLM extractor — the fallback path for HTML-only sources with no feed.
 *
 * Cost discipline (this is the ONLY place the pipeline spends model tokens):
 *   • called only for feed_kind='html' AND only when the page hash changed
 *     (the orchestrator + ingest_sources cache gate this upstream)
 *   • cheerio strips script/style/nav/footer/head before the call, so we never
 *     ship page chrome — only the listings-bearing text (with booking links).
 *   • claude-haiku-4-5 messages.parse(), Zod-validated — the cheapest viable
 *     model, structured-output mode, output re-validated by the existing scraper
 *     zod schema downstream (we never trust raw model output)
 *
 * Coverage discipline (why a multi-page listing is NOT truncated):
 *   • the page is split into bounded chunks and each chunk is extracted, so a
 *     long "what's on" listing (dozens of productions across paginated content
 *     the browser already loaded) is read end-to-end, not just the first screen.
 *   • results are de-duplicated by (title + start_date) before return.
 *
 * Returns RawPerformance[] in the same shape an adapter's parse() produces.
 */
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import * as cheerio from 'cheerio'
import type { RawPerformance } from '../scrapers/types'
import { PAGE_BREAK } from './fetch-browser'

/** Confidence stamped on every LLM-extracted row. Below the 0.9 auto-approve
 *  threshold by design, so LLM rows always pass through manual review. */
export const LLM_CONFIDENCE = 0.85

/** Characters per model call (~5k tokens of input). Chunking keeps each call
 *  cheap while removing the old single-page truncation that dropped later rows. */
const CHARS_PER_CHUNK = 20_000
/** Hard cap on chunks per page — bounds worst-case cost (8 × ~$0.025 ≈ $0.20). */
const MAX_CHUNKS = 8

const RowSchema = z.object({
  title: z.string(),
  kind: z.enum(['ballet', 'opera']),
  // Free-form date strings; the downstream normalizer parses 11 formats.
  start_date: z.string(),
  end_date: z.string().optional(),
  composer: z.string().optional(),
  choreographer: z.string().optional(),
  venue: z.string().optional(),
  price_range: z.string().optional(),
  // The booking/tickets/event URL for this performance, when the page links it.
  // Surfaced to the model as "(link: …)" inline next to each listing.
  ticket_url: z.string().optional(),
})
const ResultSchema = z.object({ performances: z.array(RowSchema) })

const SYSTEM = [
  'You extract ballet and opera performances from a theatre season / "what\'s on" listing page.',
  'Return EVERY performance that is clearly listed with a date — do not stop early; include all of them, top to bottom.',
  'kind is "ballet" or "opera".',
  'CRITICAL — DATES: output start_date and end_date in strict ISO format YYYY-MM-DD with a 4-digit year (e.g. 2026-10-13). Convert any written date ("Sat 13 Oct 2026", "13.10.2026", "October 13") to this exact format yourself.',
  'Infer the year from the season context (this listing covers the 2026 and 2027 seasons): a month from roughly September–December is 2026, January–August is 2027, unless the page states otherwise. NEVER output a year below 2026 or a 2-digit year.',
  'Each distinct run / engagement is a SEPARATE performance object. Never merge two different date ranges into one.',
  'end_date must be the last day of the SAME continuous run — never a later, separate engagement (e.g. a show in 2026 and another in 2027 are TWO objects, not one spanning 2026→2027).',
  'When a single date is shown, set start_date to it and leave end_date empty.',
  'If a performance links to its booking / tickets / event page, set ticket_url to that absolute URL — it appears in the text as "(link: https://…)" right after the title.',
  'Set venue to the theatre / hall name when it is shown.',
  'Do not invent performances, dates, composers, venues, prices, or links. Omit any field you cannot find on the page.',
].join(' ')

/** Lazily build the Anthropic client; null when unconfigured → no extraction. */
let client: Anthropic | null | undefined
function getClient(): Anthropic | null {
  if (client !== undefined) return client
  const key = process.env.ANTHROPIC_API_KEY
  client = key && !key.includes('placeholder') ? new Anthropic({ apiKey: key }) : null
  return client
}

/** Resolve a possibly-relative href to an absolute URL, or null if impossible. */
function toAbsolute(href: string | undefined, baseUrl?: string): string | null {
  if (!href) return null
  const h = href.trim()
  if (!h || h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('javascript:')) {
    return null
  }
  try {
    if (/^https?:\/\//i.test(h)) return h
    if (!baseUrl) return null
    return new URL(h, baseUrl).toString()
  } catch {
    return null
  }
}

/** Hrefs that look like a specific event/booking page (not site chrome). */
const BOOKING_HREF_RE =
  /ticket|book|event|performance|production|show|whats-?on|calendar|programme|program|season|spectacle|vorstellung/i

/**
 * Strip chrome from a single HTML document and return the listings text with
 * booking links inlined as "(link: …)". Used by trimHtml for each page.
 */
function trimSinglePage(html: string, baseUrl?: string): string {
  const $ = cheerio.load(html)
  $('script, style, nav, footer, head, noscript, svg, iframe').remove()

  $('a[href]').each((_, el) => {
    const $el = $(el)
    const abs = toAbsolute($el.attr('href'), baseUrl)
    if (!abs) return
    // Only annotate links that point at an event/booking page — keeps the text
    // focused and avoids flooding it with menu/social/util links. Match on the
    // PATH (not the host) so "facebook.com" isn't mistaken for a booking link.
    let probe: string
    try {
      const u = new URL(abs)
      probe = `${u.pathname}${u.search}`
    } catch {
      return
    }
    if (BOOKING_HREF_RE.test(probe)) $el.append(` (link: ${abs}) `)
  })

  const main = $('main').first()
  return (main.length ? main : $('body')).text().replace(/\s+/g, ' ').trim()
}

/**
 * Convert rendered HTML to a listings text string ready for the LLM. When the
 * HTML contains PAGE_BREAK markers (multi-page URL-paginated listings), each
 * page is processed independently so every page's <main> is extracted — without
 * this split, cheerio's $('main').first() would see only the first page's
 * content, leaving pages 2-N invisible to the model (the root cause of the
 * Royal Ballet crawl returning only the first ~10 productions).
 */
export function trimHtml(html: string, baseUrl?: string): string {
  if (html.includes(PAGE_BREAK)) {
    return html
      .split(PAGE_BREAK)
      .map((part) => trimSinglePage(part, baseUrl))
      .filter(Boolean)
      .join('\n')
  }
  return trimSinglePage(html, baseUrl)
}

/** Split text into bounded chunks on whitespace boundaries (never mid-word). */
function chunk(text: string, size: number, maxChunks: number): string[] {
  if (text.length <= size) return [text]
  const chunks: string[] = []
  let i = 0
  while (i < text.length && chunks.length < maxChunks) {
    let end = Math.min(i + size, text.length)
    if (end < text.length) {
      const ws = text.lastIndexOf(' ', end)
      if (ws > i) end = ws
    }
    chunks.push(text.slice(i, end))
    i = end
  }
  return chunks
}

/** One Haiku call over a single chunk of listing text. */
async function extractChunk(
  anthropic: Anthropic,
  content: string,
  companySlug: string,
  baseUrl?: string
): Promise<RawPerformance[]> {
  const res = await anthropic.messages.parse({
    model: 'claude-haiku-4-5',
    max_tokens: 8000,
    // Deterministic extraction. Without this, Haiku's default sampling made each
    // run return slightly different titles/prices for the same page, so the
    // differ saw phantom "price-changed"/"date-changed" rows and pushed already-
    // published performances back to pending on every crawl (the churn the owner
    // saw). temperature:0 makes repeat runs stable → genuinely unchanged rows.
    temperature: 0,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(ResultSchema) },
  })
  const parsed = res.parsed_output
  if (!parsed) return []
  return parsed.performances.map((p) => {
    // Absolutize / sanitize the link so the normalizer's .url() check passes
    // (a relative or junk href would otherwise reject the whole row).
    const ticket_url = toAbsolute(p.ticket_url, baseUrl) ?? undefined
    return { ...p, ticket_url, company_slug: companySlug }
  })
}

/**
 * Extract performances from a page of HTML via Haiku. Returns [] (no spend
 * attempted) when ANTHROPIC_API_KEY is unset, so offline/dry runs are safe.
 *
 * The page is chunked so a long, fully-loaded listing is read end-to-end; rows
 * are de-duplicated by (title + start_date) across chunks before return.
 */
export async function extractWithLlm(
  html: string,
  companySlug: string,
  baseUrl?: string
): Promise<RawPerformance[]> {
  const anthropic = getClient()
  if (!anthropic) return []

  const content = trimHtml(html, baseUrl)
  if (!content) return []

  const chunks = chunk(content, CHARS_PER_CHUNK, MAX_CHUNKS)
  if (chunks.length > 1) {
    console.log(`  · extracting ${content.length} chars across ${chunks.length} chunk(s)`)
  }

  const all: RawPerformance[] = []
  for (const c of chunks) {
    try {
      all.push(...(await extractChunk(anthropic, c, companySlug, baseUrl)))
    } catch (err) {
      // One bad chunk must not lose the others — log and keep going.
      console.warn(`  ! chunk extraction failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // De-duplicate across chunk boundaries (a listing item can straddle a split).
  const seen = new Set<string>()
  const deduped: RawPerformance[] = []
  for (const r of all) {
    const key = `${r.title.trim().toLowerCase()}|${(r.start_date ?? '').trim()}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }
  return deduped
}
