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
  /** 'ballet' | 'opera' — drives the discipline glyph. */
  kind?: string
  /** Human price range, if extracted (e.g. "£20–£100"). */
  price?: string | null
  /** Per-row extraction confidence (LLM rows carry their own). */
  confidence?: number | null
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
  new: '➕',
  'date-changed': '📅',
  'price-changed': '💷',
  cancelled: '❌',
  unchanged: '·',
}
const SECTION: Record<string, string> = {
  new: '➕ NEW',
  'date-changed': '📅 DATE CHANGED',
  'price-changed': '💷 PRICE CHANGED',
  cancelled: '❌ CANCELLED',
  unchanged: '· UNCHANGED',
}
const KIND_GLYPH: Record<string, string> = { ballet: '🩰', opera: '🎭' }
const ORDER = ['new', 'date-changed', 'price-changed', 'cancelled', 'unchanged']

/** "2026-09-12" → "12 Sep 2026"; passthrough if not an ISO date. */
function niceDate(d?: string): string {
  if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d)) return d ?? ''
  const [y, m, day] = d.slice(0, 10).split('-')
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(m, 10) - 1]
  return `${parseInt(day, 10)} ${mon ?? m} ${y}`
}

/** A run span: "12 Sep → 4 Oct 2026", collapsing a same-day run to one date. */
function niceSpan(start: string, end: string): string {
  if (!end || end === start) return niceDate(start)
  return `${niceDate(start)} → ${niceDate(end)}`
}

/**
 * Build the digest text (one message per company per run) — grouped by change
 * kind with a one-line summary header, so the owner can APPROVE FROM TELEGRAM
 * without ever reading the terminal. Each row shows discipline · dates · price ·
 * a low-confidence flag; the source link rides on the inline keyboard button.
 */
export function formatDigest(input: DigestInput): string {
  const n = input.lines.length
  const counts = new Map<string, number>()
  for (const l of input.lines) counts.set(l.change_kind ?? 'unchanged', (counts.get(l.change_kind ?? 'unchanged') ?? 0) + 1)

  const head = `${KIND_GLYPH[input.lines[0]?.kind ?? ''] ?? '🎟'} *${esc(input.companyName)}*`
  const summary = ORDER.filter((k) => counts.get(k))
    .map((k) => `${ICON[k]} ${counts.get(k)}`)
    .join('  ')
  const runLine = `_run ${esc(input.runId)}${input.confidence != null ? ` · conf ${input.confidence.toFixed(2)}` : ''}_`

  // Group rows under section headers, in a stable severity order.
  const grouped = ORDER.filter((k) => (input.lines.some((l) => (l.change_kind ?? 'unchanged') === k)))
    .map((k) => {
      const rows = input.lines.filter((l) => (l.change_kind ?? 'unchanged') === k).slice(0, 12)
      const body = rows
        .map((l) => {
          const disc = l.kind ? `${KIND_GLYPH[l.kind] ?? ''} ` : ''
          // Build `when` already-escaped: escape only the text, never the _italic_ markers.
          const when = l.was
            ? `${esc(niceDate(l.start_date))}  _(was ${esc(niceDate(l.was))})_`
            : esc(niceSpan(l.start_date, l.end_date))
          const price = l.price ? ` · ${esc(l.price)}` : ''
          const flag = l.confidence != null && l.confidence < 0.9 ? ' ⚠️' : ''
          return `  • ${disc}*${esc(l.title)}*${flag}\n     ${when}${price}`
        })
        .join('\n')
      const extra = counts.get(k)! > 12 ? `\n     …and ${counts.get(k)! - 12} more` : ''
      return `*${SECTION[k]}*\n${body}${extra}`
    })
    .join('\n\n')

  const src = input.sourceUrl ? `\n\n🔗 ${esc(short(input.sourceUrl))}` : ''
  return `${head} — ${n} change${n === 1 ? '' : 's'}\n${summary}\n${runLine}\n\n${grouped}${src}`
}

/**
 * Inline keyboard: Approve all / Reject all, plus a tappable "Open source" URL
 * button so the owner can eyeball the official listing before approving —
 * turning review into a two-tap flow that needs no terminal at all.
 */
export function digestKeyboard(batchId: string, sourceUrl?: string) {
  const rows: { text: string; callback_data?: string; url?: string }[][] = [
    [
      { text: '✅ Approve all', callback_data: `approve:${batchId}` },
      { text: '🚫 Reject all', callback_data: `reject:${batchId}` },
    ],
  ]
  if (sourceUrl && /^https?:\/\//.test(sourceUrl)) rows.push([{ text: '🔎 Open source', url: sourceUrl }])
  return { inline_keyboard: rows }
}

/** Send a digest message; returns the Telegram message_id (or null offline). */
export async function sendDigest(
  chatId: string,
  text: string,
  batchId: string,
  sourceUrl?: string
): Promise<string | null> {
  const result = (await call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: digestKeyboard(batchId, sourceUrl),
  })) as { message_id?: number } | null
  return result?.message_id != null ? String(result.message_id) : null
}

/** Send a plain notice (no buttons) — auto-approve summaries, run reports, alerts. */
export async function sendNotice(chatId: string, text: string): Promise<void> {
  await call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  })
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
