'use client'

import { useEffect, useState } from 'react'
import type { Company, PerformanceWithCompany, PerformanceQuery } from '@/lib/types'

/** Tolerate either `{ companies: [...] }` / `{ performances: [...] }` or a bare array. */
function unwrap<T>(json: unknown, key: string): T[] {
  if (Array.isArray(json)) return json as T[]
  if (json && typeof json === 'object') {
    const v = (json as Record<string, unknown>)[key]
    if (Array.isArray(v)) return v as T[]
    const data = (json as Record<string, unknown>).data
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

export function useCompanies(): { companies: Company[]; loading: boolean; error: boolean } {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/companies')
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return
        setCompanies(unwrap<Company>(j, 'companies'))
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setError(true)
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { companies, loading, error }
}

export function buildPerformanceQuery(query: PerformanceQuery): string {
  const sp = new URLSearchParams()
  if (query.start_date) sp.set('start_date', query.start_date)
  if (query.end_date) sp.set('end_date', query.end_date)
  if (query.company_slug) sp.set('company_slug', query.company_slug)
  if (query.country) sp.set('country', query.country)
  if (query.kind) sp.set('kind', query.kind)
  if (query.featured_only) sp.set('featured_only', 'true')
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

/**
 * Fetch performances against the frozen API contract:
 *   /api/performances?start_date&end_date&kind&country&company_slug
 * Re-runs whenever the serialized query changes.
 */
export function usePerformances(
  query: PerformanceQuery
): { performances: PerformanceWithCompany[]; loading: boolean } {
  const qs = buildPerformanceQuery(query)
  const [performances, setPerformances] = useState<PerformanceWithCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch(`/api/performances${qs}`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return
        setPerformances(unwrap<PerformanceWithCompany>(j, 'performances'))
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setPerformances([])
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [qs])

  return { performances, loading }
}
