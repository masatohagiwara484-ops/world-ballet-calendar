/**
 * The Differ — classifies each incoming performance against what the DB already
 * holds for the same source, and detects cancellations.
 *
 * Pure & deterministic: it takes the incoming normalized rows plus a snapshot of
 * existing rows keyed by id, and returns the same rows tagged with a
 * `change_kind`, plus synthetic 'cancelled' rows for ids that were previously
 * seen from this source but are absent this run.
 *
 * TRUST RULE (enforced downstream, asserted here for clarity): 'date-changed'
 * and 'cancelled' ALWAYS route to manual review — they are the changes that
 * break a traveller's plans, so they are never auto-approved.
 */
import type { ChangeKind, ExistingRow, IngestPerformance } from './types'

export interface DiffOutcome {
  /** Incoming rows, each tagged with its change_kind. */
  rows: IngestPerformance[]
  /** Previously-seen rows now absent — emitted as pending 'cancelled'. */
  cancelled: IngestPerformance[]
  /** Tally per change_kind for the Telegram digest / run summary. */
  counts: Record<ChangeKind, number>
}

/** Classify one incoming row against its existing counterpart (if any). */
export function classify(
  incoming: IngestPerformance,
  existing: ExistingRow | undefined
): ChangeKind {
  if (!existing) return 'new'
  // Cheapest signal first: an identical content hash means nothing material
  // changed, even if unrelated fields drifted.
  if (existing.content_hash && existing.content_hash === incoming.content_hash) {
    return 'unchanged'
  }
  if (
    existing.start_date !== incoming.start_date ||
    existing.end_date !== incoming.end_date
  ) {
    return 'date-changed'
  }
  if ((existing.price_range ?? '') !== (incoming.price_range ?? '')) {
    return 'price-changed'
  }
  return 'unchanged'
}

/**
 * Diff a run's incoming rows for a single source against the DB snapshot.
 *
 * @param incoming   normalized + enriched rows extracted this run
 * @param existing   every row the DB currently has for THIS source, by id
 */
export function diffRun(
  incoming: IngestPerformance[],
  existing: Map<string, ExistingRow>
): DiffOutcome {
  const counts: Record<ChangeKind, number> = {
    new: 0,
    'date-changed': 0,
    'price-changed': 0,
    cancelled: 0,
    unchanged: 0,
  }

  // Pass 1 — match on id (the title-derived slug).
  const matched = incoming.map((row) => ({ row, ex: existing.get(row.id) }))
  const seen = new Set<string>()
  for (const m of matched) if (m.ex) seen.add(m.row.id)

  /*
   * Pass 2 — TITLE-DRIFT RESCUE.
   *
   * Ids are derived from the title, and the LLM's title for the SAME production
   * drifts slightly between runs ("TanzTanzTanz" → "Tanz Tanz" at Staatsballett
   * Berlin; "MITTSU" → "MITTSU: Virginia Woolf" at Hamburg). The drifted row
   * looks brand new while the original looks cancelled, so one production ends
   * up on the site TWICE. A production whose run dates match an otherwise-
   * cancelled row exactly is that same production re-titled: adopt the existing
   * id so it diffs as a normal update instead of a phantom new + cancellation.
   *
   * Deliberately strict — BOTH dates must match exactly, and each orphan can be
   * claimed only once — so two genuinely different programmes never merge.
   */
  const orphansByDates = new Map<string, string>()
  for (const [id, ex] of existing) {
    if (seen.has(id)) continue
    const key = `${ex.start_date}|${ex.end_date}`
    if (!orphansByDates.has(key)) orphansByDates.set(key, id)
  }
  const rescued = new Set<string>()
  for (const m of matched) {
    if (m.ex) continue
    const key = `${m.row.start_date}|${m.row.end_date}`
    const orphanId = orphansByDates.get(key)
    if (!orphanId) continue
    orphansByDates.delete(key)
    rescued.add(orphanId)
    seen.add(orphanId)
    m.row = { ...m.row, id: orphanId }
    m.ex = existing.get(orphanId)
  }

  const rows = matched.map(({ row, ex }) => {
    const change_kind = classify(row, ex)
    counts[change_kind] += 1
    return { ...row, change_kind, review_status: 'pending' as const }
  })

  // Cancellations: ids the DB had for this source that did not appear this run.
  const cancelled: IngestPerformance[] = []
  for (const [id, ex] of existing) {
    if (seen.has(id)) continue
    counts.cancelled += 1
    cancelled.push({
      id,
      // The cancelled marker carries only what we can know; the row already
      // exists in the DB, so the publisher updates it in place.
      company_id: '',
      company_slug: '',
      title: '',
      kind: 'ballet',
      start_date: ex.start_date,
      end_date: ex.end_date,
      is_featured: false,
      content_hash: ex.content_hash ?? '',
      confidence: 1,
      change_kind: 'cancelled',
      review_status: 'pending',
    })
  }

  return { rows, cancelled, counts }
}
