/**
 * The publish-time safety net — ONE definition, shared by every approval path.
 *
 * Approving a batch (from the terminal or from a Telegram tap) must never be a
 * blind `pending → published`. Three classes of row are hidden instead of
 * published, no matter who approves them:
 *
 *   • cancelled      — a cancellation is confirmed by hiding the row, not by
 *                      publishing "this is cancelled" to the site
 *   • implausible    — year-0026 rows and 200-day "runs" are parser artefacts
 *   • non-performance— costume sales, guided tours, open classes (editorial rule)
 *
 * `scripts/ingest/review-pending.ts` grew these guards first; they live here so
 * the Telegram webhook — now the owner's primary review surface — enforces the
 * identical rules. A row the terminal would refuse to publish can never slip
 * onto the live site just because it was approved from a phone.
 */
import { isNonPerformance } from './ingest-filters'

/** The minimum a row must expose for the guard to judge it. */
export interface GuardableRow {
  id: string
  title: string
  start_date: string
  end_date: string | null
  change_kind: string | null
}

/** Why a row was withheld — surfaced in the CLI output and the Telegram receipt. */
export type HiddenReason = 'cancelled' | 'implausible-date' | 'non-performance'

export interface Partition<T extends GuardableRow> {
  /** Rows safe to publish. */
  publishIds: string[]
  /** Rows to mark `rejected` (hidden) instead. */
  hideIds: string[]
  /** The hidden rows with their reason, for a human-readable receipt. */
  hidden: { row: T; reason: HiddenReason }[]
}

/** A sane performance year — outside this window the date is a parser artefact. */
function isSaneYear(d: string | null): boolean {
  if (!d) return false
  const y = parseInt(d.slice(0, 4), 10)
  return Number.isFinite(y) && y >= 2025 && y <= 2035
}

/**
 * A single production almost never runs longer than ~6 months; a longer span is
 * the signature of two separate engagements merged in error (e.g. a 2026 show
 * and a 2027 show collapsed into one row). Mirrors normalize.ts MAX_RUN_DAYS.
 */
const MAX_SANE_SPAN_DAYS = 200

function hasImplausibleDates(row: GuardableRow): boolean {
  if (!isSaneYear(row.start_date)) return true
  if (row.end_date != null) {
    if (!isSaneYear(row.end_date)) return true
    const span = (Date.parse(row.end_date) - Date.parse(row.start_date)) / 86_400_000
    if (span > MAX_SANE_SPAN_DAYS) return true
  }
  return false
}

/**
 * Split an approved batch into what actually publishes and what gets hidden.
 * Order matters: `cancelled` wins, so a cancellation is never re-labelled as a
 * date problem in the receipt.
 */
export function partitionForPublish<T extends GuardableRow>(rows: T[]): Partition<T> {
  const publishIds: string[] = []
  const hidden: { row: T; reason: HiddenReason }[] = []

  for (const row of rows) {
    if (row.change_kind === 'cancelled') {
      hidden.push({ row, reason: 'cancelled' })
    } else if (hasImplausibleDates(row)) {
      hidden.push({ row, reason: 'implausible-date' })
    } else if (isNonPerformance(row.title)) {
      hidden.push({ row, reason: 'non-performance' })
    } else {
      publishIds.push(row.id)
    }
  }

  return { publishIds, hideIds: hidden.map((h) => h.row.id), hidden }
}

/** One-line human summary of what the guard withheld ('' when it withheld nothing). */
export function describeHidden<T extends GuardableRow>(hidden: Partition<T>['hidden']): string {
  if (hidden.length === 0) return ''
  const counts = new Map<HiddenReason, number>()
  for (const h of hidden) counts.set(h.reason, (counts.get(h.reason) ?? 0) + 1)
  const label: Record<HiddenReason, string> = {
    cancelled: 'cancelled',
    'implausible-date': 'bad dates',
    'non-performance': 'not a performance',
  }
  return [...counts].map(([reason, n]) => `${n} ${label[reason]}`).join(', ')
}
