'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import clsx from 'clsx'
import type { MediaFacets, MediaFacetItem, MediaFilters } from '@/lib/media'

interface Props {
  facets: MediaFacets
  filters: MediaFilters
}

/**
 * Filter rail for the /read directory. Reuses the performances filter pattern
 * (src/components/search/FilterRail.tsx): toggle buttons with live facet counts,
 * URL-query-param state (so filtered views are shareable) mutated via
 * useRouter/useSearchParams, aria-pressed/current, and a Clear-all affordance.
 */
function useFilterNav() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function push(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const qs = params.toString()
    router.push(qs ? `/read?${qs}` : '/read')
  }

  function toggle(key: string, value: string) {
    const current = searchParams.get(key)
    push(key, current === value ? null : value)
  }

  function clearAll() {
    router.push('/read')
  }

  return { toggle, clearAll }
}

interface FacetSectionProps {
  title: string
  facets: MediaFacetItem[]
  activeValue: string | undefined
  paramKey: string
  onToggle: (key: string, value: string) => void
}

function FacetSection({ title, facets, activeValue, paramKey, onToggle }: FacetSectionProps) {
  const [open, setOpen] = useState(true)
  if (facets.length === 0) return null

  return (
    <div className="border-b border-black/[0.07] pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
        aria-expanded={open}
      >
        <span className="text-[11px] tracking-[0.32em] uppercase text-ivory/55 group-hover:text-ivory transition-colors">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={clsx('text-ivory/40 transition-transform duration-200', open ? 'rotate-180' : '')}
        />
      </button>

      {open && (
        <div className="space-y-1">
          {facets.map((f) => {
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
                    ? 'bg-gold/[0.10] border border-gold/30 text-gold-deep'
                    : 'text-ivory/70 hover:bg-black/[0.04] hover:text-ivory border border-transparent'
                )}
              >
                <span className="truncate text-left">{f.label}</span>
                <span className={clsx('ml-2 text-xs flex-shrink-0', isActive ? 'text-gold-deep/70' : 'text-ivory/40')}>
                  {f.count}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MediaFilterRail({ facets, filters }: Props) {
  const { toggle, clearAll } = useFilterNav()
  const [mobileOpen, setMobileOpen] = useState(false)

  const hasActiveFilters = Boolean(filters.region || filters.country)

  const rail = (
    <div className="bg-white border border-black/[0.08] rounded-glass shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] tracking-[0.32em] uppercase text-ivory/55">Filter</p>
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

      <FacetSection
        title="Region"
        facets={facets.region}
        activeValue={filters.region}
        paramKey="region"
        onToggle={toggle}
      />
      <FacetSection
        title="Country"
        facets={facets.country}
        activeValue={filters.country}
        paramKey="country"
        onToggle={toggle}
      />
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
          aria-controls="media-filter-rail-mobile"
        >
          Filter
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-gold" aria-hidden />}
          <ChevronDown
            size={14}
            className={clsx('transition-transform duration-200', mobileOpen ? 'rotate-180' : '')}
          />
        </button>
        {mobileOpen && (
          <div id="media-filter-rail-mobile" className="mt-3">
            {rail}
          </div>
        )}
      </div>

      {/* Desktop rail */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-28">{rail}</div>
      </div>
    </>
  )
}
