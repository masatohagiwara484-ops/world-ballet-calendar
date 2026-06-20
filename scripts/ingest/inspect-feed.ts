/**
 * Feed inspector — prove a feed is REAL performances before trusting it.
 *
 *   npm run inspect:feed -- https://teatrocolon.org.ar/feed/
 *   npm run inspect:feed -- https://example.org/season.ics --kind ical
 *
 * WHY THIS EXISTS
 * `discover:feeds` finds a feed *signal* (an .ics link, an <link rel=alternate
 * rss>, JSON-LD Event objects) but cannot tell whether that feed actually lists
 * PERFORMANCES or just NEWS/blog posts. That distinction is critical: the RSS
 * extractor maps each item's `pubDate` to a performance `start_date`, so a
 * WordPress `/feed/` (which serves the latest *articles*) would manufacture
 * bogus "performances" dated to each article's publish day. A wrong date is
 * worse than a missing one — so we verify the CONTENT, not just the signal.
 *
 * This tool fetches the feed exactly as the ingest would (real browser UA, from
 * YOUR residential IP — datacenter IPs get 403), runs the SAME extractor the
 * pipeline uses, and prints what would actually be ingested plus a heuristic
 * verdict (PERFORMANCES vs likely-NEWS). It writes NOTHING. Run it on every feed
 * URL before pasting it into run-ingest.ts and going --live.
 */
import { extractFeed, type FeedKind } from './extract-feed'

const UA =
  process.env.INGEST_UA ??
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Guess the feed kind from the URL/content when --kind is not given. */
function guessKind(url: string, body: string): FeedKind {
  const low = url.toLowerCase()
  if (low.endsWith('.ics') || body.includes('BEGIN:VCALENDAR')) return 'ical'
  if (body.includes('<rss') || body.includes('<feed') || body.includes('<rdf')) return 'rss'
  if (body.includes('application/ld+json')) return 'jsonld'
  // Default to RSS — the most common "/feed/" shape.
  return 'rss'
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const url = argv.find((a) => /^https?:\/\//.test(a))
  const kindArg = argv.includes('--kind') ? (argv[argv.indexOf('--kind') + 1] as FeedKind) : null
  if (!url) {
    console.error('usage: npm run inspect:feed -- <feed-url> [--kind ical|rss|jsonld]')
    process.exit(1)
  }

  console.log(`Fetching ${url} …`)
  const res = await fetch(url, {
    headers: {
      'user-agent': UA,
      accept: 'application/rss+xml, application/atom+xml, text/calendar, application/xml, text/html;q=0.9, */*;q=0.8',
      'accept-language': 'en;q=0.9',
    },
    redirect: 'follow',
  })
  if (!res.ok) {
    console.error(`  ✗ HTTP ${res.status} ${res.statusText} — run this from your own machine (datacenter IPs get 403).`)
    process.exit(1)
  }
  const body = await res.text()
  const kind = kindArg ?? guessKind(url, body)
  console.log(`  kind: ${kind} (${body.length.toLocaleString()} bytes)\n`)

  const rows = extractFeed(kind, body, 'inspect')
  if (rows.length === 0) {
    console.log('  → 0 rows parsed. Either the wrong kind, or the feed has no dated items.')
    console.log('    This feed is NOT usable as a performance source as-is.')
    process.exit(0)
  }

  // Sort by date and show a sample of what would be ingested.
  const sorted = [...rows].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const today = new Date().toISOString().slice(0, 10)
  const future = sorted.filter((r) => r.start_date >= today)
  const dates = sorted.map((r) => r.start_date)

  console.log(`  parsed ${rows.length} item(s):`)
  for (const r of sorted.slice(0, 10)) {
    const flag = r.start_date >= today ? ' ' : '⌛' // past date → suspicious for a "what's on"
    console.log(`    ${flag} ${r.start_date}  ${r.title.slice(0, 70)}`)
  }
  if (sorted.length > 10) console.log(`    … and ${sorted.length - 10} more`)

  console.log(`\n  date span: ${dates[0]} → ${dates[dates.length - 1]}`)
  console.log(`  future-dated: ${future.length}/${rows.length}`)

  // Heuristic verdict. A real "what's on" feed is mostly FUTURE-dated and spread
  // across many days. A news feed clusters near today/recent-past (article dates)
  // and its titles read like headlines, not show names.
  const futureRatio = future.length / rows.length
  const uniqueDates = new Set(dates).size
  let verdict: string
  if (futureRatio >= 0.5 && uniqueDates >= 3) {
    verdict = '✅ LIKELY PERFORMANCES — mostly future-dated across multiple days. Safe to wire (still review in Telegram).'
  } else if (future.length === 0) {
    verdict =
      '❌ LIKELY NEWS — every item is past-dated (these look like article publish dates, not show dates). Do NOT wire as a performance feed.'
  } else {
    verdict =
      '⚠️ UNCERTAIN — few future dates / clustered. Open several titles in your browser: are they shows or articles? Do not wire until confirmed.'
  }
  console.log(`\n  VERDICT: ${verdict}`)
}

main().catch((err) => {
  console.error('inspect-feed crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
