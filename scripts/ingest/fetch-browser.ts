/**
 * Browser-render fetch — for houses whose season listings are JavaScript-
 * rendered (no static feed, no JSON-LD in the initial HTML). A real headless
 * Chrome loads the page exactly as a visitor's browser would, waits for the
 * listings to render, and returns the final HTML for the AI extractor.
 *
 * LEGALITY GUARDRAIL (non-negotiable):
 *   • We render only PUBLIC pages a normal visitor can open from their browser.
 *   • We do NOT solve CAPTCHAs or defeat active bot challenges. If the page is a
 *     Cloudflare-style interstitial or returns 403/429, we ABORT the house — it
 *     becomes Tier C (official partnership), never a target to bypass.
 *   • Every extracted row still passes the human-approval gate.
 *
 * Browser resolution order (first found wins):
 *   1. CHROME_PATH env var (explicit override)
 *   2. Mac system Chrome  (/Applications/Google Chrome.app/…)
 *   3. Mac Chromium       (/Applications/Chromium.app/…)
 *   4. Linux Chrome/Chromium (/usr/bin/google-chrome, /usr/bin/chromium)
 *   5. Playwright's own bundled Chromium (requires: npx playwright install chromium)
 *
 * This means you do NOT need to download Playwright's Chromium if you already
 * have Google Chrome installed on your Mac — the ingest will use that instead.
 * Set CHROME_PATH in .env.local to override on any machine.
 */
import { existsSync } from 'node:fs'

/**
 * Separator injected between the HTML of consecutive URL-paginated pages before
 * they are concatenated and returned. extract-llm.ts splits on this to process
 * each page's <main> independently rather than only seeing the first one.
 */
export const PAGE_BREAK = '<!-- INGEST_PAGE_BREAK -->'

/** A real browser UA so the render sees what the operator's own browser sees. */
const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Signatures of bot-challenge interstitials — if we see one, we stop (never bypass). */
const CHALLENGE_RE =
  /just a moment|checking your browser|cf-challenge|verify you are human|enable javascript and cookies|attention required/i

/** Candidate Chrome/Chromium executables to try, in priority order. */
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  // macOS — Google Chrome (most common on a developer Mac)
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // macOS — Chromium open-source build
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // macOS — Chrome Canary
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]

/**
 * Find the first Chrome/Chromium executable present on this machine.
 * Returns undefined when none is found → Playwright uses its bundled browser.
 */
function findSystemChrome(): string | undefined {
  for (const p of CHROME_CANDIDATES) {
    if (p && existsSync(p)) return p
  }
  return undefined
}

export interface RenderOptions {
  /** Wait until this selector appears (best-effort) — the listings container. */
  waitForSelector?: string
  /** Navigation timeout in ms. */
  timeoutMs?: number
  /** Override the User-Agent. */
  ua?: string
  /** Exhaust pagination (scroll + "load more"/"next") before reading the HTML.
   *  Default true for single-page mode. Ignored when maxPages > 1. */
  paginate?: boolean
  /** Safety cap on scroll/click pagination rounds. */
  maxPaginationRounds?: number
  /**
   * For URL-paginated listings (e.g. ?page=1 … ?page=N): how many pages to
   * load. Each page navigates in the same browser session (cookies/session
   * shared, cookie-consent banner dismissed once on page 1). The HTML from
   * every page is concatenated with PAGE_BREAK markers so the extractor sees
   * the entire listing instead of only page 1.
   * When set, the scroll/click pagination loop is skipped.
   */
  maxPages?: number
  /** URL query-param name for URL pagination (default 'page'). */
  pageParam?: string
}

/** Visible text on a "load more"/"next page" control across common houses. */
const LOAD_MORE_RE =
  /load\s*more|show\s*more|view\s*more|see\s*more|load\s*\d+\s*more|more\s*(results|events|performances|dates)|next(\s*page)?|voir\s*plus|mehr\s*(laden|anzeigen)|afficher\s*plus/i

