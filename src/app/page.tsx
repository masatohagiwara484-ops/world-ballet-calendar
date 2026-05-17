'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import HeroSection from '@/components/hero/HeroSection'
import CalendarSidebar from '@/components/calendar/CalendarSidebar'
import PerformanceModal from '@/components/modals/PerformanceModal'
import { useStaggerReveal } from '@/hooks/useScrollReveal'
import type { Company, Performance } from '@/lib/supabase'

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-[#FAF8F5] flex items-center justify-center">
    <p className="text-[#1A1A1A]/30 text-sm tracking-widest uppercase">Loading…</p>
  </div>,
})

type MapFilter = 'all' | 'ballet' | 'opera'

const FILTERS: { label: string; value: MapFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ballet', value: 'ballet' },
  { label: 'Opera', value: 'opera' },
]

// Accent colors for company cards rotation
const CARD_ACCENTS = ['#1B2A4A', '#1A3A2E', '#2D1B4E', '#D4AF37']

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedPerformance, setSelectedPerformance] = useState<(Performance & { company?: Company }) | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const companiesRef = useStaggerReveal<HTMLDivElement>('[data-company-card]')
  const mapSectionRef = useRef<HTMLElement>(null)
  const companiesSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
    fetch('/api/companies')
      .then(r => r.json())
      .then(d => setCompanies(d.companies ?? []))
      .catch(() => {})
  }, [])

  // Handle calendar date selection
  const handleDateSelected = async (dateStr: string) => {
    try {
      const params = new URLSearchParams()
      params.append('start_date', dateStr)
      params.append('end_date', dateStr)

      const res = await fetch(`/api/performances?${params.toString()}`)
      const data = await res.json()

      if (data.performances && data.performances.length > 0) {
        const performance = data.performances[0]
        // Find company info for this performance
        const company = companies.find(c => c.id === performance.company_id)
        setSelectedPerformance({ ...performance, company })
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch performance:', error)
    }
  }

  // IntersectionObserver for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [mounted, companies])

  if (!mounted) return <div className="h-screen bg-white" />

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)', backgroundAttachment: 'fixed' }}>
      {/* Calendar Sidebar */}
      <CalendarSidebar onDateSelected={handleDateSelected} />

      {/* Performance Modal */}
      <PerformanceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPerformance(null)
        }}
        performance={selectedPerformance}
        accentColor="gold"
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Interactive Map Section */}
      <section
        ref={mapSectionRef}
        id="map"
        className="py-24 px-4"
        style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="reveal text-center mb-4">
            <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-3">Explore</p>
            <h3 className="font-serif text-4xl font-light text-[#1A1A1A]">Find by location</h3>
          </div>

          {/* Filter buttons */}
          <div className="reveal flex justify-center gap-3 mt-6 mb-10" style={{ transitionDelay: '0.1s' }}>
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setMapFilter(value)}
                className={`px-6 py-2 text-sm tracking-widest uppercase border transition-all duration-300 ${
                  mapFilter === value
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/[0.08]'
                    : 'border-[#1A1A1A]/[0.15] text-[#1A1A1A]/40 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="reveal overflow-hidden border border-[#1A1A1A]/[0.08] h-[500px] shadow-card" style={{ transitionDelay: '0.2s' }}>
            <WorldMap filter={mapFilter} />
          </div>
        </div>
      </section>

      {/* Companies Grid Section */}
      {companies.length > 0 && (
        <section
          ref={companiesSectionRef}
          id="companies"
          className="py-24 px-8"
          style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="reveal text-center mb-2">
              <p className="text-[#C9A961] text-[10px] tracking-[0.4em] uppercase mb-3">Directory</p>
              <h3 className="font-serif text-4xl font-light text-[#1A1A1A]">Companies</h3>
            </div>
            <p className="reveal text-[#1A1A1A]/40 text-sm mb-14 text-center tracking-wide" style={{ transitionDelay: '0.1s' }}>
              Select a company to explore their season
            </p>

            <div ref={companiesRef} className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1A1A1A]/[0.06]">
              {companies.map((company, idx) => {
                const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length]
                return (
                  <Link
                    key={company.id}
                    href={`/companies/${company.slug}`}
                    data-company-card
                    className="group bg-white p-10 hover:bg-[#FAF8F5] transition-all duration-500 block hover:shadow-card-hover relative overflow-hidden"
                  >
                    {/* Top color accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                    />
                    <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-4">
                      {company.type} · {company.country}
                    </p>
                    <h4 className="font-serif text-2xl font-light mb-3 text-[#1A1A1A] group-hover:text-[#1B2A4A] transition-colors duration-300">
                      {company.name}
                    </h4>
                    <p className="text-[#1A1A1A]/50 text-sm leading-relaxed line-clamp-2">
                      {company.description_short}
                    </p>
                    <div className="mt-6 flex items-center gap-2">
                      <span className="text-[#1A1A1A]/30 text-xs tracking-widest uppercase">
                        Est. {company.founded_year}
                      </span>
                      <span className="ml-auto text-[#D4AF37] text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Explore →
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/[0.08] py-10 px-8" style={{ background: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="font-serif text-sm text-[#1A1A1A]/30 tracking-wide">
            World Ballet &amp; Opera Calendar &copy; 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
