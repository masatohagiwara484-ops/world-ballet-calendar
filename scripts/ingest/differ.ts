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

  const seen = new Set<string>()
  const rows = incoming.map((row) => {
    seen.add(row.id)
    const change_kind = classify(row, existing.get(row.id))
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
