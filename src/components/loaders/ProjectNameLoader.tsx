'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'

/**
 * First-load brand curtain: "World Ballet & Opera Calendar" in Italiana display,
 * fade in (1s) · hold (3s) · fade out (1s). Shown once per browser.
 * Champagne Noir — near-black stage with champagne gold wordmark.
 */
export default function ProjectNameLoader() {
  const loaderRef = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen =
      typeof window !== 'undefined' && localStorage.getItem('wboc_visited')
    if (seen) return

    setShow(true)
  }, [])

  useEffect(() => {
    if (!show || !loaderRef.current) return
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({
      onComplete: () => {
        localStorage.setItem('wboc_visited', 'true')
        document.body.style.overflow = ''
        setShow(false)
      },
    })

    tl.fromTo(
      loaderRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.0, ease: 'power2.inOut' }
    )
      .to(loaderRef.current, { opacity: 1, duration: 3.0 })
      .to(loaderRef.current, { opacity: 0, duration: 1.0, ease: 'power2.inOut' })

    return () => {
      tl.kill()
      document.body.style.overflow = ''
    }
  }, [show])

  if (!show) return null

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-8 opacity-0"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(212,175,55,0.10) 0%, rgba(10,9,8,0) 60%), radial-gradient(ellipse 70% 60% at 50% 110%, rgba(27,42,74,0.18) 0%, rgba(10,9,8,0) 60%), #0A0908',
      }}
    >
      <p className="text-gold text-[11px] tracking-[0.5em] uppercase mb-8">
        Presenting
      </p>
      <h1 className="font-serif text-gradient-gold text-center leading-[1.1] tracking-[0.04em] text-4xl sm:text-6xl lg:text-7xl max-w-4xl">
        World Ballet &amp; Opera Calendar
      </h1>
      <div className="mt-9 h-px w-24 bg-gold/60 shadow-[0_0_16px_rgba(212,175,55,0.5)]" />
    </div>
  )
}
