/**
 * Canonical domain types for World Ballet & Opera Calendar.
 *
 * This file is the single source of truth for the data contract shared by:
 *  - the curated static dataset (src/data/)
 *  - the Supabase tables (supabase/migrations/)
 *  - the scraper pipeline (scripts/scrapers/)
 *  - every UI component
 *
 * Do not import React or any runtime dependency here.
 */

export type CompanyType = 'ballet' | 'opera' | 'both'

export interface Company {
  id: string
  slug: string
  name: string
  name_local?: string
  type: CompanyType
  country: string
  /** ISO 3166-1 alpha-2, lowercase (e.g. "gb", "fr", "jp") — used for flags & filtering */
  country_code: string
  city: string
  lat: number
  lng: number
  website?: string
  instagram?: string
  /** Primary venue name, e.g. "Royal Opera House" */
  venue?: string
  hero_image?: string
  /** 1–2 sentence summary for cards */
  description_short?: string
  /** Long-form profile copy for the company page */
  description?: string
  founded_year?: number
  is_active: boolean
}

export interface Performance {
  id: string
  company_id: string
  /** Denormalized for convenience in UI; always present in the static dataset */
  company_slug: string
  title: string
  title_original?: string
  /** "ballet" | "opera" — what kind of work this is (a "both" company stages each) */
  kind: 'ballet' | 'opera'
  composer?: string
  choreographer?: string
  /** ISO date (YYYY-MM-DD) of the first performance in the run */
  start_date: string
  /** ISO date of the final performance in the run (>= start_date) */
  end_date: string
  venue?: string
  ticket_url?: string
  affiliate_url?: string
  description?: string
  image_url?: string
  price_range?: string
  is_featured: boolean
  /**
   * Provenance — the trust layer. `last_verified` is the timestamp a human (or
   * the Telegram approval) last confirmed these dates against the company's
   * official source; `source_url` is that source. Present on published Supabase
   * rows; absent on the (currently empty) static floor. The "Verified dates"
   * badge renders only when `last_verified` is set, turning our trust discipline
   * into a visible brand signal.
   */
  last_verified?: string
  source_url?: string
}

/** A performance joined with its company — what most UI surfaces consume. */
export interface PerformanceWithCompany extends Performance {
  company: Company
}

/** Filters accepted by the data layer & /api/performances. */
export interface PerformanceQuery {
  /** Runs overlapping [start, end] (ISO dates). */
  start_date?: string
  end_date?: string
  company_slug?: string
  country?: string
  kind?: 'ballet' | 'opera'
  featured_only?: boolean
}

/* ==========================================================================
 * Entity graph (v2) — the cross-cutting search model
 * --------------------------------------------------------------------------
 * The flat Performance above is the historical, frozen contract. On top of it
 * we derive a normalized graph so the catalogue can be searched from ANY
 * sector: a person (choreographer / dancer / conductor / composer), a work
 * ("Swan Lake" across every company on earth), a venue, a city.
 *
 * The graph is built deterministically from the curated dataset today
 * (src/lib/graph.ts) and is mirrored 1:1 by the Supabase schema
 * (supabase/migrations/) for when live, scraped data replaces the seed.
 * ========================================================================== */

/** Every capacity a credited person can hold across ballet / opera / concert. */
export type PersonRole =
  | 'choreographer'
  | 'composer'
  | 'dancer'
  | 'conductor'
  | 'director'
  | 'singer'
  | 'musician'

export const PERSON_ROLES: PersonRole[] = [
  'choreographer',
  'composer',
  'dancer',
  'conductor',
  'director',
  'singer',
  'musician',
]

/** What kind of work this is — ballet, opera, or a concert programme. */
export type WorkKind = 'ballet' | 'opera' | 'concert'

/** A canonical artist (de-duplicated across the whole catalogue by slug). */
export interface Person {
  id: string
  slug: string
  name: string
  /** "Surname, Forename" — used for alphabetical facet ordering. */
  sort_name: string
  /** Distinct capacities this person appears in, across all performances. */
  roles: PersonRole[]
}

/** The abstract work — "Swan Lake" — independent of who stages it. */
export interface Work {
  id: string
  slug: string
  title: string
  title_original?: string
  kind: WorkKind
  composer_id?: string
}

/** A physical place a performance happens. */
export interface Venue {
  id: string
  slug: string
  name: string
  city: string
  country: string
  /** ISO 3166-1 alpha-2, lowercase. */
  country_code: string
  lat: number
  lng: number
}

/** A specific staging of a work by a company (e.g. "Nureyev's Swan Lake"). */
export interface Production {
  id: string
  work_id: string
  company_id: string
  choreographer_id?: string
  director_id?: string
  /** Production title (usually the work title, sometimes a variant). */
  title: string
}

/** A person credited on a performance, with the capacity they served in. */
export interface Credit {
  person_id: string
  role: PersonRole
}

/** Parsed price band for a run, normalized from the free-text price_range. */
export interface PriceBand {
  min?: number
  max?: number
  /** ISO 4217 (e.g. "GBP", "EUR", "USD", "JPY"). */
  currency?: string
}

/* -------------------------------------------------------------------------- */
/* Faceted search contract                                                    */
/* -------------------------------------------------------------------------- */

export type SearchSort = 'date' | 'relevance' | 'price'

/** Everything the search box + filter rail can constrain. */
export interface SearchFilters {
  /** Free-text query, matched against the search document. */
  q?: string
  kind?: WorkKind
  country?: string
  city?: string
  company_slug?: string
  /** A person in ANY role. */
  person_slug?: string
  choreographer_slug?: string
  composer_slug?: string
  work_slug?: string
  /** Runs overlapping [start_date, end_date] (ISO dates). */
  start_date?: string
  end_date?: string
  /** Per-ticket cost band, compared against the run's parsed price band. */
  price_min?: number
  price_max?: number
  sort?: SearchSort
  page?: number
  page_size?: number
}

export interface FacetCount {
  value: string
  label: string
  count: number
}

/** Facet buckets returned alongside results so the rail can show live counts. */
export interface SearchFacets {
  kind: FacetCount[]
  country: FacetCount[]
  city: FacetCount[]
  company: FacetCount[]
  composer: FacetCount[]
  choreographer: FacetCount[]
}

/** A single grouped credit line: a role and the people in it. */
export interface CreditGroup {
  role: PersonRole
  people: Array<{ slug: string; name: string }>
}

/** A performance enriched with graph data — the unit the results list renders. */
export interface SearchResultItem extends PerformanceWithCompany {
  work_slug: string
  credits: CreditGroup[]
  price: PriceBand
}

export interface SearchResponse {
  total: number
  page: number
  page_size: number
  items: SearchResultItem[]
  facets: SearchFacets
}
