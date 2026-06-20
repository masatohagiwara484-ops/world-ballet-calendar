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
    // Use the system Chrome when available — avoids the Playwright CDN download.
    ...(executablePath ? { executablePath } : {}),
  })
  try {
    const context = await browser.newContext({
      userAgent: opts.ua ?? DEFAULT_UA,
      locale: 'en-US',
      viewport: { width: 1280, height: 1800 },
    })
    const page = await context.newPage()
    const res = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: opts.timeoutMs ?? 30_000,
    })

    const status = res?.status() ?? 0
    if (status === 403 || status === 429) {
      throw new Error(`blocked (HTTP ${status}) — not bypassing; treat this house as Tier C`)
    }

    if (opts.waitForSelector) {
      await page.waitForSelector(opts.waitForSelector, { timeout: 10_000 }).catch(() => {})
    }

    const html: string = await page.content()
    if (CHALLENGE_RE.test(html)) {
      throw new Error('bot-challenge interstitial detected — not bypassing; treat this house as Tier C')
    }
    return html
  } finally {
    await browser.close()
  }
}
