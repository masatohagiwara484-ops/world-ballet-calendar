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
import { clearKeyboard, formatDigest, sendDigest, type DigestLine } from './telegram'

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
  /** Houses left unsent because `limit` was reached — ask again to get them. */
  remaining: number
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

/**
 * Retire the previous message for this standing batch, if there is one.
 *
 * The batch id is stable per house, so re-sending re-points it at a DIFFERENT row
 * set. Without this, the older message keeps a live "Approve all" that would
 * publish rows it never displayed — the one way this design could break "approve
 * exactly what you see". Stripping its keyboard makes the newest digest the only
 * tappable one.
 */
async function retirePreviousMessage(client: SupabaseClient, batchId: string): Promise<void> {
  const { data } = await client
    .from('ingest_batches')
    .select('telegram_chat_id, telegram_message_id, status')
    .eq('id', batchId)
    .maybeSingle()
  const prev = data as { telegram_chat_id: string | null; telegram_message_id: string | null; status: string } | null
  // Only a still-open digest has buttons worth removing.
  if (!prev?.telegram_chat_id || !prev.telegram_message_id || prev.status !== 'sent') return
  await clearKeyboard(prev.telegram_chat_id, prev.telegram_message_id).catch(() => {
    /* an old or already-edited message can't be updated — not worth failing the send */
  })
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
  opts: { slug?: string; limit?: number } = {}
): Promise<PushResult> {
  const rows = await fetchPending(client, opts.slug)
  const byCompany = groupByCompany(rows)
  const runId = `manual-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`

  // `limit` bounds the fan-out per invocation. The webhook passes one because a
  // serverless request that sends dozens of messages inline will out-run its
  // timeout, and Telegram REPLAYS an update it never got a 200 for — sending the
  // whole queue twice. The CLI passes none: a terminal can wait.
  const all = [...byCompany.entries()]
  const batchList = opts.limit != null ? all.slice(0, opts.limit) : all

  const result: PushResult = {
    companies: byCompany.size,
    rows: rows.length,
    sent: 0,
    remaining: all.length - batchList.length,
    failed: [],
  }

  for (const [slug, list] of batchList) {
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
      await retirePreviousMessage(client, batchId)
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
