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
import { existsSync } from 'node:fs'
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
import { extractWpCalendar } from './extract-wp-calendar'
import { NON_PERFORMANCE_TITLE, ROYAL_OPERA_BALLET_TITLE } from './filters'
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
  /** 'html' uses the adapter (if present) or the LLM; feeds and 'wp-ajax' parse
   *  deterministically. */
  kind: 'html' | FeedKind | 'wp-ajax'
  /**
   * For kind:'wp-ajax' — a house whose listing is a client-side calendar widget
   * backed by a WordPress admin-ajax.php action (American Ballet Theatre is the
   * proven case). `params` replicates the exact default-checked category/
   * taxonomy checkboxes the page's own JS sends — discover them with
   * `curl .../admin-ajax.php` from a residential IP + `inspect-dump.ts`, never
   * guessed. `categoryLabel` keeps only rows tagged with it (drops Training/
   * Community/Opportunities noise sharing the same calendar).
   */
  wpAjax?: {
    action: string
    params: Record<string, string[]>
    categoryLabel: string
  }
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
  /** For URL-paginated listings (e.g. Royal Ballet's ?page=N): total page count.
   *  Each page is loaded in the same browser session; combined HTML is split by
   *  PAGE_BREAK so the extractor sees every page's <main> independently. */
  maxPages?: number
  /** URL query-param name for URL pagination (default 'page'). */
  pageParam?: string
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
  // ABT's "Performances" page renders an empty <main> — the Master Calendar is
  // a client-side FullCalendar widget with NO listing text in the served HTML
  // at all (confirmed via inspect-dump.ts: <body> text was 6,841 chars of pure
  // nav chrome). No amount of HTML-scope fixing or LLM prompting can recover
  // data that was never in the page. Its own calendar.js POSTs to
  // admin-ajax.php?action=get_calendar_events with every category/taxonomy
  // checkbox checked (discovered 2026-07-13 via curl from a residential IP +
  // reading the theme's calendar.js); replicating that POST gets the same
  // JSON the widget renders. Deterministic, no model call — confidence 1.
  'american-ballet-theatre': {
    companySlug: 'american-ballet-theatre',
    url: 'https://www.abt.org/wp-admin/admin-ajax.php',
    kind: 'wp-ajax',
    performanceKind: 'ballet',
    wpAjax: {
      action: 'get_calendar_events',
      categoryLabel: 'Performance',
      params: {
        'event_category[]': ['Performance', 'Special Events', 'Training', 'Community', 'Opportunities', 'Virtual'],
        'filter_events[]': ['24', '26', '25', '28', '30', '27', '29'],
        'filter_performance[]': ['33', '32', '234', '31', '34'],
        'filters_membership[]': ['35', '38', '36', '39', '37'],
        'filter_dancer_training[]': ['42', '41', '40', '43'],
        'filter_teacher_training[]': ['44'],
      },
    },
  },
}

/**
 * No-feed ballet houses whose listings are JavaScript-rendered. These use the
 * local Playwright path (render → AI extract → Telegram review). Fill each
 * house's real what's-on URL to activate it (blank = skipped). Royal Ballet's
 * URL is known from the operator; the others need their season/what's-on URL.
 */
const PARIS_OPERA_BALLET_LISTING = 'https://www.operadeparis.fr/en/season/ballet'
const NYCB_LISTING = 'https://www.nycballet.com/season-and-tickets/'
const SF_BALLET_LISTING = 'https://www.sfballet.org/calendar/'

