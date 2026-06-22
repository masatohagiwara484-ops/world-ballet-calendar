/**
 * Audience capture — the server-side write path for the email/follow primitive.
 *
 * This module is SERVER-ONLY by construction: it reads SUPABASE_SERVICE_ROLE_KEY,
 * a non-public env var that is undefined in the browser, so the audience list
 * (emails are PII) is never readable or writable from the client. It is consumed
 * exclusively by the /api/follow route handler.
 *
 * Like the rest of the data layer, nothing here throws on a missing/placeholder
 * configuration: addFollow returns a typed failure the route can translate into
 * a clean HTTP response, so a misconfigured environment degrades gracefully
 * rather than 500-ing the page.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type EntityType = 'work' | 'person' | 'company' | 'city'

export interface FollowInput {
  email: string
  entityType: EntityType
  entitySlug: string
  entityLabel?: string
  locale?: string
}

export type FollowResult =
  | { ok: true; already: boolean }
  | { ok: false; reason: 'invalid_email' | 'invalid_entity' | 'unconfigured' | 'error' }

const PLACEHOLDER = 'placeholder'
const ENTITY_TYPES: readonly EntityType[] = ['work', 'person', 'company', 'city']

// Pragmatic email shape check — not RFC-perfect, just enough to reject garbage
// before it reaches the database (the unique constraint handles the rest).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

let cached: SupabaseClient | null | undefined

/** Lazily build a service-role client; null when unconfigured (never throws). */
function getServiceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || url.includes(PLACEHOLDER) || key.includes(PLACEHOLDER) || !/^https?:\/\//.test(url)) {
    cached = null
    return cached
  }
  try {
    cached = createClient(url, key, { auth: { persistSession: false } })
  } catch {
    cached = null
  }
  return cached
}

/** Normalise an email for storage/dedupe (trim + lowercase). */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/**
 * Capture an email and the thing it wants alerts about. Idempotent: re-following
 * the same entity returns { ok: true, already: true } rather than erroring, so
 * the UI can always show a friendly confirmation.
 */
export async function addFollow(input: FollowInput): Promise<FollowResult> {
  const email = normalizeEmail(input.email ?? '')
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, reason: 'invalid_email' }
  if (!ENTITY_TYPES.includes(input.entityType)) return { ok: false, reason: 'invalid_entity' }

  const slug = (input.entitySlug ?? '').trim().slice(0, 200)
  if (!slug) return { ok: false, reason: 'invalid_entity' }

  const client = getServiceClient()
  if (!client) return { ok: false, reason: 'unconfigured' }

  const label = input.entityLabel?.trim().slice(0, 200) || null
  const locale = input.locale?.trim().slice(0, 12) || null
  const source = `${input.entityType}:${slug}`

  // Upsert the subscriber (the master list). onConflict(email) keeps the first
  // capture's metadata stable while guaranteeing the row exists.
  const sub = await client
    .from('subscribers')
    .upsert({ email, locale, source }, { onConflict: 'email', ignoreDuplicates: true })
  if (sub.error) {
    console.error('[audience] subscribers upsert failed:', sub.error.message, sub.error.code)
    return { ok: false, reason: 'error' }
  }

  // Record the follow. A duplicate (same email+entity) is success, not failure.
  const fol = await client
    .from('follows')
    .insert({ email, entity_type: input.entityType, entity_slug: slug, entity_label: label })
  if (fol.error) {
    // 23505 = unique_violation → they already follow this; treat as success.
    if ((fol.error as { code?: string }).code === '23505') return { ok: true, already: true }
    console.error('[audience] follows insert failed:', fol.error.message, (fol.error as { code?: string }).code)
    return { ok: false, reason: 'error' }
  }
  return { ok: true, already: false }
}
