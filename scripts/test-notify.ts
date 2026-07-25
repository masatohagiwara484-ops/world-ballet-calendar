/**
 * Manual end-to-end test for follower alerts — run from the owner's machine
 * (needs .env.local with Supabase + RESEND_API_KEY).
 *
 *   npx tsx scripts/test-notify.ts <your@email> <company-slug>
 *   npx tsx scripts/test-notify.ts <your@email> <company-slug> --send
 *
 * Without --send it is a dry run: shows which batch would fire and to whom.
 * With --send it (1) upserts a follow row for the email, (2) runs
 * notifyFollowersOfBatch against the company's most recent APPROVED batch
 * under a synthetic batch id (so real batches stay unlogged), (3) prints the
 * result. Run it twice with --send to see idempotency (second run: 0 sent).
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { addFollow } from '../src/lib/audience'
import { notifyFollowersOfBatch } from '../src/lib/notify'

config({ path: '.env.local' })

async function main(): Promise<void> {
  const [email, companySlug] = process.argv.slice(2)
  const send = process.argv.includes('--send')
  if (!email || !companySlug) {
    console.error('usage: npx tsx scripts/test-notify.ts <email> <company-slug> [--send]')
    process.exit(1)
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('✗ Supabase env missing (.env.local)')
    process.exit(1)
  }
  const client = createClient(url, key, { auth: { persistSession: false } })

  const { data: batches } = await client
    .from('ingest_batches')
    .select('id, company_slug, performance_ids, status')
    .eq('company_slug', companySlug)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
  const batch = batches?.[0] as
    | { id: string; performance_ids: string[] | null }
    | undefined
  if (!batch) {
    console.error(`✗ no approved batch found for ${companySlug}`)
    process.exit(1)
  }
  const ids = batch.performance_ids ?? []
  console.log(`· latest approved batch: ${batch.id} (${ids.length} rows)`)

  if (!send) {
    console.log('· dry run — pass --send to follow + email for real')
    return
  }

  const follow = await addFollow({ email, entityType: 'company', entitySlug: companySlug })
  console.log(`· follow ${companySlug}: ${follow.ok ? (follow.already ? 'already' : 'created') : `failed ${follow.reason}`}`)

  const testBatchId = `test:${batch.id}`
  console.log(`· notifying under synthetic batch id ${testBatchId} …`)
  await notifyFollowersOfBatch(client, testBatchId, companySlug, ids)
  console.log('· done — check the inbox (and re-run to verify 0 sends the second time)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
