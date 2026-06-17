/**
 * LLM extractor — the fallback path for HTML-only sources with no feed.
 *
 * Cost discipline (this is the ONLY place the pipeline spends model tokens):
 *   • called only for feed_kind='html' AND only when the page hash changed
 *     (the orchestrator + ingest_sources cache gate this upstream)
 *   • cheerio strips script/style/nav/footer/head and caps input length before
 *     the call, so we never ship a whole bloated page
 *   • one claude-haiku-4-5 messages.parse() call, Zod-validated — the cheapest
 *     viable model, structured-output mode, output re-validated by the existing
 *     scraper zod schema downstream (we never trust raw model output)
 *
 * Returns RawPerformance[] in the same shape an adapter's parse() produces.
 */
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import * as cheerio from 'cheerio'
import type { RawPerformance } from '../scrapers/types'

/** Confidence stamped on every LLM-extracted row. Below the 0.9 auto-approve
 *  threshold by design, so LLM rows always pass through manual review. */
export const LLM_CONFIDENCE = 0.85

/** Hard cap on characters sent to the model (≈6k tokens) — bounds cost. */
const MAX_CHARS = 24_000

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
})
const ResultSchema = z.object({ performances: z.array(RowSchema) })

const SYSTEM = [
  'You extract ballet and opera performances from a theatre season page.',
  'Return ONLY performances that are clearly listed with a date.',
  'kind is "ballet" or "opera". Use the dates exactly as written on the page.',
  'Do not invent performances, dates, composers, or prices. Omit fields you cannot find.',
].join(' ')

/** Lazily build the Anthropic client; null when unconfigured → no extraction. */
let client: Anthropic | null | undefined
function getClient(): Anthropic | null {
  if (client !== undefined) return client
  const key = process.env.ANTHROPIC_API_KEY
  client = key && !key.includes('placeholder') ? new Anthropic({ apiKey: key }) : null
  return client
}

/** Strip chrome and collapse to the listings-bearing text, capped. */
export function trimHtml(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, nav, footer, head, noscript, svg, iframe').remove()
  const main = $('main').first()
  const text = (main.length ? main : $('body')).text().replace(/\s+/g, ' ').trim()
  return text.slice(0, MAX_CHARS)
}

/**
 * Extract performances from a page of HTML via Haiku. Returns [] (no spend
 * attempted) when ANTHROPIC_API_KEY is unset, so offline/dry runs are safe.
 */
export async function extractWithLlm(
  html: string,
  companySlug: string
): Promise<RawPerformance[]> {
  const anthropic = getClient()
  if (!anthropic) return []

  const content = trimHtml(html)
  if (!content) return []

  const res = await anthropic.messages.parse({
    model: 'claude-haiku-4-5',
    max_tokens: 8000,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
    output_config: { format: zodOutputFormat(ResultSchema) },
  })

  const parsed = res.parsed_output
  if (!parsed) return []
  return parsed.performances.map((p) => ({ ...p, company_slug: companySlug }))
}
