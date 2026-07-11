/**
 * Published-date audit — the trust checklist for rows already LIVE on the site.
 *
 * `review:pending` only shows `review_status='pending'` rows. A wrong date that
 * is already `published` is invisible to it — yet that is exactly the failure the
 * owner found on the live site. This script lists every PUBLISHED performance,
 * grouped by company, with its dates, provenance (source_url / last_verified) and
 * a set of automatic suspicion flags, so the owner can open each official listing
 * and confirm or correct the dates. It is READ-ONLY: it writes nothing and
 * publishes nothing — the correction step is deliberately manual (trust gate).
 *
 *   npm run audit:published                     # every published row, all houses
 *   npm run audit:published -- --slug royal-ballet    # one house
 *   npm run audit:published -- --suspicious           # only rows that tripped a flag
 *   npm run audit:published -- --slug X --suspicious  # combine
 *
 * Suspicion flags (a flag is a prompt to VERIFY, never proof of a wrong date):
 *   ⏳ past       — the run already ended (end_date < today): stale/should be gone
 *   🕳 no-source  — no source_url: provenance can't be shown (VerifiedDates hidden)
 *   ❓ unverified — no last_verified stamp: never confirmed against the official page
 *   📏 long-run   — span > 200 days: signature of two engagements merged in error
 *   📆 bad-year   — a date outside 2025–2035: a parser artefact, never real
 */
import { config } from 'dotenv'
import { getWriter } from './state'

config({ path: '.env.local' })

interface PublishedRow {
  id: string
  company_slug: string
  title: string
  kind: string
  start_date: string
  end_date: string | null
  venue: string | null
  source_url: string | null
  last_verified: string | null
  confidence: number | null
}

function parseArgs(argv: string[]) {
  return {
    slug: argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null,
    suspiciousOnly: argv.includes('--suspicious'),
  }
}

const MAX_SANE_SPAN_DAYS = 200
const today = new Date().toISOString().slice(0, 10)

function saneYear(d: string | null): boolean {
  if (!d) return false
  const y = parseInt(d.slice(0, 4), 10)
  return Number.isFinite(y) && y >= 2025 && y <= 2035
}

/** Automatic suspicion flags for one row — empty means nothing obvious is wrong. */
function flagsFor(r: PublishedRow): string[] {
  const f: string[] = []
  const end = r.end_date ?? r.start_date
  if (end && end < today) f.push('⏳ past')
  if (!r.source_url) f.push('🕳 no-source')
  if (!r.last_verified) f.push('❓ unverified')
  if (!saneYear(r.start_date) || (r.end_date != null && !saneYear(r.end_date))) f.push('📆 bad-year')
  else if (r.end_date != null) {
    const span = (Date.parse(r.end_date) - Date.parse(r.start_date)) / 86_400_000
    if (span > MAX_SANE_SPAN_DAYS) f.push('📏 long-run')
  }
  return f
}

// "2026-09-12" → "12 Sep 2026" for a scannable, human date.
function niceDate(d: string | null): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d ?? '—'
  const [y, m, day] = d.slice(0, 10).split('-')
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(m, 10) - 1]
  return `${parseInt(day, 10)} ${mon ?? m} ${y}`
}
const niceSpan = (s: string, e: string | null): string =>
  !e || e === s ? niceDate(s) : `${niceDate(s)} → ${niceDate(e)}`
const glyph = (k: string): string => (k === 'ballet' ? '🩰' : k === 'opera' ? '🎭' : '🎟')

async function main(): Promise<void> {
  const { slug, suspiciousOnly } = parseArgs(process.argv.slice(2))

  const client = getWriter()
  if (!client) {
    console.error(
      '✗ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
    )
    process.exit(1)
  }

  let query = client
    .from('performances')
    .select('id, company_slug, title, kind, start_date, end_date, venue, source_url, last_verified, confidence')
    .eq('review_status', 'published')
    .order('company_slug')
    .order('start_date')
  if (slug) query = query.eq('company_slug', slug)

  const { data, error } = await query
  if (error) {
    console.error('✗ query failed:', error.message)
    process.exit(1)
  }
  let rows = (data ?? []) as PublishedRow[]

  if (rows.length === 0) {
    console.log(`No published rows${slug ? ` for ${slug}` : ''}.`)
    return
  }

  const flagged = new Map<string, string[]>()
  for (const r of rows) flagged.set(r.id, flagsFor(r))
  const suspiciousCount = [...flagged.values()].filter((f) => f.length > 0).length

  if (suspiciousOnly) rows = rows.filter((r) => (flagged.get(r.id) ?? []).length > 0)

  const byCompany = new Map<string, PublishedRow[]>()
  for (const r of rows) {
    const list = byCompany.get(r.company_slug) ?? []
    list.push(r)
    byCompany.set(r.company_slug, list)
  }

  const bar = '─'.repeat(72)
  console.log(`\n┌${bar}┐`)
  console.log(`│ 📋 ${rows.length} published row(s)${slug ? ` · ${slug}` : ''} across ${byCompany.size} house(s)`)
  console.log(`│ ${suspiciousCount} row(s) tripped a suspicion flag — verify these against the official page`)
  console.log(`└${bar}┘`)

  for (const [company, list] of byCompany) {
    console.log(`\n▌ ${glyph(list[0]?.kind ?? '')} ${company}  ·  ${list.length} performance(s)`)
    // Show the source once per house — that's the page to open and compare against.
    const src = list.find((r) => r.source_url)?.source_url
    if (src) console.log(`  🔗 ${src}`)
    console.log(`  ${'┈'.repeat(70)}`)
    for (const r of list) {
      const f = flagged.get(r.id) ?? []
      const title = r.title.length > 44 ? `${r.title.slice(0, 43)}…` : r.title
      console.log(`   ${glyph(r.kind)} ${title.padEnd(45)} ${niceSpan(r.start_date, r.end_date)}`)
      const meta = [
        r.last_verified ? `verified ${niceDate(r.last_verified.slice(0, 10))}` : '',
        f.join('  '),
      ]
        .filter(Boolean)
        .join('   ')
      if (meta) console.log(`      ${meta}`)
    }
  }

  console.log(`\nHow to use this: open each 🔗 official listing and compare the dates above.`)
  console.log(`Rows are READ-ONLY here — tell me which ids are wrong (and their correct dates)`)
  console.log(`and I'll correct them. Nothing was changed by running this.\n`)
}

main().catch((err) => {
  console.error('audit-published crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
