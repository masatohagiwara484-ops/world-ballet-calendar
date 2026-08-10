/**
 * Who is allowed to publish from Telegram.
 *
 * The `X-Telegram-Bot-Api-Secret-Token` header on the webhook proves that
 * TELEGRAM called us — it says nothing about WHICH human tapped the button. Any
 * user who can see a digest (a group member, someone the bot was forwarded to)
 * would otherwise be able to push scraped rows onto the live site.
 *
 * The owner is `TELEGRAM_CHAT_ID`: in the 1:1 bot DM the chat id and the user id
 * are the same number. `TELEGRAM_ALLOWED_USER_IDS` (comma-separated) overrides it
 * when review moves to a shared group and more than one person may approve.
 *
 * Fails CLOSED: with neither variable set, nobody is authorised. A misconfigured
 * deploy must refuse approvals, never accept them from anyone.
 */

/**
 * The environment this module reads. A bare record rather than
 * `NodeJS.ProcessEnv` so the self-test can pass a two-key object — and so it
 * still accepts `process.env` under Next's augmented env typings.
 */
export type TelegramAuthEnv = Record<string, string | undefined>

/** Parse the allowlist from the environment, most specific variable first. */
export function ownerIds(env: TelegramAuthEnv = process.env): string[] {
  return (env.TELEGRAM_ALLOWED_USER_IDS ?? env.TELEGRAM_CHAT_ID ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** True only for a sender explicitly named in the allowlist. */
export function isOwner(
  fromId: number | string | undefined | null,
  env: TelegramAuthEnv = process.env
): boolean {
  if (fromId == null || fromId === '') return false
  const allowed = ownerIds(env)
  if (allowed.length === 0) return false
  return allowed.includes(String(fromId))
}
