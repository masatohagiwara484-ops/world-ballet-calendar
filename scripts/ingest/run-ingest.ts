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
 * Pipeline per source: discover → fetch → extract → normalize → resolve → diff
 * → write pending. NOTHING is ever published here; the owner approves via Telegram.
 *
 * Extraction is feed-first and cost-disciplined:
 *   • feed_kind ∈ {ical,rss,jsonld} → deterministic parse, NO model call
 *   • feed_kind = html with a CSS adapter → the adapter (free template path)
 *   • feed_kind = html with no adapter → one Haiku call, gated by a page-hash
 *     cache so an unchanged page costs nothing on a re-run
 */
import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { companies } from '../../src/data/companies'
import { formatDigest, sendDigest, type DigestLine } from '../../src/lib/telegram'
import type { ScraperAdapter, RawPerformance } from '../scrapers/types'
import { normalizeMany } from '../scrapers/normalize'
import royalBallet from '../scrapers/adapters/royal-ballet'
import parisOperaBallet from '../scrapers/adapters/paris-opera-ballet'
import wienerStaatsoper from '../scrapers/adapters/wiener-staatsoper'
import { contentHash, pageHash } from './hash'
import { diffRun } from './differ'
import { resolveEntities } from './resolver'
import { extractFeed, type FeedKind } from './extract-feed'
import { extractWithLlm, LLM_CONFIDENCE } from './extract-llm'
import {
  getWriter,
  getSourceState,
  saveSourceState,
  fetchExistingForSource,
  upsertEntities,
  upsertCredits,
  writePending,
  markCancelledPending,
  recordBatch,
} from './state'
import type { ExistingRow, IngestPerformance } from './types'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

/** A data source: a company slug + listing URL + how to extract it. */
interface SourceConfig {
  companySlug: string
  url: string
  /** 'html' uses the adapter (if present) or the LLM; feeds parse deterministically. */
  kind: 'html' | FeedKind
  /** CSS-template adapter for an HTML source; absent → LLM extraction. */
  adapter?: ScraperAdapter
}

/**
 * Source registry. The three existing CSS adapters are templates for HTML
 * sources; feed/LLM houses are added here as their docs/SOURCES.md rows are
 * filled (P4/P5). All start from the same SourceConfig contract.
 */
const SOURCES: Record<string, SourceConfig> = {
  'royal-ballet': { companySlug: 'royal-ballet', url: royalBallet.sourceUrl, kind: 'html', adapter: royalBallet },
  'paris-opera-ballet': { companySlug: 'paris-opera-ballet', url: parisOperaBallet.sourceUrl, kind: 'html', adapter: parisOperaBallet },
  'wiener-staatsoper': { companySlug: 'wiener-staatsoper', url: wienerStaatsoper.sourceUrl, kind: 'html', adapter: wienerStaatsoper },
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
    if (t === '--adapter' || t === '--source') a.adapter = argv[++i]
    else if (t === '--all') a.all = true
    else if (t === '--fixture') a.fixture = true
    else if (t === '--live') a.live = true
    else if (t === '--selftest') a.selftest = true
  }
  if (!a.fixture && !a.live && !a.selftest) a.fixture = true
  return a
}

