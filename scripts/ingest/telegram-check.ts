/**
 * Telegram wiring self-check — proves the approval channel is live BEFORE a crawl
 * depends on it. It reads the same env vars the ingest and webhook use and calls
 * three read-only Bot API endpoints:
 *
 *   getMe            → the token is valid and names the bot
 *   getChat          → TELEGRAM_CHAT_ID is reachable by this bot
 *   getWebhookInfo   → the webhook is registered (approval taps will be delivered)
 *
 * It sends NO message and changes nothing. Run it after BotFather setup and after
 * the setWebhook curl to confirm every piece is connected.
 *
 *   npm run telegram:check
 */
import { config } from 'dotenv'

config({ path: '.env.local' })

const API = 'https://api.telegram.org/bot'

async function call(token: string, method: string, body: Record<string, unknown> = {}): Promise<any> {
  const res = await fetch(`${API}${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json().catch(() => ({}))) as { ok?: boolean; result?: any; description?: string }
}

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  const webhookSecretSet = !!process.env.TELEGRAM_WEBHOOK_SECRET

  let ok = true

  if (!token || token.includes('placeholder')) {
    console.error('✗ TELEGRAM_BOT_TOKEN missing/placeholder in .env.local — get it from @BotFather.')
    process.exit(1)
  }

  // 1. getMe — token valid?
  const me = await call(token, 'getMe')
  if (me.ok) {
    console.log(`✅ token valid — bot @${me.result.username} (${me.result.first_name})`)
  } else {
    console.error(`✗ getMe failed: ${me.description ?? 'unknown error'} — the token is wrong or revoked.`)
    process.exit(1)
  }

  // 2. getChat — chat_id reachable?
  if (!chatId) {
    console.warn('⚠️ TELEGRAM_CHAT_ID not set — digests have nowhere to go. Message @userinfobot to get your numeric id.')
    ok = false
  } else {
    const chat = await call(token, 'getChat', { chat_id: chatId })
    if (chat.ok) {
      const label = chat.result.username ? `@${chat.result.username}` : chat.result.title ?? chat.result.first_name ?? chatId
      console.log(`✅ chat reachable — ${label} (id ${chatId})`)
    } else {
      console.warn(
        `⚠️ getChat failed: ${chat.description ?? 'unknown'} — ` +
          `open a DM with the bot and press Start once, or check TELEGRAM_CHAT_ID.`
      )
      ok = false
    }
  }

  // 3. getWebhookInfo — approval taps delivered?
  const hook = await call(token, 'getWebhookInfo')
  if (hook.ok) {
    const url = hook.result.url as string
    if (url) {
      console.log(`✅ webhook set — ${url}`)
      if (hook.result.pending_update_count) console.log(`   · ${hook.result.pending_update_count} pending update(s)`)
      if (hook.result.last_error_message) {
        console.warn(`   ⚠️ last delivery error: ${hook.result.last_error_message}`)
        ok = false
      }
    } else {
      console.warn(
        '⚠️ no webhook registered — Approve/Reject taps will NOT reach the site.\n' +
          '   Register it (one curl):\n' +
          '   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \\\n' +
          '     -d "url=https://worldballetoperacalender.vercel.app/api/telegram/webhook" \\\n' +
          '     -d "secret_token=${TELEGRAM_WEBHOOK_SECRET}"'
      )
      ok = false
    }
  } else {
    console.warn(`⚠️ getWebhookInfo failed: ${hook.description ?? 'unknown'}`)
    ok = false
  }

  if (!webhookSecretSet) {
    console.warn('⚠️ TELEGRAM_WEBHOOK_SECRET not set locally — the webhook route verifies this header on every tap.')
  }

  console.log(
    ok
      ? '\n✅ Telegram is fully wired — the crawl can send digests and your taps will publish.'
      : '\n⚠️ Some pieces are missing (see above). The crawl still runs; you can approve via `npm run review:pending -- --publish` until Telegram is complete.'
  )
}

main().catch((err) => {
  console.error('telegram-check crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
