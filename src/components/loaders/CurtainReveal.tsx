'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * première — Theatrical Curtain Reveal (first-load overture)
 *
 * A scarlet-and-gold velvet stage curtain fills the viewport the instant the
 * page paints (server-rendered markup — no flash of the page behind it). The
 * visitor *scrolls* and the two velvet halves part beneath a gold-fringed
 * valance, revealing the search experience like curtain-up at the opera.
 *
 * Built with SSR-safe DOM + CSS transforms (no WebGL) so the very first paint
 * is already the curtain — this is what removes the old "search flashes first"
 * lag. Motion is driven by a rAF-smoothed scroll value for a delicate ease.
 *
 * Plays once per browser (localStorage, primed by an inline script in layout so
 * returning visitors never see it). Skipped for prefers-reduced-motion.
 */

const SEEN_KEY = 'wboc_curtain_seen'

// Shared velvet + gold styling -------------------------------------------------
const VELVET_FOLDS =
  'repeating-linear-gradient(90deg,#4d070d 0px,#6f0c16 26px,#8c1320 46px,#a01826 60px,#7a0f1a 80px,#560910 104px,#4d070d 130px)'
const GOLD_ROPE =
  'repeating-linear-gradient(135deg,#6e4f12 0,#caa42a 3px,#f4dd86 6px,#caa42a 9px,#6e4f12 12px)'
const DAMASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180' viewBox='0 0 120 180'%3E%3Cg fill='none' stroke='%23E7C766' stroke-width='1.4' opacity='0.5'%3E%3Cpath d='M60 18c14 10 14 28 0 40-14-12-14-30 0-40z'/%3E%3Cpath d='M60 58c10 6 14 16 14 26 0 14-14 24-14 24s-14-10-14-24c0-10 4-20 14-26z'/%3E%3Ccircle cx='60' cy='118' r='5'/%3E%3Cpath d='M30 90c8 6 8 18 0 26M90 90c-8 6-8 18 0 26'/%3E%3C/g%3E%3C/svg%3E\")"

function CurtainPanel({ side }: { side: 'left' | 'right' }) {
  const inner = side === 'left' ? 'right' : 'left'
  return (
    <div
      className="absolute top-0 bottom-0"
      style={{
        [side]: 0,
        width: '52%',
        background: `${DAMASK}, linear-gradient(to ${inner}, rgba(255,255,255,0.06), transparent 26%), ${VELVET_FOLDS}`,
        backgroundBlendMode: 'soft-light, screen, normal',
        boxShadow:
          side === 'left'
            ? 'inset -46px 0 70px rgba(0,0,0,0.5), 10px 0 40px rgba(0,0,0,0.45)'
            : 'inset 46px 0 70px rgba(0,0,0,0.5), -10px 0 40px rgba(0,0,0,0.45)',
      }}
    >
      {/* deep crease near the meeting edge for 3-D depth */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          [inner]: 0,
          width: '32%',
          background: `linear-gradient(to ${side}, rgba(0,0,0,0.45), transparent)`,
          pointerEvents: 'none',
        }}
      />
      {/* gold rope braid down the inner meeting edge */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          [inner]: 0,
          width: '12px',
          background: GOLD_ROPE,
          boxShadow: '0 0 16px rgba(212,175,55,0.55)',
        }}
      />
    </div>
  )
}

