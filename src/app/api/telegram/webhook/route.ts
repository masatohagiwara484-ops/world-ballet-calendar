/**
 * POST /api/telegram/webhook — the owner's approval endpoint.
 *
 * Telegram calls this when the owner taps a button on a digest, or types a
 * command in the bot DM. We:
 *   1. verify the X-Telegram-Bot-Api-Secret-Token header (set at setWebhook time)
 *   2. verify the SENDER is the owner — the secret proves "Telegram called us",
 *      not "the right person tapped" (see `isOwner`)
 *   3. load the ingest_batches row named in the callback_data
 *   4. flip its pending performances through the shared publish guard:
 *      Approve → published (cancellations / bad dates / non-performances hidden),
 *      Reject → rejected — using the SERVER-ONLY service-role key
 *   5. acknowledge + rewrite the message, then revalidate the affected pages
 *
 * Commands (typed in the DM):
 *   /pending — push the current review queue as digests, no terminal needed
 *   /help    — what the bot can do
 *
 * This is the ONLY path that publishes scraped data. The crawl only ever writes
 * review_status='pending'.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  answerCallback,
  digestKeyboard,
  detailKeyboard,
  editMessage,
  formatDetail,
  formatDigest,
  sendNotice,
  DETAIL_PAGE_SIZE,
  type DetailRow,
  type DigestLine,
} from '@/lib/telegram'
import { notifyFollowersOfBatch } from '@/lib/notify'
import { isOwner } from '@/lib/telegram-auth'
import { partitionForPublish, describeHidden } from '@/lib/review-guard'
import {
  PENDING_COLUMNS,
  companyName,
  fetchPending,
  pushPendingDigests,
  type PendingRow,
} from '@/lib/pending-digest'

export const dynamic = 'force-dynamic'
/**
 * `/pending` fans out one message per house. Telegram REPLAYS any update it
 * doesn't get a timely 200 for, so a timeout here would re-send the whole queue —
 * give the handler room, and cap the fan-out with PENDING_FANOUT_LIMIT as well.
 */
export const maxDuration = 60

/** Houses per `/pending` invocation; the rest come on the next ask. */
const PENDING_FANOUT_LIMIT = 8

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) return null
  try {
    return createClient(url, key, { auth: { persistSession: false } })
  } catch {
    return null
  }
}

interface BatchRow {
  id: string
  company_slug: string
  run_id: string
  performance_ids: string[]
  telegram_chat_id: string | null
  telegram_message_id: string | null
  counts: Record<string, number>
}

/** Runs of clean human approvals before a source earns auto-approve. */
const AUTO_APPROVE_AFTER = 3

/**
 * Earned trust: a clean Approve grows the source's streak and, at the
 * threshold, flips auto_approve on. Any Reject resets the streak and revokes
 * auto-approve — trust is earned slowly and lost immediately.
 */
async function adjustTrust(
  client: SupabaseClient,
  slug: string,
  approved: boolean
): Promise<void> {
  if (!approved) {
    await client
      .from('ingest_sources')
      .update({ consecutive_clean_runs: 0, auto_approve: false })
      .eq('slug', slug)
    return
  }
  const { data } = await client
    .from('ingest_sources')
    .select('consecutive_clean_runs')
    .eq('slug', slug)
    .maybeSingle()
  const next = ((data as { consecutive_clean_runs: number } | null)?.consecutive_clean_runs ?? 0) + 1
  await client
    .from('ingest_sources')
    .update({ consecutive_clean_runs: next, auto_approve: next >= AUTO_APPROVE_AFTER })
    .eq('slug', slug)
}

