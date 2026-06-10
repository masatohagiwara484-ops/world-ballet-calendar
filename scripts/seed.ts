/**
 * World Ballet & Opera Calendar — database seed.
 *
 * Run with:  npm run seed   (→ npx tsx scripts/seed.ts)
 *
 * Imports the SINGLE source-of-truth curated dataset from src/data/ and
 * upserts it into Supabase. The schema is defined in
 * supabase/migrations/002_rebuild_schema.sql — run that first.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and a write-capable key. RLS allows only
 * public SELECT, so writes need the service-role key:
 *   SUPABASE_SERVICE_ROLE_KEY   (preferred — bypasses RLS)
 * falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY (only works if you have
 * temporarily granted write access). Loaded from .env.local via dotenv.
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { companies } from '../src/data/companies'
import { performances } from '../src/data/performances'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local.'
  )
  process.exit(1)
}

if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
  console.error('Supabase env vars are placeholders — refusing to seed.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function seed(): Promise<void> {
  console.log(`Seeding ${companies.length} companies…`)
  const { error: companyError } = await supabase
    .from('companies')
    .upsert(companies, { onConflict: 'id' })
  if (companyError) {
    console.error('Failed to upsert companies:', companyError.message)
    process.exit(1)
  }
  console.log(`  ${companies.length} companies upserted.`)

  console.log(`Seeding ${performances.length} performances…`)
  // Chunk to stay well under payload limits.
  const CHUNK = 100
  for (let i = 0; i < performances.length; i += CHUNK) {
    const batch = performances.slice(i, i + CHUNK)
    const { error } = await supabase
      .from('performances')
      .upsert(batch, { onConflict: 'id' })
    if (error) {
      console.error('Failed to upsert performances:', error.message)
      process.exit(1)
    }
  }
  console.log(`  ${performances.length} performances upserted.`)
  console.log('Seed complete.')
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
