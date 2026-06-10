/**
 * Data access layer — the only module UI code and API routes may use to
 * read companies & performances.
 *
 * Resolution order:
 *   1. Supabase (when NEXT_PUBLIC_SUPABASE_URL is configured and reachable)
 *   2. Curated static dataset (src/data/) — guaranteed fallback so the site
 *      is never empty, even with no database.
 *
 * Fallback rules (all silent — never throw to the caller):
 *   - env vars missing OR containing 'placeholder'  → static
 *   - any query throws or exceeds the 3s timeout     → static
 *   - the "supabase is unreachable" decision is cached for the process so we
 *     don't pay the timeout cost on every request after the first failure.
 *
 * The exported function signatures (getCompanies / getCompanyBySlug /
 * getPerformances) are the FROZEN contract — do not change them.
 */

import type {
  Company,
  Performance,
  PerformanceQuery,
  PerformanceWithCompany,
} from './types'
import { companies as staticCompanies } from '@/data/companies'
import { performances as staticPerformances } from '@/data/performances'
import { getSupabaseClient } from './supabase'

const QUERY_TIMEOUT_MS = 3000

/**
 * Per-process memo of whether Supabase is reachable.
 *   null    → not yet probed
 *   false   → known unreachable / unconfigured → always use static
 *   true    → reachable
 */
let supabaseReachable: boolean | null = null

/** Wrap a promise so it rejects if it does not settle within `ms`. */
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('supabase query timed out')),
      ms
    )
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

/** Mark Supabase unreachable for the rest of this process. */
function markUnreachable(): null {
  supabaseReachable = false
  return null
}

/**
 * Returns a usable Supabase client, or null if we should use static data.
 * Honors the cached "unreachable" decision.
 */
function activeClient() {
  if (supabaseReachable === false) return null
  return getSupabaseClient()
}

/* ------------------------------------------------------------------ */
/* Static-dataset helpers (the guaranteed floor)                       */
/* ------------------------------------------------------------------ */

function staticGetCompanies(): Company[] {
  return [...staticCompanies].sort((a, b) => a.name.localeCompare(b.name))
}

function staticGetCompanyBySlug(slug: string): Company | null {
  return staticCompanies.find((c) => c.slug === slug) ?? null
}

function staticGetPerformances(
  query: PerformanceQuery
): PerformanceWithCompany[] {
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

/* ------------------------------------------------------------------ */
/* Public API (frozen signatures)                                      */
/* ------------------------------------------------------------------ */

export async function getCompanies(): Promise<Company[]> {
  const client = activeClient()
  if (!client) return staticGetCompanies()

  try {
    const { data, error } = await withTimeout(
      client
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      QUERY_TIMEOUT_MS
    )
    if (error) throw error
    supabaseReachable = true
    if (!data || data.length === 0) return staticGetCompanies()
    return data as Company[]
  } catch {
    markUnreachable()
    return staticGetCompanies()
  }
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const client = activeClient()
  if (!client) return staticGetCompanyBySlug(slug)

  try {
    const { data, error } = await withTimeout(
      client.from('companies').select('*').eq('slug', slug).maybeSingle(),
      QUERY_TIMEOUT_MS
    )
    if (error) throw error
    supabaseReachable = true
    // A successful query that returns no row means the company genuinely
    // does not exist in Supabase — but to keep the site coherent we still
    // fall back to the static record if one exists.
    return (data as Company | null) ?? staticGetCompanyBySlug(slug)
  } catch {
    markUnreachable()
    return staticGetCompanyBySlug(slug)
  }
}

export async function getPerformances(
  query: PerformanceQuery = {}
): Promise<PerformanceWithCompany[]> {
  const client = activeClient()
  if (!client) return staticGetPerformances(query)

  try {
    // Embed the related company so we can both filter by country and return
    // the joined company object. `!inner` keeps it an inner join.
    let builder = client
      .from('performances')
      .select('*, company:companies!inner(*)')

    if (query.company_slug) {
      builder = builder.eq('company.slug', query.company_slug)
    }
    if (query.kind) builder = builder.eq('kind', query.kind)
    if (query.featured_only) builder = builder.eq('is_featured', true)
    if (query.country) builder = builder.eq('company.country', query.country)
    // Overlap: run.end_date >= start AND run.start_date <= end
    if (query.start_date) builder = builder.gte('end_date', query.start_date)
    if (query.end_date) builder = builder.lte('start_date', query.end_date)

    const { data, error } = await withTimeout(
      builder.order('start_date', { ascending: true }),
      QUERY_TIMEOUT_MS
    )
    if (error) throw error
    supabaseReachable = true
    if (!data) return staticGetPerformances(query)

    // Normalize the embedded company key and shape.
    type Row = Performance & { company: Company | Company[] }
    return (data as Row[])
      .map((row) => {
        const company = Array.isArray(row.company) ? row.company[0] : row.company
        const { company: _omit, ...perf } = row
        return { ...(perf as Performance), company } as PerformanceWithCompany
      })
      .filter((p) => p.company)
  } catch {
    markUnreachable()
    return staticGetPerformances(query)
  }
}
