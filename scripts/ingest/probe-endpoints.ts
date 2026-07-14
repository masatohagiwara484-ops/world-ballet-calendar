/**
 * Endpoint probe — the "how does this house serve its data" triage, batched.
 *
 *   npm run probe:endpoints              # probe every no-data / low-quality house
 *   npm run probe:endpoints -- --slug national-ballet-of-canada
 *
 * WHY THIS EXISTS
 * The ABT breakthrough took many manual round-trips (fetch → inspect <main> →
 * find admin-ajax → read calendar.js → discover params). That investigation is
 * the SAME for every JS-widget house; only the parameters differ. This script
 * runs that whole triage for every listed house in ONE pass and prints, per
 * house, which extraction PATTERN it needs:
 *
 *   feed      → an official iCal/RSS/JSON-LD feed is present            (deterministic)
 *   wp-ajax   → WordPress admin-ajax.php calendar (ABT's pattern)       (deterministic)
 *   tribe     → The Events Calendar REST at /wp-json/tribe/events/v1    (deterministic)
 *   jsonld    → schema.org Event objects embedded in the page           (deterministic)
 *   html/LLM  → real listing text is in the served HTML                 (current LLM path)
 *   spa       → near-empty HTML; data loads via some XHR — needs a look (render/XHR)
 *
 * IMPORTANT — run from YOUR machine, not a datacenter. Many houses 403 a
 * datacenter IP but serve a normal browser. This probe is READ-ONLY: it only
 * fetches pages a browser would and reads them for data-source signatures.
 */
import { config } from 'dotenv'
import * as cheerio from 'cheerio'
import { renderPage } from './fetch-browser'

config({ path: '.env.local' })

const UA =
  process.env.PROBE_UA ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** The houses to triage: every one that has no data or known quality issues.
 *  (Deterministic, already-clean houses — Met, ABT — are intentionally omitted.) */
