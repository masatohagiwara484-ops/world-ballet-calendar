/**
 * Push the review queue to Telegram — the on-demand twin of `review:pending`.
 *
 * `npm run review:pending` prints the queue in a terminal. This sends the SAME
 * queue to the owner's phone as one digest per house, each with Approve all /
 * Reject all / Details buttons, so the whole review can happen from Telegram.
 * Nothing is published here — this only sends. Publishing still requires a tap,
 * which the webhook authorises and guards.
 *
 *   npm run review:telegram                          # every house with pending rows
 *   npm run review:telegram -- --slug royal-ballet   # one house
 *   npm run review:telegram -- --dry                 # count only, send nothing
 *
 * Idempotent by design: each house has ONE standing batch (`pending:<slug>`), so
 * re-running refreshes that house's digest instead of piling up dead batches.
 */
import { config } from 'dotenv'
import { getWriter } from './state'
import { fetchPending, groupByCompany, pushPendingDigests, companyName } from '../../src/lib/pending-digest'

config({ path: '.env.local' })

function parseArgs(argv: string[]) {
  return {
    slug: argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : undefined,
    dry: argv.includes('--dry'),
  }
}

async function main(): Promise<void> {
  const { slug, dry } = parseArgs(process.argv.slice(2))

  const client = getWriter()
  if (!client) {
    console.error(
      '✗ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
    )
    process.exit(1)
  }

  const chatId = process.env.TELEGRAM_CHAT_ID
  const token = process.env.TELEGRAM_BOT_TOKEN
  const configured = !!chatId && !!token && !token.includes('placeholder')
  if (!dry && !configured) {
    console.error(
      '✗ Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local,\n' +
        '  then run `npm run telegram:check` to confirm the wiring.'
    )
    process.exit(1)
  }

  if (dry) {
    const rows = await fetchPending(client, slug)
    const byCompany = groupByCompany(rows)
    if (rows.length === 0) {
      console.log(`No pending rows${slug ? ` for ${slug}` : ''}. Nothing to send.`)
      return
    }
    console.log(`Would send ${byCompany.size} digest(s) covering ${rows.length} pending row(s):`)
    for (const [s, list] of byCompany) console.log(`  · ${companyName(s)} — ${list.length}`)
    return
  }

  if (!chatId) return // unreachable: guarded above, but keeps chatId non-null for TS
  const result = await pushPendingDigests(client, chatId, { slug })

  if (result.rows === 0) {
    console.log(`No pending rows${slug ? ` for ${slug}` : ''}. Nothing to send.`)
    return
  }

  console.log(
    `📤 Sent ${result.sent}/${result.companies} digest(s) covering ${result.rows} pending row(s) to Telegram.`
  )
  for (const f of result.failed) console.error(`  ✗ ${f.slug}: ${f.reason}`)
  console.log('   Approve or reject from the chat — the webhook publishes and revalidates.')
  if (result.failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error('review-telegram crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
