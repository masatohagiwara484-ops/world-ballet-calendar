/**
 * Supabase client — lazy & non-throwing.
 *
 * Importing this module must NEVER throw, even when the environment variables
 * are missing or still contain placeholder values. The client is created on
 * first use via getSupabaseClient(); if the configuration is unusable the
 * helper returns null and callers fall back to the curated static dataset.
 *
 * The canonical domain types live in ./types. We re-export the legacy
 * `Company` / `Performance` aliases here so older imports keep working.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Company as CompanyType, Performance as PerformanceType } from './types'

/** Legacy re-exports — canonical definitions live in ./types. */
export type Company = CompanyType
export type Performance = PerformanceType

const PLACEHOLDER = 'placeholder'

/**
 * Returns true when the Supabase env vars look real (present and not a
 * placeholder). When this is false the data layer skips Supabase entirely.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  if (url.includes(PLACEHOLDER) || key.includes(PLACEHOLDER)) return false
  // Must be a plausible https URL.
  if (!/^https?:\/\//.test(url)) return false
  return true
}

let cachedClient: SupabaseClient | null = null
let attemptedClientInit = false

/**
 * Lazily creates (and memoizes) the anon Supabase client. Returns null when
 * the configuration is unusable — callers must handle the null case by
 * falling back to the static dataset. Never throws.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (attemptedClientInit) return cachedClient
  attemptedClientInit = true

  if (!isSupabaseConfigured()) {
    cachedClient = null
    return null
  }

  try {
    cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    )
  } catch {
    cachedClient = null
  }
  return cachedClient
}
