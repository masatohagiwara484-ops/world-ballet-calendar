'use client'

/**
 * FollowButton — the capture primitive, in one tasteful control.
 *
 * Collapsed it reads "Follow {label}". Clicked, it reveals a single email field;
 * submitting POSTs to /api/follow and the control becomes a quiet confirmation.
 * No password, no account wall — the lowest-friction way to turn an anonymous
 * visitor into a known, re-reachable member of the audience. This is the shape
 * that lets viral traffic compound into an owned list rather than evaporating.
 *
 * It stays useful even when the backend is unconfigured: a 503 surfaces a calm
 * "couldn't save" message rather than breaking the page.
 */
import { useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import type { EntityType } from '@/lib/audience'

interface Props {
  entityType: EntityType
  entitySlug: string
  entityLabel: string
  /** Optional override for the collapsed verb line. */
  prompt?: string
}

type State = 'idle' | 'open' | 'saving' | 'done' | 'error'

export default function FollowButton({ entityType, entitySlug, entityLabel, prompt }: Props) {
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const [already, setAlready] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('saving')
    try {
      const locale = typeof navigator !== 'undefined' ? navigator.language : undefined
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, entityType, entitySlug, entityLabel, locale }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; already?: boolean }
      if (res.ok && data.ok) {
        setAlready(Boolean(data.already))
        setState('done')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-2.5 text-sm text-gold">
        <Check size={16} className="shrink-0" />
        <span>
          {already
            ? `You already follow ${entityLabel}.`
            : `We'll email you about ${entityLabel}.`}
        </span>
      </div>
    )
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={() => setState('open')}
        className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-xs tracking-[0.18em] uppercase text-gold-deep hover:bg-gold/10 transition-colors"
      >
        <Bell size={14} />
        {prompt ?? `Follow ${entityLabel}`}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <p className="text-ivory/55 text-[11px] tracking-[0.16em] uppercase mb-2">
        Alerts for {entityLabel}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="flex-1 min-w-0 rounded-full bg-white border border-black/[0.12] px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold/60 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={state === 'saving'}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 text-xs tracking-[0.16em] uppercase text-stage font-medium hover:bg-gold-bright transition-colors disabled:opacity-60"
        >
          {state === 'saving' ? <Loader2 size={14} className="animate-spin" /> : 'Notify me'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-rose-600 text-[11px] mt-2">
          Couldn’t save that just now — please try again.
        </p>
      )}
      <p className="text-ivory/35 text-[10px] mt-2 leading-relaxed">
        One email when new dates are announced. No spam, unsubscribe anytime.
      </p>
    </form>
  )
}
