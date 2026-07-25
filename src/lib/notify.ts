/**
 * Follower alerts — email everyone who follows a company (or a touched work)
 * the moment its performances publish.
 *
 * Design constraints (in priority order):
 *   1. NEVER break the approval flow — the whole run is wrapped, errors are
 *      logged and swallowed, and with no RESEND_API_KEY it is a silent no-op.
 *   2. Idempotent — notification_log's (batch_id, email) unique pair means a
 *      double-tapped Telegram button or a retried webhook can't email twice.
 *   3. One email per subscriber per approval — a follower of the company AND
 *      three of its works still gets a single message.
 *
 * Scope (v1): company + work followers. person followers (dancers) are on
 * hold by owner decision; the `city:all` sentinel is the newsletter list and
 * never receives per-approval alerts.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from './email'
import {
  alertHtml,
  alertText,
  alertSubject,
  SITE_URL,
  type AlertRow,
} from './email-templates'

/** Protects the Resend free tier (100/day): one approval sends at most this
 *  many emails; the overflow is logged as skipped and can be re-sent later. */
const MAX_SENDS_PER_BATCH = 50

interface PerfRow extends AlertRow {
  work_id: string | null
}

interface FollowRow {
  email: string
}

interface SubscriberRow {
  email: string
  token: string
  unsubscribed_at: string | null
}

/**
 * Notify followers of `companySlug` (and of any work touched by `ids`) that
 * the batch's performances are live. Call AFTER the rows are published.
 */
export async function notifyFollowersOfBatch(
  client: SupabaseClient,
  batchId: string,
  companySlug: string,
  ids: string[]
): Promise<void> {
  try {
    if (ids.length === 0) return

    // Idempotency at the (batch, email) grain: a re-run (double-tap, webhook
    // retry, partial failure) only emails addresses not yet logged.
    const { data: sentBefore } = await client
      .from('notification_log')
      .select('email')
      .eq('batch_id', batchId)
    const alreadySent = new Set(
      ((sentBefore ?? []) as { email: string }[]).map((r) => r.email)
    )

    // Which of the batch's rows are actually live and alert-worthy?
    const { data: perfData } = await client
      .from('performances')
      .select('id, title, start_date, end_date, change_kind, work_id')
      .in('id', ids)
      .eq('review_status', 'published')
      .in('change_kind', ['new', 'date-changed'])
    const perfs = (perfData ?? []) as PerfRow[]
    if (perfs.length === 0) return

    // Company display name (entity_label on the follow row is a fallback).
    const { data: companyRow } = await client
      .from('companies')
      .select('name')
      .eq('slug', companySlug)
      .maybeSingle()
    const companyName = (companyRow as { name?: string } | null)?.name ?? companySlug

    // Touched works → their followers count too.
    const workIds = [...new Set(perfs.map((p) => p.work_id).filter(Boolean))] as string[]
    let workSlugs: string[] = []
    if (workIds.length) {
      const { data: workRows } = await client.from('works').select('slug').in('id', workIds)
      workSlugs = (workRows ?? []).map((w) => (w as { slug: string }).slug)
    }

    // Collect follower emails: company followers + work followers, deduped.
    const emails = new Set<string>()
    const { data: companyFollows } = await client
      .from('follows')
      .select('email')
      .eq('entity_type', 'company')
      .eq('entity_slug', companySlug)
    for (const f of (companyFollows ?? []) as FollowRow[]) emails.add(f.email)
    if (workSlugs.length) {
      const { data: workFollows } = await client
        .from('follows')
        .select('email')
        .eq('entity_type', 'work')
        .in('entity_slug', workSlugs)
      for (const f of (workFollows ?? []) as FollowRow[]) emails.add(f.email)
    }
    if (emails.size === 0) return

    // Resolve unsubscribe tokens; drop unsubscribed addresses.
    const { data: subData } = await client
      .from('subscribers')
      .select('email, token, unsubscribed_at')
      .in('email', [...emails])
    const subscribers = ((subData ?? []) as SubscriberRow[]).filter(
      (s) => !s.unsubscribed_at && !alreadySent.has(s.email)
    )
    if (subscribers.length === 0) return

    const added = perfs.filter((p) => p.change_kind === 'new')
    const redated = perfs.filter((p) => p.change_kind === 'date-changed')

    let sent = 0
    let skipped = 0
    for (const sub of subscribers) {
      if (sent >= MAX_SENDS_PER_BATCH) {
        skipped++
        continue
      }
      const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${sub.token}`
      const input = { companyName, added, redated, unsubscribeUrl }
      const ok = await sendEmail({
        to: sub.email,
        subject: alertSubject(input),
        html: alertHtml(input),
        text: alertText(input),
        unsubscribeUrl,
      })
      if (ok) {
        sent++
        // Log AFTER acceptance so a transport failure stays retryable.
        await client.from('notification_log').insert({ batch_id: batchId, email: sub.email })
      }
    }
    console.log(
      `[notify] ${companySlug} batch=${batchId}: ${sent} sent, ${skipped} over-cap, ${subscribers.length} eligible`
    )
  } catch (err) {
    // A notification failure must never surface into the approval flow.
    console.warn(`[notify] failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
