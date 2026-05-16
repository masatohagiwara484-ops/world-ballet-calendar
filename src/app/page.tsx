'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Company } from '@/lib/supabase'

const GlobeView = dynamic(() => import('@/components/map/GlobeView'), {
  ssr: false,
  loading: () => <div className="h-screen bg-black" />,
})

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-950 flex items-center justify-center">
    <p className="text-gray-600 text-sm tracking-widest uppercase">Loading…</p>
  </div>,
})

type MapFilter = 'all' | 'ballet' | 'opera'

const FILTERS: { label: string; value: MapFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ballet', value: 'ballet' },
  { label: 'Opera', value: 'opera' },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    setMounted(true)
    fetch('/api/companies')
      .then(r => r.json())
      .then(d => setCompanies(d.companies ?? []))
      .catch(() => {})
  }, [])

  if (!mounted) return <div className="h-screen bg-black" />

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Globe */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <GlobeView />
        </div>
        <div className="relative z-10 text-center pointer-events-none">
          <h1 className="font-serif text-6xl md:text-8xl font-light tracking-tight mb-4">
            Every stage.
          </h1>
          <h2 className="font-serif text-6xl md:text-8xl font-light tracking-tight mb-12 text-gray-400">
            Every season.
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto px-4">
            Discover ballet and opera performances around the world.
          </p>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto">
          <h3 className="font-serif text-4xl mb-4 text-center">Find by location</h3>

          {/* Filter buttons */}
          <div className="flex justify-center gap-3 mb-10">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setMapFilter(value)}
                className={`px-6 py-2 text-sm tracking-widest uppercase border transition-all duration-300 ${
                  mapFilter === value
                    ? 'border-[#C9A961] text-[#C9A961] bg-[#C9A961]/10'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden border border-gray-800 h-[500px]">
            <WorldMap filter={mapFilter} />
          </div>
        </div>
      </section>

      {/* Companies Grid Section */}
      {companies.length > 0 && (
        <section className="py-20 px-8 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <h3 className="font-serif text-4xl font-light mb-3 text-center">Companies</h3>
            <p className="text-white/40 text-sm mb-12 text-center tracking-wide">
              Select a company to explore their season
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  className="group bg-[#0A0A0A] p-10 hover:bg-white/[0.02] transition-all duration-500 block"
                >
                  <p className="text-[#C9A961] text-[10px] tracking-[0.3em] uppercase mb-4">
                    {company.type} · {company.country}
                  </p>
                  <h4 className="font-serif text-2xl font-light mb-3 group-hover:text-[#C9A961] transition-colors duration-300">
                    {company.name}
                  </h4>
                  <p className="text-white/30 text-sm leading-relaxed line-clamp-2">
                    {company.description_short}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <span className="text-white/20 text-xs tracking-widest uppercase">
                      Est. {company.founded_year}
                    </span>
                    <span className="ml-auto text-[#C9A961] text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#0A0A0A] border-t border-white/5 py-8 px-8">
        <div className="max-w-7xl mx-auto text-center text-white/30 text-sm">
          <p>World Ballet &amp; Opera Calendar &copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
