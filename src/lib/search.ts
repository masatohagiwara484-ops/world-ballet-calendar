/**
 * Faceted search engine.
 *
 * Runs entirely over the in-memory entity graph (src/lib/graph.ts), which today
 * is derived from the curated dataset and tomorrow from live scraped data in
 * Supabase — search.ts neither knows nor cares which. It is the single place
 * the "one word → every matching performance on earth" promise is fulfilled.
 *
 * Pipeline: free-text match → structured filters → facet counting (computed on
 * the set constrained by *other* facets, so counts stay meaningful) → sort →
 * paginate.
 */
import type {
  FacetCount,
  SearchFacets,
  SearchFilters,
  SearchResponse,
  SearchResultItem,
} from './types'
import { buildGraph, type GraphPerformance } from './graph'
import { toEur } from './normalize'

const DEFAULT_PAGE_SIZE = 24

/** Tokenize a free-text query into lowercased terms. */
function terms(q?: string): string[] {
  if (!q) return []
  return q
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

/** Every term must appear in the performance's search document (AND match). */
function matchesQuery(perf: GraphPerformance, queryTerms: string[]): boolean {
  if (queryTerms.length === 0) return true
  return queryTerms.every((t) => perf.doc.includes(t))
}

/**
 * Apply all structured filters EXCEPT the ones named in `skip`. Skipping a
 * facet's own dimension is how we compute that facet's counts against the rest
 * of the active query (classic faceted-search behaviour).
 */
function applyFilters(
  perf: GraphPerformance,
  f: SearchFilters,
  skip: Set<keyof SearchFilters> = new Set()
): boolean {
  if (!skip.has('kind') && f.kind && perf.kind !== f.kind) return false
  if (!skip.has('country') && f.country && perf.company.country !== f.country) return false
  if (!skip.has('city') && f.city && perf.company.city !== f.city) return false
  if (!skip.has('company_slug') && f.company_slug && perf.company.slug !== f.company_slug) {
    return false
  }
  if (!skip.has('person_slug') && f.person_slug && !perf.person_slugs.includes(f.person_slug)) {
    return false
  }
  if (
    !skip.has('choreographer_slug') &&
    f.choreographer_slug &&
    !perf.choreographer_slugs.includes(f.choreographer_slug)
  ) {
    return false
  }
  if (
    !skip.has('composer_slug') &&
    f.composer_slug &&
    !perf.composer_slugs.includes(f.composer_slug)
  ) {
    return false
  }
  if (!skip.has('work_slug') && f.work_slug && perf.work_slug !== f.work_slug) return false

  // Date overlap: run intersects [start_date, end_date].
  if (!skip.has('start_date') && f.start_date && perf.end_date < f.start_date) return false
  if (!skip.has('end_date') && f.end_date && perf.start_date > f.end_date) return false

  // Price band (compared in EUR). A run with no parsed price passes only when
  // no price filter is set, so price filtering never hides priced results.
  if (!skip.has('price_min') || !skip.has('price_max')) {
    const hasPriceFilter = f.price_min != null || f.price_max != null
    if (hasPriceFilter) {
      if (perf.price.min == null) return false
      const lo = toEur(perf.price.min, perf.price.currency)
      const hi = perf.price.max != null ? toEur(perf.price.max, perf.price.currency) : lo
      if (!skip.has('price_min') && f.price_min != null && hi < f.price_min) return false
      if (!skip.has('price_max') && f.price_max != null && lo > f.price_max) return false
    }
  }

  return true
}

function bump(map: Map<string, FacetCount>, value: string, label: string) {
  const existing = map.get(value)
  if (existing) existing.count += 1
  else map.set(value, { value, label, count: 1 })
}

function topFacets(map: Map<string, FacetCount>, limit = 12): FacetCount[] {
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit)
}

const KIND_LABELS: Record<string, string> = {
  ballet: 'Ballet',
  opera: 'Opera',
  concert: 'Concert',
}