export default function CurtainReveal() {
  const [mounted, setMounted] = useState(true)
  const [bar, setBar] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const valanceRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef(0)
  const openRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seen = localStorage.getItem(SEEN_KEY)

    const unlock = () => {
      document.documentElement.classList.remove('wboc-lock')
      document.documentElement.classList.add('wboc-curtain-done')
    }

    // Returning visitor / reduced motion → never play.
    if (seen || reduce) {
      unlock()
      setMounted(false)
      return
    }

    document.documentElement.classList.add('wboc-lock')

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      localStorage.setItem(SEEN_KEY, 'true')
      const root = rootRef.current
      if (root) {
        root.style.transition = 'opacity 0.7s ease'
        root.style.opacity = '0'
        root.style.pointerEvents = 'none'
      }
      window.setTimeout(() => {
        unlock()
        setMounted(false)
      }, 720)
    }

    const advance = (next: number) => {
      targetRef.current = Math.min(1, Math.max(0, next))
      setBar(targetRef.current)
      if (targetRef.current >= 0.999) finish()
    }

    // rAF easing loop — delicate, theatrical parting.
    let raf = 0
    const tick = () => {
      openRef.current += (targetRef.current - openRef.current) * 0.09
      const o = openRef.current
      const ease = o * o * (3 - 2 * o) // smoothstep
      if (leftRef.current)
        leftRef.current.style.transform = `translate3d(${-ease * 102}%,0,0) skewX(${ease * 2}deg)`
      if (rightRef.current)
        rightRef.current.style.transform = `translate3d(${ease * 102}%,0,0) skewX(${-ease * 2}deg)`
      if (valanceRef.current) {
        valanceRef.current.style.transform = `translate3d(0,${-ease * 60}%,0)`
        valanceRef.current.style.opacity = `${1 - ease * 0.9}`
      }
      if (brandRef.current) {
        const f = Math.max(0, 1 - o / 0.32)
        brandRef.current.style.opacity = `${f}`
        brandRef.current.style.transform = `translate3d(0,0,0) scale(${1 + o * 0.18})`
      }
      if (spotRef.current) spotRef.current.style.opacity = `${1 - ease}`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Scroll / touch / key capture while the curtain is up.
    const WHEEL = 0.00062
    const TOUCH = 0.0016
    let touchY = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      advance(targetRef.current + e.deltaY * WHEEL)
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      advance(targetRef.current + (touchY - e.touches[0].clientY) * TOUCH)
      touchY = e.touches[0].clientY
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        advance(targetRef.current + 0.16)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      ref={rootRef}
      id="curtain-overlay"
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      aria-hidden
    >
      {/* warm centre spotlight for depth (fades as the curtain parts so the
          page revealed behind it is never dimmed) */}
      <div
        ref={spotRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 38%, rgba(255,214,140,0.16), transparent 60%)',
        }}
      />

      {/* The two parting velvet halves */}
      <div ref={leftRef} className="absolute inset-0 will-change-transform">
        <CurtainPanel side="left" />
      </div>
      <div ref={rightRef} className="absolute inset-0 will-change-transform">
        <CurtainPanel side="right" />
      </div>

      {/* Fixed gold-fringed valance / pelmet across the top */}
      <div
        ref={valanceRef}
        className="absolute top-0 left-0 right-0 will-change-transform"
        style={{ height: '20vh' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `${VELVET_FOLDS}`,
            boxShadow: 'inset 0 -30px 50px rgba(0,0,0,0.55)',
          }}
        />
        {/* scalloped gold fringe along the valance hem */}
        <div
          className="absolute left-0 right-0"
          style={{
            bottom: '-13px',
            height: '16px',
            background: `repeating-linear-gradient(90deg, transparent 0, transparent 8px, #caa42a 8px, #f4dd86 14px, #caa42a 20px, transparent 20px, transparent 28px)`,
            WebkitMaskImage:
              'repeating-radial-gradient(circle at 14px 0, #000 0 7px, transparent 7px 14px)',
            maskImage:
              'repeating-radial-gradient(circle at 14px 0, #000 0 7px, transparent 7px 14px)',
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))',
          }}
        />
      </div>

      {/* Centre brand — première emblem + immersive scroll cue (fades on open) */}
      <div
        ref={brandRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-8 will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/premiere-mark-gold.png"
          alt="première"
          width={132}
          height={154}
          style={{
            width: 'clamp(74px, 10vw, 118px)',
            height: 'auto',
            filter: 'drop-shadow(0 6px 26px rgba(0,0,0,0.5))',
            animation: 'wboc-glow 3.6s ease-in-out infinite',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/premiere-word-gold.png"
          alt="première"
          style={{
            width: 'clamp(180px, 26vw, 300px)',
            height: 'auto',
            marginTop: '1.6rem',
            opacity: 0.96,
            filter: 'drop-shadow(0 4px 18px rgba(0,0,0,0.45))',
          }}
        />
      </div>

      {/* Immersive scroll message + progress (stays through the parting) */}
      <div
        className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 pointer-events-none"
        style={{ opacity: Math.max(0, 1 - bar * 1.8) }}
      >
        <span
          style={{
            color: '#F3E3C0',
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(13px,1.6vw,16px)',
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            textShadow: '0 2px 20px rgba(0,0,0,0.7)',
          }}
        >
          Scroll to find your première
        </span>
        <span style={{ color: '#D4AF37', animation: 'wboc-bob 1.8s ease-in-out infinite' }}>
          ▾
        </span>
      </div>

      {/* gold parting progress line */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] pointer-events-none">
        <div
          style={{
            width: `${bar * 100}%`,
            height: '100%',
            margin: '0 auto',
            background: 'linear-gradient(90deg, transparent, #D4AF37 50%, transparent)',
            boxShadow: '0 0 12px rgba(212,175,55,0.7)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <style>{`
        @keyframes wboc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
        @keyframes wboc-glow{0%,100%{filter:drop-shadow(0 6px 26px rgba(0,0,0,0.5))}50%{filter:drop-shadow(0 6px 34px rgba(212,175,55,0.55))}}
      `}</style>
    </div>
  )
}
