'use client'

/**
 * NewsletterPopup — the intent-triggered capture for "The Première Edit".
 *
 * The home page has an inline NewsletterCapture, but most traffic will land on a
 * deep page (a performance, a company, a city guide) and leave without scrolling
 * to it. This popup catches that audience at the moment of departure — once, and
 * tastefully — so viral/long-tail traffic compounds into an owned list instead
 * of evaporating.
 *
 * Restraint is the whole point (luxury, not a spam wall):
 *   - Never on first paint. Arms only after a quiet dwell (DWELL_MS).
 *   - Fires on the FIRST of: meaningful scroll depth, or desktop exit-intent.
 *   - Shows at most once per visitor per SUPPRESS_DAYS, whether they subscribe,
 *     dismiss, or just close it. Subscribers are suppressed for a year.
 *   - Honours prefers-reduced-motion (no scale/fade animation) and is fully
 *     keyboard-accessible (Esc to close, focus moves into the dialog).
 *
 * Writes through the same /api/follow primitive + sentinel entity as
 * NewsletterCapture, so one backend path owns every captured email.
 */
import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'

const STORAGE_KEY = 'wboc_edit_popup'
const DWELL_MS = 8000
const SCROLL_TRIGGER = 0.5 // 50% of the scrollable height
const SUPPRESS_DAYS = 45
const SUBSCRIBED_DAYS = 365

type State = 'idle' | 'saving' | 'done' | 'error'

function suppressedUntil(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { until } = JSON.parse(raw) as { until?: number }
    return typeof until === 'number' ? until : null
  } catch {
    return null
  }
}

function suppress(days: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ until: Date.now() + days * 86_400_000 })
    )
  } catch {
    /* storage unavailable — fail open, just don't persist */
  }
}

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [email, setEmail] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Arm the triggers once, if the visitor isn't currently suppressed.
  useEffect(() => {
    const until = suppressedUntil()
    if (until && until > Date.now()) return

    let armed = false
    let fired = false
    const arm = () => {
      armed = true
    }
    const fire = () => {
      if (fired || !armed) return
      fired = true
      setOpen(true)
      cleanup()
    }

    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max > 0 && window.scrollY / max >= SCROLL_TRIGGER) fire()
    }
    const onExit = (e: MouseEvent) => {
      if (e.clientY <= 0) fire()
    }

    const dwell = window.setTimeout(arm, DWELL_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseout', onExit)

    function cleanup() {
      window.clearTimeout(dwell)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseout', onExit)
    }
    return cleanup
  }, [])

  // While open: lock body scroll, Esc to close, move focus into the dialog.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    // Focus the email field (or close button if already submitted).
    const t = window.setTimeout(() => {
      ;(state === 'done' ? closeRef : inputRef).current?.focus()
    }, 50)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function dismiss() {
    suppress(SUPPRESS_DAYS)
    setOpen(false)
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
        body: JSON.stringify({
          email,
          entityType: 'city',
          entitySlug: 'all',
          entityLabel: 'The Première Edit',
          locale,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      if (res.ok && data.ok) {
        suppress(SUBSCRIBED_DAYS)
        setState('done')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to The Première Edit"
      className="fixed inset-0 z-[100] flex items-center justify-center px-5 py-8 motion-safe:animate-[fadeIn_0.3s_ease]"
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={dismiss}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
      />

      {/* Card */}
      <div className="relative glass-card specular w-full max-w-lg p-8 md:p-12 text-center motion-safe:animate-[popIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
        <button
          ref={closeRef}
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 p-2 text-ivory/40 hover:text-gold transition-colors"
        >
          <X size={18} />
        </button>

        <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-4">
          The Première Edit
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-ivory mb-4 leading-tight">
          Never miss a performance worth the journey
        </h2>
        <p className="text-ivory/60 text-sm md:text-base leading-relaxed max-w-sm mx-auto mb-8">
          Once a month, the handful of ballet and opera performances worth
          crossing a border for — curated by hand, never automated. Free.
        </p>

        {state === 'done' ? (
          <div className="inline-flex items-center gap-2.5 text-gold">
            <Check size={18} />
            <span className="text-sm">You’re on the list. Watch for the next Edit.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              ref={inputRef}
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

        {state !== 'done' && (
          <button
            onClick={dismiss}
            className="mt-6 text-ivory/35 text-[11px] tracking-[0.18em] uppercase hover:text-ivory/60 transition-colors"
          >
            No thanks
          </button>
        )}
      </div>
    </div>
  )
}
