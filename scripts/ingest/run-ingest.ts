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
import { formatDigest, sendDigest, sendNotice, type DigestLine } from '../../src/lib/telegram'
import type { ScraperAdapter, RawPerformance } from '../scrapers/types'
import { normalizeMany } from '../scrapers/normalize'
import { contentHash, pageHash } from './hash'
import { diffRun } from './differ'
import { resolveEntities } from './resolver'
import { extractFeed, type FeedKind } from './extract-feed'
import { extractWithLlm, LLM_CONFIDENCE } from './extract-llm'
import { renderPage } from './fetch-browser'
import {
  getWriter,
  getSourceState,
  saveSourceState,
  fetchExistingForSource,
  upsertEntities,
  upsertCredits,
  writePending,
  markCancelledPending,
  publishIds,
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
  /**
   * Default performance kind ('ballet'|'opera') applied to any extracted row
   * that doesn't supply its own. Feeds (iCal/JSON-LD) never set kind, so this
   * is required for all non-LLM sources. LLM path infers it from page content.
   */
  performanceKind?: 'ballet' | 'opera'
  /** CSS-template adapter for an HTML source; absent → LLM extraction. */
  adapter?: ScraperAdapter
  /** Render with a headless browser before extracting — for JS-rendered listing
   *  pages with no static feed. Requires the optional local Playwright tool. */
  render?: boolean
  /** Best-effort selector to wait for after render (the listings container). */
  waitForSelector?: string
  /**
   * Source-scoped title exclusion. Some house calendars list events outside the
   * company's own art form (the Met's calendar carries ABT ballet + concerts).
   * A matching title is dropped before write — better a missing row than a
   * misattributed one. Distinct from JUNK_TITLE, which is the global junk filter.
   */
  excludeTitle?: RegExp
}

/**
 * Feed URLs discovered by `npm run discover:feeds` (Tier A). Paste the EXACT
 * feed URL from docs/FEED_DISCOVERY.md ("Houses ready to ingest now"). A house
 * whose URL is left blank is skipped (with a notice) — fill it to activate it.
 *
 * iCal/RSS: the URL must be the feed endpoint itself (.ics / .xml / /feed).
 * JSON-LD : the URL is the listing page that embeds <script type=ld+json>.
 */
// (Teatro Colón & Opera Australia RSS were removed: inspect:feed proved them to
//  be news/empty, not performances. Both moved to the render path below.)

/**
 * Source registry — only houses with a verified official feed (Tier A). The old
 * CSS-adapter sources were removed: those houses expose no working feed, and
 * brittle selectors were the road to wrong data. No-feed houses are added later
 * via the AI-extraction path, never by fabrication. Each source is the same
 * SourceConfig contract; feeds parse deterministically with no model call.
 */
const SOURCES: Record<string, SourceConfig> = {
  // JSON-LD embedded in the calendar page — the probe confirmed Event objects.
  // This is the ONLY confirmed real season feed: the German .ics links turned out
  // to be single-event files, and the Teatro Colón / Opera Australia WordPress
  // /feed/ URLs were news/empty (verified via `inspect:feed`). Every other house
  // therefore uses the render path below.
  // Opera-only: the Met calendar also lists ABT ballet (summer season) and
  // concerts/galas at the Opera House. Those are dropped so the Metropolitan
  // Opera page shows only genuine operas. The markers below are specific to the
  // non-opera events and are checked NOT to match real operas (e.g. "Silent
  // Night" and "Lincoln in the Bardo" are operas and survive).
  'metropolitan-opera': {
    companySlug: 'metropolitan-opera',
    url: 'https://www.metopera.org/calendar',
    kind: 'jsonld',
    performanceKind: 'opera',
    excludeTitle: /\bABT\b|\bin concert\b|\bconcert\b|\bsymphony\b|\bjubilee\b|\bcelebration\b|\btoast\b|special guest artist|grand finals/i,
  },
}

/**
 * No-feed ballet houses whose listings are JavaScript-rendered. These use the
 * local Playwright path (render → AI extract → Telegram review). Fill each
 * house's real what's-on URL to activate it (blank = skipped). Royal Ballet's
 * URL is known from the operator; the others need their season/what's-on URL.
 */
