/**
 * Ingestion state store — all Supabase reads/writes the pipeline needs, behind
 * the service-role key. Every function is null-safe: when Supabase isn't
 * configured the orchestrator runs as an offline dry-run (prints, writes nothing).
 *
 * Writes here are the ONLY way scraped data enters the DB, and every performance
 * is written with review_status='pending' — nothing is ever published from the
 * crawl. Publishing happens later, server-side, from the Telegram webhook.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ExistingRow, IngestPerformance } from './types'
import type { ResolvedEntities } from './resolver'

/** Service-role writer, or null when unconfigured (→ offline dry-run). */
export function getWriter(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  if (url.includes('placeholder') || key.includes('placeholder')) return null
  try {
    return createClient(url, key, { auth: { persistSession: false } })
  } catch {
    return null
  }
}

/** Per-source crawl state (hash/etag cache + auto-approve flag). */
export interface SourceState {
  slug: string
  listing_url: string | null
  feed_kind: string
  last_hash: string | null
  etag: string | null
  robots_ok: boolean
  tos_ok: boolean
  auto_approve: boolean
}

export async function getSourceState(
  client: SupabaseClient,
  slug: string
): Promise<SourceState | null> {
  const { data, error } = await client
    .from('ingest_sources')
    .select('slug, listing_url, feed_kind, last_hash, etag, robots_ok, tos_ok, auto_approve')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as SourceState | null) ?? null
}

export async function saveSourceState(
  client: SupabaseClient,
  slug: string,
  patch: { last_hash?: string; etag?: string | null }
): Promise<void> {
  const { error } = await client.from('ingest_sources').upsert(
    {
      slug,
      ...patch,
      last_fetched: new Date().toISOString(),
    },
    { onConflict: 'slug' }
  )
  if (error) throw error
}

/** Every existing row for a source, keyed by id — the differ's DB snapshot. */
export async function fetchExistingForSource(
  client: SupabaseClient,
  sourceUrl: string
): Promise<Map<string, ExistingRow>> {
  const { data, error } = await client
    .from('performances')
    .select('id, content_hash, start_date, end_date, price_range')
    .eq('source_url', sourceUrl)
  if (error) throw error
  const map = new Map<string, ExistingRow>()
  for (const r of (data ?? []) as ExistingRow[]) map.set(r.id, r)
  return map
}

/** Extract a readable message from any error value (Error, Supabase error object, or unknown). */
function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null) {
    const o = e as Record<string, unknown>
    return (o.message as string) ?? (o.code as string) ?? JSON.stringify(e)
  }
  return String(e)
}

/** Upsert the resolved entity graph (people → works → venues → productions → credits). */
export async function upsertEntities(
  client: SupabaseClient,
  e: ResolvedEntities
): Promise<void> {
  // Order matters: works reference people (composer_id), productions reference
  // works/people, credits reference performances+people.
  // Entity graph tables exist only when migration 003 has been run. If they are
  // absent (42P01) we log a warning and continue — the performance rows are still
  // written and displayed; the graph is an enhancement, not a hard requirement.
  const safe = async (table: string, rows: unknown[], conflict: string): Promise<boolean> => {
    if (!rows.length) return true
    const { error } = await client.from(table).upsert(rows as never[], { onConflict: conflict })
    if (error) {
      const msg = errMsg(error)
      if ((error as unknown as Record<string, unknown>).code === '42P01') {
        console.warn(`  ! ${table} table missing (run migration 003 in Supabase SQL editor to enable entity graph)`)
      } else {
        console.warn(`  ! upsert ${table} failed: ${msg}`)
      }
      return false
    }
    return true
  }
  await safe('people', e.people, 'id')
  await safe('venues', e.venues, 'id')
  await safe('works', e.works, 'id')
  await safe('productions', e.productions, 'id')
}