/** Common cookie-consent "accept" controls (OneTrust, Cookiebot, generic). */
const COOKIE_ACCEPT_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  'button[aria-label*="accept" i]',
  'button[data-testid*="accept" i]',
  '[id*="cookie" i] button',
]
const COOKIE_ACCEPT_TEXT_RE = /accept all|allow all|accept cookies|accept all cookies|i accept|agree|got it|allow cookies/i

/** Dismiss a cookie-consent banner so it can't intercept scroll/click. Best-effort. */
async function dismissCookies(page: any): Promise<boolean> {
  for (const sel of COOKIE_ACCEPT_SELECTORS) {
    try {
      const el = await page.$(sel)
      if (el && (await el.isVisible().catch(() => false))) {
        await el.click({ timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(400)
        return true
      }
    } catch {
      /* keep trying */
    }
  }
  // Text-based fallback (button/anchor whose label looks like an accept control).
  const clicked = await page
    .evaluate((reSrc: string) => {
      const re = new RegExp(reSrc, 'i')
      const els = Array.from(document.querySelectorAll('button, a, [role="button"]')) as HTMLElement[]
      const btn = els.find((e) => re.test((e.textContent || '').trim()) && e.offsetParent !== null)
      if (btn) {
        btn.click()
        return true
      }
      return false
    }, COOKIE_ACCEPT_TEXT_RE.source)
    .catch(() => false)
  if (clicked) await page.waitForTimeout(400)
  return clicked
}

/** Count likely listing/booking anchors — a far better progress signal than raw
 *  HTML length (which barely moves when a few cards are appended). */
async function probeCounts(page: any): Promise<{ links: number; html: number }> {
  return page
    .evaluate(() => ({
      links: document.querySelectorAll(
        'a[href*="ticket" i], a[href*="event" i], a[href*="performance" i], a[href*="production" i], a[href*="whats-on" i]'
      ).length,
      html: document.body.innerHTML.length,
    }))
    .catch(() => ({ links: 0, html: 0 }))
}

/**
 * Exhaust a paginated / infinite-scroll listing: dismiss any cookie banner, then
 * repeatedly scroll to the bottom and click any "load more"/"next" control until
 * the page stops growing (or the round cap is hit). This is purely the same
 * interaction a visitor performs to see the rest of the season — no API/endpoint
 * guessing, no challenge bypass. Logs per-round progress so a failed crawl tells
 * us WHERE it stalled (cookie wall, no pagination control, JS-only nav, …).
 */
async function exhaustListing(page: any, maxRounds: number, debug: boolean): Promise<void> {
  if (await dismissCookies(page)) console.log('  · dismissed cookie-consent banner')

  const before = await probeCounts(page)
  console.log(`  · listing start: ${before.links} booking-links, ${before.html} html chars`)

  let lastLinks = before.links
  let stable = 0
  for (let round = 0; round < maxRounds; round++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {})
    await page.waitForTimeout(700)

    // Prefer a real Playwright click (handles overlays / scroll-into-view) by
    // locating a control whose visible text matches LOAD_MORE_RE.
    let clicked = false
    try {
      const loc = page
        .locator('button, a, [role="button"]')
        .filter({ hasText: LOAD_MORE_RE })
        .first()
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => {})
        await loc.click({ timeout: 2000 })
        clicked = true
      }
    } catch {
      /* fall through to DOM click */
    }
    if (!clicked) {
      clicked = await page
        .evaluate((reSrc: string) => {
          const re = new RegExp(reSrc, 'i')
          const els = Array.from(document.querySelectorAll('button, a, [role="button"]')) as HTMLElement[]
          const btn = els.find(
            (e) =>
              re.test((e.textContent || '').trim()) &&
              e.offsetParent !== null &&
              !(e as HTMLButtonElement).disabled
          )
          if (btn) {
            btn.click()
            return true
          }
          return false
        }, LOAD_MORE_RE.source)
        .catch(() => false)
    }

    await page.waitForTimeout(clicked ? 1500 : 400)

    const now = await probeCounts(page)
    if (debug) console.log(`  · round ${round + 1}: ${now.links} links${clicked ? ' (clicked)' : ''}`)

    if (now.links > lastLinks) {
      lastLinks = now.links
      stable = 0
      continue
    }
    // No growth and nothing left to click → two quiet rounds means we're done.
    if (!clicked && ++stable >= 2) break
  }
  console.log(`  · listing end: ${lastLinks} booking-links after pagination`)
}

