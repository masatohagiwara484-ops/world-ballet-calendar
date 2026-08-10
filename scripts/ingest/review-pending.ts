/**
 * Review queue CLI — approve/reject pending performances from the terminal.
 *
 * This is the Telegram-free equivalent of the approval webhook: it lets the
 * owner SEE every row the crawl wrote as `review_status='pending'` and then
 * publish or reject them, all from their own machine. The human-in-the-loop
 * trust gate is preserved — nothing is published until you run --publish after
 * eyeballing the list. Use this when the Telegram webhook isn't set up yet.
 *
 *   npm run review:pending                         # LIST all pending (no writes)
 *   npm run review:pending -- --slug metropolitan-opera   # LIST one company
 *   npm run review:pending -- --slug metropolitan-opera --publish   # publish it
 *   npm run review:pending -- --publish            # publish ALL pending
 *   npm run review:pending -- --slug X --reject    # reject (discard) one company
 *
 * Publishing mirrors the webhook exactly: confirmed cancellations become
 * `rejected` (hidden), everything else becomes `published` with a fresh
 * `last_verified` stamp. Published rows appear on the live site at the next ISR
 * revalidate (≤1h) or immediately after a redeploy.
 */
import { config } from 'dotenv'
import { getWriter } from './state'
import { partitionForPublish, describeHidden } from '../../src/lib/review-guard'

config({ path: '.env.local' })

interface PendingRow {
  id: string
  company_slug: string
  title: string
  kind: string
  start_date: string
  end_date: string | null
  venue: string | null
  price_range: string | null
  ticket_url: string | null
  affiliate_url: string | null
  confidence: number | null
  change_kind: string | null
  source_url: string | null
}

function parseArgs(argv: string[]) {
  return {
    slug: argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null,
    publish: argv.includes('--publish'),
    reject: argv.includes('--reject'),
  }
}

