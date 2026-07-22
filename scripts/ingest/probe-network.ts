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

/** Schedule-shaped signals in a response/hydration body — multiple date formats
 *  (ISO, DD.MM.YYYY, DD/MM/YYYY) plus common EN/DE/FR field names. */
const DATE_RE =
  /\d{4}-\d{2}-\d{2}|\d{2}[./]\d{2}[./]\d{4}|"(date|start|startdate|enddate|performances|events|productions|spielplan|vorstellung|spectacle|repr[ée]sentation|titel|titre|title)"/gi

/** Common cookie-consent accept controls — the schedule XHR often fires only
 *  AFTER consent (Axeptio/OneTrust/Cookiebot/datasign gate it). */
const CONSENT_SELECTORS = [
  '#axeptio_btn_acceptAll',
  '.axeptio_btn_acceptAll',
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  '[data-testid="uc-accept-all-button"]',
  'button[aria-label*="accept" i]',
]
const CONSENT_TEXT =
  /accept all|allow all|accept cookies|tout accepter|j.?accepte|alle akzeptieren|akzeptieren|同意する|すべて(許可|同意)|accepter/i

async function dismissConsent(page: any): Promise<boolean> {
  for (const sel of CONSENT_SELECTORS) {
    try {
      const el = await page.$(sel)
      if (el && (await el.isVisible().catch(() => false))) {
        await el.click({ timeout: 2000 }).catch(() => {})
        return true
      }
    } catch {
      /* keep trying */
    }
  }
  return page
    .evaluate((re: string) => {
      const rx = new RegExp(re, 'i')
      const els = Array.from(document.querySelectorAll('button, a, [role="button"]')) as HTMLElement[]
      const btn = els.find((e) => rx.test((e.textContent || '').trim()) && e.offsetParent !== null)
      if (btn) {
        btn.click()
        return true
      }
      return false
    }, CONSENT_TEXT.source)
    .catch(() => false)
}

/** Pull embedded hydration JSON out of the rendered DOM (Next/Nuxt/Apollo/ld+json
 *  and any application/json script) — many SPAs ship the season in the HTML, not
 *  a separate XHR. Returns per-blob size + whether it holds date-shaped data. */
async function captureHydration(page: any): Promise<{ name: string; size: number; dateHits: number }[]> {
  return page
    .evaluate((reSrc: string) => {
      const rx = new RegExp(reSrc, 'gi')
      const out: { name: string; size: number; dateHits: number }[] = []
      const test = (name: string, text: string | null | undefined) => {
        if (!text || text.length < 200) return
        out.push({ name, size: text.length, dateHits: (text.match(rx) ?? []).length })
      }
      test('__NEXT_DATA__', document.getElementById('__NEXT_DATA__')?.textContent)
      for (const k of ['__NUXT__', '__INITIAL_STATE__', '__APOLLO_STATE__']) {
        const v = (window as any)[k]
        if (v) {
          try {
            test(`window.${k}`, JSON.stringify(v))
          } catch {
            /* circular — skip */
          }
        }
      }
      document.querySelectorAll('script[type="application/json"]').forEach((s, i) => {
        test(`script[json]#${(s as HTMLElement).id || i}`, s.textContent)
      })
      document.querySelectorAll('script[type="application/ld+json"]').forEach((s, i) => {
        test(`ld+json#${i}`, s.textContent)
      })
      return out
    }, DATE_RE.source)
    .catch(() => [])
}

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
  let hydration: { name: string; size: number; dateHits: number }[] = []
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
        const dateHits = (body.match(DATE_RE) ?? []).length
        seen.add(u.split('?')[0] + ct)
        hits.push({ url: u, type: ct.split(';')[0] || '?', size: body.length, dateHits })
      } catch {
        /* ignore per-response failures */
      }
    })

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(2500)
    // The schedule XHR is often gated behind cookie consent — accept, then wait
    // again so the now-unblocked request fires and is captured.
    const consented = await dismissConsent(page)
    if (consented) await page.waitForTimeout(1000)
    await page.waitForTimeout(5000) // let post-load / post-consent XHRs fire
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {})
    await page.waitForTimeout(3000)
    hydration = await captureHydration(page)
  } catch (err) {
    console.log(`▌ ${slug}\n   ! ${err instanceof Error ? err.message : String(err)}\n`)
    await browser.close().catch(() => {})
    return
  }
  await browser.close().catch(() => {})

  // Rank: schedule-shaped bodies first, then by size.
  hits.sort((a, b) => (b.dateHits - a.dateHits) || (b.size - a.size))
  console.log(`▌ ${slug}`)
  if (!hits.length && !hydration.length) {
    console.log('   (no JSON/data responses captured — may need auth, a click, or a different page)\n')
    return
  }
  for (const h of hits.slice(0, 8)) {
    const flag = h.dateHits >= 5 ? '⭐ likely schedule (XHR)' : h.dateHits > 0 ? '· has dates' : ''
    console.log(`   [${h.dateHits} date-hits, ${h.size} bytes, ${h.type}] ${flag}`)
    console.log(`     ${h.url.length > 160 ? h.url.slice(0, 160) + '…' : h.url}`)
  }
  // Embedded hydration blobs (data shipped in the HTML, no separate XHR).
  hydration.sort((a, b) => b.dateHits - a.dateHits)
  for (const h of hydration.filter((x) => x.dateHits > 0).slice(0, 4)) {
    const flag = h.dateHits >= 5 ? '⭐ likely schedule (in-HTML)' : '· has dates (in-HTML)'
    console.log(`   [${h.dateHits} date-hits, ${h.size} bytes, ${h.name}] ${flag}`)
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
