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

  console.log(`\n=== ${rows.length} pending row(s)${slug ? ` for ${slug}` : ''} ===\n`)
  for (const [company, list] of byCompany) {
    console.log(`▌ ${company} — ${list.length} performance(s)`)
    for (const r of list) {
      const span = r.end_date && r.end_date !== r.start_date ? `${r.start_date}…${r.end_date}` : r.start_date
      const flags = [
        r.change_kind && r.change_kind !== 'new' ? `[${r.change_kind}]` : '',
        r.confidence != null && r.confidence < 0.9 ? `(conf ${r.confidence})` : '',
        r.affiliate_url ? '$aff' : r.ticket_url ? '$ticket' : 'no-link',
      ]
        .filter(Boolean)
        .join(' ')
      console.log(`    ${span}  ${r.title.slice(0, 64).padEnd(64)} ${flags}`)
    }
    console.log('')
  }

  if (!publish && !reject) {
    console.log('Review the list above. To act:')
    console.log(`  npm run review:pending -- ${slug ? `--slug ${slug} ` : ''}--publish    # publish these`)
    console.log(`  npm run review:pending -- ${slug ? `--slug ${slug} ` : ''}--reject     # discard these`)
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

  // Data-quality guard: a sane performance date is in the near future window.
  // Rows outside it (e.g. the year-0026 rows a since-fixed parser once wrote) are
  // stale artefacts and must NEVER reach the live site — auto-reject them.
  const isSaneYear = (d: string | null): boolean => {
    if (!d) return false
    const y = parseInt(d.slice(0, 4), 10)
    return Number.isFinite(y) && y >= 2025 && y <= 2035
  }
  const isInsane = (r: PendingRow): boolean =>
    !isSaneYear(r.start_date) || (r.end_date != null && !isSaneYear(r.end_date))

  // publish — mirror the webhook: cancellations + bad-date rows are hidden, the rest go live.
  const cancelledIds = rows.filter((r) => r.change_kind === 'cancelled').map((r) => r.id)
  const insaneRows = rows.filter((r) => r.change_kind !== 'cancelled' && isInsane(r))
  const rejectIds = [...new Set([...cancelledIds, ...insaneRows.map((r) => r.id)])]

  if (insaneRows.length) {
    console.log(`⚠️  Auto-rejecting ${insaneRows.length} row(s) with implausible dates (kept off the live site):`)
    for (const r of insaneRows.slice(0, 10)) {
      console.log(`      - ${r.company_slug}  "${r.title.slice(0, 40)}"  ${r.start_date}…${r.end_date}`)
    }
  }
  if (rejectIds.length) {
    const { error: e } = await client
      .from('performances')
      .update({ review_status: 'rejected' })
      .in('id', rejectIds)
    if (e) {
      console.error('✗ hiding cancellations/bad-date rows failed:', e.message)
      process.exit(1)
    }
  }

  // Publish everything pending EXCEPT what we just rejected.
  const publishIds = ids.filter((id) => !rejectIds.includes(id))
  const { error: e2 } = await client
    .from('performances')
    .update({ review_status: 'published', last_verified: new Date().toISOString() })
    .in('id', publishIds)
    .eq('review_status', 'pending')
  if (e2) {
    console.error('✗ publish failed:', e2.message)
    process.exit(1)
  }
  console.log(
    `✅ Published ${publishIds.length} row(s)` +
      `${cancelledIds.length ? `, hid ${cancelledIds.length} cancellation(s)` : ''}` +
      `${insaneRows.length ? `, rejected ${insaneRows.length} bad-date row(s)` : ''}.`
  )
  console.log('   They appear on the live site at the next revalidate (≤1h) or after a redeploy.')
}

main().catch((err) => {
  console.error('review-pending crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
