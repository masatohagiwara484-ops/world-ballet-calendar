'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { X, ArrowUpRight } from 'lucide-react'
import { gsap } from '@/lib/gsap'
import { useCompanies } from '@/hooks/useCompanies'
import { useElementSize } from '@/hooks/useElementSize'
import { typeLabel } from '@/components/shared/design'
import type { Company } from '@/lib/types'

const GlobeInner = dynamic(() => import('./GlobeInner'), {
  ssr: false,
  loading: () => null,
})

export default function HeroGlobe() {
  const { companies } = useCompanies()
  const [containerRef, size] = useElementSize<HTMLDivElement>()
  const [selected, setSelected] = useState<Company | null>(null)
  const [, setHovered] = useState<Company | null>(null)
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
        delay: 0.25,
      }
    )
  }, [])

  return (
    <section
      aria-label="Interactive globe of ballet and opera companies"
      className="relative w-full overflow-hidden"
      style={{ height: 'min(100svh, 980px)', minHeight: '620px' }}
    >
      {/* Soft radial vignette behind the dark globe so it floats on white */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 62% 50%, rgba(27,42,74,0.10) 0%, rgba(212,175,55,0.06) 35%, rgba(255,255,255,0) 70%), linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)',
        }}
      />

      {/* Globe canvas — measured container fed to the WebGL globe */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-hidden
      >
        {size.width > 0 && size.height > 0 && (
          <GlobeInner
            companies={companies}
            width={size.width}
            height={size.height}
            onSelect={setSelected}
            onHover={setHovered}
          />
        )}
      </div>

      {/* Legibility scrim on the left where the headline sits */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-full md:w-3/5 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Headline overlay */}
      <div
        ref={overlayRef}
        className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-center pointer-events-none"
      >
        <div className="max-w-xl pointer-events-auto">
          <p
            data-hero-anim
            className="text-[#D4AF37] text-[11px] tracking-[0.42em] uppercase mb-6"
          >
            World Ballet &amp; Opera Calendar
          </p>
          <h1
            data-hero-anim
            className="font-serif font-light text-[#1A1A1A] leading-[1.04] text-5xl sm:text-6xl lg:text-7xl"
          >
            Every stage.
            <br />
            Every season.
          </h1>
          <p
            data-hero-anim
            className="mt-7 text-[#1A1A1A]/60 text-base md:text-lg leading-relaxed font-light max-w-md"
          >
            Spin the globe to discover the world&rsquo;s great ballet and opera
            companies — then plan your season, performance by performance.
          </p>
          <div data-hero-anim className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/calendar"
              className="px-7 py-3 bg-[#1B2A4A] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#13203a] transition-colors duration-300"
            >
              Open the calendar
            </Link>
            <Link
              href="/companies"
              className="px-7 py-3 border border-[#1A1A1A]/20 text-[#1A1A1A]/70 text-xs tracking-[0.2em] uppercase hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors duration-300"
            >
              Browse companies
            </Link>
          </div>
          <p
            data-hero-anim
            className="mt-8 text-[#1A1A1A]/35 text-[11px] tracking-[0.18em] uppercase"
          >
            Drag to rotate · Tap a marker to explore
          </p>
        </div>
      </div>

      {/* Selected company card */}
      {selected && (
        <div className="absolute z-20 bottom-6 right-6 left-6 sm:left-auto sm:w-[340px] animate-fade-in-up">
          <div className="relative bg-white border border-[#1A1A1A]/[0.08] shadow-card-hover rounded-md overflow-hidden">
            <div
              className="h-1 w-full"
              style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }}
            />
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute top-3 right-3 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"
            >
              <X size={18} />
            </button>
            <div className="p-6">
              <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-3">
                {typeLabel(selected.type)} · {selected.country}
              </p>
              <h3 className="font-serif text-2xl font-light text-[#1A1A1A] mb-1">
                {selected.name}
              </h3>
              <p className="text-[#1A1A1A]/45 text-sm mb-5">
                {selected.city}
                {selected.venue ? ` · ${selected.venue}` : ''}
              </p>
              <Link
                href={`/companies/${selected.slug}`}
                className="inline-flex items-center gap-1.5 text-[#1B2A4A] text-xs tracking-[0.2em] uppercase hover:text-[#D4AF37] transition-colors"
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
