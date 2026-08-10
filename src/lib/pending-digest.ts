/**
 * "What is waiting for me right now?" — the review queue, pushed to Telegram.
 *
 * The crawl sends a digest for the changes IT just found, and only at the moment
 * it finds them. That leaves the owner reading `npm run review:pending` in a
 * terminal for anything already sitting in the queue. This module closes that
 * gap: it reads every `review_status='pending'` row, groups it by house, and
 * sends the same Approve / Reject / Details digest on demand.
 *
 * Shared deliberately by both entry points so they can never drift:
 *   • `npm run review:telegram`      (scripts/ingest/review-telegram.ts)
 *   • `/pending` typed in the chat   (src/app/api/telegram/webhook/route.ts)
 *
 * Batch ids are the standing key `pending:<slug>` rather than a run id: re-asking
 * for the queue UPDATES that house's batch instead of accumulating dead ones, and
 * keeps `callback_data` comfortably inside Telegram's 64-byte ceiling.
 */
// Relative imports (not the `@/` alias) so this module resolves identically in
// the Next build and under `tsx` when the CLI script pulls it in.
import type { SupabaseClient } from '@supabase/supabase-js'
import { companies } from '../data/companies'
import { formatDigest, sendDigest, type DigestLine } from './telegram'

/** Every field the digest and the Details view need, in one read. */
export const PENDING_COLUMNS =
  'id, company_slug, title, kind, start_date, end_date, venue, price_range, ticket_url, affiliate_url, confidence, change_kind, source_url'

export interface PendingRow {
  id: string
  company_slug: string
  title: string
  kind: string
  start_date: string
  end_date: string | null
  venue: string | null
  price_range: string | null
  ticket_url: string | null
  affiliate_url: string | null
  confidence: number | null
  change_kind: string | null
  source_url: string | null
}

export interface PushResult {
  /** Houses with something pending. */
  companies: number
  /** Pending rows across those houses. */
  rows: number
  /** Digests actually delivered. */
  sent: number
  /** Company slugs whose digest failed to send, with the reason. */
  failed: { slug: string; reason: string }[]
}

/** The standing batch id for a house's on-demand review queue. */
export function pendingBatchId(slug: string): string {
  return `pending:${slug}`
}

/** Load the pending queue, oldest performance first, optionally for one house. */
export async function fetchPending(
  client: SupabaseClient,
  slug?: string
): Promise<PendingRow[]> {
  let query = client
    .from('performances')
    .select(PENDING_COLUMNS)
    .eq('review_status', 'pending')
    .order('company_slug')
    .order('start_date')
  if (slug) query = query.eq('company_slug', slug)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as PendingRow[]
}

/** Group rows by house, preserving the query's ordering. */
export function groupByCompany(rows: PendingRow[]): Map<string, PendingRow[]> {
  const byCompany = new Map<string, PendingRow[]>()
  for (const row of rows) {
    const list = byCompany.get(row.company_slug) ?? []
    list.push(row)
    byCompany.set(row.company_slug, list)
  }
  return byCompany
}

/** The house's display name, falling back to its slug for a not-yet-curated house. */
export function companyName(slug: string): string {
  return companies.find((c) => c.slug === slug)?.name ?? slug
}

/** Turn pending rows into digest lines (no `was` — the previous date isn't kept here). */
function toDigestLines(rows: PendingRow[]): DigestLine[] {
  return rows.map((r) => ({
    change_kind: r.change_kind ?? 'new',
    title: r.title,
    start_date: r.start_date,
    end_date: r.end_date ?? r.start_date,
    kind: r.kind,
    price: r.price_range,
    confidence: r.confidence,
  }))
}

/** Upsert the standing batch so a tap on the digest can find these exact rows. */
async function recordPendingBatch(
  client: SupabaseClient,
  batch: {
    id: string
    company_slug: string
    run_id: string
    telegram_chat_id: string
    telegram_message_id: string | null
    performance_ids: string[]
    counts: Record<string, number>
  }
): Promise<void> {
  const { error } = await client
    .from('ingest_batches')
    .upsert({ ...batch, status: 'sent' }, { onConflict: 'id' })
  if (error) throw new Error(error.message)
}

/**
 * Send one digest per house for everything currently pending.
 *
 * Never throws for a single bad house — a failed send is reported in `failed` so
 * one unreachable digest can't hide the rest of the queue.
 */
export async function pushPendingDigests(
  client: SupabaseClient,
  chatId: string,
  opts: { slug?: string } = {}
): Promise<PushResult> {
  const rows = await fetchPending(client, opts.slug)
  const byCompany = groupByCompany(rows)
  const runId = `manual-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`

  const result: PushResult = { companies: byCompany.size, rows: rows.length, sent: 0, failed: [] }

  for (const [slug, list] of byCompany) {
    const batchId = pendingBatchId(slug)
    const counts: Record<string, number> = {}
    for (const r of list) counts[r.change_kind ?? 'new'] = (counts[r.change_kind ?? 'new'] ?? 0) + 1
    const sourceUrl = list.find((r) => r.source_url)?.source_url ?? undefined

    try {
      const text = formatDigest({
        companyName: companyName(slug),
        runId,
        batchId,
        lines: toDigestLines(list),
        sourceUrl,
      })
      const messageId = await sendDigest(chatId, text, batchId, sourceUrl)
      await recordPendingBatch(client, {
        id: batchId,
        company_slug: slug,
        run_id: runId,
        telegram_chat_id: chatId,
        telegram_message_id: messageId,
        performance_ids: list.map((r) => r.id),
        counts,
      })
      result.sent += 1
    } catch (err) {
      result.failed.push({ slug, reason: err instanceof Error ? err.message : String(err) })
    }
  }

  return result
}
