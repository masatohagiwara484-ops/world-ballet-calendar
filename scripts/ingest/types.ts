/**
 * Ingestion pipeline — shared types.
 *
 * The ingestion job reuses the frozen `Performance` shape (src/lib/types.ts) so
 * scraped rows stay structurally identical to seed rows. `IngestPerformance`
 * layers on the provenance/diff signals migration 003+004 added: where the row
 * came from, how it changed, how much we trust it, and the review gate.
 */
import type { Performance } from '../../src/lib/types'

export type ChangeKind =
  | 'new'
  | 'date-changed'
  | 'price-changed'
  | 'cancelled'
  | 'unchanged'

export type ReviewStatus = 'pending' | 'published' | 'rejected'

/** A normalized performance enriched for ingestion (never reaches the public
 *  unfiltered — review_status gates that). */
export interface IngestPerformance extends Performance {
  /** The listing/feed URL this row was extracted from. */
  source_url?: string
  /** Stable hash of the source-bearing fields — drives cheap change detection. */
  content_hash: string
  /** Extraction confidence: feed = 1.0, LLM reports its own. */
  confidence: number
  /** How this row differs from what the DB already had (set by the differ). */
  change_kind?: ChangeKind
  /** The review gate. Ingestion always writes 'pending'. */
  review_status?: ReviewStatus
  /** Full search document (graph.ts `doc`), written for FTS. */
  search_text?: string
  /** Graph links + structured price, filled by the resolver. */
  work_id?: string
  production_id?: string
  venue_id?: string
  price_min?: number
  price_max?: number
  currency?: string
  price_eur_min?: number
}

/** The minimal snapshot of an existing DB row the differ compares against. */
export interface ExistingRow {
  id: string
  content_hash: string | null
  start_date: string
  end_date: string
  price_range: string | null
}
