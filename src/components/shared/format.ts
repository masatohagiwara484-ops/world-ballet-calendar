/** Date formatting helpers (pure, no React). */
import { format, parseISO, isValid } from 'date-fns'

function safeParse(iso: string): Date | null {
  const d = parseISO(iso)
  return isValid(d) ? d : null
}

/** "12 Jun 2026" */
export function formatDay(iso: string): string {
  const d = safeParse(iso)
  return d ? format(d, 'd MMM yyyy') : iso
}

/** "12 – 30 Jun 2026" or "28 Jun – 4 Jul 2026" — a run range. */
export function formatRange(startIso: string, endIso: string): string {
  const start = safeParse(startIso)
  const end = safeParse(endIso)
  if (!start || !end) return `${startIso} – ${endIso}`
  if (startIso === endIso) return format(start, 'd MMM yyyy')

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
  const sameYear = start.getFullYear() === end.getFullYear()

  if (sameMonth) return `${format(start, 'd')} – ${format(end, 'd MMM yyyy')}`
  if (sameYear) return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`
}

/** "June 2026" */
export function formatMonthYear(iso: string): string {
  const d = safeParse(iso)
  return d ? format(d, 'MMMM yyyy') : iso
}
