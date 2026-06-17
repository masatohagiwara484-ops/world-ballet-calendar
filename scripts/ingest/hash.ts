/**
 * Content hashing — the cheap-change-detection primitive.
 *
 * Two hashes matter to the pipeline:
 *   • pageHash()  — over a page's MAIN content, stored on ingest_sources. An
 *     unchanged page hash means SKIP the whole source (no download re-parse, no
 *     LLM spend) on a re-run.
 *   • contentHash() — over the source-bearing fields of one performance, stored
 *     per row. An identical row hash means the differ marks it 'unchanged'
 *     without re-resolving entities.
 *
 * Hashes are deterministic (sorted, normalized) so the same input always yields
 * the same digest across runs and machines.
 */
import { createHash } from 'node:crypto'
import type { Performance } from '../../src/lib/types'

function sha(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex').slice(0, 32)
}

/** Hash a page's main content. Whitespace-collapsed so trivial reflows don't churn. */
export function pageHash(content: string): string {
  return sha(content.replace(/\s+/g, ' ').trim())
}

/** The fields whose change should mark a performance as materially different. */
function fingerprint(p: Performance): string {
  return [
    p.id,
    p.title,
    p.kind,
    p.start_date,
    p.end_date,
    p.venue ?? '',
    p.price_range ?? '',
    p.composer ?? '',
    p.choreographer ?? '',
  ].join('|')
}

/** Stable per-performance content hash. */
export function contentHash(p: Performance): string {
  return sha(fingerprint(p))
}
