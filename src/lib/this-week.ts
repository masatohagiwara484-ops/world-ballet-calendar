/**
 * "This week on stage" — the data behind the shareable weekly card (#10).
 *
 * One source of truth so the /this-week page and its auto-generated OG image
 * always show the same window and the same runs.
 */
import { format, parseISO, isValid } from 'date-fns'
import { getPerformances } from './data'
import type { PerformanceWithCompany } from './types'

function safe(iso: string): Date | null {
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

/** "23 – 29 Jun 2026" (or spanning months/years as needed). */
export function weekRangeLabel(startIso: string, endIso: string): string {
  const s = safe(startIso)
  const e = safe(endIso)
  if (!s || !e) return `${startIso} – ${endIso}`
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const sameYear = s.getFullYear() === e.getFullYear()
  if (sameMonth) return `${format(s, 'd')} – ${format(e, 'd MMM yyyy')}`
  if (sameYear) return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`
  return `${format(s, 'd MMM yyyy')} – ${format(e, 'd MMM yyyy')}`
}

/** Compact per-run label for the card rows: "24 Jun" or "24–28 Jun". */
export function shortRunLabel(startIso: string, endIso: string): string {
  const s = safe(startIso)
  const e = safe(endIso)
  if (!s || !e) return startIso
  if (startIso === endIso) return format(s, 'd MMM')
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  if (sameMonth) return `${format(s, 'd')}–${format(e, 'd MMM')}`
  return `${format(s, 'd MMM')}–${format(e, 'd MMM')}`
}

export interface ThisWeek {
  start: string
  end: string
  rangeLabel: string
  performances: PerformanceWithCompany[]
}

/** This week's window (today → +7 days) and the runs that overlap it. */
export async function getThisWeek(now: Date = new Date()): Promise<ThisWeek> {
  const start = now.toISOString().slice(0, 10)
  const end = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
  const performances = await getPerformances({ start_date: start, end_date: end })
  return { start, end, rangeLabel: weekRangeLabel(start, end), performances }
}
