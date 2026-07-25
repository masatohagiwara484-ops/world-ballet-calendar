/**
 * GET /api/digest/weekly — the Thursday letter.
 *
 * Fired by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set the route
 * refuses to run at all, so it can never be triggered anonymously.
 *
 * Idempotent by design: sendWeeklyDigests() keys on the ISO week, so a retry
 * (or a manual re-run after a partial send) only mails readers not yet sent.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWeeklyDigests } from '@/lib/digest'
import { sendNotice } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Fan-out over subscribers can outlast the default 10s. */
export const maxDuration = 300

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  const got = req.headers.get('authorization')
  if (!secret || got !== `Bearer ${secret}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ ok: false, reason: 'unconfigured' }, { status: 503 })
  }
  const client = createClient(url, key, { auth: { persistSession: false } })

  const result = await sendWeeklyDigests(client)

  // One line to the owner so the weekly send is observable without the logs.
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (chatId && (result.sent > 0 || result.overCap > 0)) {
    await sendNotice(
      chatId,
      `📬 *Weekly digest* — ${result.weekKey}\n${result.sent} sent · ${result.empty} nothing-to-say · ${result.overCap} deferred`
    ).catch(() => undefined)
  }

  return NextResponse.json({ ok: true, ...result })
}
