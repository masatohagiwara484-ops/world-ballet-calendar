/**
 * Debug-dump inspector — turns a 700k-char rendered HTML dump into a small,
 * pasteable report so we can see EXACTLY how a listing paginates and how a card
 * is structured (the two things needed to fix the crawl / write an adapter).
 *
 *   npx tsx scripts/ingest/inspect-dump.ts
 *   npx tsx scripts/ingest/inspect-dump.ts scripts/ingest/.debug/www.rbo.org.uk.html
 *
 * Prints: <main> presence + text length, candidate card-container counts,
 * pagination controls (class/id/aria/text matching page|next|load-more|…), the
 * unique event-link hrefs, and the outerHTML of the first likely event card.
 * Nothing is sent anywhere — it only reads the local dump.
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as cheerio from 'cheerio'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEBUG_DIR = join(__dirname, '.debug')

async function resolvePath(arg?: string): Promise<string> {
  if (arg) return arg
  const files = await readdir(DEBUG_DIR).catch(() => [] as string[])
  const html = files.filter((f) => f.endsWith('.html'))
  if (html.length === 0) {
    throw new Error(`No dump found in ${DEBUG_DIR}. Run: INGEST_DEBUG=1 npm run ingest -- --source <name> --live`)
  }
  return join(DEBUG_DIR, html[0])
}

function trunc(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n)}…` : t
}

async function main(): Promise<void> {
  const path = await resolvePath(process.argv[2])
  const html = await readFile(path, 'utf8')
  const $ = cheerio.load(html)
  $('script, style, noscript, svg').remove()

  console.log(`\n=== inspecting ${path} (${html.length} chars) ===\n`)

  // 1) main / body text size — explains how much the extractor actually sees.
  const main = $('main').first()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  console.log(`<main> present: ${main.length > 0}`)
  console.log(`<main> text length: ${main.length ? main.text().replace(/\s+/g, ' ').trim().length : 0}`)
  console.log(`<body> text length: ${bodyText.length}`)

  // 2) Pagination controls — the crux. Anything that looks like page nav.
  console.log(`\n--- pagination candidates ---`)
  const pagRe = /page|next|prev|load[\s-]*more|show[\s-]*more|pagination|paging|more\b/i
  const seenPag = new Set<string>()
  $('a, button, [role="button"], nav, ul, li').each((_, el) => {
    const $el = $(el)
    const cls = ($el.attr('class') || '') + ' ' + ($el.attr('id') || '') + ' ' + ($el.attr('aria-label') || '')
    const txt = $el.text().trim()
    if (pagRe.test(cls) || (txt.length <= 24 && pagRe.test(txt))) {
      const tag = (el as any).tagName
      const href = $el.attr('href') ? ` href="${$el.attr('href')}"` : ''
      const key = `${tag}|${trunc(cls, 60)}|${trunc(txt, 24)}`
      if (seenPag.has(key)) return
      seenPag.add(key)
      console.log(`  <${tag}${href} class/id/aria="${trunc(cls, 70)}"> "${trunc(txt, 30)}"`)
    }
  })
  if (seenPag.size === 0) console.log('  (none found — listing may be URL/date-based or virtualised)')

  // 3) Event-link hrefs — how many distinct event pages are in the DOM.
  console.log(`\n--- event links ---`)
  const linkRe = /ticket|event|performance|production|whats-?on/i
  const hrefs = new Set<string>()
  $('a[href]').each((_, el) => {
    const h = $(el).attr('href') || ''
    if (linkRe.test(h)) hrefs.add(h.split('?')[0])
  })
  console.log(`  distinct event-ish hrefs: ${hrefs.size}`)
  ;[...hrefs].slice(0, 30).forEach((h) => console.log(`    ${h}`))

  // 4) First likely event card — its outerHTML, to design a selector/adapter.
  console.log(`\n--- first event card (outerHTML, truncated) ---`)
  const firstLink = $('a[href]').filter((_, el) => linkRe.test($(el).attr('href') || '')).first()
  if (firstLink.length) {
    // Walk up to a plausible card container (article/li or a div with several children).
    let card = firstLink
    for (let i = 0; i < 6; i++) {
      const parent = card.parent()
      if (!parent.length) break
      const tag = (parent.get(0) as any)?.tagName
      card = parent
      if (tag === 'article' || tag === 'li') break
      if (parent.children().length >= 3 && parent.find('a[href]').length <= 3) break
    }
    console.log(trunc($.html(card) || '', 1600))
  } else {
    console.log('  (no event link found to anchor a card)')
  }
  console.log('')
}

main().catch((e) => {
  console.error('inspect-dump failed:', e instanceof Error ? e.message : String(e))
  process.exit(1)
})