/** Run a faceted search over the graph and return results + facet counts. */
export function search(filters: SearchFilters = {}): SearchResponse {
  const graph = buildGraph()
  const queryTerms = terms(filters.q)

  // Stage 1: full result set under the full query (text + all filters).
  const matched = graph.performances.filter(
    (p) => matchesQuery(p, queryTerms) && applyFilters(p, filters)
  )

  // Stage 2: facet counts — each dimension counted against the set filtered by
  // every OTHER active facet (so selecting "Opera" still shows other kinds'
  // counts, letting the user widen).
  const facetMaps = {
    kind: new Map<string, FacetCount>(),
    country: new Map<string, FacetCount>(),
    city: new Map<string, FacetCount>(),
    company: new Map<string, FacetCount>(),
    composer: new Map<string, FacetCount>(),
    choreographer: new Map<string, FacetCount>(),
  }

  for (const p of graph.performances) {
    if (!matchesQuery(p, queryTerms)) continue
    if (applyFilters(p, filters, new Set(['kind']))) bump(facetMaps.kind, p.kind, KIND_LABELS[p.kind] ?? p.kind)
    if (applyFilters(p, filters, new Set(['country']))) bump(facetMaps.country, p.company.country, p.company.country)
    if (applyFilters(p, filters, new Set(['city']))) bump(facetMaps.city, p.company.city, p.company.city)
    if (applyFilters(p, filters, new Set(['company_slug']))) bump(facetMaps.company, p.company.slug, p.company.name)
    if (applyFilters(p, filters, new Set(['composer_slug']))) {
      for (const g of p.credits) if (g.role === 'composer') for (const person of g.people) bump(facetMaps.composer, person.slug, person.name)
    }
    if (applyFilters(p, filters, new Set(['choreographer_slug']))) {
      for (const g of p.credits) if (g.role === 'choreographer') for (const person of g.people) bump(facetMaps.choreographer, person.slug, person.name)
    }
  }

  const facets: SearchFacets = {
    kind: topFacets(facetMaps.kind, 3),
    country: topFacets(facetMaps.country),
    city: topFacets(facetMaps.city),
    company: topFacets(facetMaps.company),
    composer: topFacets(facetMaps.composer),
    choreographer: topFacets(facetMaps.choreographer),
  }

  // Stage 3: sort.
  const sort = filters.sort ?? 'date'
  const sorted = [...matched].sort((a, b) => {
    if (sort === 'price') {
      return (a.price_eur_min ?? Infinity) - (b.price_eur_min ?? Infinity)
    }
    if (sort === 'relevance' && queryTerms.length > 0) {
      return scoreRelevance(b, queryTerms) - scoreRelevance(a, queryTerms) || a.start_date.localeCompare(b.start_date)
    }
    return a.start_date.localeCompare(b.start_date)
  })

  // Stage 4: paginate.
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(60, Math.max(1, filters.page_size ?? DEFAULT_PAGE_SIZE))
  const start = (page - 1) * pageSize
  const items: SearchResultItem[] = sorted.slice(start, start + pageSize).map(toResultItem)

  return { total: matched.length, page, page_size: pageSize, items, facets }
}

/** Light relevance score: title hits weigh more than body hits. */
function scoreRelevance(perf: GraphPerformance, queryTerms: string[]): number {
  const title = perf.title.toLowerCase()
  let score = 0
  for (const t of queryTerms) {
    if (title.includes(t)) score += 3
    if (perf.doc.includes(t)) score += 1
  }
  return score
}

/** Strip the internal-only fields, returning the public result shape. */
function toResultItem(p: GraphPerformance): SearchResultItem {
  return {
    id: p.id,
    company_id: p.company_id,
    company_slug: p.company_slug,
    title: p.title,
    title_original: p.title_original,
    kind: p.kind,
    composer: p.composer,
    choreographer: p.choreographer,
    start_date: p.start_date,
    end_date: p.end_date,
    venue: p.venue,
    ticket_url: p.ticket_url,
    affiliate_url: p.affiliate_url,
    description: p.description,
    image_url: p.image_url,
    price_range: p.price_range,
    is_featured: p.is_featured,
    company: p.company,
    work_slug: p.work_slug,
    credits: p.credits,
    price: p.price,
  }
}

/** Autocomplete source: people, works, companies, cities — for the search box. */
export interface Suggestion {
  type: 'work' | 'person' | 'company' | 'city'
  label: string
  sublabel?: string
  /** query-string params to apply when chosen. */
  params: Record<string, string>
}

export function suggest(q: string, limit = 8): Suggestion[] {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return []
  const graph = buildGraph()
  const out: Suggestion[] = []

  for (const w of graph.works) {
    if (w.title.toLowerCase().includes(needle)) {
      out.push({ type: 'work', label: w.title, sublabel: KIND_LABELS[w.kind], params: { work: w.slug } })
    }
  }
  for (const person of graph.people) {
    if (person.name.toLowerCase().includes(needle)) {
      out.push({
        type: 'person',
        label: person.name,
        sublabel: person.roles.map((r) => r[0].toUpperCase() + r.slice(1)).join(' · '),
        params: { person: person.slug },
      })
    }
  }
  for (const c of graph.companyBySlug.values()) {
    if (c.name.toLowerCase().includes(needle)) {
      out.push({ type: 'company', label: c.name, sublabel: c.city, params: { company: c.slug } })
    }
  }

  // Rank: prefix matches first, then by type priority (work, person, company).
  const typeRank = { work: 0, person: 1, company: 2, city: 3 }
  return out
    .sort((a, b) => {
      const ap = a.label.toLowerCase().startsWith(needle) ? 0 : 1
      const bp = b.label.toLowerCase().startsWith(needle) ? 0 : 1
      return ap - bp || typeRank[a.type] - typeRank[b.type] || a.label.localeCompare(b.label)
    })
    .slice(0, limit)
}
