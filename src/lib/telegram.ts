/**
 * Telegram Bot API client + digest formatting.
 *
 * Shared by the ingestion job (which SENDS the per-company digest) and the
 * webhook route (which ANSWERS the callback and EDITS the message to reflect the
 * owner's decision). Pure transport + formatting — no Supabase, no Next.
 *
 * All calls are null-safe: with no TELEGRAM_BOT_TOKEN they no-op so the crawl
 * still runs offline.
 */

const API = 'https://api.telegram.org/bot'

function token(): string | null {
  const t = process.env.TELEGRAM_BOT_TOKEN
  return t && !t.includes('placeholder') ? t : null
}

async function call(method: string, body: Record<string, unknown>): Promise<unknown> {
  const t = token()
  if (!t) return null
  const res = await fetch(`${API}${t}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: unknown; description?: string }
  if (!json.ok) throw new Error(`telegram ${method} failed: ${json.description ?? res.status}`)
  return json.result
}

/** A change line for the digest. */
export interface DigestLine {
  change_kind?: string
  title: string
  start_date: string
  end_date: string
  /** For date changes: the previous start, if known. */
  was?: string
}

export interface DigestInput {
  companyName: string
  runId: string
  batchId: string
  lines: DigestLine[]
  sourceUrl?: string
  confidence?: number
}

const ICON: Record<string, string> = {
  new: '➕ NEW',
  'date-changed': '📅 DATE',
  'price-changed': '💷 PRICE',
  cancelled: '❌ CANCELLED',
  unchanged: '· same',
}

/** Build the digest text (one message per company per run). */
export function formatDigest(input: DigestInput): string {
  const head = `🩰 *${esc(input.companyName)}* — ${input.lines.length} change${input.lines.length === 1 ? '' : 's'} (run ${esc(input.runId)})`
  const body = input.lines
    .slice(0, 20)
    .map((l) => {
      const tag = ICON[l.change_kind ?? 'unchanged'] ?? l.change_kind ?? ''
      const when = l.was ? `${l.start_date} (was ${l.was})` : `${l.start_date}→${l.end_date}`
      return `${tag}  ${esc(l.title)}  ${when}`
    })
    .join('\n')
  const more = input.lines.length > 20 ? `\n…and ${input.lines.length - 20} more` : ''
  const meta =
    (input.sourceUrl ? `\nsource: ${esc(short(input.sourceUrl))}` : '') +
    (input.confidence != null ? ` · confidence ${input.confidence.toFixed(2)}` : '')
  return `${head}\n${body}${more}${meta}`
}

/** Inline keyboard: Approve all / Reject all / Inspect (callback_data carries batch id). */
export function digestKeyboard(batchId: string) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Approve all', callback_data: `approve:${batchId}` },
        { text: '🚫 Reject all', callback_data: `reject:${batchId}` },
      ],
    ],
  }
}

/** Send a digest message; returns the Telegram message_id (or null offline). */
export async function sendDigest(
  chatId: string,
  text: string,
  batchId: string
): Promise<string | null> {
  const result = (await call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: digestKeyboard(batchId),
  })) as { message_id?: number } | null
  return result?.message_id != null ? String(result.message_id) : null
}

/** Acknowledge a button tap (stops the spinner, shows a toast). */
export async function answerCallback(callbackId: string, text: string): Promise<void> {
  await call('answerCallbackQuery', { callback_query_id: callbackId, text })
}

/** Rewrite the digest message to record the decision (removes the buttons). */
export async function editMessage(chatId: string, messageId: string, text: string): Promise<void> {
  await call('editMessageText', {
    chat_id: chatId,
    message_id: Number(messageId),
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  })
}

const esc = (s: string) => s.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')
const short = (u: string) => u.replace(/^https?:\/\//, '').slice(0, 60)
