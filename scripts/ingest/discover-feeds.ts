/**
 * Feed discovery — the "per-house research" automated.
 *
 *   npm run discover:feeds            # probe every company, write docs/FEED_DISCOVERY.md
 *   npm run discover:feeds -- --slug royal-ballet   # probe one house
 *
 * WHY THIS EXISTS
 * The data-acquisition strategy (see the plan) is feed-first and legality-first:
 * we only ingest a house through an OFFICIAL machine feed (iCal / RSS / public
 * JSON-LD) — never by evading bot protection. The bottleneck was the human work
 * of opening 25+ sites and hunting for a feed. This script does that hunt
 * automatically and prints a `docs/SOURCES.md`-ready verdict per house:
 *
 *   Tier A  → an official feed was found (iCal/RSS/JSON-LD) → ingestible now
 *   none    → no public feed → needs Tier C (official partnership) or skip
 *
 * IMPORTANT — run this from YOUR machine, not a datacenter.
 * Many houses (Cloudflare etc.) return 403 to datacenter IPs but serve a normal
 * browser. Running locally with a browser User-Agent sees what your browser sees.
 * This probe is READ-ONLY and only reads pages a browser would; the actual
 * ingestion still respects robots.txt and uses the WorldBalletCalendarBot UA.
 */
import { config } from 'dotenv'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as cheerio from 'cheerio'
import { companies } from '../../src/data/companies'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

/** A real browser UA so a local run sees what the operator's browser sees. */
const UA =
  process.env.DISCOVER_UA ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const FETCH_TIMEOUT_MS = 15000
const POLITENESS_MS = 800

interface Finding {
  slug: string
  name: string
  website: string
  reachable: boolean
  status: number | string
  rss: string[]
  ical: string[]
  jsonLdEvents: number
  /** The page where a feed / JSON-LD events were found — register THIS as the
   *  ingest listing URL (not the bare homepage). */
  listingUrl: string
  robots: 'allows' | 'restricted' | 'blocked' | 'unknown'
  sitemaps: string[]
  tier: 'A' | '—'
  note: string
}

/**
 * Common "what's-on" page paths to probe beyond the homepage. The real feed /
 * JSON-LD almost always lives on the season/calendar page, not the front page —
 * scanning only the homepage is why an earlier run found feeds on just 3/22
 * houses. Localised variants cover EN + DE/FR-style sites.
 */
const LISTING_PATHS = [
  '/whats-on',
  '/what-s-on',
  '/calendar',
  '/season',
  '/events',
  '/performances',
  '/programme',
  '/schedule',
  '/en/whats-on',
  '/en/calendar',
  '/en/season',
  '/spielplan',
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

async function get(url: string): Promise<{ ok: boolean; status: number | string; body: string }> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en;q=0.9',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    const body = await res.text().catch(() => '')
    return { ok: res.ok, status: res.status, body }
  } catch (err) {
    return { ok: false, status: msg(err), body: '' }
  } finally {
    clearTimeout(t)
  }
}

/** Absolute-ize a possibly-relative href against the page URL. */
function abs(href: string, base: string): string {
  try {
    return new URL(href, base).toString()
  } catch {
    return href
  }
}

/** Parse a robots.txt body for the `*` group + sitemaps. */
function readRobots(body: string): { robots: Finding['robots']; sitemaps: string[] } {
  const sitemaps = [...body.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1])
  // Walk groups; capture Disallow lines under User-agent: * (and global).
  const lines = body.split(/\r?\n/)
  let inStar = false
  let disallowsRoot = false
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim()
    if (!line) continue
    const ua = /^user-agent:\s*(.+)$/i.exec(line)
    if (ua) {
      inStar = ua[1].trim() === '*'
      continue
    }
    if (inStar) {
      const dis = /^disallow:\s*(.*)$/i.exec(line)
      if (dis && (dis[1].trim() === '/' )) disallowsRoot = true
    }
  }
  return { robots: disallowsRoot ? 'restricted' : 'allows', sitemaps }
}

