'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'
import CompanyCard from '@/components/shared/CompanyCard'
import type { Company } from '@/lib/types'

type TypeFilter = 'all' | 'ballet' | 'opera' | 'both'

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ballet', label: 'Ballet' },
  { value: 'opera', label: 'Opera' },
  { value: 'both', label: 'Both' },
]

export default function CompanyDirectory({ companies }: { companies: Company[] }) {
  const [type, setType] = useState<TypeFilter>('all')
  const [country, setCountry] = useState('')
  const [query, setQuery] = useState('')

  const countries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.country))).sort(),
    [companies]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return companies.filter((c) => {
      if (type !== 'all' && c.type !== type) return false
      if (country && c.country !== country) return false
      if (q) {
        const hay = `${c.name} ${c.name_local ?? ''} ${c.city} ${c.country}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [companies, type, country, query])

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-5 mb-10">
        <div
          role="group"
          aria-label="Filter by type"
          className="inline-flex border border-[#1A1A1A]/[0.12] rounded overflow-hidden self-start"
        >
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setType(o.value)}
              aria-pressed={type === o.value}
              className={clsx(
                'px-5 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors',
                type === o.value
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-white text-[#1A1A1A]/55 hover:text-[#1A1A1A]'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/35">
            Country
          </span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-white border border-[#1A1A1A]/[0.12] rounded px-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none cursor-pointer min-w-[12rem]"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 lg:ml-auto w-full lg:w-72">
          <span className="text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A]/35">
            Search
          </span>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Company, city, country"
              className="w-full bg-white border border-[#1A1A1A]/[0.12] rounded pl-9 pr-4 py-2.5 text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>
        </label>
      </div>

      <p className="text-[#1A1A1A]/40 text-xs tracking-[0.15em] uppercase mb-6">
        {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-[#1A1A1A]/40 text-sm">
          No companies match these filters.
        </p>
      )}
    </div>
  )
}