/**
 * Navigate with a tolerant strategy. Many house sites hold long-poll / analytics
 * / chat sockets open, so Playwright's 'networkidle' never fires and the old
 * 30s wait timed the whole house out (Paris Opera, ABT, Australian Ballet, Tokyo
 * Ballet all failed this way). Instead we wait for the DOM to be ready (fast and
 * reliable), then give client-side rendering a brief, best-effort window to fetch
 * and paint the listing. Retried once before giving up.
 */
async function gotoResilient(page: any, url: string, opts: RenderOptions): Promise<any> {
  const timeout = opts.timeoutMs ?? 60_000
  let lastErr: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout })
      // Best-effort: let frameworks hydrate and fetch their listing data. Neither
      // wait may fail the navigation — they are capped and swallowed.
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {})
      await page.waitForTimeout(2_000)
      return res
    } catch (err) {
      lastErr = err
      if (attempt < 2) {
        console.log('  · navigation timed out, retrying once…')
        await page.waitForTimeout(1_500)
      }
    }
  }
  throw lastErr
}

/**
 * Navigate each URL-paginated page (?page=1 … ?page=N) in the SAME browser
 * context (so the cookie-consent banner dismissed on page 1 stays gone),
 * capture each page's HTML, and return them concatenated with PAGE_BREAK
 * markers. extract-llm.ts splits on PAGE_BREAK to apply <main> extraction
 * independently to each page — without this, cheerio only sees the first
 * <main> in the concatenated blob and pages 2-N are invisible to the LLM.
 */
async function renderMultiPageUrl(
  context: any,
  baseUrl: string,
  opts: RenderOptions,
  debug: boolean,
): Promise<string> {
  const maxPages = opts.maxPages!
  const pageParam = opts.pageParam ?? 'page'
  const htmlParts: string[] = []
  let cookiesDismissed = false

  for (let p = 1; p <= maxPages; p++) {
    const pageUrlObj = new URL(baseUrl)
    pageUrlObj.searchParams.set(pageParam, String(p))
    const pageUrl = pageUrlObj.toString()

    const page = await context.newPage()
    try {
      const res = await gotoResilient(page, pageUrl, opts)
      const status = res?.status() ?? 0
      if (status === 403 || status === 429) {
        throw new Error(`blocked (HTTP ${status}) on page ${p} — not bypassing; treat this house as Tier C`)
      }

      if (p === 1 && opts.waitForSelector) {
        await page.waitForSelector(opts.waitForSelector, { timeout: 10_000 }).catch(() => {})
      }

      if (!cookiesDismissed) {
        cookiesDismissed = await dismissCookies(page)
        if (cookiesDismissed) {
          console.log('  · dismissed cookie-consent banner')
          await page.waitForTimeout(400)
        }
      }

      const html: string = await page.content()
      if (CHALLENGE_RE.test(html)) {
        throw new Error(`bot-challenge interstitial detected on page ${p} — not bypassing; treat this house as Tier C`)
      }

      const { links } = await probeCounts(page)
      console.log(`  · page ${p}/${maxPages}: ${html.length} chars, ${links} booking-links`)
      htmlParts.push(html)

      if (debug) {
        try {
          const { writeFile, mkdir } = await import('node:fs/promises')
          const host = new URL(baseUrl).hostname.replace(/[^a-z0-9.]+/gi, '-')
          const dir = new URL('./.debug/', import.meta.url)
          await mkdir(dir, { recursive: true })
          const file = new URL(`${host}-p${p}.html`, dir)
          await writeFile(file, html, 'utf8')
          if (p === maxPages) {
            console.log(
              `  · [debug] wrote ${maxPages} page dumps → scripts/ingest/.debug/${host}-p{1..${maxPages}}.html`,
            )
          }
        } catch { /* dump failure must not abort the crawl */ }
      }
    } finally {
      await page.close()
    }

    // Polite pause between pages.
    if (p < maxPages) await new Promise<void>((r) => setTimeout(r, 800))
  }

  return htmlParts.join(`\n${PAGE_BREAK}\n`)
}