/** Scan a page's HTML for feed signals. */
function scanHtml(html: string, pageUrl: string): Pick<Finding, 'rss' | 'ical' | 'jsonLdEvents'> {
  const $ = cheerio.load(html)
  const rss = new Set<string>()
  const ical = new Set<string>()

  // <link rel="alternate" type="application/rss+xml|atom+xml">
  $('link[rel="alternate"]').each((_, el) => {
    const type = ($(el).attr('type') ?? '').toLowerCase()
    const href = $(el).attr('href')
    if (href && (type.includes('rss') || type.includes('atom'))) rss.add(abs(href, pageUrl))
  })
  // Any anchor/link to an .ics or webcal feed ("add to calendar").
  $('a[href], link[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const low = href.toLowerCase()
    if (low.endsWith('.ics') || low.startsWith('webcal:') || low.includes('.ics?') || low.includes('format=ical')) {
      ical.add(abs(href, pageUrl))
    }
    if (low.includes('/feed') && (low.includes('rss') || low.endsWith('/feed') || low.endsWith('/feed/'))) {
      rss.add(abs(href, pageUrl))
    }
  })

  // JSON-LD blocks mentioning an Event-like @type.
  let jsonLdEvents = 0
  $('script[type="application/ld+json"]').each((_, el) => {
    const txt = $(el).contents().text()
    if (/"@type"\s*:\s*"(?:[A-Za-z]*Event|Festival|TheaterEvent|DanceEvent|MusicEvent)"/.test(txt)) {
      jsonLdEvents++
    }
  })

  return { rss: [...rss], ical: [...ical], jsonLdEvents }
}

async function probe(slug: string, name: string, website: string): Promise<Finding> {
  const f: Finding = {
    slug,
    name,
    website,
    reachable: false,
    status: '',
    rss: [],
    ical: [],
    jsonLdEvents: 0,
    listingUrl: '',
    robots: 'unknown',
    sitemaps: [],
    tier: '—',
    note: '',
  }

  // robots.txt (best-effort; informs the legality column).
  try {
    const origin = new URL(website).origin
    const r = await get(`${origin}/robots.txt`)
    if (typeof r.status === 'number' && r.status === 403) f.robots = 'blocked'
    else if (r.ok && r.body) Object.assign(f, readRobots(r.body))
  } catch {
    /* ignore */
  }

  await sleep(POLITENESS_MS)

  // Scan the homepage first, then the common "what's-on" pages. The first page
  // that yields a real feed (or JSON-LD events) becomes the listing URL — that
  // is the page the ingest pipeline should fetch.
  const origin = (() => {
    try {
      return new URL(website).origin
    } catch {
      return website.replace(/\/$/, '')
    }
  })()
  const pagesToScan = [website, ...LISTING_PATHS.map((p) => origin + p)]

  for (const pageUrl of pagesToScan) {
    const page = await get(pageUrl)
    // The homepage result sets the house's reachability/status.
    if (pageUrl === website) {
      f.status = page.status
      f.reachable = page.ok
    }
    if (page.ok && page.body) {
      const s = scanHtml(page.body, pageUrl)
      const before = f.ical.length + f.rss.length + f.jsonLdEvents
      f.rss.push(...s.rss)
      f.ical.push(...s.ical)
      f.jsonLdEvents += s.jsonLdEvents
      const after = f.ical.length + f.rss.length + f.jsonLdEvents
      if (after > before && !f.listingUrl) f.listingUrl = pageUrl
      // A real iCal/RSS feed is conclusive — stop hunting more pages.
      if (f.ical.length > 0 || f.rss.length > 0) break
    }
    await sleep(POLITENESS_MS)
  }

  f.rss = [...new Set(f.rss)]
  f.ical = [...new Set(f.ical)]

  const hasFeed = f.ical.length > 0 || f.rss.length > 0 || f.jsonLdEvents > 0
  f.tier = hasFeed ? 'A' : '—'
  if (!f.reachable) {
    f.note = f.robots === 'blocked' || f.status === 403 ? 'bot-blocked (403) — try in your browser; else Tier C' : `unreachable (${f.status})`
  } else if (hasFeed) {
    const kinds = [f.ical.length && 'iCal', f.rss.length && 'RSS', f.jsonLdEvents && 'JSON-LD'].filter(Boolean)
    f.note = `feed found: ${kinds.join(', ')}${f.listingUrl && f.listingUrl !== website ? ` on ${f.listingUrl}` : ''}`
  } else {
    f.note = 'reachable, no feed on homepage or common listing paths — try the real season page in your browser, else Tier C'
  }
  return f
}

