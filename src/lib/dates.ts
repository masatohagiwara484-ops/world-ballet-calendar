/**
 * Shared UTC date-string arithmetic for ISO (YYYY-MM-DD) dates.
 * The single home for add-N-days logic — affiliate check-outs, calendar
 * DTEND, and trip-night derivation must all step days identically.
 */

/** ISO date N days after the given one (UTC, no DST surprises). */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Today as an ISO date (UTC). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
