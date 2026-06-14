'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import SearchBox from '@/components/search/SearchBox'

const EXAMPLE_CHIPS = [
  { label: 'Swan Lake', href: '/search?q=Swan%20Lake' },
  { label: 'Kenneth MacMillan', href: '/search?choreographer=kenneth-macmillan' },
  { label: 'Tokyo', href: '/search?city=Tokyo' },
  { label: 'Opera', href: '/search?kind=opera' },
  { label: 'Under €80', href: '/search?price_max=80' },
]

export default function SearchHero() {
  return (
    <section
      aria-label="Search the world's stages"
      className="relative min-h-[78vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden"
    >
      {/* Ambient aura layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 70% 55% at 50% 5%, rgba(212,175,55,0.13) 0%, rgba(10,9,8,0) 65%)',
            'radial-gradient(ellipse 80% 60% at 0% 70%, rgba(74,31,46,0.18) 0%, rgba(10,9,8,0) 60%)',
            'radial-gradient(ellipse 60% 50% at 100% 80%, rgba(27,42,74,0.18) 0%, rgba(10,9,8,0) 55%)',
          ].join(', '),
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <p
          className="text-gold text-[11px] tracking-[0.4em] uppercase mb-6 animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        >
          The World&rsquo;s Stages, One Search
        </p>

        {/* Headline */}
        <h1
          className="font-serif text-5xl sm:text-6xl md:text-7xl text-gradient-gold leading-[1.07] mb-6 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          Every stage
          <br />
          in the world.
        </h1>

        {/* Subhead */}
        <p
          className="text-ivory/62 text-base sm:text-lg mb-10 animate-fade-in-up"
          style={{ animationDelay: '160ms' }}
        >
          Find any ballet or opera performance — by work, artist, company, or city.
        </p>

        {/* Search box */}
        <div
          className="animate-fade-in-up mb-8"
          style={{ animationDelay: '240ms' }}
        >
          <Suspense fallback={<div className="h-16 glass-panel rounded-glass animate-pulse" />}>
            <SearchBox size="hero" />
          </Suspense>
        </div>

        {/* Example chips */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 animate-fade-in-up"
          style={{ animationDelay: '320ms' }}
          aria-label="Example searches"
        >
          {EXAMPLE_CHIPS.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="glass-pill px-4 py-2 text-[11px] tracking-[0.22em] uppercase text-ivory/55 hover:text-gold hover:border-gold/30 transition-all duration-300"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