const RENDER_SOURCES: Record<string, SourceConfig> = {
  // Royal Ballet & Royal Opera: same RBO site, different hotFilter.
  // URL-paginated (?page=1/2/3); maxPages:3 loads all pages in one session.
  'royal-ballet': { companySlug: 'royal-ballet', url: 'https://www.rbo.org.uk/tickets-and-events?hotFilter=ballet-and-dance', kind: 'html', render: true, performanceKind: 'ballet', maxPages: 3 },
  // The RBO site serves one calendar for both companies; drop ballet/shared
  // events from the opera filter so Royal Opera shows only genuine opera.
  'royal-opera': { companySlug: 'royal-opera', url: 'https://www.rbo.org.uk/tickets-and-events?hotFilter=opera', kind: 'html', render: true, performanceKind: 'opera', maxPages: 3, excludeTitle: ROYAL_OPERA_BALLET_TITLE },
  // Paris Opera — dedicated ballet and opera season pages.
  'paris-opera-ballet': { companySlug: 'paris-opera-ballet', url: PARIS_OPERA_BALLET_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  'opera-national-de-paris': { companySlug: 'opera-national-de-paris', url: 'https://www.operadeparis.fr/en/season/operas', kind: 'html', render: true, performanceKind: 'opera' },
  // US companies. (american-ballet-theatre moved to SOURCES — wp-ajax, see above)
  'new-york-city-ballet': { companySlug: 'new-york-city-ballet', url: NYCB_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  'san-francisco-ballet': { companySlug: 'san-francisco-ballet', url: SF_BALLET_LISTING, kind: 'html', render: true, performanceKind: 'ballet' },
  // German companies — expose only per-event .ics files (no season feed), so
  // render their calendar pages and AI-extract.
  'hamburg-ballett': { companySlug: 'hamburg-ballett', url: 'https://hamburgballett.die-hamburgische-staatsoper.de/en/calendar/ballet', kind: 'html', render: true, performanceKind: 'ballet' },
  'stuttgart-ballet': { companySlug: 'stuttgart-ballet', url: 'https://www.stuttgart-ballet.de/schedule/calendar/', kind: 'html', render: true, performanceKind: 'ballet' },
  'bayerische-staatsoper': { companySlug: 'bayerische-staatsoper', url: 'https://www.staatsoper.de/en/performances.html', kind: 'html', render: true, performanceKind: 'opera' },
  // Austrian companies.
  'wiener-staatsoper': { companySlug: 'wiener-staatsoper', url: 'https://www.wiener-staatsoper.at/en/performance-plan/season/', kind: 'html', render: true, performanceKind: 'opera' },
  'wiener-staatsballett': { companySlug: 'wiener-staatsballett', url: 'https://www.wiener-staatsballett.at/spielplan/', kind: 'html', render: true, performanceKind: 'ballet' },
  // Italian / Danish / Dutch / Canadian / Australian / Japanese companies.
  'teatro-alla-scala': { companySlug: 'teatro-alla-scala', url: 'https://www.teatroallascala.org/en/season/2025-2026/', kind: 'html', render: true },
  'royal-danish-ballet': { companySlug: 'royal-danish-ballet', url: 'https://kglteater.dk/en/programme/dance-and-ballet', kind: 'html', render: true, performanceKind: 'ballet' },
  'dutch-national-ballet': { companySlug: 'dutch-national-ballet', url: 'https://www.operaballet.nl/en/ballet/season', kind: 'html', render: true, performanceKind: 'ballet' },
  'national-ballet-of-canada': { companySlug: 'national-ballet-of-canada', url: 'https://national.ballet.ca/performances/', kind: 'html', render: true, performanceKind: 'ballet' },
  'australian-ballet': { companySlug: 'australian-ballet', url: 'https://australianballet.com.au/whats-on', kind: 'html', render: true, performanceKind: 'ballet' },
  'tokyo-ballet': { companySlug: 'tokyo-ballet', url: 'https://www.thetokyoballet.com/performances/', kind: 'html', render: true, performanceKind: 'ballet' },
  'new-national-theatre-tokyo': { companySlug: 'new-national-theatre-tokyo', url: 'https://www.nntt.jac.go.jp/english/opera/schedule/', kind: 'html', render: true, performanceKind: 'opera' },
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
  /**
   * Operator path: extract from HTML the owner saved with their OWN browser into
   * scripts/ingest/.local/<slug>.html. This sidesteps the datacenter-IP 403 wall
   * (ROADMAP #12) entirely — the page was fetched by a real logged-in visitor —
   * and writes pending rows to Supabase for the same Telegram approval gate.
   */
  local: boolean
  selftest: boolean
}

function parseArgs(argv: string[]): Args {
  const a: Args = { all: false, fixture: false, live: false, local: false, selftest: false }
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]
    if (t === '--adapter' || t === '--source') a.adapter = argv[++i]
    else if (t === '--all') a.all = true
    else if (t === '--fixture') a.fixture = true
    else if (t === '--live') a.live = true
    else if (t === '--local') a.local = true
    else if (t === '--selftest') a.selftest = true
  }
  // --local implies a real write (pending → review), like --live.
  if (!a.fixture && !a.live && !a.local && !a.selftest) a.fixture = true
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

/** Where the operator drops browser-saved HTML for the `--local` path. */
const LOCAL_DIR = join(__dirname, '.local')

/**
 * Resolve the saved-HTML file for a source. Accepts a few extensions a browser's
 * "Save As" produces so the operator doesn't have to rename anything:
 *   <slug>.html  ·  <slug>.htm  ·  <slug>.txt
 */
function localPathFor(slug: string): string | null {
  for (const ext of ['html', 'htm', 'txt']) {
    const p = join(LOCAL_DIR, `${slug}.${ext}`)
    if (existsSync(p)) return p
  }
  return null
}

async function loadContent(src: SourceConfig, args: Args): Promise<string> {
  // Operator path: read the page the owner saved from their own browser.
  if (args.local) {
    const p = localPathFor(src.companySlug)
    if (!p) {
      throw new Error(
        `no saved HTML at ${join('scripts/ingest/.local', `${src.companySlug}.html`)} — ` +
          `open ${src.url} in your browser, Save As → "Page Source"/"Web Page, HTML Only", ` +
          `name it ${src.companySlug}.html, and drop it in scripts/ingest/.local/`
      )
    }
    console.log(`  · reading saved HTML: ${p}`)
    return readFile(p, 'utf8')
  }
  if (args.live) {
    // wp-ajax: replicate the calendar widget's own POST — never rendered HTML.
    if (src.kind === 'wp-ajax') {
      if (!src.wpAjax) throw new Error(`${src.companySlug}: kind 'wp-ajax' requires a wpAjax config`)
      // A rolling window, re-computed fresh on every run so the source never
      // goes stale. Start is 45 DAYS IN THE PAST, not today: a production that
      // opened before today (still running) has its true opening night before
      // "now", and starting the window at today would silently truncate it —
      // confirmed live 2026-07-14, Swan Lake's real run is 07-13→07-18 but a
      // today-anchored window recorded 07-14→07-18, one night short. 45 days
      // comfortably covers any ballet/opera run length. End is +14 months out.
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 45)
      const start = startDate.toISOString().slice(0, 10)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 14)
      const end = endDate.toISOString().slice(0, 10)

      const body = new URLSearchParams()
      body.append('action', src.wpAjax.action)
      body.append('start', start)
      body.append('end', end)
      for (const [key, values] of Object.entries(src.wpAjax.params)) {
        for (const v of values) body.append(key, v)
      }

      const res = await fetch(src.url, {
        method: 'POST',
        headers: {
          'user-agent': INGEST_UA,
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json, text/javascript, */*; q=0.9',
        },
        body: body.toString(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      return res.text()
    }
    // JS-rendered listings need a real browser; static pages/feeds use fetch.
    if (src.render) {
      return renderPage(src.url, {
        ua: INGEST_UA,
        waitForSelector: src.waitForSelector,
        maxPages: src.maxPages,
        pageParam: src.pageParam,
      })
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
  // wp-ajax fixtures are the raw JSON response, not a rendered HTML page.
  const ext = src.kind === 'wp-ajax' ? 'json' : 'html'
  return readFile(join(__dirname, '..', 'scrapers', 'fixtures', `${src.companySlug}.${ext}`), 'utf8')
}

/** Extract raw performances by source kind. Confidence: feed/adapter=1.0, LLM=0.85. */
async function extract(src: SourceConfig, content: string): Promise<{ raws: RawPerformance[]; confidence: number }> {
  let raws: RawPerformance[]
  let confidence: number
  if (src.kind === 'wp-ajax') {
    raws = extractWpCalendar(content, src.companySlug, src.wpAjax!.categoryLabel)
    confidence = 1
  } else if (src.kind !== 'html') {
    raws = extractFeed(src.kind, content, src.companySlug)
    confidence = 1
  } else if (src.adapter) {
    raws = src.adapter.parse(content)
    confidence = 1
  } else {
    // Pass the listing URL so the extractor can absolutize booking links into
    // ticket_url (relative hrefs would otherwise be dropped by the normalizer).
    raws = await extractWithLlm(content, src.companySlug, src.url)
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
 * Two per-night rows further apart than this are treated as SEPARATE
 * engagements, never bridged into one continuous run. Proven necessary from
 * ABT's Master Calendar: "Swan Lake" plays 06-17→06-20, then a 23-day silence
 * (other ballets rotate through the same rep season), then 07-13→07-18 — same
 * title, same venue, but collapsing them into "06-17→07-18" would tell a
 * traveller they could book any night in that month, when most of those
 * nights aren't Swan Lake at all. 14 days is comfortably below that 23-day
 * gap while still tolerating a normal run's rest days/dark nights.
 */
const MAX_RUN_GAP_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000
const daysBetween = (a: string, b: string): number => (new Date(b).getTime() - new Date(a).getTime()) / DAY_MS

/**
 * Collapse rows that share an id into one production per continuous run
 * (earliest start … latest end, split on any gap over MAX_RUN_GAP_DAYS).
 * JSON-LD/iCal/wp-ajax calendars emit ONE event per performance date, so a
 * single run arrives as dozens of same-id rows; without merging, the upsert
 * hits "ON CONFLICT cannot affect row a second time" and the entire batch
 * fails. Splitting on gaps keeps a rotating-repertory season's separate
 * engagements from being reported as one falsely-continuous date range.
 * Split blocks after the first get their id suffixed (`-2`, `-3`, …) so both
 * remain stable, distinct rows across re-runs. Junk titles are filtered here.
 */
function collapseProductions<T extends { id: string; title: string; start_date: string; end_date: string }>(
  rows: T[],
  excludeTitle?: RegExp
): { kept: T[]; dropped: number; collapsed: number } {
  const byId = new Map<string, T[]>()
  let dropped = 0
  for (const r of rows) {
    if (
      JUNK_TITLE.test(r.title) ||
      NON_PERFORMANCE_TITLE.test(r.title) ||
      (excludeTitle && excludeTitle.test(r.title))
    ) {
      dropped += 1
      continue
    }
    const list = byId.get(r.id)
    if (list) list.push(r)
    else byId.set(r.id, [r])
  }

  const kept: T[] = []
  for (const group of byId.values()) {
    group.sort((a, b) => a.start_date.localeCompare(b.start_date))
    let block: T | null = null
    let blockNum = 1
    for (const r of group) {
      if (!block) {
        block = { ...r }
        continue
      }
      if (daysBetween(block.end_date, r.start_date) > MAX_RUN_GAP_DAYS) {
        kept.push(block)
        blockNum += 1
        block = { ...r, id: `${r.id}-${blockNum}` }
        continue
      }
      if (r.start_date < block.start_date) block.start_date = r.start_date
      if (r.end_date > block.end_date) block.end_date = r.end_date
    }
    if (block) kept.push(block)
  }
  return { kept, dropped, collapsed: rows.length - dropped - kept.length }
}

/** Per-source outcome — collected into the end-of-run summary. */
interface SourceResult {
  ok: boolean
  line: string
}

/**
 * TRUST GUARD: a run that extracted ZERO productions against a source that
 * already has published rows is almost certainly a broken fetch/extraction
 * (site layout changed, JS didn't render, `<main>` moved, API down) — NOT the
 * house going dark. diffRun() has no way to tell the two apart: it marks every
 * previously-seen id "not present this run" → cancelled either way. Left
 * unguarded, one bad crawl silently un-publishes an entire house's live season
 * (this is exactly what happened to american-ballet-theatre's 4 published
 * rows on 2026-07-13). So: 0 kept + existing rows present == treat the run as
 * FAILED and touch nothing, rather than as "everything cancelled".
 *
 * A house that is genuinely dark (real season end) will keep failing this way
 * every run — which is the correct, safe failure mode: the owner sees a
 * standing "extraction failed" line instead of the site quietly going empty.
 */
export function isFailedExtraction(keptCount: number, existingCount: number): boolean {
  return keptCount === 0 && existingCount > 0
}

/** Run one source through the full pipeline. */
async function runSource(src: SourceConfig, args: Args, runId: string): Promise<SourceResult> {
  // --local writes pending rows too, so it needs the Supabase writer like --live.
  const write = args.live || args.local
  const writer = write ? getWriter() : null
  const mode = args.local ? 'local' : args.live ? 'live' : 'fixture'
  console.log(`\n=== ${src.companySlug} (${mode}, ${src.adapter ? 'adapter' : src.kind}) ===`)

  let content: string
  try {
    content = await loadContent(src, args)
  } catch (err) {
    console.warn(`  ! could not load source (${msg(err)}); skipping.`)
    return { ok: false, line: `⚠️ ${src.companySlug}: load failed (${msg(err)})` }
  }

  // Snapshot the existing rows for this source — used both by the cache gate
  // below and by the differ later, so we fetch it once.
  const existing = writer
    ? await fetchExistingForSource(writer, src.url)
    : new Map<string, ExistingRow>()

  // Cache gate: an unchanged page hash means SKIP (no extraction, no LLM spend)
  // — but ONLY when we already have rows stored for this source. A matching hash
  // with zero stored rows means a previous run fetched the page yet failed to
  // extract (model API down / out of credit / a since-fixed bug); we must RETRY,
  // not skip it forever. The hash is persisted only AFTER a successful extraction
  // (below), so a failed/empty run never poisons the cache.
  let autoApprove = false
  let pageHashValue: string | null = null
  if (writer) {
    const state = await getSourceState(writer, src.companySlug)
    autoApprove = state?.auto_approve ?? false
    pageHashValue = pageHash(content)
    if (state?.last_hash === pageHashValue && existing.size > 0) {
      console.log(`  · page unchanged since last run, ${existing.size} rows stored — skipping (0 cost)`)
      return { ok: true, line: `· ${src.companySlug}: unchanged` }
    }
    if (state?.last_hash === pageHashValue && existing.size === 0) {
      console.log('  · page unchanged but 0 rows stored — RE-extracting (previous run failed)')
    }
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
  // Surface WHY rows were dropped — essential for diagnosing a source that
  // returns rows but normalizes to zero (almost always a date-format issue).
  if (rejected.length) {
    const sample = rejected.slice(0, 8)
    console.log(`  · rejection reasons (showing ${sample.length}/${rejected.length}):`)
    for (const r of sample) {
      const t = (r.raw.title ?? '?').slice(0, 44)
      console.log(`      - "${t}" [start="${r.raw.start_date ?? ''}" end="${r.raw.end_date ?? ''}"] → ${r.reason}`)
    }
  }

  // Persist the page hash ONLY now that extraction yielded usable productions —
  // so a failed/empty run (0 productions) is retried on the next pass instead of
  // being wrongly cached as "unchanged". This is what lets a re-run skip the
  // companies that already succeeded while re-attempting the ones that didn't.
  if (writer && pageHashValue && kept.length > 0) {
    await saveSourceState(writer, src.companySlug, { last_hash: pageHashValue })
  }

  // TRUST GUARD — see isFailedExtraction() doc comment. A zero-extraction run
  // must never reach diffRun(): diffRun cannot distinguish "this house has
  // nothing this run" from "the crawl broke", and would mark every published
  // row for this source as cancelled.
  if (isFailedExtraction(kept.length, existing.size)) {
    console.warn(
      `  ! extraction returned 0 productions but ${existing.size} row(s) already exist for this source ` +
        `— treating as a FAILED crawl, not a mass cancellation. No rows changed.`
    )
    return { ok: false, line: `⚠️ ${src.companySlug}: extraction failed (0 productions, ${existing.size} preserved)` }
  }

  // Provenance per production row.
  const base = new Map<string, Pick<IngestPerformance, 'source_url' | 'content_hash' | 'confidence'>>()
  for (const v of kept) base.set(v.id, { source_url: src.url, content_hash: contentHash(v), confidence })

  // Resolve entities + enrich performances.
  const resolved = resolveEntities(companies, kept, base)

  // Diff against the DB snapshot for this source (empty offline → all 'new').
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
  // CRITICAL: write ONLY changed rows. An 'unchanged' row already exists in the
  // DB exactly as-is; re-upserting it would reset its review_status back to
  // 'pending' (toRow always stamps 'pending'), silently UN-PUBLISHING rows the
  // owner already approved — the root cause of the live site going empty after a
  // re-crawl. Skipping unchanged rows preserves their published state.
  const changed = rows.filter((r) => r.change_kind !== 'unchanged')
  await upsertEntities(writer, resolved)
  const writtenIds = await writePending(writer, changed)
  await upsertCredits(writer, resolved.credits)
  await markCancelledPending(writer, cancelled.map((c) => c.id))
  console.log(
    `  ↑ wrote ${writtenIds.length} pending rows (+${cancelled.length} cancelled, ` +
      `${rows.length - changed.length} unchanged preserved) to Supabase`
  )

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
        kind: r.kind,
        price: r.price_range,
        confidence: r.confidence,
      })),
      ...cancelled.map((c) => ({ change_kind: 'cancelled', title: c.id, start_date: c.start_date, end_date: c.end_date })),
    ]
    let messageId: string | null = null
    if (chatId) {
      const companyName = companies.find((c) => c.slug === src.companySlug)?.name ?? src.companySlug
      const text = formatDigest({ companyName, runId, batchId, lines, sourceUrl: src.url, confidence })
      try {
        messageId = await sendDigest(chatId, text, batchId, src.url)
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

  // Trust guard: 0 extracted + published rows already present must be flagged
  // as a failed crawl BEFORE it ever reaches diffRun — never as a mass cancel.
  const guardOk =
    isFailedExtraction(0, 4) === true &&
    isFailedExtraction(0, 0) === false &&
    isFailedExtraction(3, 4) === false
  console.log(
    guardOk
      ? '  ✓ zero-extraction guard blocks a false mass-cancellation'
      : '  ✗ zero-extraction guard FAILED'
  )
  if (!ok || !guardOk) process.exit(1)
}

const badge = (k?: string) =>
  k === 'new' ? '+ NEW   ' : k === 'date-changed' ? '~ DATE  ' : k === 'price-changed' ? '~ PRICE ' : k === 'cancelled' ? '✗ CANCEL' : '· same  '
const msg = (e: unknown): string => {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e !== null) {
    const o = e as Record<string, unknown>
    return (o.message as string) ?? (o.code as string) ?? JSON.stringify(e)
  }
  return String(e)
}

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
      `Usage: tsx scripts/ingest/run-ingest.ts --all [--fixture|--live|--local]\n` +
        `       tsx scripts/ingest/run-ingest.ts --source <name> [--fixture|--live|--local]\n` +
        `       tsx scripts/ingest/run-ingest.ts --selftest\n\n` +
        `  --local  extract from HTML you saved into scripts/ingest/.local/<slug>.html\n` +
        `           (your own browser fetched it → no datacenter-IP 403). Writes\n` +
        `           pending rows for Telegram approval, exactly like --live.\n\n` +
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
  if (args.live || args.local) {
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
