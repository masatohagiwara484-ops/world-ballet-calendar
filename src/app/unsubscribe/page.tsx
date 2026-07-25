/**
 * /unsubscribe?token=<uuid> — one-click unsubscribe landing.
 *
 * Reached from the email footer and the List-Unsubscribe header. Sets
 * subscribers.unsubscribed_at for the token's address and confirms in the
 * house voice. Idempotent (a second visit shows the same confirmation);
 * an unknown token gets a graceful message, never an error page.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Unsubscribed',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function unsubscribe(token: string): Promise<'done' | 'unknown' | 'unavailable'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return 'unavailable'
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await client
    .from('subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('token', token)
    .select('email')
  if (error) return 'unavailable'
  return data && data.length > 0 ? 'done' : 'unknown'
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = (searchParams.token ?? '').trim()
  const result = token ? await unsubscribe(token) : 'unknown'

  const heading =
    result === 'done' ? 'You are unsubscribed' : 'This link has expired'
  const body =
    result === 'done'
      ? 'You will receive no further performance alerts. The season, of course, remains yours to browse — and you can follow any company again whenever you wish.'
      : result === 'unavailable'
        ? 'We could not process the request just now. Please try the link again in a moment.'
        : 'We could not match this unsubscribe link. If you continue to receive alerts, use the link in the most recent email.'

  return (
    <main className="min-h-screen flex items-center justify-center px-8 bg-stage">
      <div className="text-center max-w-md">
        <p className="text-gold-deep text-xs tracking-[0.3em] uppercase mb-6">première</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-6 text-gradient-gold">{heading}</h1>
        <p className="text-ivory/70 text-base mb-12 leading-relaxed">{body}</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full border border-gold-deep/60 text-gold-deep text-xs tracking-widest uppercase hover:bg-gold-deep/10 transition-all duration-300"
        >
          Return to the season
        </Link>
      </div>
    </main>
  )
}
