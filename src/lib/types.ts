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
