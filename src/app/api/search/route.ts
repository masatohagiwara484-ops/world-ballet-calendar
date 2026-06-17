/**
 * GET /api/search — faceted catalogue search.
 *
 * Query params (all optional):
 *   q, kind, country, city, company, person, choreographer, composer, work,
 *   start, end, price_min, price_max, sort (date|relevance|price), page, page_size
 *
 * Returns SearchResponse { total, page, page_size, items, facets }.
 */
import { NextResponse, type NextRequest } from 'next/server'
import { searchAsync } from '@/lib/search'
import type { SearchFilters, SearchSort, WorkKind } from '@/lib/types'

export const dynamic = 'force-dynamic'

function num(v: string | null): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const kind = sp.get('kind')
  const sort = sp.get('sort')

  const filters: SearchFilters = {
    q: sp.get('q') ?? undefined,
    kind: kind === 'ballet' || kind === 'opera' || kind === 'concert' ? (kind as WorkKind) : undefined,
    country: sp.get('country') ?? undefined,
    city: sp.get('city') ?? undefined,
    company_slug: sp.get('company') ?? undefined,
    person_slug: sp.get('person') ?? undefined,
    choreographer_slug: sp.get('choreographer') ?? undefined,
    composer_slug: sp.get('composer') ?? undefined,
    work_slug: sp.get('work') ?? undefined,
    start_date: sp.get('start') ?? undefined,
    end_date: sp.get('end') ?? undefined,
    price_min: num(sp.get('price_min')),
    price_max: num(sp.get('price_max')),
    sort: sort === 'relevance' || sort === 'price' ? (sort as SearchSort) : 'date',
    page: num(sp.get('page')),
    page_size: num(sp.get('page_size')),
  }

  const result = await searchAsync(filters)
  return NextResponse.json(result, {
    headers: { 'cache-control': 's-maxage=300, stale-while-revalidate=600' },
  })
}