/** Revalidate every page a publish/reject could have changed. */
async function revalidateFor(
  client: SupabaseClient,
  companySlug: string,
  performanceIds: string[]
): Promise<void> {
  // Global + company surfaces.
  for (const p of ['/', '/search', '/companies', `/companies/${companySlug}`, '/sitemap.xml']) {
    revalidatePath(p)
  }
  for (const id of performanceIds) revalidatePath(`/performances/${id}`)

  if (performanceIds.length === 0) return
  // Work pages touched by these performances.
  const { data: perfRows } = await client
    .from('performances')
    .select('work_id')
    .in('id', performanceIds)
  const workIds = [...new Set((perfRows ?? []).map((r) => (r as { work_id: string | null }).work_id).filter(Boolean))] as string[]
  if (workIds.length) {
    const { data: works } = await client.from('works').select('slug').in('id', workIds)
    for (const w of works ?? []) revalidatePath(`/works/${(w as { slug: string }).slug}`)
  }
  // People pages touched by these performances.
  const { data: creditRows } = await client
    .from('performance_credits')
    .select('person_id')
    .in('performance_id', performanceIds)
  const personIds = [...new Set((creditRows ?? []).map((r) => (r as { person_id: string }).person_id))]
  if (personIds.length) {
    const { data: people } = await client.from('people').select('slug').in('id', personIds)
    for (const p of people ?? []) revalidatePath(`/people/${(p as { slug: string }).slug}`)
  }
}

/** Load the rows a batch governs, whatever their current review_status. */
async function loadBatchRows(client: SupabaseClient, ids: string[]): Promise<PendingRow[]> {
  if (ids.length === 0) return []
  const { data } = await client
    .from('performances')
    .select(PENDING_COLUMNS)
    .in('id', ids)
    .order('start_date')
  return (data ?? []) as PendingRow[]
}

const toDetailRows = (rows: PendingRow[]): DetailRow[] =>
  rows.map((r) => ({
    title: r.title,
    kind: r.kind,
    start_date: r.start_date,
    end_date: r.end_date,
    venue: r.venue,
    price_range: r.price_range,
    ticket_url: r.ticket_url,
    affiliate_url: r.affiliate_url,
    confidence: r.confidence,
    change_kind: r.change_kind,
  }))

const toDigestLines = (rows: PendingRow[]): DigestLine[] =>
  rows.map((r) => ({
    change_kind: r.change_kind ?? 'new',
    title: r.title,
    start_date: r.start_date,
    end_date: r.end_date ?? r.start_date,
    kind: r.kind,
    price: r.price_range,
    confidence: r.confidence,
  }))

/** Handle a typed command in the bot DM (/pending, /start, /help). */
async function handleCommand(
  client: SupabaseClient,
  chatId: string,
  text: string
): Promise<void> {
  const parts = text.trim().split(/\s+/)
  const command = parts[0]?.toLowerCase().replace(/@.*$/, '') ?? ''
  // `/pending royal-ballet` narrows to one house, mirroring `--slug` on the CLI.
  const slug = parts[1]?.trim() || undefined

  if (command === '/pending') {
    // Count first so the header lands ABOVE the digests it introduces.
    const waiting = await fetchPending(client, slug)
    if (waiting.length === 0) {
      await sendNotice(
        chatId,
        slug ? `✅ *Nothing pending* for \`${slug}\`.` : '✅ *Nothing pending* — the queue is empty.'
      )
      return
    }
    const houses = new Set(waiting.map((r) => r.company_slug)).size
    const capped = houses > PENDING_FANOUT_LIMIT ? ` Sending the first ${PENDING_FANOUT_LIMIT}.` : ''
    await sendNotice(
      chatId,
      `📋 *${waiting.length} pending* across ${houses} house${houses === 1 ? '' : 's'}.${capped}`
    )

    const result = await pushPendingDigests(client, chatId, { slug, limit: PENDING_FANOUT_LIMIT })
    const notes = [
      result.remaining ? `${result.remaining} more house(s) — send /pending again.` : '',
      result.failed.length ? `⚠️ failed: ${result.failed.map((f) => f.slug).join(', ')}` : '',
    ].filter(Boolean)
    if (notes.length) await sendNotice(chatId, notes.join('\n'))
    return
  }

  // /start and /help both land here — one message that explains the whole loop.
  await sendNotice(
    chatId,
    '🎟 *première — review bot*\n\n' +
      '/pending — show everything waiting for approval\n' +
      '/help — this message\n\n' +
      'On a digest: *✅ Approve all* publishes, *🚫 Reject all* discards, ' +
      '*🔍 Details* opens venue, price, ticket link and confidence per performance.'
  )
}

