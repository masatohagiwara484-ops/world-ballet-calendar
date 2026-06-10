'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'

/**
 * First-load brand curtain: "World Ballet & Opera Calendar" in Playfair serif,
 * fade in (1s) · hold (3s) · fade out (1s). Shown once per browser.
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
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}
    >
      <p className="text-[#D4AF37] text-[11px] tracking-[0.5em] uppercase mb-7">
        Presenting
      </p>
      <h1 className="font-serif font-light text-[#1A1A1A] text-center leading-[1.08] text-4xl sm:text-6xl lg:text-7xl max-w-4xl">
        World Ballet &amp; Opera Calendar
      </h1>
      <div className="mt-8 h-px w-24 bg-[#D4AF37]/50" />
    </div>
  )
}
