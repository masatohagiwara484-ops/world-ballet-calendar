/**
 * Generic JSON-API extractor — for houses whose schedule is served as a plain
 * JSON endpoint their SPA fetches (found via `npm run probe:network`). New
 * National Theatre Tokyo is the first: its page loads
 * `/opera/js/performance.json`, an array of productions.
 *
 * Field names differ per house, so the mapping is config-driven (JsonApiConfig)
 * rather than hard-coded — the same extractor serves any flat/lightly-nested
 * JSON feed by pointing it at the right keys. Deterministic, no model call:
 * confidence 1.
 */
import type { RawPerformance } from '../scrapers/types'

export interface JsonApiConfig {
  /** Dot-path to the array of items, when it isn't the JSON root (e.g. 'data.events'). */
  itemsPath?: string
  /** Key holding the production title. */
  titleField: string
  /** Key holding the run's first date. */
  startField: string
  /** Key holding the run's last date (optional → single-day). */
  endField?: string
  /** Preferred booking link key; falls back to urlField. */
  ticketField?: string
  /** Detail-page link key, used as the ticket fallback. */
  urlField?: string
}

/** Read a dot-path ('a.b.c') out of a nested object. */
function dig(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj)
}

/** Normalise the common feed date shapes to strict YYYY-MM-DD. Anything else is
 *  passed through untouched for the downstream date-fns normalizer to attempt. */
function toIsoDate(v: unknown): string | undefined {
  if (v == null) return undefined
  const s = String(v).trim()
  if (!s) return undefined
  const m = /^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})/.exec(s)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return s
}

export function extractJsonApi(json: string, companySlug: string, cfg: JsonApiConfig): RawPerformance[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return []
  }
  const items = cfg.itemsPath ? dig(parsed, cfg.itemsPath) : parsed
  if (!Array.isArray(items)) return []

  const out: RawPerformance[] = []
  for (const raw of items as Record<string, unknown>[]) {
    if (!raw || typeof raw !== 'object') continue
    const title = String(raw[cfg.titleField] ?? '').trim()
    const start_date = toIsoDate(raw[cfg.startField])
    if (!title || !start_date) continue

    const end_date = cfg.endField ? toIsoDate(raw[cfg.endField]) : undefined
    const ticket =
      (cfg.ticketField ? raw[cfg.ticketField] : undefined) ?? (cfg.urlField ? raw[cfg.urlField] : undefined)
    const ticket_url = ticket ? String(ticket).trim() : undefined

    out.push({
      company_slug: companySlug,
      title,
      start_date,
      end_date: end_date ?? start_date,
      ticket_url,
    })
  }
  return out
}
