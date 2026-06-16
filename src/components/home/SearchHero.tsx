'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import SearchBox from '@/components/search/SearchBox'

const EXAMPLE_CHIPS = [
  { label: 'Swan Lake', href: '/search?q=Swan%20Lake' },
  { label: 'Rudolf Nureyev', href: '/search?q=Rudolf%20Nureyev' },
  { label: 'Paris', href: '/search?city=Paris' },
  { label: 'La Bohème', href: '/search?q=La%20Boh%C3%A8me' },
  { label: 'Tokyo', href: '/search?city=Tokyo' },
  { label: 'Opera', href: '/search?kind=opera' },
]

export default function SearchHero() {
  return (
    <section
      aria-label="Search the world's stages"
      className="relative min-h-[82vh] flex flex-col items-center justify-center px-6 py-28 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}
    >
      {/* Ambient aura layers — light jewel washes on white */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(212,175,55,0.09) 0%, transparent 65%)',
            'radial-gradient(ellipse 80% 60% at 0% 80%, rgba(74,31,46,0.07) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 100% 85%, rgba(27,42,74,0.08) 0%, transparent 55%)',
          ].join(', '),
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <p
          className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-7 animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        >
          World Ballet &amp; Opera Calendar
        </p>

        {/* Headline */}
        <h1
          className="font-seasons text-5xl sm:text-6xl md:text-[4.5rem] text-gradient-gold leading-[1.07] mb-5 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          Every stage
          <br />
          in the world.
        </h1>

        {/* Tagline */}
        <p
          className="font-seasons text-xl sm:text-2xl text-ivory/70 italic mb-4 animate-fade-in-up"
          style={{ animationDelay: '140ms' }}
        >
          One search.
        </p>

        {/* Subhead */}
        <p
          className="text-ivory/60 text-base sm:text-lg mb-10 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Type a work, an artist, a company, or a city — and find every performance on Earth.
        </p>

        {/* Search box */}
        <div
          className="animate-fade-in-up mb-8"
          style={{ animationDelay: '280ms' }}
        >
          <Suspense fallback={<div className="h-16 bg-white/80 border border-black/10 rounded-glass animate-pulse" />}>
            <SearchBox size="hero" />
          </Suspense>
        </div>

        {/* Example chips */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 animate-fade-in-up"
          style={{ animationDelay: '360ms' }}
          aria-label="Example searches"
        >
          {EXAMPLE_CHIPS.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="glass-pill px-4 py-2 text-[11px] tracking-[0.22em] uppercase text-ivory/60 hover:text-gold-deep hover:border-gold/40 transition-all duration-300"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
