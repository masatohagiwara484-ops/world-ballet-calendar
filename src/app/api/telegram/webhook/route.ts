/**
 * POST /api/telegram/webhook — the owner's approval endpoint.
 *
 * Telegram calls this when the owner taps a button on a digest. We:
 *   1. verify the X-Telegram-Bot-Api-Secret-Token header (set at setWebhook time)
 *   2. load the ingest_batches row named in the callback_data
 *   3. flip its pending performances: Approve → published (cancellations → hidden),
 *      Reject → rejected — using the SERVER-ONLY service-role key
 *   4. acknowledge + rewrite the message, then revalidate the affected pages
 *
 * This is the ONLY path that publishes scraped data. The crawl only ever writes
 * review_status='pending'.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { answerCallback, editMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

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

export async function POST(req: NextRequest): Promise<Response> {
  // 1. Authenticate the caller as Telegram.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const got = req.headers.get('x-telegram-bot-api-secret-token')
  if (!secret || got !== secret) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  const client = serviceClient()
  if (!client) return new NextResponse('not configured', { status: 503 })

  const update = (await req.json().catch(() => null)) as { callback_query?: Record<string, unknown> } | null
  const cq = update?.callback_query as
    | { id: string; data?: string; message?: { chat?: { id: number }; message_id?: number } }
    | undefined
  // Non-button updates (plain messages etc.) are acknowledged and ignored.
  if (!cq) return NextResponse.json({ ok: true })

  const data = cq.data ?? ''
  const sep = data.indexOf(':')
  const action = sep > 0 ? data.slice(0, sep) : data
  const batchId = sep > 0 ? data.slice(sep + 1) : ''

  const { data: batchData } = await client
    .from('ingest_batches')
    .select('id, company_slug, performance_ids, telegram_chat_id, telegram_message_id, counts')
    .eq('id', batchId)
    .maybeSingle()
  const batch = batchData as BatchRow | null

  if (!batch) {
    await answerCallback(cq.id, 'This batch has expired.')
    return NextResponse.json({ ok: true })
  }

  const ids = batch.performance_ids ?? []
  const chatId = batch.telegram_chat_id ?? (cq.message?.chat?.id != null ? String(cq.message.chat.id) : null)
  const messageId = batch.telegram_message_id ?? (cq.message?.message_id != null ? String(cq.message.message_id) : null)

  let resultText: string
  if (action === 'approve') {
    // Confirmed cancellations are HIDDEN (rejected); everything else publishes.
    await client
      .from('performances')
      .update({ review_status: 'rejected' })
      .in('id', ids)
      .eq('change_kind', 'cancelled')
    await client
      .from('performances')
      .update({ review_status: 'published', last_verified: new Date().toISOString() })
      .in('id', ids)
      .eq('review_status', 'pending')
    await client.from('ingest_batches').update({ status: 'approved' }).eq('id', batchId)
    await adjustTrust(client, batch.company_slug, true)
    await revalidateFor(client, batch.company_slug, ids)
    resultText = `✅ *Approved* — ${ids.length} change${ids.length === 1 ? '' : 's'} now live.`
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
