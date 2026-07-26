'use client'

/**
 * Passwordless sign-in — a single email field, mirroring FollowButton's
 * idle/saving/done state shape for consistency with the rest of the site.
 * Sends a Supabase magic link; the visitor never sets or types a password.
 */
import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/auth/browser'

type State = 'idle' | 'saving' | 'done' | 'error'

export default function LoginForm({ next }: { next: string }) {
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setState('saving')
    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      setState(error ? 'error' : 'done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center justify-center gap-2.5 text-sm text-gold">
        <Check size={16} className="shrink-0" />
        <span>Check your inbox — we&rsquo;ve sent a link to sign in.</span>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="w-full">
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
          {state === 'saving' ? <Loader2 size={14} className="animate-spin" /> : 'Send link'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-rose-600 text-[11px] mt-2">
          Couldn&rsquo;t send that link just now — please try again.
        </p>
      )}
    </form>
  )
}
