'use client'

/**
 * NewsletterCapture — the home/footer top-of-funnel email capture.
 *
 * This is "The Première Edit": a free monthly curation of the performances worth
 * crossing a border for. It is deliberately framed as an editorial product (an
 * audience joins a point of view), not a "notification setting" — that framing
 * is what makes the list worth subscribing to, and later worth paying for.
 *
 * It writes through the same /api/follow primitive with a sentinel entity
 * (city:all) so a single backend path owns every email we capture.
 */
import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

type State = 'idle' | 'saving' | 'done' | 'error'

export default function NewsletterCapture() {
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('saving')
    try {
      const locale = typeof navigator !== 'undefined' ? navigator.language : undefined
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          entityType: 'city',
          entitySlug: 'all',
          entityLabel: 'The Première Edit',
          locale,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      setState(res.ok && data.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="glass-card specular p-10 md:p-14 text-center max-w-3xl mx-auto">
      <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-4">The Première Edit</p>
      <h2 className="font-serif text-3xl md:text-4xl text-ivory mb-4">
        The month’s essential performances, chosen for you
      </h2>
      <p className="text-ivory/60 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8">
        Once a month, the handful of ballet and opera performances worth crossing
        a border for — curated, never automated. Free.
      </p>

      {state === 'done' ? (
        <div className="inline-flex items-center gap-2.5 text-gold">
          <Check size={18} />
          <span className="text-sm">You’re on the list. Watch for the next Edit.</span>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="flex-1 min-w-0 rounded-full bg-white border border-black/[0.12] px-5 py-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold/60 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={state === 'saving'}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-7 py-3 text-xs tracking-[0.18em] uppercase text-stage font-medium hover:bg-gold-bright transition-colors disabled:opacity-60"
          >
            {state === 'saving' ? <Loader2 size={15} className="animate-spin" /> : 'Subscribe'}
          </button>
        </form>
      )}
      {state === 'error' && (
        <p className="text-rose-600 text-[11px] mt-3">
          Couldn’t subscribe just now — please try again.
        </p>
      )}
    </div>
  )
}