async function main(): Promise<void> {
  const { slug, publish, reject } = parseArgs(process.argv.slice(2))

  const client = getWriter()
  if (!client) {
    console.error(
      '✗ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
    )
    process.exit(1)
  }

  let query = client
    .from('performances')
    .select(
      'id, company_slug, title, kind, start_date, end_date, venue, price_range, ticket_url, affiliate_url, confidence, change_kind, source_url'
    )
    .eq('review_status', 'pending')
    .order('company_slug')
    .order('start_date')
  if (slug) query = query.eq('company_slug', slug)

  const { data, error } = await query
  if (error) {
    console.error('✗ query failed:', error.message)
    process.exit(1)
  }
  const rows = (data ?? []) as PendingRow[]

  if (rows.length === 0) {
    console.log(`No pending rows${slug ? ` for ${slug}` : ''}. Nothing to review.`)
    return
  }

  // Group by company for a readable digest.
  const byCompany = new Map<string, PendingRow[]>()
  for (const r of rows) {
    const list = byCompany.get(r.company_slug) ?? []
    list.push(r)
    byCompany.set(r.company_slug, list)
  }

  // "2026-09-12" → "12 Sep 2026" for a scannable, human date.
  const niceDate = (d: string | null): string => {
    if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d ?? '—'
    const [y, m, day] = d.slice(0, 10).split('-')
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(m, 10) - 1]
    return `${parseInt(day, 10)} ${mon ?? m} ${y}`
  }
  const niceSpan = (s: string, e: string | null): string =>
    !e || e === s ? niceDate(s) : `${niceDate(s)} → ${niceDate(e)}`
  const glyph = (k: string): string => (k === 'ballet' ? '🩰' : k === 'opera' ? '🎭' : '🎟')
  const changeTag = (k: string | null): string =>
    k === 'date-changed' ? '📅 date' : k === 'price-changed' ? '💷 price' : k === 'cancelled' ? '❌ cancel' : '➕ new'

  // Run-wide summary first — the at-a-glance the aim asks for.
  const totals = new Map<string, number>()
  for (const r of rows) totals.set(r.change_kind ?? 'new', (totals.get(r.change_kind ?? 'new') ?? 0) + 1)
  const summary = [...totals].map(([k, n]) => `${changeTag(k)} ${n}`).join('   ')
  const bar = '─'.repeat(72)
  console.log(`\n┌${bar}┐`)
  console.log(`│ 📋 ${rows.length} pending row(s)${slug ? ` · ${slug}` : ''} across ${byCompany.size} house(s)`)
  console.log(`│ ${summary}`)
  console.log(`└${bar}┘`)

  for (const [company, list] of byCompany) {
    console.log(`\n▌ ${glyph(list[0]?.kind ?? '')} ${company}  ·  ${list.length} performance(s)`)
    console.log(`  ${'┈'.repeat(70)}`)
    for (const r of list) {
      const flags = [
        r.change_kind && r.change_kind !== 'new' ? changeTag(r.change_kind) : '',
        r.confidence != null && r.confidence < 0.9 ? `⚠️ conf ${r.confidence.toFixed(2)}` : '',
        r.affiliate_url ? '💰 aff' : r.ticket_url ? '🎟 ticket' : '⚠️ no-link',
        r.price_range ? `· ${r.price_range}` : '',
      ]
        .filter(Boolean)
        .join('  ')
      const title = r.title.length > 48 ? `${r.title.slice(0, 47)}…` : r.title
      console.log(`   ${glyph(r.kind)} ${title.padEnd(49)} ${niceSpan(r.start_date, r.end_date)}`)
      if (flags) console.log(`      ${flags}`)
    }
  }
  console.log('')

  if (!publish && !reject) {
    console.log('Review the list above. To act:')
    console.log(`  npm run review:pending -- ${slug ? `--slug ${slug} ` : ''}--publish    # publish these`)
    console.log(`  npm run review:pending -- ${slug ? `--slug ${slug} ` : ''}--reject     # discard these`)
    console.log(`  npm run review:telegram${slug ? ` -- --slug ${slug}` : ''}             # review from Telegram instead`)
    return
  }

  const ids = rows.map((r) => r.id)

  if (reject) {
    const { error: e } = await client
      .from('performances')
      .update({ review_status: 'rejected' })
      .in('id', ids)
      .eq('review_status', 'pending')
    if (e) {
      console.error('✗ reject failed:', e.message)
      process.exit(1)
    }
    console.log(`🚫 Rejected ${ids.length} row(s).`)
    return
  }

  // publish — the guard decides what actually goes live. It lives in
  // src/lib/review-guard so the Telegram webhook applies the IDENTICAL rules:
  // cancellations, implausible dates and non-performance rows are hidden.
  const { publishIds, hideIds, hidden } = partitionForPublish(rows)

  for (const reason of ['implausible-date', 'non-performance'] as const) {
    const group = hidden.filter((h) => h.reason === reason)
    if (!group.length) continue
    const label =
      reason === 'implausible-date'
        ? 'row(s) with implausible dates (kept off the live site)'
        : 'non-performance row(s) (sales/tours/classes)'
    console.log(`⚠️  Auto-rejecting ${group.length} ${label}:`)
    for (const { row: r } of group.slice(0, 10)) {
      console.log(`      - ${r.company_slug}  "${r.title.slice(0, 40)}"  ${r.start_date}…${r.end_date}`)
    }
  }

  if (hideIds.length) {
    const { error: e } = await client
      .from('performances')
      .update({ review_status: 'rejected' })
      .in('id', hideIds)
    if (e) {
      console.error('✗ hiding cancellations/bad-date rows failed:', e.message)
      process.exit(1)
    }
  }

  const { error: e2 } = await client
    .from('performances')
    .update({ review_status: 'published', last_verified: new Date().toISOString() })
    .in('id', publishIds)
    .eq('review_status', 'pending')
  if (e2) {
    console.error('✗ publish failed:', e2.message)
    process.exit(1)
  }
  const withheld = describeHidden(hidden)
  console.log(`✅ Published ${publishIds.length} row(s)${withheld ? `, withheld ${withheld}` : ''}.`)
  console.log('   They appear on the live site at the next revalidate (≤1h) or after a redeploy.')
}

main().catch((err) => {
  console.error('review-pending crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
