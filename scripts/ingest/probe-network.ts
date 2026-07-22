/**
 * Network probe — find the JSON/XHR endpoint a JS-widget house loads its
 * schedule from, the way ABT's admin-ajax was found, but automatically.
 *
 *   npm run probe:network                         # all SPA houses
 *   npm run probe:network -- --slug wiener-staatsoper
 *
 * WHY THIS EXISTS
 * The remaining no-data houses (Vienna, Tokyo, NNTT, Copenhagen, Paris, …)
 * render a near-empty HTML shell and fetch their performances from a private
 * JSON API after load — so there's nothing in the served HTML to extract.
 * Finding that API is the ABT investigation repeated per house; doing it by
 * hand in DevTools is the round-trip bottleneck. This launches the real page,
 * records every network response, and prints the ones that look like the
 * schedule data (JSON, non-trivial size, date/event-shaped body) — the exact
 * URL to wire as a deterministic source.
 *
 * READ-ONLY. Run from YOUR machine (datacenter IPs get 403). Uses your system
 * Chrome via the same resolver the crawl uses.
 */
import { config } from 'dotenv'
import { findSystemChrome } from './fetch-browser'

config({ path: '.env.local' })

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** SPA houses whose data arrives via XHR (confirmed 0-in-HTML by the crawl). */
const TARGETS: Record<string, string> = {
  'wiener-staatsoper': 'https://www.wiener-staatsoper.at/en/performance-plan/season/',
  'wiener-staatsballett': 'https://www.wiener-staatsballett.at/spielplan/',
  'tokyo-ballet': 'https://www.thetokyoballet.com/performances/',
  'new-national-theatre-tokyo': 'https://www.nntt.jac.go.jp/english/opera/schedule/',
  'royal-danish-ballet': 'https://kglteater.dk/en/programme/dance-and-ballet',
  'national-ballet-of-canada': 'https://national.ballet.ca/performances/',
  'dutch-national-ballet': 'https://www.operaballet.nl/en/ballet/season',
  'paris-opera-ballet': 'https://www.operadeparis.fr/en/season/ballet',
}

/** Third-party noise never worth reporting. */
const NOISE = /google|gtm|gtag|facebook|doubleclick|analytics|cookie|consent|sentry|hotjar|cdn\.jsdelivr|fonts\.|recaptcha|onetrust|cookiebot|tiktok|linkedin|adservice|snowplow|segment|datadog|newrelic/i

/** URL hints that a request is the listing data feed. */
const DATA_HINT = /\.json|\/api\/|graphql|feed|calendar|event|performance|spielplan|schedule|programme|season|production|repertoire|tnew|tessitura/i

interface Hit {
  url: string
  type: string
  size: number
  dateHits: number
}

async function probeOne(slug: string, url: string): Promise<void> {
  const specifier = 'playwright'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pw: any
  try {
    pw = await import(specifier)
  } catch {
    console.log(`▌ ${slug}\n   ! Playwright not installed (npm install -D playwright)\n`)
    return
  }

  const executablePath = findSystemChrome()
  const browser = await pw.chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
  const hits: Hit[] = []
  const seen = new Set<string>()
  try {
    const ctx = await browser.newContext({ userAgent: UA, locale: 'en-US', viewport: { width: 1280, height: 1800 } })
    const page = await ctx.newPage()

    page.on('response', async (res: any) => {
      try {
        const u: string = res.url()
        const ct = (res.headers()['content-type'] ?? '').toLowerCase()
        if (NOISE.test(u)) return
        const looksData = ct.includes('json') || DATA_HINT.test(u)
        if (!looksData) return
        if (seen.has(u.split('?')[0] + ct)) return
        const body: string = await res.text().catch(() => '')
        if (body.length < 200) return
        // Count schedule-shaped signals in the body.
        const dateHits = (body.match(/\d{4}-\d{2}-\d{2}|"(date|start|startDate|performances|events|productions)"/gi) ?? []).length
        seen.add(u.split('?')[0] + ct)
        hits.push({ url: u, type: ct.split(';')[0] || '?', size: body.length, dateHits })
      } catch {
        /* ignore per-response failures */
      }
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(6000) // let post-load XHRs fire
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {})
    await page.waitForTimeout(3000)
  } catch (err) {
    console.log(`▌ ${slug}\n   ! ${err instanceof Error ? err.message : String(err)}\n`)
    await browser.close().catch(() => {})
    return
  }
  await browser.close().catch(() => {})

  // Rank: schedule-shaped bodies first, then by size.
  hits.sort((a, b) => (b.dateHits - a.dateHits) || (b.size - a.size))
  console.log(`▌ ${slug}`)
  if (!hits.length) {
    console.log('   (no JSON/data responses captured — may need auth, a click, or a different page)\n')
    return
  }
  for (const h of hits.slice(0, 8)) {
    const flag = h.dateHits >= 5 ? '⭐ likely schedule' : h.dateHits > 0 ? '· has dates' : ''
    console.log(`   [${h.dateHits} date-hits, ${h.size} bytes, ${h.type}] ${flag}`)
    console.log(`     ${h.url.length > 160 ? h.url.slice(0, 160) + '…' : h.url}`)
  }
  console.log('')
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const only = argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null
  const entries = Object.entries(TARGETS).filter(([slug]) => !only || slug === only)
  console.log(`Capturing network for ${entries.length} house(s)… (⭐ = the endpoint to wire)\n`)
  for (const [slug, url] of entries) {
    await probeOne(slug, url)
  }
  console.log('Paste the ⭐/date-hit URLs back — those are the schedule APIs to implement.')
}

main().catch((e) => {
  console.error('probe-network crashed:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