/**
 * Render a JS page and return its final HTML. Throws (caught upstream as a
 * per-house skip) when Playwright is absent, the page is blocked, or a challenge
 * interstitial is detected — we surface the reason rather than work around it.
 */
export async function renderPage(url: string, opts: RenderOptions = {}): Promise<string> {
  // Non-literal specifier keeps TypeScript from requiring playwright at compile
  // time — it is an optional local tool, resolved only at runtime.
  const specifier = 'playwright'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pw: any
  try {
    pw = await import(specifier)
  } catch {
    throw new Error(
      'Playwright is not installed. Run:  npm install -D playwright\n' +
        'Then either:\n' +
        '  • npx playwright install chromium  (downloads ~120MB)\n' +
        '  • OR set CHROME_PATH=/path/to/chrome in .env.local (uses your existing Chrome)'
    )
  }

  const executablePath = findSystemChrome()
  if (executablePath) {
    console.log(`  · using system Chrome: ${executablePath}`)
  }

  const browser = await pw.chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  })
  try {
    const context = await browser.newContext({
      userAgent: opts.ua ?? DEFAULT_UA,
      locale: 'en-US',
      viewport: { width: 1280, height: 1800 },
    })

    const debug = !!process.env.INGEST_DEBUG

    // URL-paginated mode: navigate each ?page=N URL in the same session.
    // The result is PAGE_BREAK-separated HTML; extract-llm splits it so every
    // page's <main> is extracted independently.
    if ((opts.maxPages ?? 1) > 1) {
      return await renderMultiPageUrl(context, url, opts, debug)
    }

    // Single-page + scroll/click mode (existing flow).
    const page = await context.newPage()
    const res = await gotoResilient(page, url, opts)

    const status = res?.status() ?? 0
    if (status === 403 || status === 429) {
      throw new Error(`blocked (HTTP ${status}) — not bypassing; treat this house as Tier C`)
    }

    if (opts.waitForSelector) {
      await page.waitForSelector(opts.waitForSelector, { timeout: 10_000 }).catch(() => {})
    }

    if (opts.paginate !== false) {
      await exhaustListing(page, opts.maxPaginationRounds ?? 40, debug)
    }

    const html: string = await page.content()

    if (debug) {
      try {
        const { writeFile, mkdir } = await import('node:fs/promises')
        const host = new URL(url).hostname.replace(/[^a-z0-9.]+/gi, '-')
        const dir = new URL('./.debug/', import.meta.url)
        await mkdir(dir, { recursive: true })
        const file = new URL(`${host}.html`, dir)
        await writeFile(file, html, 'utf8')
        console.log(`  · [debug] wrote rendered HTML (${html.length} chars) → scripts/ingest/.debug/${host}.html`)
      } catch (e) {
        console.warn(`  · [debug] dump failed: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    if (CHALLENGE_RE.test(html)) {
      throw new Error('bot-challenge interstitial detected — not bypassing; treat this house as Tier C')
    }
    return html
  } finally {
    await browser.close()
  }
}