function tableRow(f: Finding): string {
  const feed = f.ical[0] ?? f.rss[0] ?? (f.jsonLdEvents ? `JSON-LD on ${f.listingUrl || 'page'}` : '—')
  return `| ${f.name} | ${f.tier} | ${feed} | ${f.robots} | ${f.note} |`
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const slugArg = argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null

  // Unique by website (RBO/Paris/Bolshoi each appear twice across ballet+opera).
  const seen = new Set<string>()
  const targets = companies.filter((c): c is typeof c & { website: string } => {
    if (!c.website) return false
    if (slugArg && c.slug !== slugArg) return false
    if (seen.has(c.website)) return false
    seen.add(c.website)
    return true
  })

  console.log(`Probing ${targets.length} sites with browser UA…\n`)
  const findings: Finding[] = []
  for (const c of targets) {
    process.stdout.write(`  · ${c.slug} … `)
    const f = await probe(c.slug, c.name, c.website)
    findings.push(f)
    console.log(`${f.tier === 'A' ? '✅ FEED' : f.reachable ? '— none' : '⚠ ' + f.status}  (${f.note})`)
    await sleep(POLITENESS_MS)
  }

  const withFeed = findings.filter((f) => f.tier === 'A')
  const blocked = findings.filter((f) => !f.reachable)

  const report =
    `# Feed Discovery Report\n\n` +
    `Generated by \`npm run discover:feeds\` — an automated, READ-ONLY probe of each\n` +
    `house for an official machine feed (iCal / RSS / JSON-LD). Run from a normal\n` +
    `network; datacenter IPs get 403 from many houses.\n\n` +
    `**${withFeed.length}/${findings.length}** houses expose a feed on their homepage\n` +
    `or a common what's-on page. Houses marked \`bot-blocked\` should be re-checked\n` +
    `from your browser — the feed may exist but the probe's network was refused.\n\n` +
    `| Company | Tier | Feed (or signal) | robots | Note |\n` +
    `|---|---|---|---|---|\n` +
    findings.map(tableRow).join('\n') +
    `\n\n## Houses ready to ingest now (Tier A)\n\n` +
    `Paste these into the engineer/AI to wire each as a source. \`kind\` is the\n` +
    `extractor; \`url\` is the listing page to fetch.\n\n` +
    (withFeed.length
      ? withFeed
          .map((f) => {
            const kind = f.ical.length ? 'ical' : f.rss.length ? 'rss' : 'jsonld'
            const url = f.ical[0] ?? f.rss[0] ?? (f.listingUrl || f.website)
            return `- **${f.name}** (\`${f.slug}\`) — kind: \`${kind}\` — url: ${url}`
          })
          .join('\n')
      : '_None detected from this network. Re-run from your browser/residential IP._') +
    `\n\n## Bot-blocked from this run (verify in your browser)\n\n` +
    (blocked.length ? blocked.map((f) => `- ${f.name} (${f.status})`).join('\n') : '_None._') +
    `\n`

  const out = join(__dirname, '..', '..', 'docs', 'FEED_DISCOVERY.md')
  await writeFile(out, report, 'utf8')
  console.log(`\n=== summary ===`)
  console.log(`  feeds found: ${withFeed.length}/${findings.length}`)
  console.log(`  bot-blocked: ${blocked.length}`)
  console.log(`  report written: docs/FEED_DISCOVERY.md`)
}

main().catch((err) => {
  console.error('discover-feeds crashed:', msg(err))
  process.exit(1)
})