const PARIS_OPERA_BALLET_LISTING = 'https://www.operadeparis.fr/en/useful-information/opening-calendar'
const ABT_LISTING = 'https://www.abt.org/performances/'
const NYCB_LISTING = 'https://www.nycballet.com/season-and-tickets/'
const SF_BALLET_LISTING = 'https://www.sfballet.org/calendar/'

const RENDER_SOURCES: Record<string, SourceConfig> = {
  'royal-ballet': { companySlug: 'royal-ballet', url: 'https://www.rbo.org.uk/tickets-and-events?hotFilter=ballet-and-dance', kind: 'html', render: true, performanceKind: 'ballet' },
  'paris-opera-ballet': { companySlug: 'paris-opera-ballet', url: PARIS_OPERA_BALLET_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  'american-ballet-theatre': { companySlug: 'american-ballet-theatre', url: ABT_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  'new-york-city-ballet': { companySlug: 'new-york-city-ballet', url: NYCB_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  'san-francisco-ballet': { companySlug: 'san-francisco-ballet', url: SF_BALLET_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  // Hamburg & Stuttgart expose only per-event .ics files (no season feed), so
  // render their calendar pages and AI-extract — same as the no-feed houses.
  'hamburg-ballett': { companySlug: 'hamburg-ballett', url: 'https://hamburgballett.die-hamburgische-staatsoper.de/en/calendar/ballet', kind: 'html', render: true, performanceKind: 'ballet' },
  'stuttgart-ballet': { companySlug: 'stuttgart-ballet', url: 'https://www.stuttgart-ballet.de/schedule/calendar/', kind: 'html', render: true, performanceKind: 'ballet' },
  // Teatro Colón & Opera Australia: RSS was news/empty (verified via inspect:feed),
  // so render the real calendar page and AI-extract instead.
  'teatro-colon': { companySlug: 'teatro-colon', url: 'https://teatrocolon.org.ar/calendario/', kind: 'html', render: true, performanceKind: 'opera' },
  'opera-australia': { companySlug: 'opera-australia', url: 'https://opera.org.au/whats-on/', kind: 'html', render: true, performanceKind: 'opera' },
}

/** All registered sources (feeds + render). `--all` runs every activated one. */
const ALL_SOURCES: Record<string, SourceConfig> = { ...SOURCES, ...RENDER_SOURCES }

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

/**
 * UA for live fetches. Defaults to a real browser string so that public
 * listing/feed pages the operator can open in their own browser are also
 * fetchable from their machine — many houses 403 a bot UA from any IP. This is
 * NOT bot-evasion: we only read pages a browser would, respect robots, and never
 * defeat an active challenge/CAPTCHA. Override with INGEST_UA if needed.
 */
const INGEST_UA =
  process.env.INGEST_UA ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function loadContent(src: SourceConfig, live: boolean): Promise<string> {
  if (live) {
    // JS-rendered listings need a real browser; static pages/feeds use fetch.
    if (src.render) {
      return renderPage(src.url, { ua: INGEST_UA, waitForSelector: src.waitForSelector })
    }
    const res = await fetch(src.url, {
      headers: {
        'user-agent': INGEST_UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/calendar;q=0.9,*/*;q=0.8',
        'accept-language': 'en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return res.text()
  }
  return readFile(join(__dirname, '..', 'scrapers', 'fixtures', `${src.companySlug}.html`), 'utf8')
}

/** Extract raw performances by source kind. Confidence: feed/adapter=1.0, LLM=0.85. */
async function extract(src: SourceConfig, content: string): Promise<{ raws: RawPerformance[]; confidence: number }> {
  let raws: RawPerformance[]
  let confidence: number
  if (src.kind !== 'html') {
    raws = extractFeed(src.kind, content, src.companySlug)
    confidence = 1
  } else if (src.adapter) {
    raws = src.adapter.parse(content)
    confidence = 1
  } else {
    raws = await extractWithLlm(content, src.companySlug)
    confidence = LLM_CONFIDENCE
  }
  // Feeds (iCal/JSON-LD) carry no discipline field, so stamp the source's
  // declared kind onto any row that didn't set its own. Without this every
  // feed row is rejected by the normalizer ("invalid kind").
  if (src.performanceKind) {
    for (const r of raws) if (!r.kind) r.kind = src.performanceKind
  }
  return { raws, confidence }
}

const companyIdMap = () => new Map(companies.map((c) => [c.slug, c.id]))

/**
 * Obvious non-performance junk that some house calendars expose (e.g. the Met's
 * own "Load Test Prod" sentinel rows dated 2050). Dropped before anything is
 * written — a single fabricated row destroys the trust the product is built on.
 */
const JUNK_TITLE = /\b(load[\s-]*test|test\s*prod(uction)?|lorem ipsum|placeholder|do not (use|book))\b/i

/**
 * Collapse rows that share an id into one production spanning the whole run
 * (earliest start … latest end). JSON-LD/iCal calendars emit ONE event per
 * performance date, so a single production arrives as dozens of same-id rows;
 * without this the upsert hits "ON CONFLICT cannot affect row a second time"
 * and the entire run fails. One row per production is also the right shape for
 * a season calendar. Junk titles are filtered out here too.
 */
function collapseProductions<T extends { id: string; title: string; start_date: string; end_date: string }>(
  rows: T[],
  excludeTitle?: RegExp
): { kept: T[]; dropped: number; collapsed: number } {
  const byId = new Map<string, T>()
  let dropped = 0
  for (const r of rows) {
    if (JUNK_TITLE.test(r.title) || (excludeTitle && excludeTitle.test(r.title))) {
      dropped += 1
      continue
    }
    const existing = byId.get(r.id)
    if (!existing) {
      byId.set(r.id, { ...r })
      continue
    }
    // Widen the existing production's span to cover this date.
    if (r.start_date < existing.start_date) existing.start_date = r.start_date
    if (r.end_date > existing.end_date) existing.end_date = r.end_date
  }
  const kept = [...byId.values()]
  return { kept, dropped, collapsed: rows.length - dropped - kept.length }
}

/** Per-source outcome — collected into the end-of-run summary. */
interface SourceResult {
  ok: boolean
  line: string
}

/** Run one source through the full pipeline. */
async function runSource(src: SourceConfig, args: Args, runId: string): Promise<SourceResult> {
  const writer = args.live ? getWriter() : null
  console.log(`\n=== ${src.companySlug} (${args.live ? 'live' : 'fixture'}, ${src.adapter ? 'adapter' : src.kind}) ===`)

  let content: string
  try {
    content = await loadContent(src, args.live)
  } catch (err) {
    console.warn(`  ! could not load source (${msg(err)}); skipping.`)
    return { ok: false, line: `⚠️ ${src.companySlug}: load failed (${msg(err)})` }
  }

  // Cache gate: an unchanged page hash means SKIP (no extraction, no LLM spend).
  let autoApprove = false
  if (writer) {
    const state = await getSourceState(writer, src.companySlug)
    autoApprove = state?.auto_approve ?? false
    const hash = pageHash(content)
    if (state?.last_hash && state.last_hash === hash) {
      console.log('  · page unchanged since last run — skipping (0 cost)')
      return { ok: true, line: `· ${src.companySlug}: unchanged` }
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
    return { ok: false, line: `⚠️ ${src.companySlug}: extraction failed (${msg(err)})` }
  }
  const { valid, rejected } = normalizeMany(raws, companyIdMap())
  // Collapse per-date events into one row per production, and drop junk. This
  // is what makes the upsert safe (no duplicate ids in a batch) and the calendar
  // correct (one entry per production run, not one per night).
  const { kept, dropped, collapsed } = collapseProductions(valid, src.excludeTitle)
  console.log(
    `  parsed ${raws.length} → ${valid.length} valid, ${rejected.length} rejected` +
      ` → ${kept.length} productions (collapsed ${collapsed} dates, dropped ${dropped} junk) (confidence ${confidence})`
  )

  // Provenance per production row.
  const base = new Map<string, Pick<IngestPerformance, 'source_url' | 'content_hash' | 'confidence'>>()
  for (const v of kept) base.set(v.id, { source_url: src.url, content_hash: contentHash(v), confidence })

  // Resolve entities + enrich performances.
  const resolved = resolveEntities(companies, kept, base)

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
    return { ok: true, line: `(dry) ${src.companySlug}: ${rows.length} rows` }
  }

  // Write: entities first, then pending performances, then credits, then cancels.
  await upsertEntities(writer, resolved)
  const writtenIds = await writePending(writer, rows)
  await upsertCredits(writer, resolved.credits)
  await markCancelledPending(writer, cancelled.map((c) => c.id))
  console.log(`  ↑ wrote ${writtenIds.length} pending rows (+${cancelled.length} cancelled) to Supabase`)

  const changed = rows.filter((r) => r.change_kind !== 'unchanged')
  const chatId = process.env.TELEGRAM_CHAT_ID ?? null

  // AUTO-APPROVE (earned): a trusted source whose run is ALL new additions, at
  // high confidence, with no date changes or cancellations, publishes directly
  // with a notify-only summary. Anything else routes to manual review.
  const autoEligible =
    autoApprove &&
    confidence >= 0.9 &&
    cancelled.length === 0 &&
    changed.length > 0 &&
    changed.every((r) => r.change_kind === 'new')

  if (autoEligible) {
    await publishIds(writer, changed.map((r) => r.id))
    console.log(`  ✓ auto-approved ${changed.length} new rows (trusted source)`)
    if (chatId) {
      const name = companies.find((c) => c.slug === src.companySlug)?.name ?? src.companySlug
      await sendNotice(chatId, `✅ *${name}* — ${changed.length} new auto-published (run ${runId})`).catch(() => {})
    }
    return { ok: true, line: `✅ ${src.companySlug}: ${changed.length} auto-published` }
  }

  // One Telegram digest per company per run — only when something changed.
  const allIds = [...changed.map((r) => r.id), ...cancelled.map((c) => c.id)]
  if (allIds.length > 0) {
    const batchId = `${runId}:${src.companySlug}`
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
  const pendingN = changed.length + cancelled.length
  return {
    ok: true,
    line: pendingN > 0 ? `📝 ${src.companySlug}: ${pendingN} pending review` : `· ${src.companySlug}: no changes`,
  }
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

  const selected = args.all
    ? Object.values(ALL_SOURCES)
    : args.adapter && ALL_SOURCES[args.adapter]
      ? [ALL_SOURCES[args.adapter]]
      : []

  // Skip feed houses whose URL has not been pasted in yet (blank = not ready).
  const targets = selected.filter((s) => {
    if (s.url && s.url.trim()) return true
    const how = s.render
      ? "set its what's-on URL in RENDER_SOURCES"
      : 'paste its feed URL from docs/FEED_DISCOVERY.md'
    console.warn(`  · ${s.companySlug}: source URL not set — ${how} to activate.`)
    return false
  })

  if (selected.length === 0) {
    console.error(
      `Usage: tsx scripts/ingest/run-ingest.ts --all [--fixture|--live]\n` +
        `       tsx scripts/ingest/run-ingest.ts --source <name> [--fixture|--live]\n` +
        `       tsx scripts/ingest/run-ingest.ts --selftest\n\n` +
        `Sources: ${Object.keys(ALL_SOURCES).join(', ')}`
    )
    process.exit(args.adapter ? 1 : 0)
  }

  const runId = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  let anyFailed = false
  const summary: string[] = []
  for (const src of targets) {
    try {
      const res = await runSource(src, args, runId)
      summary.push(res.line)
      if (!res.ok) anyFailed = true
    } catch (err) {
      anyFailed = true
      summary.push(`⚠️ ${src.companySlug}: crashed (${msg(err)})`)
      console.warn(`  ! ${src.companySlug} failed: ${msg(err)}`)
    }
  }

  // End-of-run report — one Telegram message so the owner sees the whole crawl
  // at a glance (auto-published, pending, skipped, errors).
  console.log(`\n=== run ${runId} summary ===\n${summary.join('\n')}`)
  if (args.live) {
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (chatId) {
      await sendNotice(chatId, `🗂 *Ingest run ${runId}*\n${summary.join('\n')}`).catch(() => {})
    }
  }
  process.exit(args.fixture && anyFailed ? 1 : 0)
}

main().catch((err) => {
  console.error('Ingestion run crashed:', msg(err))
  process.exit(1)
})
