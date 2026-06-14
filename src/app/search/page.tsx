import { Suspense } from 'react'
import type { Metadata } from 'next'
import { search } from '@/lib/search'
import type { SearchFilters, SearchSort, WorkKind } from '@/lib/types'
import SearchBox from '@/components/search/SearchBox'
import ResultCard from '@/components/search/ResultCard'
import FilterRail from '@/components/search/FilterRail'
import ActiveFilters from '@/components/search/ActiveFilters'
import Pagination from '@/components/search/Pagination'
import SortControl from '@/components/search/SortControl'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */
type PageProps = { searchParams: Record<string, string | string[] | undefined> }

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v)
  if (!s) return undefined
  const n = Number(s)
  return isNaN(n) ? undefined : n
}

function parseFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  return {
    q: str(params.q),
    kind: str(params.kind) as WorkKind | undefined,
    country: str(params.country),
    city: str(params.city),
    company_slug: str(params.company),
    person_slug: str(params.person),
    choreographer_slug: str(params.choreographer),
    composer_slug: str(params.composer),
    work_slug: str(params.work),
    start_date: str(params.start),
    end_date: str(params.end),
    price_min: num(params.price_min),
    price_max: num(params.price_max),
    sort: (str(params.sort) as SearchSort | undefined) ?? 'date',
    page: num(params.page) ?? 1,
    page_size: 24,
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filters = parseFilters(searchParams)
  const q = filters.q
  const work = str(searchParams.work)

  let title: string
  let description: string

  if (work) {
    title = `${work.replace(/-/g, ' ')} — every performance worldwide`
    description = `Discover every performance of ${work.replace(/-/g, ' ')} on the World Ballet & Opera Calendar.`
  } else if (q) {
    title = `"${q}" — World Ballet & Opera Calendar`
    description = `Search results for "${q}" — find ballet and opera performances worldwide.`
  } else if (filters.kind) {
    const kindName = filters.kind.charAt(0).toUpperCase() + filters.kind.slice(1)
    title = `${kindName} performances worldwide — World Ballet & Opera Calendar`
    description = `Browse ${kindName} performances around the world on the World Ballet & Opera Calendar.`
  } else {
    title = "Search the world's ballet & opera — World Ballet & Opera Calendar"
    description = 'Find any ballet or opera performance in the world. Filter by company, city, artist, date, and more.'
  }

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

/** Thin Suspense wrappers so useSearchParams() compiles without errors in build. */
function SortControlSuspense({ sort }: { sort: SearchSort | undefined }) {
  return (
    <Suspense fallback={<div className="h-8" />}>
      <SortControl current={sort ?? 'date'} />
    </Suspense>
  )
}

function ActiveFiltersSuspense({ filters }: { filters: SearchFilters }) {
  return (
    <Suspense fallback={null}>
      <ActiveFilters filters={filters} />
    </Suspense>
  )
}

function FilterRailSuspense({ facets, filters }: Parameters<typeof FilterRail>[0]) {
  return (
    <Suspense fallback={<div className="w-72 h-96 glass-panel animate-pulse" />}>
      <FilterRail facets={facets} filters={filters} />
    </Suspense>
  )
}

function PaginationSuspense(props: Parameters<typeof Pagination>[0]) {
  return (
    <Suspense fallback={null}>
      <Pagination {...props} />
    </Suspense>
  )
}

export default function SearchPage({ searchParams }: PageProps) {
  const filters = parseFilters(searchParams)
  const result = search(filters)

  const q = filters.q

  // Build a descriptive heading
  let heading = 'Every performance, worldwide'
  if (q) heading = `Results for "${q}"`
  else if (filters.work_slug) heading = filters.work_slug.replace(/-/g, ' ')
  else if (filters.kind) heading = `${filters.kind.charAt(0).toUpperCase() + filters.kind.slice(1)} worldwide`
  else if (filters.city) heading = `In ${filters.city}`
  else if (filters.country) heading = `In ${filters.country}`

  return (
    <main className="min-h-screen pt-28 pb-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-3">
            Search
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-gradient-gold mb-6 leading-tight">
            {heading}
          </h1>
          <Suspense fallback={<div className="h-14 glass-panel animate-pulse rounded-glass" />}>
            <SearchBox initialQuery={q} />
          </Suspense>
        </div>

        {/* Results count + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <p className="text-ivory/60 text-sm">
            <span className="text-ivory font-medium">{result.total}</span>
            {' '}performance{result.total !== 1 ? 's' : ''}
            {q ? ` matching "${q}"` : ''}
          </p>
          <SortControlSuspense sort={filters.sort} />
        </div>

        {/* Active filter chips */}
        <ActiveFiltersSuspense filters={filters} />

        {/* Two-column layout */}
        <div className="flex gap-7 items-start">
          {/* Filter rail */}
          <FilterRailSuspense facets={result.facets} filters={filters} />

          {/* Results column */}
          <div className="flex-1 min-w-0">
            {result.items.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {result.items.map((item) => (
                  <ResultCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-16 text-center">
                <p className="font-serif text-2xl text-ivory/60 mb-3">No performances found</p>
                <p className="text-ivory/50 text-sm">
                  No performances match — try widening your filters.
                </p>
              </div>
            )}

            <PaginationSuspense
              page={result.page}
              pageSize={result.page_size}
              total={result.total}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
