/**
 * Register the approval webhook with Telegram — reading the keys from .env.local.
 *
 * The hand-written `curl .../bot${TELEGRAM_BOT_TOKEN}/setWebhook` in the runbook
 * expands SHELL variables, but the token lives in `.env.local`, which is read by
 * Node (dotenv) and never exported to the shell. In a normal terminal that
 * expands to an empty string, the URL collapses to `api.telegram.org/bot/setWebhook`
 * and Telegram answers a bare `404 Not Found` — which reads like "the endpoint is
 * wrong" when the real cause is "the token was empty".
 *
 * This script closes that trap: same source of truth as every other command here,
 * and the token never enters the shell history.
 *
 *   npm run telegram:setwebhook                     # uses NEXT_PUBLIC_SITE_URL
 *   npm run telegram:setwebhook -- --url https://…  # override the site origin
 *   npm run telegram:setwebhook -- --drop           # also discard queued updates
 */
import { config } from 'dotenv'

config({ path: '.env.local' })

const API = 'https://api.telegram.org/bot'

interface TelegramReply {
  ok?: boolean
  result?: unknown
  description?: string
}

async function call(token: string, method: string, body: Record<string, unknown> = {}): Promise<TelegramReply> {
  const res = await fetch(`${API}${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json().catch(() => ({}))) as TelegramReply
}

function parseArgs(argv: string[]) {
  return {
    url: argv.includes('--url') ? argv[argv.indexOf('--url') + 1] : undefined,
    drop: argv.includes('--drop'),
  }
}

async function main(): Promise<void> {
  const { url: urlArg, drop } = parseArgs(process.argv.slice(2))

  const token = process.env.TELEGRAM_BOT_TOKEN
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET

  if (!token || token.includes('placeholder')) {
    console.error(
      '✗ TELEGRAM_BOT_TOKEN missing from .env.local — get it from @BotFather.\n' +
        '  (This is the exact condition that makes a hand-typed curl return 404.)'
    )
    process.exit(1)
  }
  if (!secret) {
    console.error(
      '✗ TELEGRAM_WEBHOOK_SECRET missing from .env.local.\n' +
        '  Generate one with:  openssl rand -hex 32\n' +
        '  It must be IDENTICAL here and in Vercel, or every tap is rejected as unauthorised.'
    )
    process.exit(1)
  }

  const origin = (urlArg ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldballetoperacalender.vercel.app')
    .trim()
    .replace(/\/+$/, '')
  const webhookUrl = `${origin}/api/telegram/webhook`

  // Name the bot before changing anything — proves the token resolves.
  const me = await call(token, 'getMe')
  if (!me.ok) {
    console.error(`✗ getMe failed: ${me.description ?? 'unknown error'} — the token is wrong or revoked.`)
    process.exit(1)
  }
  const bot = me.result as { username?: string }
  console.log(`✅ token valid — bot @${bot.username}`)

  const res = await call(token, 'setWebhook', {
    url: webhookUrl,
    secret_token: secret,
    // Buttons arrive as callback_query; /pending and /help as message. Nothing
    // else is acted on, so don't ask Telegram to deliver it.
    allowed_updates: ['message', 'callback_query'],
    ...(drop ? { drop_pending_updates: true } : {}),
  })

  if (!res.ok) {
    console.error(`✗ setWebhook failed: ${res.description ?? 'unknown error'}`)
    console.error(`  url attempted: ${webhookUrl}`)
    process.exit(1)
  }

  console.log(`✅ webhook registered — ${webhookUrl}${drop ? ' (pending updates dropped)' : ''}`)
  console.log('\nNext: `npm run telegram:check` should now report three ✅.')
  console.log(
    'Remember the deployed site must be running this code, and TELEGRAM_WEBHOOK_SECRET\n' +
      'in Vercel must match the value used here.'
  )
}

main().catch((err) => {
  console.error('telegram-setwebhook crashed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
