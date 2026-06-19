/**
 * The Resolver — the single write path for the entity graph.
 *
 * Rather than re-deriving people/works/venues/productions, it reuses the exact
 * in-memory builder the live site searches over (src/lib/graph.ts `buildGraph`),
 * guaranteeing a scraped "Kenneth MacMillan" resolves to the SAME id as a seeded
 * one. It then projects that graph into Supabase upsert payloads and enriches
 * each performance with its graph links, structured price, and search document.
 */
import type { Company, Performance } from '../../src/lib/types'
import { buildGraph } from '../../src/lib/graph'
import { slugify } from '../../src/lib/normalize'
import type { IngestPerformance } from './types'

export interface ResolvedEntities {
  people: Array<Record<string, unknown>>
  works: Array<Record<string, unknown>>
  venues: Array<Record<string, unknown>>
  productions: Array<Record<string, unknown>>
  credits: Array<{ performance_id: string; person_id: string; role: string }>
  /** Performances enriched with work_id/production_id/venue_id/price/search_text. */
  performances: IngestPerformance[]
}

/** Venue id for a company, computed exactly as graph.ts derives it. */
function venueIdFor(company: Company): string {
  const name = company.venue ?? `${company.name} — ${company.city}`
  return `v-${slugify(name)}`
}

/**
 * Resolve a batch of normalized performances (for one or many companies) into
 * entity rows + enriched performances. `base` carries the per-row provenance
 * (source_url, content_hash, confidence) the graph builder doesn't know about.
 */
export function resolveEntities(
  companies: Company[],
  performances: Performance[],
  base: Map<string, Pick<IngestPerformance, 'source_url' | 'content_hash' | 'confidence'>>
): ResolvedEntities {
  const graph = buildGraph(companies, performances)
  const companyById = new Map(companies.map((c) => [c.id, c]))

  const people = graph.people.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    sort_name: p.sort_name,
    roles: p.roles,
  }))

  const works = graph.works.map((w) => ({
    id: w.id,
    slug: w.slug,
    title: w.title,
    title_original: w.title_original ?? null,
    kind: w.kind,
    composer_id: w.composer_id ?? null,
  }))

  const venues = graph.venues.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    city: v.city,
    country: v.country,
    country_code: v.country_code,
    lat: v.lat ?? null,
    lng: v.lng ?? null,
  }))

  const productions = graph.productions.map((pr) => ({
    id: pr.id,
    work_id: pr.work_id,
    company_id: pr.company_id,
    choreographer_id: pr.choreographer_id ?? null,
    director_id: pr.director_id ?? null,
    title: pr.title,
  }))

  const credits: Array<{ performance_id: string; person_id: string; role: string }> = []
  const enriched: IngestPerformance[] = []

  for (const gp of graph.performances) {
    const company = companyById.get(gp.company_id)
    const work = graph.workBySlug.get(gp.work_slug)
    const prov = base.get(gp.id)

    for (const group of gp.credits) {
      for (const person of group.people) {
        credits.push({
          performance_id: gp.id,
          person_id: `pe-${person.slug}`,
          role: group.role,
        })
      }
    }

    enriched.push({
      // Frozen Performance fields.
      id: gp.id,
      company_id: gp.company_id,
      company_slug: gp.company_slug,
      title: gp.title,
      title_original: gp.title_original,
      kind: gp.kind,
      composer: gp.composer,
      choreographer: gp.choreographer,
      start_date: gp.start_date,
      end_date: gp.end_date,
      venue: gp.venue,
      ticket_url: gp.ticket_url,
      affiliate_url: gp.affiliate_url,
      description: gp.description,
      image_url: gp.image_url,
      price_range: gp.price_range,
      is_featured: gp.is_featured,
      // Graph links + structured price.
      work_id: work?.id,
      production_id: gp.production_id,
      venue_id: company ? venueIdFor(company) : undefined,
      price_min: gp.price.min,
      price_max: gp.price.max,
      currency: gp.price.currency,
      price_eur_min: gp.price_eur_min,
      search_text: gp.doc,
      // Provenance (defaults if a row slipped through without it).
      source_url: prov?.source_url,
      content_hash: prov?.content_hash ?? '',
      confidence: prov?.confidence ?? 1,
    })
  }

  return { people, works, venues, productions, credits, performances: enriched }
}
