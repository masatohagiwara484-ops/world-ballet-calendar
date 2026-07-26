'use client'

/**
 * FollowButton — the capture primitive, in one tasteful control.
 *
 * Anonymous visitor (no session): collapsed it reads "Follow {label}". Clicked,
 * it reveals a single email field; submitting POSTs to /api/follow and the
 * control becomes a quiet confirmation. No password, no account wall — the
 * lowest-friction way to turn an anonymous visitor into a known, re-reachable
 * member of the audience.
 *
 * Signed-in visitor: on mount we check (client-side, via the auth-capable
 * browser client) whether this entity is already followed by the session's
 * account. If so the control renders "Following {label}" immediately — no
 * email field needed, the account's own email is already known — with a
 * one-click unfollow. This intentionally runs client-side rather than as a
 * server-passed prop so the company page (statically generated, revalidate =
 * 3600) doesn't have to opt into per-request dynamic rendering just to read a
 * cookie.
 *
 * It stays useful even when the backend is unconfigured: a 503 surfaces a calm
 * "couldn't save" message rather than breaking the page.
 */
import { useState, useEffect } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import type { EntityType } from '@/lib/audience'
import { createClient } from '@/lib/auth/browser'

interface Props {
  entityType: EntityType
  entitySlug: string
  entityLabel: string
  /** Optional override for the collapsed verb line. */
  prompt?: string
}

type State = 'idle' | 'open' | 'saving' | 'done' | 'error'

interface Account {
  email: string
  following: boolean
}

export default function FollowButton({ entityType, entitySlug, entityLabel, prompt }: Props) {
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const [already, setAlready] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email || cancelled) return
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_slug', entitySlug)
        .maybeSingle()
      if (!cancelled) setAccount({ email: user.email as string, following: Boolean(data) })
    }
    check().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [entityType, entitySlug])

  async function accountFollow() {
    if (!account) return
    setState('saving')
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setState('error')
      return
    }
    const { error } = await supabase.from('follows').insert({
      user_id: user.id,
      email: account.email,
      entity_type: entityType,
      entity_slug: entitySlug,
      entity_label: entityLabel,
    })
    setState('idle')
    if (error) return
    setAccount({ ...account, following: true })
  }

  async function accountUnfollow() {
    if (!account) return
    setState('saving')
    const supabase = createClient()
    await supabase
      .from('follows')
      .delete()
      .eq('entity_type', entityType)
      .eq('entity_slug', entitySlug)
    setState('idle')
    setAccount({ ...account, following: false })
  }

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

  // Signed-in visitor — already following.
  if (account?.following) {
    return (
      <div className="flex items-center gap-2.5 text-sm text-gold">
        <Check size={16} className="shrink-0" />
        <span>Following {entityLabel}.</span>
        <button
          type="button"
          onClick={accountUnfollow}
          disabled={state === 'saving'}
          className="text-ivory/45 text-[11px] tracking-[0.16em] uppercase hover:text-gold transition-colors disabled:opacity-60"
        >
          {state === 'saving' ? <Loader2 size={12} className="animate-spin inline" /> : 'Unfollow'}
        </button>
      </div>
    )
  }

  // Signed-in visitor — not yet following. Email is already known, so one click.
  if (account && !account.following) {
    return (
      <button
        type="button"
        onClick={accountFollow}
        disabled={state === 'saving'}
        className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-5 py-2.5 text-xs tracking-[0.18em] uppercase text-gold-deep hover:bg-gold/10 transition-colors disabled:opacity-60"
      >
        {state === 'saving' ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
        {prompt ?? `Follow ${entityLabel}`}
      </button>
    )
  }

  // Anonymous visitor (or auth check still pending) — unchanged capture flow.
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
