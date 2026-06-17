/**
 * Ingestion orchestrator — the cron entry point.
 *
 *   npx tsx scripts/ingest/run-ingest.ts --all --fixture
 *     → run every source against its local fixture, offline (no writes)
 *   npx tsx scripts/ingest/run-ingest.ts --all --live
 *     → fetch + extract + resolve + diff, write pending rows to Supabase
 *   npx tsx scripts/ingest/run-ingest.ts --selftest
 *     → prove the differ classifies new / unchanged / date-changed / cancelled
 *
 * Pipeline per source: fetch → extract → normalize → resolve → diff → write
 * pending. NOTHING is ever published here; the owner approves via Telegram.
 *
 * Extraction today reuses the existing scraper adapters; the feed/LLM extractors
 * (P4) slot into the same `extract()` seam.
 */
import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { companies } from '../../src/data/companies'
import type { ScraperAdapter } from '../scrapers/types'
import { normalizeMany } from '../scrapers/normalize'
import royalBallet from '../scrapers/adapters/royal-ballet'
import parisOperaBallet from '../scrapers/adapters/paris-opera-ballet'
import wienerStaatsoper from '../scrapers/adapters/wiener-staatsoper'
import { contentHash } from './hash'
import { diffRun } from './differ'
import { resolveEntities } from './resolver'
import {
  getWriter,
  fetchExistingForSource,
  upsertEntities,
  upsertCredits,
  writePending,
  markCancelledPending,
} from './state'
import type { ExistingRow, IngestPerformance } from './types'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Source registry — one adapter per source (extends to docs/SOURCES.md in P4). */
const SOURCES: Record<string, ScraperAdapter> = {
  'royal-ballet': royalBallet,
  'paris-opera-ballet': parisOperaBallet,
  'wiener-staatsoper': wienerStaatsoper,
}

interface Args {
  adapter?: string
  all: boolean
  fixture: boolean
  live: boolean
  selftest: boolean
}

function parseArgs(argv: string[]): Args {
  const a: Args = { all: false, fixture: false, live: false, selftest: false }
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]
    if (t === '--adapter') a.adapter = argv[++i]
    else if (t === '--all') a.all = true
    else if (t === '--fixture') a.fixture = true
    else if (t === '--live') a.live = true
    else if (t === '--selftest') a.selftest = true
  }
  if (!a.fixture && !a.live && !a.selftest) a.fixture = true
  return a
}

