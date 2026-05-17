'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Performance, Company } from '@/lib/supabase'

interface CalendarSidebarProps {
  onFilterChange?: (filters: FilterState) => void
}

interface FilterState {
  country: string | null
  type: 'all' | 'ballet' | 'opera'
  selectedDate: string | null
}

export default function CalendarSidebar({ onFilterChange }: CalendarSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    country: null,
    type: 'all',
    selectedDate: null,
  })

  const [countries, setCountries] = useState<string[]>([])
  const [performanceDates, setPerformanceDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Fetch countries from companies
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('/api/companies')
        const data = await res.json()
        const countrySet = new Set((data.companies || []).map((c: Company) => c.country))
        setCountries(Array.from(countrySet).sort() as string[])
      } catch (error) {
        console.error('Failed to fetch countries:', error)
      }
    }
    fetchCountries()
  }, [])

  // Fetch performance dates when filters change
  useEffect(() => {
    const fetchPerformances = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.country) params.append('country', filters.country)
        if (filters.type !== 'all') params.append('type', filters.type)
        params.append('start_date', '2026-01-01')
        params.append('end_date', '2026-12-31')

        const res = await fetch(`/api/performances?${params.toString()}`)
        const data = await res.json()

        const dates = new Set<string>()
        data.performances?.forEach((p: Performance) => {
          const dateStr = p.start_date.split('T')[0]
          dates.add(dateStr)
        })
        setPerformanceDates(dates)
      } catch (error) {
        console.error('Failed to fetch performances:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPerformances()
  }, [filters.country, filters.type])

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterState>) => {
      const updated = { ...filters, ...newFilters }
      setFilters(updated)
      onFilterChange?.(updated)
    },
    [filters, onFilterChange]
  )

  const handleClearFilters = () => {
    const cleared = { country: null, type: 'all' as const, selectedDate: null }
    setFilters(cleared)
    onFilterChange?.(cleared)
  }

  // Generate calendar days for 2026
  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate()

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i,
    name: new Date(2026, i).toLocaleString('en-US', { month: 'short' }),
  }))

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-[#1A1A1A]/[0.08] overflow-y-auto pt-24 px-6 py-8 z-40 max-xl:hidden">
      <h2 className="font-serif text-xl font-light mb-6 text-[#1A1A1A]">2026 Calendar</h2>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Country Filter */}
        <div>
          <label className="text-[#1A1A1A]/50 text-xs tracking-widest uppercase block mb-2">
            Country
          </label>
          <select
            value={filters.country || ''}
            onChange={(e) => handleFilterChange({ country: e.target.value || null })}
            className="w-full bg-[#FAF8F5] border border-[#1A1A1A]/[0.08] text-[#1A1A1A] px-3 py-2 text-sm rounded focus:outline-none focus:border-[#D4AF37] transition-colors"
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-[#1A1A1A]/50 text-xs tracking-widest uppercase block mb-2">
            Type
          </label>
          <div className="flex gap-2">
            {(['all', 'ballet', 'opera'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange({ type })}
                className={`flex-1 px-3 py-2 text-xs tracking-widest uppercase rounded transition-all ${
                  filters.type === type
                    ? 'bg-[#D4AF37] text-white font-medium'
                    : 'bg-[#FAF8F5] text-[#1A1A1A]/50 border border-[#1A1A1A]/[0.08] hover:border-[#1A1A1A]/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.country || filters.type !== 'all') && (
          <button
            onClick={handleClearFilters}
            className="w-full text-xs text-[#1A1A1A]/30 hover:text-[#D4AF37] transition-colors underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-6">
        {months.map(({ month, name }) => (
          <div key={month}>
            <h3 className="font-serif text-sm font-light text-[#1A1A1A] mb-3">{name}</h3>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-[#1A1A1A]/30 text-[10px] font-light h-6 flex items-center justify-center">
                  {day.substring(0, 1)}
                </div>
              ))}

              {Array.from({ length: new Date(2026, month, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth(2026, month) }).map((_, i) => {
                const day = i + 1
                const dateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const hasPerformance = performanceDates.has(dateStr)

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleFilterChange({ selectedDate: dateStr })}
                    className={`h-8 flex items-center justify-center text-xs rounded transition-all ${
                      filters.selectedDate === dateStr
                        ? 'bg-[#D4AF37] text-white font-medium shadow-gold-glow'
                        : hasPerformance
                          ? 'bg-[#FAF8F5] text-[#D4AF37] border border-[#D4AF37]/50 cursor-pointer hover:shadow-gold-glow'
                          : 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]/50'
                    }`}
                    disabled={!hasPerformance && filters.selectedDate !== dateStr}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center text-[#1A1A1A]/30 text-xs mt-4">Loading...</div>}
    </aside>
  )
}