export async function POST(req: NextRequest): Promise<Response> {
  // 1. Authenticate the caller as Telegram.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const got = req.headers.get('x-telegram-bot-api-secret-token')
  if (!secret || got !== secret) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  const client = serviceClient()
  if (!client) return new NextResponse('not configured', { status: 503 })

  const update = (await req.json().catch(() => null)) as {
    callback_query?: Record<string, unknown>
    message?: { chat?: { id: number }; from?: { id: number }; text?: string }
  } | null

  const cq = update?.callback_query as
    | {
        id: string
        data?: string
        from?: { id: number }
        message?: { chat?: { id: number }; message_id?: number }
      }
    | undefined

  // --- Typed commands (/pending, /help) ---
  if (!cq) {
    const message = update?.message
    const text = message?.text ?? ''
    if (!text.startsWith('/')) return NextResponse.json({ ok: true })
    // 2. Authorise the SENDER. A stranger who finds the bot gets silence, not a
    // queue listing — the pending queue is unpublished editorial data.
    if (!isOwner(message?.from?.id)) return NextResponse.json({ ok: true })
    const chatId = message?.chat?.id != null ? String(message.chat.id) : null
    if (!chatId) return NextResponse.json({ ok: true })
    try {
      await handleCommand(client, chatId, text)
    } catch (err) {
      await sendNotice(chatId, `⚠️ ${err instanceof Error ? err.message : String(err)}`).catch(() => {})
    }
    return NextResponse.json({ ok: true })
  }

  // 2. Authorise the tapper — the secret header proves Telegram called us, not
  // that the owner is the one publishing to the live site.
  if (!isOwner(cq.from?.id)) {
    await answerCallback(cq.id, 'Not authorised.').catch(() => {})
    return NextResponse.json({ ok: true })
  }

  const data = cq.data ?? ''
  const sep = data.indexOf(':')
  const action = sep > 0 ? data.slice(0, sep) : data
  const rest = sep > 0 ? data.slice(sep + 1) : ''
  // `detail` carries a trailing :<page>; every other action is just the batch id.
  const pageMatch = action === 'detail' ? rest.match(/^(.*):(\d+)$/) : null
  const batchId = pageMatch ? pageMatch[1] : rest
  const page = pageMatch ? parseInt(pageMatch[2], 10) : 0

  const { data: batchData } = await client
    .from('ingest_batches')
    .select('id, company_slug, run_id, performance_ids, telegram_chat_id, telegram_message_id, counts')
    .eq('id', batchId)
    .maybeSingle()
  const batch = batchData as BatchRow | null

  if (!batch) {
    await answerCallback(cq.id, 'This batch has expired.')
    return NextResponse.json({ ok: true })
  }

  const ids = batch.performance_ids ?? []
  // Edit the message that was ACTUALLY TAPPED, falling back to the recorded one.
  // A standing `pending:<slug>` batch is re-pointed at each re-send, so the stored
  // id can name a newer message than the one under the owner's finger — the reply
  // must land on the message they touched.
  const chatId = (cq.message?.chat?.id != null ? String(cq.message.chat.id) : null) ?? batch.telegram_chat_id
  const messageId =
    (cq.message?.message_id != null ? String(cq.message.message_id) : null) ?? batch.telegram_message_id

  // --- Read-only views: Details / back to Summary. No DB writes, no decision. ---
  if (action === 'detail' || action === 'summary') {
    const rows = await loadBatchRows(client, ids)
    const name = companyName(batch.company_slug)
    const sourceUrl = rows.find((r) => r.source_url)?.source_url ?? undefined

    if (rows.length === 0) {
      await answerCallback(cq.id, 'These rows are gone.')
      return NextResponse.json({ ok: true })
    }
    if (chatId && messageId) {
      const isDetail = action === 'detail'
      const pages = Math.max(1, Math.ceil(rows.length / DETAIL_PAGE_SIZE))
      const safePage = Math.min(Math.max(page, 0), pages - 1)
      const text = isDetail
        ? formatDetail(name, toDetailRows(rows), safePage)
        : formatDigest({
            companyName: name,
            runId: batch.run_id,
            batchId,
            lines: toDigestLines(rows),
            sourceUrl,
          })
      const keyboard = isDetail
        ? detailKeyboard(batchId, safePage, pages, sourceUrl)
        : digestKeyboard(batchId, sourceUrl)
      try {
        await editMessage(chatId, messageId, text, keyboard)
      } catch (err) {
        // "message is not modified" means the view is already what was asked for.
        // Anything else is a real failure and must NOT look like a working button.
        const reason = err instanceof Error ? err.message : String(err)
        if (!/not modified/i.test(reason)) {
          await answerCallback(cq.id, 'Could not open details.').catch(() => {})
          return NextResponse.json({ ok: true })
        }
      }
    }
    await answerCallback(cq.id, '')
    return NextResponse.json({ ok: true })
  }

  let resultText: string
  if (action === 'approve') {
    // The guard decides what actually goes live: cancellations, implausible dates
    // and non-performance rows are HIDDEN, never published — identical rules to
    // `npm run review:pending -- --publish`.
    const rows = await loadBatchRows(client, ids)
    const { publishIds, hideIds, hidden } = partitionForPublish(rows)

    if (hideIds.length) {
      // `.eq('review_status','pending')` matters HERE and not on the CLI: the CLI's
      // rows came from a pending-only query, while loadBatchRows reads a batch's
      // rows whatever their status. Without it a stale digest could unpublish a
      // live row.
      await client
        .from('performances')
        .update({ review_status: 'rejected' })
        .in('id', hideIds)
        .eq('review_status', 'pending')
    }
    if (publishIds.length) {
      await client
        .from('performances')
        .update({ review_status: 'published', last_verified: new Date().toISOString() })
        .in('id', publishIds)
        .eq('review_status', 'pending')
    }
    await client.from('ingest_batches').update({ status: 'approved' }).eq('id', batchId)
    await adjustTrust(client, batch.company_slug, true)
    // Hidden rows need revalidation TOO: a confirmed cancellation was usually
    // published before, so its `/performances/<id>` page is live and ISR-cached.
    // Purge it, or a cancelled show stays readable for up to an hour.
    await revalidateFor(client, batch.company_slug, [...publishIds, ...hideIds])
    // Follower alerts — awaited (Vercel may freeze the function after the
    // response), but internally never-throwing, so approval can't break.
    await notifyFollowersOfBatch(client, batchId, batch.company_slug, publishIds)
    const withheld = describeHidden(hidden)
    resultText =
      `✅ *Approved* — ${publishIds.length} change${publishIds.length === 1 ? '' : 's'} now live.` +
      (withheld ? `\n_Withheld: ${withheld}._` : '')
  } else if (action === 'reject') {
    await client
      .from('performances')
      .update({ review_status: 'rejected' })
      .in('id', ids)
      .eq('review_status', 'pending')
    await client.from('ingest_batches').update({ status: 'rejected' }).eq('id', batchId)
    await adjustTrust(client, batch.company_slug, false)
    resultText = `🚫 *Rejected* — ${ids.length} change${ids.length === 1 ? '' : 's'} discarded.`
  } else {
    await answerCallback(cq.id, 'Unknown action.')
    return NextResponse.json({ ok: true })
  }

  await answerCallback(cq.id, 'Done.')
  if (chatId && messageId) {
    try {
      await editMessage(chatId, messageId, resultText)
    } catch {
      /* editing is best-effort; the DB state is already authoritative */
    }
  }
  return NextResponse.json({ ok: true })
}
