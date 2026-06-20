/**
 * Purge ALL performance rows from Supabase.
 *
 * Why this exists: the site previously seeded a *placeholder* season whose
 * dates did not match reality. `npm run seed` upserts (it never deletes), so
 * emptying src/data/performances.ts is not enough — the old rows linger in the
 * database and would still be served. This script removes them.
 *
 * Usage (run from your own machine, with SUPABASE_SERVICE_ROLE_KEY in .env.local):
 *   npm run purge:performances          # DRY RUN — only reports the count
 *   npm run purge:performances -- --yes # actually deletes every performance row
 *
 * Safe to run repeatedly. The performance_people junction has ON DELETE CASCADE,
 * so dependent rows are cleaned up automatically; works/venues/productions are
 * referenced ON DELETE SET NULL and are left intact.
 *
 * After purging, the catalogue is empty until real, verified data arrives via
 * `npm run ingest` (Telegram-approved) or a hand-verified `npm run seed`.
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY in .env.local.'
  )
  process.exit(1)
}

if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
  console.error('Supabase env vars are placeholders — refusing to run.')
  process.exit(1)
}

const confirmed = process.argv.slice(2).includes('--yes')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function purge(): Promise<void> {
  // Count first so the operator sees exactly what is at stake.
  const { count, error: countError } = await supabase
    .from('performances')
    .select('id', { count: 'exact', head: true })
  if (countError) {
    console.error('Failed to count performances:', countError.message)
    process.exit(1)
  }

  const total = count ?? 0
  console.log(`Supabase currently holds ${total} performance row(s).`)

  if (total === 0) {
    console.log('Nothing to purge. Database is already clean.')
    return
  }

  if (!confirmed) {
    console.log('\nDRY RUN — no rows deleted.')
    console.log('Re-run with  npm run purge:performances -- --yes  to delete them.')
    return
  }

  // `id is not null` is always true → deletes every row (Supabase blocks an
  // unfiltered delete as a safety measure, so we pass an always-true filter).
  const { error } = await supabase
    .from('performances')
    .delete()
    .not('id', 'is', null)
  if (error) {
    console.error('Failed to delete performances:', error.message)
    process.exit(1)
  }

  const { count: remaining } = await supabase
    .from('performances')
    .select('id', { count: 'exact', head: true })
  console.log(`Deleted ${total} row(s). ${remaining ?? 0} remaining.`)
  console.log('Purge complete. The catalogue is now empty and honest.')
}

purge().catch((error: unknown) => {
  console.error('Purge failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