async function loadContent(src: SourceConfig, live: boolean): Promise<string> {
  if (live) {
    const res = await fetch(src.url, {
      headers: { 'user-agent': 'WorldBalletCalendarBot/1.0 (+contact)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return res.text()
  }
  return readFile(join(__dirname, '..', 'scrapers', 'fixtures', `${src.companySlug}.html`), 'utf8')
}

/** Extract raw performances by source kind. Confidence: feed/adapter=1.0, LLM=0.85. */
async function extract(src: SourceConfig, content: string): Promise<{ raws: RawPerformance[]; confidence: number }> {
  if (src.kind !== 'html') {
    return { raws: extractFeed(src.kind, content, src.companySlug), confidence: 1 }
  }
  if (src.adapter) {
    return { raws: src.adapter.parse(content), confidence: 1 }
  }
  return { raws: await extractWithLlm(content, src.companySlug), confidence: LLM_CONFIDENCE }
}

const companyIdMap = () => new Map(companies.map((c) => [c.slug, c.id]))

/** Run one source through the full pipeline. */
async function runSource(src: SourceConfig, args: Args, runId: string): Promise<boolean> {
  const writer = args.live ? getWriter() : null
  console.log(`\n=== ${src.companySlug} (${args.live ? 'live' : 'fixture'}, ${src.adapter ? 'adapter' : src.kind}) ===`)

  let content: string
  try {
    content = await loadContent(src, args.live)
  } catch (err) {
    console.warn(`  ! could not load source (${msg(err)}); skipping.`)
    return false
  }

  // Cache gate: an unchanged page hash means SKIP (no extraction, no LLM spend).
  if (writer) {
    const state = await getSourceState(writer, src.companySlug)
    const hash = pageHash(content)
    if (state?.last_hash && state.last_hash === hash) {
      console.log('  · page unchanged since last run — skipping (0 cost)')
      return true
    }
    await saveSourceState(writer, src.companySlug, { last_hash: hash })
  }

  // Extract → normalize.
  let raws: RawPerformance[]
  let confidence: number
  try {
    const r = await extract(src, content)
    raws = r.raws
    confidence = r.confidence
  } catch (err) {
    console.warn(`  ! extraction threw (${msg(err)}); skipping.`)
    return false
  }
  const { valid, rejected } = normalizeMany(raws, companyIdMap())
  console.log(`  parsed ${raws.length} → ${valid.length} valid, ${rejected.length} rejected (confidence ${confidence})`)

  // Provenance per valid row.
  const base = new Map<string, Pick<IngestPerformance, 'source_url' | 'content_hash' | 'confidence'>>()
  for (const v of valid) base.set(v.id, { source_url: src.url, content_hash: contentHash(v), confidence })

  // Resolve entities + enrich performances.
  const resolved = resolveEntities(companies, valid, base)

  // Diff against the DB snapshot for this source (empty offline → all 'new').
  const existing = writer
    ? await fetchExistingForSource(writer, src.url)
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

  // One Telegram digest per company per run — only when something changed.
  const changed = rows.filter((r) => r.change_kind !== 'unchanged')
  const allIds = [...changed.map((r) => r.id), ...cancelled.map((c) => c.id)]
  if (allIds.length > 0) {
    const batchId = `${runId}:${src.companySlug}`
    const chatId = process.env.TELEGRAM_CHAT_ID ?? null
    const lines: DigestLine[] = [
      ...changed.map((r) => ({
        change_kind: r.change_kind,
        title: r.title,
        start_date: r.start_date,
        end_date: r.end_date,
        was: r.change_kind === 'date-changed' ? existing.get(r.id)?.start_date : undefined,
      })),
      ...cancelled.map((c) => ({ change_kind: 'cancelled', title: c.id, start_date: c.start_date, end_date: c.end_date })),
    ]
    let messageId: string | null = null
    if (chatId) {
      const companyName = companies.find((c) => c.slug === src.companySlug)?.name ?? src.companySlug
      const text = formatDigest({ companyName, runId, batchId, lines, sourceUrl: src.url, confidence })
      try {
        messageId = await sendDigest(chatId, text, batchId)
      } catch (err) {
        console.warn(`  ! telegram digest failed: ${msg(err)}`)
      }
    }
    await recordBatch(writer, {
      id: batchId,
      company_slug: src.companySlug,
      run_id: runId,
      telegram_chat_id: chatId,
      telegram_message_id: messageId,
      performance_ids: allIds,
      counts,
    })
  }
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
  const b = mk({ id: 'p-b' })
  const c = mk({ id: 'p-c', price_range: '£20–£100' })
  for (const r of [a, b, c]) r.content_hash = contentHash(r)

  const existing = new Map<string, ExistingRow>([
    ['p-b', { id: 'p-b', content_hash: 'STALE', start_date: '2026-12-08', end_date: '2026-12-30', price_range: null }],
    ['p-c', { id: 'p-c', content_hash: 'STALE', start_date: '2026-09-12', end_date: '2026-10-04', price_range: '£10–£50' }],
    ['p-gone', { id: 'p-gone', content_hash: 'x', start_date: '2026-01-01', end_date: '2026-01-02', price_range: null }],
  ])

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
        `       tsx scripts/ingest/run-ingest.ts --source <name> [--fixture|--live]\n` +
        `       tsx scripts/ingest/run-ingest.ts --selftest\n\n` +
        `Sources: ${Object.keys(SOURCES).join(', ')}`
    )
    process.exit(args.adapter ? 1 : 0)
  }

  const runId = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  let anyFailed = false
  for (const src of targets) {
    try {
      const ok = await runSource(src, args, runId)
      if (!ok) anyFailed = true
    } catch (err) {
      anyFailed = true
      console.warn(`  ! ${src.companySlug} failed: ${msg(err)}`)
    }
  }
  process.exit(args.fixture && anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Ingestion run crashed:', msg(err))
  process.exit(1)
})
