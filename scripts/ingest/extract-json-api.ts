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

/** Last path segment of a detail URL, as a stable latin slug. Gives NNTT-style
 *  houses a meaningful, stable id even when the title is non-latin (a Japanese
 *  title slugifies to empty, collapsing every production to `p-company--year`). */
function urlSlug(u: unknown): string {
  if (!u) return ''
  try {
    const path = new URL(String(u)).pathname.replace(/\/+$/, '')
    const seg = path.split('/').filter(Boolean).pop() ?? ''
    return seg.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  } catch {
    return ''
  }
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
    const detailUrl = cfg.urlField ? raw[cfg.urlField] : undefined
    const ticket = (cfg.ticketField ? raw[cfg.ticketField] : undefined) ?? detailUrl
    const ticket_url = ticket ? String(ticket).trim() : undefined

    // Stable id from the detail-page slug when available, so non-latin titles
    // don't collapse to `p-company--year`. Falls back (id undefined) to the
    // normalizer's title-slug for latin-title feeds.
    const slug = urlSlug(detailUrl)
    const id = slug ? `p-${companySlug}-${slug}-${start_date.slice(0, 4)}` : undefined

    out.push({
      id,
      company_slug: companySlug,
      title,
      start_date,
      end_date: end_date ?? start_date,
      ticket_url,
    })
  }
  return out
}
