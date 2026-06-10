/**
 * Scraper CLI.
 *
 *   npx tsx scripts/scrapers/run.ts --adapter royal-ballet --fixture
 *     → parse the local fixture offline and print normalized output
 *
 *   npx tsx scripts/scrapers/run.ts --adapter royal-ballet --live
 *     → fetch the adapter's sourceUrl (network is blocked in the sandbox —
 *       handled gracefully with a clear message, no crash)
 *
 *   npx tsx scripts/scrapers/run.ts --all --fixture
 *     → run every adapter against its fixture
 *
 * When SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are set, the
 * normalized rows are upserted into Supabase. Otherwise it's a dry run that
 * only prints results.
 */
import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { companies } from '../../src/data/companies'
import type { ScraperAdapter } from './types'
import { normalizeMany } from './normalize'
import royalBallet from './adapters/royal-ballet'
import parisOperaBallet from './adapters/paris-opera-ballet'
import wienerStaatsoper from './adapters/wiener-staatsoper'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

const ADAPTERS: Record<string, ScraperAdapter> = {
  'royal-ballet': royalBallet,
  'paris-opera-ballet': parisOperaBallet,
  'wiener-staatsoper': wienerStaatsoper,
}

interface Args {
  adapter?: string
  all: boolean
  fixture: boolean
  live: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, fixture: false, live: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--adapter') args.adapter = argv[++i]
    else if (a === '--all') args.all = true
    else if (a === '--fixture') args.fixture = true
    else if (a === '--live') args.live = true
  }
  // Default to fixture mode if neither source flag is given.
  if (!args.fixture && !args.live) args.fixture = true
  return args
}

async function loadHtml(adapter: ScraperAdapter, mode: Args): Promise<string> {
  if (mode.live) {
    // Outbound network is blocked in the sandbox; this will usually throw and
    // is caught by the caller, which reports it as a graceful skip.
    const res = await fetch(adapter.sourceUrl, {
      headers: { 'user-agent': 'WorldBalletCalendarBot/1.0 (+contact)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return res.text()
  }
  const fixturePath = join(__dirname, 'fixtures', `${adapter.companySlug}.html`)
  return readFile(fixturePath, 'utf8')
}

function companyIdMap(): Map<string, string> {
  return new Map(companies.map((c) => [c.slug, c.id]))
}

function getSupabaseWriter() {
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

async function runAdapter(
  adapter: ScraperAdapter,
  mode: Args
): Promise<{ ok: boolean }> {
  console.log(`\n=== ${adapter.companySlug} (${mode.live ? 'live' : 'fixture'}) ===`)

  let html: string
  try {
    html = await loadHtml(adapter, mode)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(
      `  ! Could not load source (${msg}). ` +
        (mode.live
          ? 'Live fetch is expected to fail in the sandbox; skipping.'
          : 'Missing fixture.')
    )
    return { ok: false }
  }

  let raws
  try {
    raws = adapter.parse(html)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`  ! Parser threw (${msg}); skipping adapter.`)
    return { ok: false }
  }

  const { valid, rejected } = normalizeMany(raws, companyIdMap())

  console.log(`  parsed ${raws.length} raw rows → ${valid.length} valid, ${rejected.length} rejected`)
  for (const v of valid) {
    console.log(
      `    ✓ ${v.id}  ${v.title} [${v.kind}]  ${v.start_date} → ${v.end_date}`
    )
  }
  for (const r of rejected) {
    console.log(`    ✗ "${r.raw.title}" — ${r.reason}`)
  }

  const writer = getSupabaseWriter()
  if (writer && valid.length > 0) {
    const { error } = await writer
      .from('performances')
      .upsert(valid, { onConflict: 'id' })
    if (error) {
      console.warn(`  ! Upsert failed: ${error.message}`)
      return { ok: false }
    }
    console.log(`  ↑ upserted ${valid.length} rows to Supabase`)
  } else if (!writer) {
    console.log('  (dry run — set SUPABASE_SERVICE_ROLE_KEY to upsert)')
  }

  return { ok: true }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  const targets: ScraperAdapter[] = args.all
    ? Object.values(ADAPTERS)
    : args.adapter && ADAPTERS[args.adapter]
      ? [ADAPTERS[args.adapter]]
      : []

  if (targets.length === 0) {
    console.error(
      'Usage: tsx scripts/scrapers/run.ts --adapter <name> [--fixture|--live]\n' +
        `       tsx scripts/scrapers/run.ts --all [--fixture|--live]\n\n` +
        `Available adapters: ${Object.keys(ADAPTERS).join(', ')}`
    )
    process.exit(args.adapter ? 1 : 0)
  }

  let anyFailed = false
  for (const adapter of targets) {
    // Per-adapter isolation: one failure never aborts the run.
    try {
      const { ok } = await runAdapter(adapter, args)
      if (!ok) anyFailed = true
    } catch (err) {
      anyFailed = true
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  ! ${adapter.companySlug} failed unexpectedly: ${msg}`)
    }
  }

  console.log('')
  // Fixture runs should exit 0 on success; a live run that only failed due to
  // blocked network still exits 0 so CI "continue-on-error" semantics are
  // clean — individual adapter status is reported above.
  process.exit(args.fixture && anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Scraper run crashed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
