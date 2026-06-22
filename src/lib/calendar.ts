/**
 * Calendar export helpers — "Add to Calendar" for a performance run.
 *
 * Two outputs from one event shape:
 *   • icsContent()       — an RFC 5545 .ics file (Apple Calendar, Outlook, etc.)
 *   • googleCalendarUrl() — a prefilled Google Calendar event link
 *
 * Performances are date-only (we rarely know curtain times), so events are
 * emitted as ALL-DAY runs: DTEND / the Google end date is EXCLUSIVE (last day +
 * 1), which is how both ecosystems represent a multi-day all-day span.
 *
 * Why this matters for growth: a saved calendar entry is a standing, personal
 * reminder that pulls the visitor back when the run approaches — and the act of
 * saving is a low-friction reason to surface première in the user's own tools.
 */

export interface CalendarEvent {
  /** Stable id for the run (used to build the iCal UID). */
  id: string
  title: string
  /** Company / presenter name, appended to the calendar summary. */
  company?: string
  /** ISO YYYY-MM-DD. */
  startDate: string
  /** ISO YYYY-MM-DD; defaults to startDate when absent (single-day run). */
  endDate?: string
  venue?: string
  city?: string
  country?: string
  /** Booking or detail URL, included in the description and URL fields. */
  url?: string
  /** Optional free-text blurb. */
  description?: string
}

/** "2026-10-13" → "20261013" (the date-only form both .ics and Google use). */
function compact(iso: string): string {
  return iso.replace(/-/g, '')
}

/** Add one day to an ISO date (all-day DTEND/Google end date is exclusive). */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Inclusive last day of the run (defaults to the start for single-day runs). */
function lastDay(ev: CalendarEvent): string {
  return ev.endDate && ev.endDate >= ev.startDate ? ev.endDate : ev.startDate
}

/** Human location line from venue / city / country. */
function locationLine(ev: CalendarEvent): string {
  return [ev.venue, ev.city, ev.country].filter(Boolean).join(', ')
}

/** Calendar summary: "Swan Lake — The Royal Ballet". */
function summary(ev: CalendarEvent): string {
  return ev.company ? `${ev.title} — ${ev.company}` : ev.title
}

/** Long description: blurb (if any) followed by the link. */
function details(ev: CalendarEvent): string {
  return [ev.description, ev.url].filter(Boolean).join('\n\n')
}

/** Escape a value for an iCal text field (RFC 5545 §3.3.11). */
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Fold a content line to 75 octets with CRLF + space continuation (RFC 5545). */
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 74) {
    parts.push(' ' + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  if (rest.length) parts.push(' ' + rest)
  return parts.join('\r\n')
}

/** Build a complete .ics document for a single performance run. */
export function icsContent(ev: CalendarEvent): string {
  const loc = locationLine(ev)
  const desc = details(ev)
  // A fixed DTSTAMP keeps re-downloads byte-identical (no spurious updates).
  const dtstamp = `${compact(ev.startDate)}T000000Z`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//premiere//Ballet & Opera Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeICS(ev.id)}@premiere`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${compact(ev.startDate)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(lastDay(ev)))}`,
    `SUMMARY:${escapeICS(summary(ev))}`,
    ...(loc ? [`LOCATION:${escapeICS(loc)}`] : []),
    ...(desc ? [`DESCRIPTION:${escapeICS(desc)}`] : []),
    ...(ev.url ? [`URL:${escapeICS(ev.url)}`] : []),
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n')
}

/** Build a prefilled Google Calendar "create event" URL. */
export function googleCalendarUrl(ev: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary(ev),
    dates: `${compact(ev.startDate)}/${compact(nextDay(lastDay(ev)))}`,
  })
  const loc = locationLine(ev)
  if (loc) params.set('location', loc)
  const desc = details(ev)
  if (desc) params.set('details', desc)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** A safe filename for the downloaded .ics ("swan-lake.ics"). */
export function icsFilename(ev: CalendarEvent): string {
  const base = ev.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'performance'}.ics`
}
