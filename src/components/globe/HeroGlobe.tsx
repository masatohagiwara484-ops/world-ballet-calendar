'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { X, ArrowUpRight } from 'lucide-react'
import { gsap } from '@/lib/gsap'
import { useCompanies } from '@/hooks/useCompanies'
import { typeLabel } from '@/components/shared/design'
import type { Company } from '@/lib/types'
import type { MarkerHover } from './Markers'

const GlassGlobe = dynamic(() => import('./GlassGlobe'), {
  ssr: false,
  loading: () => null,
})

export default function HeroGlobe() {
  const { companies } = useCompanies()
  const [selected, setSelected] = useState<Company | null>(null)
  const [hover, setHover] = useState<MarkerHover | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // GSAP entrance for the headline overlay.
  useEffect(() => {
    if (!overlayRef.current) return
    const items = overlayRef.current.querySelectorAll('[data-hero-anim]')
    gsap.fromTo(
      items,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.14,
        delay: 0.3,
      }
    )
  }, [])

  return (
    <section
      aria-label="Interactive globe of ballet and opera companies"
      className="relative w-full overflow-hidden"
      style={{ height: 'min(100svh, 980px)', minHeight: '620px' }}
    >
      {/* Gold radial aura behind the globe on the near-black stage */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at 66% 50%, rgba(212,175,55,0.16) 0%, rgba(74,31,46,0.10) 38%, rgba(10,9,8,0) 72%)',
        }}
      />

      {/* Globe canvas — full-bleed, sits behind the headline */}
      <div className="absolute inset-0 md:left-[18%]">
        <GlassGlobe companies={companies} onSelect={setSelected} onHover={setHover} />
      </div>

      {/* Headline overlay */}
      <div
        ref={overlayRef}
        className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-center pointer-events-none"
      >
        <div className="max-w-xl pointer-events-auto">
          <p
            data-hero-anim
            className="text-gold text-[11px] tracking-[0.42em] uppercase mb-6"
          >
            premi&egrave;re &middot; ballet &amp; opera
          </p>
          <h1
            data-hero-anim
            className="font-serif leading-[1.04] text-5xl sm:text-6xl lg:text-7xl tracking-[0.02em]"
          >
            <span className="text-gradient-gold">Every stage.</span>
            <br />
            <span className="text-gradient-gold">Every season.</span>
          </h1>
          <p
            data-hero-anim
            className="mt-7 text-ivory/60 text-base md:text-lg leading-relaxed font-light max-w-md"
          >
            Spin the globe to discover the world&rsquo;s great ballet and opera
            companies &mdash; then plan your season, performance by performance.
          </p>
          <div data-hero-anim className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/calendar"
              className="px-7 py-3 rounded-full bg-gold text-stage text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300 hover:bg-gold-bright hover:shadow-glow-gold"
            >
              Open the calendar
            </Link>
            <Link
              href="/companies"
              className="glass-pill specular px-7 py-3 text-ivory/80 text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:text-gold hover:border-[rgba(212,175,55,0.35)]"
            >
              Browse companies
            </Link>
          </div>
          <p
            data-hero-anim
            className="mt-8 text-ivory/38 text-[11px] tracking-[0.18em] uppercase"
          >
            Drag to rotate &middot; Tap a marker to explore
          </p>
        </div>
      </div>

      {/* Hover tooltip — fed by marker onHover, positioned over the canvas box */}
      {hover && !selected && (
        <div
          className="glass-panel specular pointer-events-none absolute z-30 px-4 py-3 max-w-[220px] -translate-x-1/2 -translate-y-full"
          style={{
            left: `${hover.x * 100}%`,
            top: `calc(${hover.y * 100}% - 14px)`,
          }}
        >
          <p className="text-ivory font-serif text-base leading-snug">
            {hover.company.name}
          </p>
          <p className="text-gold/80 text-[10px] tracking-[0.2em] uppercase mt-1">
            {hover.company.city} &middot; {hover.company.country}
          </p>
        </div>
      )}

      {/* Selected company card */}
      {selected && (
        <div className="absolute z-30 bottom-6 right-6 left-6 sm:left-auto sm:w-[340px] animate-fade-in-up">
          <div className="glass-card specular relative overflow-hidden">
            <div
              className="h-1 w-full"
              style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }}
            />
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute top-3 right-3 text-ivory/40 hover:text-gold transition-colors"
            >
              <X size={18} />
            </button>
            <div className="p-6">
              <p className="text-gold text-[10px] tracking-[0.3em] uppercase mb-3">
                {typeLabel(selected.type)} &middot; {selected.country}
              </p>
              <h3 className="font-serif text-2xl text-ivory mb-1">
                {selected.name}
              </h3>
              <p className="text-ivory/45 text-sm mb-5">
                {selected.city}
                {selected.venue ? ` · ${selected.venue}` : ''}
              </p>
              <Link
                href={`/companies/${selected.slug}`}
                className="inline-flex items-center gap-1.5 text-gold text-xs tracking-[0.2em] uppercase hover:text-gold-bright transition-colors"
              >
                View company
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
