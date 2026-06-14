'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'
import type { SearchFacets, SearchFilters, FacetCount } from '@/lib/types'

interface Props {
  facets: SearchFacets
  filters: SearchFilters
}

const PRICE_OPTIONS = [
  { label: 'Under €40', value: '40' },
  { label: 'Under €80', value: '80' },
  { label: 'Under €150', value: '150' },
  { label: 'Under €300', value: '300' },
  { label: 'Any price', value: '' },
]

const KIND_OPTIONS = [
  { label: 'Ballet', value: 'ballet' },
  { label: 'Opera', value: 'opera' },
  { label: 'Concert', value: 'concert' },
]

function useFilterNav() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function push(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/search?${params.toString()}`)
  }

  function toggle(key: string, value: string) {
    const current = searchParams.get(key)
    push(key, current === value ? null : value)
  }

  function clearAll() {
    // Keep only q
    const q = searchParams.get('q')
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    router.push(`/search?${params.toString()}`)
  }

  return { push, toggle, clearAll }
}

interface FacetSectionProps {
  title: string
  facets: FacetCount[]
  activeValue: string | undefined
  paramKey: string
  onToggle: (key: string, value: string) => void
}

function FacetSection({ title, facets, activeValue, paramKey, onToggle }: FacetSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [sectionOpen, setSectionOpen] = useState(true)
  const visible = expanded ? facets : facets.slice(0, 8)
  const hasMore = facets.length > 8

  if (facets.length === 0) return null

  return (
    <div className="border-b border-white/[0.08] pb-4 mb-4">
      <button
        type="button"
        onClick={() => setSectionOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
        aria-expanded={sectionOpen}
      >
        <span className="text-[11px] tracking-[0.32em] uppercase text-ivory/55 group-hover:text-ivory/80 transition-colors">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={clsx('text-ivory/30 transition-transform duration-200', sectionOpen ? 'rotate-180' : '')}
        />
      </button>

      {sectionOpen && (
        <div className="space-y-1">
          {visible.map((f) => {
            const isActive = activeValue === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onToggle(paramKey, f.value)}
                aria-pressed={isActive}
                aria-current={isActive ? 'true' : undefined}
                className={clsx(
                  'flex items-center justify-between w-full px-3 py-2 rounded-glass-sm text-sm transition-all duration-200',
                  isActive
                    ? 'bg-gold/[0.12] border border-gold/30 text-gold'
                    : 'text-ivory/62 hover:bg-white/[0.06] hover:text-ivory border border-transparent'
                )}
              >
                <span className="truncate text-left">{f.label}</span>
                <span className={clsx('ml-2 text-xs flex-shrink-0', isActive ? 'text-gold/70' : 'text-ivory/30')}>
                  {f.count}
                </span>
              </button>
            )
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] tracking-[0.2em] uppercase text-ivory/38 hover:text-gold transition-colors px-3 pt-1"
            >
              {expanded ? 'Show less' : `+${facets.length - 8} more`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function FilterRail({ facets, filters }: Props) {
  const { push, toggle, clearAll } = useFilterNav()
  const [dateOpen, setDateOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const hasActiveFilters =
    filters.kind || filters.country || filters.city ||
    filters.company_slug || filters.choreographer_slug ||
    filters.composer_slug || filters.start_date || filters.end_date ||
    filters.price_max != null

  const rail = (
    <div className="glass-panel p-5 space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] tracking-[0.32em] uppercase text-ivory/55">Filters</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase text-gold hover:text-gold-bright transition-colors"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Discipline */}
      <div className="border-b border-white/[0.08] pb-4 mb-4">
        <p className="text-[11px] tracking-[0.32em] uppercase text-ivory/55 mb-3">Discipline</p>
        <div className="space-y-1">
          {KIND_OPTIONS.map((opt) => {
            const fc = facets.kind.find((f) => f.value === opt.value)
            const isActive = filters.kind === opt.value
            if (!fc && !isActive) return null
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle('kind', opt.value)}
                aria-pressed={isActive}
                aria-current={isActive ? 'true' : undefined}
                className={clsx(
                  'flex items-center justify-between w-full px-3 py-2 rounded-glass-sm text-sm transition-all duration-200',
                  isActive
                    ? 'bg-gold/[0.12] border border-gold/30 text-gold'
                    : 'text-ivory/62 hover:bg-white/[0.06] hover:text-ivory border border-transparent'
                )}
              >
                <span>{opt.label}</span>
                {fc && (
                  <span className={clsx('text-xs', isActive ? 'text-gold/70' : 'text-ivory/30')}>
                    {fc.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <FacetSection title="Country" facets={facets.country} activeValue={filters.country} paramKey="country" onToggle={toggle} />
      <FacetSection title="City" facets={facets.city} activeValue={filters.city} paramKey="city" onToggle={toggle} />
      <FacetSection title="Company" facets={facets.company} activeValue={filters.company_slug} paramKey="company" onToggle={toggle} />
      <FacetSection title="Choreographer" facets={facets.choreographer} activeValue={filters.choreographer_slug} paramKey="choreographer" onToggle={toggle} />
      <FacetSection title="Composer" facets={facets.composer} activeValue={filters.composer_slug} paramKey="composer" onToggle={toggle} />

      {/* Date range */}
      <div className="border-b border-white/[0.08] pb-4 mb-4">
        <button
          type="button"
          onClick={() => setDateOpen((v) => !v)}
          className="flex items-center justify-between w-full mb-3 group"
          aria-expanded={dateOpen}
        >
          <span className="text-[11px] tracking-[0.32em] uppercase text-ivory/55 group-hover:text-ivory/80 transition-colors">
            Date range
          </span>
          <ChevronDown
            size={14}
            className={clsx('text-ivory/30 transition-transform duration-200', dateOpen ? 'rotate-180' : '')}
          />
        </button>
        {dateOpen && (
          <div className="space-y-2">
            <div>
              <label htmlFor="filter-start" className="text-[10px] tracking-[0.24em] uppercase text-ivory/38 mb-1 block">
                From
              </label>
              <input
                id="filter-start"
                type="date"
                value={filters.start_date ?? ''}
                onChange={(e) => push('start', e.target.value || null)}
                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-glass-sm text-ivory/70 text-sm px-3 py-2 focus:outline-none focus:border-gold/40 focus:bg-white/[0.07] transition-all"
              />
            </div>
            <div>
              <label htmlFor="filter-end" className="text-[10px] tracking-[0.24em] uppercase text-ivory/38 mb-1 block">
                To
              </label>
              <input
                id="filter-end"
                type="date"
                value={filters.end_date ?? ''}
                onChange={(e) => push('end', e.target.value || null)}
                className="w-full bg-white/[0.04] border border-white/[0.12] rounded-glass-sm text-ivory/70 text-sm px-3 py-2 focus:outline-none focus:border-gold/40 focus:bg-white/[0.07] transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <button
          type="button"
          onClick={() => setPriceOpen((v) => !v)}
          className="flex items-center justify-between w-full mb-3 group"
          aria-expanded={priceOpen}
        >
          <span className="text-[11px] tracking-[0.32em] uppercase text-ivory/55 group-hover:text-ivory/80 transition-colors">
            Max price (EUR)
          </span>
          <ChevronDown
            size={14}
            className={clsx('text-ivory/30 transition-transform duration-200', priceOpen ? 'rotate-180' : '')}
          />
        </button>
        {priceOpen && (
          <select
            value={filters.price_max?.toString() ?? ''}
            onChange={(e) => push('price_max', e.target.value || null)}
            aria-label="Maximum price in EUR"
            className="w-full bg-white/[0.04] border border-white/[0.12] rounded-glass-sm text-ivory/70 text-sm px-3 py-2 focus:outline-none focus:border-gold/40 transition-all appearance-none cursor-pointer"
          >
            {PRICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: '#0A0908' }}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="glass-pill px-5 py-2.5 flex items-center gap-2 text-ivory/70 text-sm hover:text-ivory transition-colors"
          aria-expanded={mobileOpen}
          aria-controls="filter-rail-mobile"
        >
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-gold" aria-hidden />
          )}
          <ChevronDown
            size={14}
            className={clsx('transition-transform duration-200', mobileOpen ? 'rotate-180' : '')}
          />
        </button>
        {mobileOpen && (
          <div id="filter-rail-mobile" className="mt-3">
            {rail}
          </div>
        )}
      </div>

      {/* Desktop rail */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-28">
          {rail}
        </div>
      </div>
    </>
  )
}
