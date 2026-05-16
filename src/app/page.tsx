'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import HeroSection from '@/components/hero/HeroSection'
import CalendarSidebar from '@/components/calendar/CalendarSidebar'
import { useStaggerReveal } from '@/hooks/useScrollReveal'
import type { Company } from '@/lib/supabase'

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
  const companiesRef = useStaggerReveal<HTMLDivElement>('[data-company-card]')

  useEffect(() => {
    setMounted(true)
    fetch('/api/companies')
      .then(r => r.json())
      .then(d => setCompanies(d.companies ?? []))
      .catch(() => {})
  }, [])

  if (!mounted) return <div className="h-screen bg-black" />

  return (
    <div className="min-h-screen bg-[#2a2a3e]">
      {/* Calendar Sidebar */}
      <CalendarSidebar />

      {/* Hero Section */}
      <HeroSection />

      {/* Interactive Map Section */}
      <section id="map" className="py-20 px-4 bg-gradient-to-b from-[#2a2a3e] to-[#3a3a4e]">
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
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-[#E8D5B7]/30 text-[#E8D5B7]/50 hover:border-[#E8D5B7]/60 hover:text-[#E8D5B7]'
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
        <section id="companies" className="py-20 px-8 bg-[#2a2a3e]">
          <div className="max-w-7xl mx-auto">
            <h3 className="font-serif text-4xl font-light mb-3 text-center">Companies</h3>
            <p className="text-white/40 text-sm mb-12 text-center tracking-wide">
              Select a company to explore their season
            </p>

            <div ref={companiesRef} className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E8D5B7]/10">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.slug}`}
                  data-company-card
                  className="group bg-[#2a2a3e] p-10 hover:bg-[#3a3a4e] transition-all duration-500 block hover:shadow-lg"
                >
                  <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-4">
                    {company.type} · {company.country}
                  </p>
                  <h4 className="font-serif text-2xl font-light mb-3 group-hover:text-[#D4AF37] transition-colors duration-300">
                    {company.name}
                  </h4>
                  <p className="text-[#E8D5B7]/60 text-sm leading-relaxed line-clamp-2">
                    {company.description_short}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <span className="text-[#E8D5B7]/40 text-xs tracking-widest uppercase">
                      Est. {company.founded_year}
                    </span>
                    <span className="ml-auto text-[#D4AF37] text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
      <footer className="bg-[#2a2a3e] border-t border-[#E8D5B7]/15 py-8 px-8">
        <div className="max-w-7xl mx-auto text-center text-white/30 text-sm">
          <p>World Ballet &amp; Opera Calendar &copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
