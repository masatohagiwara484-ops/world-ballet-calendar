/**
 * WordPress "admin-ajax.php" calendar extractor.
 *
 * Some houses' season listing is not server-rendered HTML at all: it's a
 * client-side FullCalendar widget whose own JS POSTs to `admin-ajax.php` and
 * paints the JSON response. American Ballet Theatre is the proven case — its
 * `<main>` is an empty shell, the real listing lives only in this JSON, and
 * no amount of HTML-scoping or LLM prompting can recover data that was never
 * in the rendered page.
 *
 * Replicating the browser's own POST body (the exact category/taxonomy
 * checkboxes it sends, all checked by default) gets the SAME JSON the widget
 * renders — deterministically, with no page to parse and no model call. This
 * is the wp-ajax counterpart to the iCal/RSS/JSON-LD feed paths: confidence 1.
 *
 * Each returned row is ONE performance date/time (a calendar-grid shape,
 * exactly like the per-night rows an iCal feed emits); collapseProductions()
 * in run-ingest.ts merges same-title rows into a single run, unchanged.
 */
import type { RawPerformance } from '../scrapers/types'

interface WpCalendarEvent {
  title?: string
  start?: string
  categoryLabel?: string
  popup?: string
}

/** Pull the first regex capture out of the event's popup HTML, if present. */
function popupField(popup: string, re: RegExp): string | undefined {
  const m = re.exec(popup)
  const v = m?.[1]?.trim()
  return v ? v : undefined
}

const VENUE_RE = /<p class="venue">([^<]*)<\/p>/
// Prefer the venue's own box-office link ("Ticket Info"); fall back to the
// house's own event page ("More Info") when no external ticket link exists.
const TICKET_RE = /<a href="([^"]+)"[^>]*>\s*Ticket Info\s*<\/a>/i
const MORE_INFO_RE = /<a href="([^"]+)"[^>]*>\s*More Info\s*<\/a>/i

/**
 * Parse the admin-ajax.php JSON body into RawPerformance rows, keeping only
 * events tagged with the given category label (e.g. "Performance") — this is
 * what drops the Training/Community/Opportunities noise that shares the same
 * calendar without a separate listing page.
 */
export function extractWpCalendar(
  json: string,
  companySlug: string,
  categoryLabel: string
): RawPerformance[] {
  let events: unknown
  try {
    events = JSON.parse(json)
  } catch {
    return []
  }
  if (!Array.isArray(events)) return []

  const wanted = categoryLabel.toLowerCase()
  const out: RawPerformance[] = []
  for (const raw of events as WpCalendarEvent[]) {
    if (!raw.title || !raw.start) continue
    if ((raw.categoryLabel ?? '').toLowerCase() !== wanted) continue

    const start_date = raw.start.split('T')[0]
    if (!start_date) continue

    const popup = raw.popup ?? ''
    out.push({
      company_slug: companySlug,
      title: raw.title.trim(),
      kind: 'ballet',
      start_date,
      end_date: start_date,
      venue: popupField(popup, VENUE_RE),
      ticket_url: popupField(popup, TICKET_RE) ?? popupField(popup, MORE_INFO_RE),
    })
  }
  return out
}
