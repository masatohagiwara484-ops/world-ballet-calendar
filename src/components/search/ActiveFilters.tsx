'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import type { SearchFilters } from '@/lib/types'

interface Props {
  filters: SearchFilters
}

interface Chip {
  label: string
  paramKey: string
}

function buildChips(filters: SearchFilters): Chip[] {
  const chips: Chip[] = []

  if (filters.kind) chips.push({ label: filters.kind.charAt(0).toUpperCase() + filters.kind.slice(1), paramKey: 'kind' })
  if (filters.country) chips.push({ label: filters.country, paramKey: 'country' })
  if (filters.city) chips.push({ label: filters.city, paramKey: 'city' })
  if (filters.company_slug) chips.push({ label: `Company: ${filters.company_slug}`, paramKey: 'company' })
  if (filters.person_slug) chips.push({ label: `Artist: ${filters.person_slug}`, paramKey: 'person' })
  if (filters.choreographer_slug) chips.push({ label: `Choreographer: ${filters.choreographer_slug}`, paramKey: 'choreographer' })
  if (filters.composer_slug) chips.push({ label: `Composer: ${filters.composer_slug}`, paramKey: 'composer' })
  if (filters.work_slug) chips.push({ label: `Work: ${filters.work_slug}`, paramKey: 'work' })
  if (filters.start_date) chips.push({ label: `From ${filters.start_date}`, paramKey: 'start' })
  if (filters.end_date) chips.push({ label: `To ${filters.end_date}`, paramKey: 'end' })
  if (filters.price_max != null) chips.push({ label: `Under €${filters.price_max}`, paramKey: 'price_max' })

  return chips
}

export default function ActiveFilters({ filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chips = buildChips(filters)

  if (chips.length === 0) return null

  function remove(paramKey: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramKey)
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div
      role="group"
      aria-label="Active filters"
      className="flex flex-wrap gap-2 mb-5"
    >
      {chips.map((chip) => (
        <span
          key={chip.paramKey}
          className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase text-gold animate-fade-in"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => remove(chip.paramKey)}
            aria-label={`Remove ${chip.label} filter`}
            className="text-gold/60 hover:text-gold transition-colors"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  )
}