const TARGETS: Record<string, string> = {
  'national-ballet-of-canada': 'https://national.ballet.ca/performances/',
  'new-national-theatre-tokyo': 'https://www.nntt.jac.go.jp/english/opera/schedule/',
  'dutch-national-ballet': 'https://www.operaballet.nl/en/ballet/season',
  'royal-danish-ballet': 'https://kglteater.dk/en/programme/dance-and-ballet',
  'wiener-staatsoper': 'https://www.wiener-staatsoper.at/en/performance-plan/season/',
  'wiener-staatsballett': 'https://www.wiener-staatsballett.at/spielplan/',
  'tokyo-ballet': 'https://www.thetokyoballet.com/performances/',
  'paris-opera-ballet': 'https://www.operadeparis.fr/en/season/ballet',
  'opera-national-de-paris': 'https://www.operadeparis.fr/en/season/operas',
  'bayerische-staatsoper': 'https://www.staatsoper.de/en/performances.html',
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

/**
 * Render with real Chrome (the SAME path the crawl uses), NOT plain fetch: these
 * houses return 404/403 to a bare fetch but serve a normal browser. paginate is
 * off — we only need the first-screen DOM to read data-source signatures, not
 * the whole exhausted listing. External <script> bodies (e.g. a theme's
 * calendar.js) aren't inlined by page.content(), so an admin-ajax action name
 * living in an external file won't show; detecting admin-ajax + FullCalendar is
 * still enough to classify the pattern.
 */
async function get(url: string): Promise<{ status: number | string; body: string }> {
  try {
    const body = await renderPage(url, { ua: UA, paginate: false, timeoutMs: 45000 })
    return { status: 200, body }
  } catch (err) {
    const m = msg(err)
    const code = /HTTP (\d+)/.exec(m)?.[1]
    return { status: code ? Number(code) : m, body: '' }
  }
}

interface Signals {
  bodyTextLen: number
  fullcalendar: boolean
  adminAjax: boolean
  ajaxActions: string[]
  tribe: boolean
  wpJson: boolean
  spektrix: boolean
  tessitura: boolean
  jsonLdEvents: number
  icalHrefs: string[]
}

function scan(html: string): Signals {
  const $ = cheerio.load(html)
  const scripts = $('script').text()

  // JSON-LD Event objects.
  let jsonLdEvents = 0
  $('script[type="application/ld+json"]').each((_, el) => {
    if (/"@type"\s*:\s*"(?:[A-Za-z]*Event|Festival)"/.test($(el).contents().text())) jsonLdEvents++
  })

  // admin-ajax action names (the ABT pattern's key: action=get_calendar_events).
  const ajaxActions = new Set<string>()
  for (const m of html.matchAll(/action['"=:\s]+([a-z][a-z0-9_]*(?:event|calendar|performance|show|program)[a-z0-9_]*)/gi)) {
    ajaxActions.add(m[1])
  }

  // .ics / webcal calendar links.
  const icalHrefs = new Set<string>()
  $('a[href], link[href]').each((_, el) => {
    const h = ($(el).attr('href') ?? '').toLowerCase()
    if (h.endsWith('.ics') || h.startsWith('webcal:') || h.includes('format=ical')) icalHrefs.add(h)
  })

  const hay = html + scripts
  return {
    bodyTextLen: $('body').text().replace(/\s+/g, ' ').trim().length,
    fullcalendar: /fullcalendar|fullCalendar|fc-event|fc-view/i.test(hay),
    adminAjax: /admin-ajax\.php/i.test(hay),
    ajaxActions: [...ajaxActions].slice(0, 6),
    tribe: /wp-json\/tribe|tribe_events|the-events-calendar|tribe-events/i.test(hay),
    wpJson: /\/wp-json\//i.test(hay),
    spektrix: /spektrix/i.test(hay),
    tessitura: /tessitura|tnew/i.test(hay),
    jsonLdEvents,
    icalHrefs: [...icalHrefs].slice(0, 3),
  }
}

/** Best-guess extraction pattern from the signals. */
function verdict(s: Signals): string {
  if (s.jsonLdEvents > 0) return `jsonld (${s.jsonLdEvents} Event objects) — deterministic`
  if (s.icalHrefs.length) return `feed:ical — deterministic`
  if (s.adminAjax && (s.fullcalendar || s.ajaxActions.length)) {
    const act = s.ajaxActions[0] ? ` action~"${s.ajaxActions[0]}"` : ''
    return `wp-ajax (ABT pattern${act}) — deterministic; discover its filter params`
  }
  if (s.tribe) return `tribe (The Events Calendar REST /wp-json/tribe/events/v1/events) — deterministic`
  if (s.spektrix) return `spektrix ticketing API — deterministic (per-house instance name)`
  if (s.tessitura) return `tessitura/TNEW — usually needs render`
  if (s.bodyTextLen < 3000) return `spa — HTML near-empty (${s.bodyTextLen} chars); data loads via XHR, needs a look`
  return `html/LLM — real listing text present (${s.bodyTextLen} chars); current LLM path should work`
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const only = argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null
  const entries = Object.entries(TARGETS).filter(([slug]) => !only || slug === only)

  console.log(`Probing ${entries.length} house(s) from your IP…\n`)
  for (const [slug, url] of entries) {
    const { status, body } = await get(url)
    if (typeof status !== 'number' || status >= 400 || !body) {
      console.log(`▌ ${slug}\n   ⚠ ${status}${status === 403 ? ' (bot-blocked — try the page in your browser)' : ''}\n`)
      await sleep(700)
      continue
    }
    const s = scan(body)
    console.log(`▌ ${slug}  (HTTP ${status})`)
    console.log(`   → ${verdict(s)}`)
    const flags = [
      s.fullcalendar && 'FullCalendar',
      s.adminAjax && 'admin-ajax',
      s.tribe && 'tribe',
      s.wpJson && 'wp-json',
      s.spektrix && 'spektrix',
      s.tessitura && 'tessitura',
      s.jsonLdEvents && `${s.jsonLdEvents} JSON-LD`,
    ].filter(Boolean)
    console.log(`   signals: ${flags.length ? flags.join(', ') : '(none)'}  ·  body ${s.bodyTextLen} chars`)
    if (s.ajaxActions.length) console.log(`   ajax actions seen: ${s.ajaxActions.join(', ')}`)
    if (s.icalHrefs.length) console.log(`   ical: ${s.icalHrefs.join('  ')}`)
    console.log('')
    await sleep(700)
  }
  console.log('Paste this whole output back to decide each house\'s implementation.')
}

main().catch((e) => {
  console.error('probe-endpoints crashed:', msg(e))
  process.exit(1)
})
