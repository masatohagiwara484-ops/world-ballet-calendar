/**
 * Manual test for the weekly digest — run from the owner's machine
 * (needs .env.local with Supabase; RESEND_API_KEY only for --send).
 *
 *   npx tsx scripts/test-digest.ts <your@email>
 *       → dry run: prints what this week's letter would contain
 *   npx tsx scripts/test-digest.ts <your@email> --send
 *       → actually sends it (run twice: the second run must report 0 sent)
 *   npx tsx scripts/test-digest.ts <your@email> --send --week 2026-W31
 *       → sends "next week's" letter, proving recommendations don't repeat
 *
 * Only the given address is considered, so a test never mails real readers.
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { sendWeeklyDigests, isoWeekKey } from '../src/lib/digest'

config({ path: '.env.local' })

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const rawEmail = args.find((a) => !a.startsWith('--'))
  const email = rawEmail?.trim().toLowerCase()
  const send = args.includes('--send')
  const weekIdx = args.indexOf('--week')
  const weekKey = weekIdx >= 0 ? args[weekIdx + 1] : undefined

  if (!email) {
    console.error('usage: npx tsx scripts/test-digest.ts <email> [--send] [--week 2026-W31]')
    process.exit(1)
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('✗ Supabase env missing (.env.local)')
    process.exit(1)
  }
  const client = createClient(url, key, { auth: { persistSession: false } })

  console.log(`· week ${weekKey ?? isoWeekKey(new Date())} · ${email} · ${send ? 'SEND' : 'dry run'}`)
  const result = await sendWeeklyDigests(client, {
    dryRun: !send,
    weekKey,
    onlyEmail: email,
  })
  console.log(result)
  if (!send) console.log('· pass --send to deliver for real')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
