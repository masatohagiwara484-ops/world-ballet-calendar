/**
 * One-shot cleanup of performances that were written before the editorial
 * filters existed. Rejects (hides) rows that are:
 *   • talks / insights / behind-the-scenes (NON_PERFORMANCE_TITLE), or
 *   • ballet / shared events sitting under the Royal Opera (ROYAL_OPERA_BALLET_TITLE).
 *
 * Rejected rows (review_status='rejected') vanish from the live site but are kept
 * for provenance. Future crawls won't re-add them — run-ingest applies the same
 * filters on the way in.
 *
 *   npm run clean:published            # DRY RUN — lists what would be hidden
 *   npm run clean:published -- --yes   # actually reject them
 */
import { config } from 'dotenv'
import { getWriter } from './state'
import { isExcludedForCompany } from './filters'

config({ path: '.env.local' })

interface Row {
  id: string
  company_slug: string
  title: string
  review_status: string
}

async function main(): Promise<void> {
  const client = getWriter()
  if (!client) {
    console.error('✗ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.')
    process.exit(1)
  }
  const apply = process.argv.slice(2).includes('--yes')

  // Only consider rows that are (or could become) visible.
  const { data, error } = await client
    .from('performances')
    .select('id, company_slug, title, review_status')
    .in('review_status', ['published', 'pending'])
  if (error) {
    console.error('✗ query failed:', error.message)
    process.exit(1)
  }
  const rows = (data ?? []) as Row[]
  const toReject = rows.filter((r) => isExcludedForCompany(r.company_slug, r.title))

  if (toReject.length === 0) {
    console.log('Nothing to clean — no non-performance or misfiled rows are visible.')
    return
  }

  console.log(`\n=== ${toReject.length} row(s) to hide ===\n`)
  const byCompany = new Map<string, Row[]>()
  for (const r of toReject) {
    const list = byCompany.get(r.company_slug) ?? []
    list.push(r)
    byCompany.set(r.company_slug, list)
  }
  for (const [company, list] of byCompany) {
    console.log(`▌ ${company} — ${list.length}`)
    for (const r of list) console.log(`    [${r.review_status}] ${r.title.slice(0, 70)}`)
    console.log('')
  }

  if (!apply) {
    console.log('DRY RUN — nothing changed. Re-run with  npm run clean:published -- --yes  to hide them.')
    return
  }

  const ids = toReject.map((r) => r.id)
  const { error: e } = await client
    .from('performances')
    .update({ review_status: 'rejected' })
    .in('id', ids)
  if (e) {
    console.error('✗ reject failed:', e.message)
    process.exit(1)
  }
  console.log(`🚫 Hid ${ids.length} row(s). They no longer appear on the live site.`)
  console.log('   Redeploy or wait for the next revalidate (≤1h) to see the change.')
}

main().catch((err) => {
  console.error('clean-published crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
