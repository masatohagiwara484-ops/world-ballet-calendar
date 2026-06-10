/**
 * Data access layer — the only module UI code and API routes may use to
 * read companies & performances.
 *
 * Resolution order:
 *   1. Supabase (when NEXT_PUBLIC_SUPABASE_URL is configured and reachable)
 *   2. Curated static dataset (src/data/) — guaranteed fallback so the site
 *      is never empty, even with no database.
 *
 * Implemented by the backend workstream. The function signatures below are
 * the frozen contract — do not change them without updating all consumers.
 */

import type { Company, PerformanceQuery, PerformanceWithCompany } from './types'
import { companies as staticCompanies } from '@/data/companies'
import { performances as staticPerformances } from '@/data/performances'

export async function getCompanies(): Promise<Company[]> {
  return staticCompanies
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  return staticCompanies.find((c) => c.slug === slug) ?? null
}

export async function getPerformances(
  query: PerformanceQuery = {}
): Promise<PerformanceWithCompany[]> {
  const byId = new Map(staticCompanies.map((c) => [c.id, c]))
  return staticPerformances
    .filter((p) => {
      if (query.company_slug && p.company_slug !== query.company_slug) return false
      if (query.kind && p.kind !== query.kind) return false
      if (query.featured_only && !p.is_featured) return false
      if (query.country) {
        const company = byId.get(p.company_id)
        if (!company || company.country !== query.country) return false
      }
      // Overlap test: run intersects [start_date, end_date]
      if (query.start_date && p.end_date < query.start_date) return false
      if (query.end_date && p.start_date > query.end_date) return false
      return true
    })
    .map((p) => ({ ...p, company: byId.get(p.company_id)! }))
    .filter((p) => p.company)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
}