/** Upsert performance credits after the performances themselves exist. */
export async function upsertCredits(
  client: SupabaseClient,
  credits: ResolvedEntities['credits']
): Promise<void> {
  if (!credits.length) return
  const { error } = await client
    .from('performance_credits')
    .upsert(credits, { onConflict: 'performance_id,person_id,role' })
  if (error) {
    // performance_credits requires migration 003 — non-fatal, same as entity graph.
    console.warn(`  ! upsert performance_credits failed: ${errMsg(error)}`)
  }
}

/** The Performance columns we write — frozen fields + 003/004 provenance/diff. */
function toRow(p: IngestPerformance): Record<string, unknown> {
  return {
    id: p.id,
    company_id: p.company_id,
    company_slug: p.company_slug,
    title: p.title,
    title_original: p.title_original ?? null,
    kind: p.kind,
    composer: p.composer ?? null,
    choreographer: p.choreographer ?? null,
    start_date: p.start_date,
    end_date: p.end_date,
    venue: p.venue ?? null,
    ticket_url: p.ticket_url ?? null,
    affiliate_url: p.affiliate_url ?? null,
    description: p.description ?? null,
    image_url: p.image_url ?? null,
    price_range: p.price_range ?? null,
    is_featured: p.is_featured,
    work_id: p.work_id ?? null,
    production_id: p.production_id ?? null,
    venue_id: p.venue_id ?? null,
    price_min: p.price_min ?? null,
    price_max: p.price_max ?? null,
    currency: p.currency ?? null,
    price_eur_min: p.price_eur_min ?? null,
    search_text: p.search_text ?? null,
    source_url: p.source_url ?? null,
    content_hash: p.content_hash,
    confidence: p.confidence,
    change_kind: p.change_kind ?? null,
    // The review gate — ALWAYS pending from the crawl.
    review_status: 'pending',
  }
}

/** Write the run's performances as pending review. Returns the written ids. */
export async function writePending(
  client: SupabaseClient,
  rows: IngestPerformance[]
): Promise<string[]> {
  if (!rows.length) return []
  const payload = rows.map(toRow)
  const { error } = await client
    .from('performances')
    .upsert(payload, { onConflict: 'id' })
  if (error) throw error
  return rows.map((r) => r.id)
}

/** Publish rows directly (auto-approve path) — skips the review queue. */
export async function publishIds(client: SupabaseClient, ids: string[]): Promise<void> {
  if (!ids.length) return
  const { error } = await client
    .from('performances')
    .update({ review_status: 'published', last_verified: new Date().toISOString() })
    .in('id', ids)
  if (error) throw error
}

/** Record (or update) the Telegram digest batch — the approval state machine. */
export async function recordBatch(
  client: SupabaseClient,
  batch: {
    id: string
    company_slug: string
    run_id: string
    telegram_chat_id?: string | null
    telegram_message_id?: string | null
    performance_ids: string[]
    counts: Record<string, number>
  }
): Promise<void> {
  const { error } = await client.from('ingest_batches').upsert(
    {
      id: batch.id,
      company_slug: batch.company_slug,
      run_id: batch.run_id,
      telegram_chat_id: batch.telegram_chat_id ?? null,
      telegram_message_id: batch.telegram_message_id ?? null,
      status: 'sent',
      performance_ids: batch.performance_ids,
      counts: batch.counts,
    },
    { onConflict: 'id' }
  )
  if (error) {
    // ingest_batches requires migration 004 — non-fatal.
    console.warn(`  ! recordBatch failed: ${errMsg(error)}`)
  }
}

/**
 * Mark cancelled rows as pending review WITHOUT touching their other fields —
 * cancellation is a state the owner confirms, never a silent unpublish.
 */
export async function markCancelledPending(
  client: SupabaseClient,
  ids: string[]
): Promise<void> {
  if (!ids.length) return
  const { error } = await client
    .from('performances')
    .update({ review_status: 'pending', change_kind: 'cancelled' })
    .in('id', ids)
    .eq('review_status', 'published')
  if (error) throw error
}