async function loadHtml(adapter: ScraperAdapter, live: boolean): Promise<string> {
  if (live) {
    const res = await fetch(adapter.sourceUrl, {
      headers: { 'user-agent': 'WorldBalletCalendarBot/1.0 (+contact)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return res.text()
  }
  return readFile(join(__dirname, '..', 'scrapers', 'fixtures', `${adapter.companySlug}.html`), 'utf8')
}

const companyIdMap = () => new Map(companies.map((c) => [c.slug, c.id]))

/** Run one source through the full pipeline. */
async function runSource(adapter: ScraperAdapter, args: Args): Promise<boolean> {
  const writer = args.live ? getWriter() : null
  console.log(`\n=== ${adapter.companySlug} (${args.live ? 'live' : 'fixture'}) ===`)

  let html: string
  try {
    html = await loadHtml(adapter, args.live)
  } catch (err) {
    console.warn(`  ! could not load source (${msg(err)}); skipping.`)
    return false
  }

  // Extract → normalize.
  let raws
  try {
    raws = adapter.parse(html)
  } catch (err) {
    console.warn(`  ! parser threw (${msg(err)}); skipping.`)
    return false
  }
  const { valid, rejected } = normalizeMany(raws, companyIdMap())
  console.log(`  parsed ${raws.length} → ${valid.length} valid, ${rejected.length} rejected`)

  // Provenance for each valid row (feed/adapter = confidence 1.0).
  const base = new Map<string, Pick<IngestPerformance, 'source_url' | 'content_hash' | 'confidence'>>()
  for (const v of valid) {
    base.set(v.id, { source_url: adapter.sourceUrl, content_hash: contentHash(v), confidence: 1 })
  }

  // Resolve entities + enrich performances.
  const resolved = resolveEntities(companies, valid, base)

  // Diff against the DB snapshot for this source (empty offline → all 'new').
  const existing = writer
    ? await fetchExistingForSource(writer, adapter.sourceUrl)
    : new Map<string, ExistingRow>()
  const { rows, cancelled, counts } = diffRun(resolved.performances, existing)

  console.log(
    `  diff: new=${counts.new} date-changed=${counts['date-changed']} ` +
      `price-changed=${counts['price-changed']} unchanged=${counts.unchanged} cancelled=${counts.cancelled}`
  )
  for (const r of rows) console.log(`    ${badge(r.change_kind)} ${r.id}  ${r.title}  ${r.start_date}→${r.end_date}`)
  for (const c of cancelled) console.log(`    ✗ CANCELLED ${c.id}`)

  if (!writer) {
    console.log('  (dry run — set SUPABASE_SERVICE_ROLE_KEY for live writes)')
    return true
  }

  // Write: entities first, then pending performances, then credits, then cancels.
  await upsertEntities(writer, resolved)
  const writtenIds = await writePending(writer, rows)
  await upsertCredits(writer, resolved.credits)
  await markCancelledPending(writer, cancelled.map((c) => c.id))
  console.log(`  ↑ wrote ${writtenIds.length} pending rows (+${cancelled.length} cancelled) to Supabase`)
  return true
}

/** Offline proof that the differ tags every change kind correctly. */
function selftest(): void {
  console.log('=== differ self-test ===')
  const mk = (over: Partial<IngestPerformance>): IngestPerformance => ({
    id: 'p-x',
    company_id: 'c',
    company_slug: 'royal-ballet',
    title: 'Swan Lake',
    kind: 'ballet',
    start_date: '2026-09-12',
    end_date: '2026-10-04',
    is_featured: false,
    content_hash: '',
    confidence: 1,
    ...over,
  })
  const a = mk({ id: 'p-a' })
  const b = mk({ id: 'p-b', start_date: '2026-12-05', end_date: '2026-12-30' })
  const c = mk({ id: 'p-c', price_range: '£20–£100' })
  for (const r of [a, b, c]) r.content_hash = contentHash(r)

  // Existing DB snapshot: b unchanged-hash, c date-same/price-different, plus a
  // ghost row 'p-gone' that no longer appears → cancellation.
  const existing = new Map<string, ExistingRow>([
    ['p-b', { id: 'p-b', content_hash: b.content_hash, start_date: '2026-12-08', end_date: '2026-12-30', price_range: null }],
    ['p-c', { id: 'p-c', content_hash: 'STALE', start_date: '2026-09-12', end_date: '2026-10-04', price_range: '£10–£50' }],
    ['p-gone', { id: 'p-gone', content_hash: 'x', start_date: '2026-01-01', end_date: '2026-01-02', price_range: null }],
  ])
  // Force b to be a date-change: same hash would mark unchanged, so clear it.
  existing.set('p-b', { ...existing.get('p-b')!, content_hash: 'STALE' })

  const { rows, cancelled, counts } = diffRun([a, b, c], existing)
  for (const r of rows) console.log(`  ${badge(r.change_kind)}  ${r.id}`)
  for (const c2 of cancelled) console.log(`  ✗ CANCELLED  ${c2.id}`)

  const ok =
    rows.find((r) => r.id === 'p-a')?.change_kind === 'new' &&
    rows.find((r) => r.id === 'p-b')?.change_kind === 'date-changed' &&
    rows.find((r) => r.id === 'p-c')?.change_kind === 'price-changed' &&
    counts.cancelled === 1
  console.log(ok ? '\n  ✓ all change kinds classified correctly' : '\n  ✗ classification FAILED')
  if (!ok) process.exit(1)
}

const badge = (k?: string) =>
  k === 'new' ? '+ NEW   ' : k === 'date-changed' ? '~ DATE  ' : k === 'price-changed' ? '~ PRICE ' : k === 'cancelled' ? '✗ CANCEL' : '· same  '
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.selftest) return selftest()

  const targets = args.all
    ? Object.values(SOURCES)
    : args.adapter && SOURCES[args.adapter]
      ? [SOURCES[args.adapter]]
      : []

  if (targets.length === 0) {
    console.error(
      `Usage: tsx scripts/ingest/run-ingest.ts --all [--fixture|--live]\n` +
        `       tsx scripts/ingest/run-ingest.ts --adapter <name> [--fixture|--live]\n` +
        `       tsx scripts/ingest/run-ingest.ts --selftest\n\n` +
        `Sources: ${Object.keys(SOURCES).join(', ')}`
    )
    process.exit(args.adapter ? 1 : 0)
  }

  let anyFailed = false
  for (const adapter of targets) {
    try {
      const ok = await runSource(adapter, args)
      if (!ok) anyFailed = true
    } catch (err) {
      anyFailed = true
      console.warn(`  ! ${adapter.companySlug} failed: ${msg(err)}`)
    }
  }
  process.exit(args.fixture && anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Ingestion run crashed:', msg(err))
  process.exit(1)
})
