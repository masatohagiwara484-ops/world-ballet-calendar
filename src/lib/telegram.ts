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

/** One inline-keyboard button: a callback action, or a plain outbound link. */
export interface InlineButton {
  text: string
  callback_data?: string
  url?: string
}

/** A Telegram `reply_markup` inline keyboard. */
export interface InlineKeyboard {
  inline_keyboard: InlineButton[][]
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

/** A full pending row, for the per-performance Details view. */
export interface DetailRow {
  title: string
  kind: string | null
  start_date: string
  end_date: string | null
  venue: string | null
  price_range: string | null
  ticket_url: string | null
  affiliate_url: string | null
  confidence: number | null
  change_kind: string | null
}

/** Performances per Details page — keeps a page inside Telegram's 4096-char limit. */
export const DETAIL_PAGE_SIZE = 6

/**
 * The per-performance view behind the "Details" button — everything the terminal
 * review pass prints (venue, exact run, price, ticket link, confidence), so the
 * owner never needs `npm run review:pending` to decide.
 */
export function formatDetail(
  companyName: string,
  rows: DetailRow[],
  page: number
): string {
  const pages = Math.max(1, Math.ceil(rows.length / DETAIL_PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 0), pages - 1)
  const slice = rows.slice(safePage * DETAIL_PAGE_SIZE, (safePage + 1) * DETAIL_PAGE_SIZE)

  const body = slice
    .map((r, i) => {
      const n = safePage * DETAIL_PAGE_SIZE + i + 1
      const disc = r.kind ? `${KIND_GLYPH[r.kind] ?? ''} ` : ''
      const tag = r.change_kind && r.change_kind !== 'new' ? ` ${ICON[r.change_kind] ?? ''}` : ''
      const facts = [
        `📆 ${esc(niceSpan(r.start_date, r.end_date ?? r.start_date))}`,
        r.venue ? `📍 ${esc(r.venue)}` : null,
        r.price_range ? `💷 ${esc(r.price_range)}` : null,
        // The link itself rides on the row so a long URL never breaks the layout.
        r.affiliate_url ?? r.ticket_url ? `🎟 ${esc(short(r.affiliate_url ?? r.ticket_url ?? ''))}` : '⚠️ no ticket link',
        r.confidence != null ? `${r.confidence < 0.9 ? '⚠️' : '·'} conf ${r.confidence.toFixed(2)}` : null,
      ].filter(Boolean) as string[]
      return `*${n}. ${disc}${esc(r.title)}*${tag}\n     ${facts.join('\n     ')}`
    })
    .join('\n\n')

  const head = `🔍 *${esc(companyName)}* — details`
  const foot = `_page ${safePage + 1} of ${pages} · ${rows.length} performance${rows.length === 1 ? '' : 's'}_`
  return `${head}\n${foot}\n\n${body}`
}

/**
 * Inline keyboard: Approve all / Reject all, plus a tappable "Open source" URL
 * button so the owner can eyeball the official listing before approving —
 * turning review into a two-tap flow that needs no terminal at all. "Details"
 * expands the same batch into the per-performance view without losing the
 * approve/reject affordance.
 */
export function digestKeyboard(batchId: string, sourceUrl?: string, hasDetail = true): InlineKeyboard {
  const rows: InlineButton[][] = [
    [
      { text: '✅ Approve all', callback_data: `approve:${batchId}` },
      { text: '🚫 Reject all', callback_data: `reject:${batchId}` },
    ],
  ]
  const third: InlineButton[] = []
  if (hasDetail && fits(`detail:${batchId}:0`)) {
    third.push({ text: '🔍 Details', callback_data: `detail:${batchId}:0` })
  }
  if (sourceUrl && /^https?:\/\//.test(sourceUrl)) third.push({ text: '🔎 Open source', url: sourceUrl })
  if (third.length) rows.push(third)
  return { inline_keyboard: rows }
}

/**
 * Keyboard for the Details view: page navigation, a way back to the summary, and
 * the same Approve/Reject — the owner can decide from whichever view they're in.
 */
export function detailKeyboard(
  batchId: string,
  page: number,
  pages: number,
  sourceUrl?: string
): InlineKeyboard {
  const rows: InlineButton[][] = []

  const nav: InlineButton[] = []
  if (page > 0) nav.push({ text: '‹ Prev', callback_data: `detail:${batchId}:${page - 1}` })
  if (page < pages - 1) nav.push({ text: 'Next ›', callback_data: `detail:${batchId}:${page + 1}` })
  if (nav.length) rows.push(nav)

  rows.push([{ text: '↩︎ Summary', callback_data: `summary:${batchId}` }])
  rows.push([
    { text: '✅ Approve all', callback_data: `approve:${batchId}` },
    { text: '🚫 Reject all', callback_data: `reject:${batchId}` },
  ])
  if (sourceUrl && /^https?:\/\//.test(sourceUrl)) rows.push([{ text: '🔎 Open source', url: sourceUrl }])
  return { inline_keyboard: rows }
}

/**
 * Telegram rejects callback_data over 64 BYTES. Batch ids are `<runId>:<slug>`,
 * so a long house slug plus a page suffix can approach the ceiling — drop the
 * button rather than let the whole sendMessage fail.
 */
function fits(data: string): boolean {
  return Buffer.byteLength(data, 'utf8') <= 64
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

/**
 * Strip a message's buttons without touching its text — used to retire a SUPERSEDED
 * digest. A standing `pending:<slug>` batch is re-pointed at a new row set each
 * time the queue is re-sent, so an older message's "Approve all" would otherwise
 * still be tappable while showing rows that are no longer what it governs.
 * Best-effort: a message too old to edit is not worth failing the send for.
 */
export async function clearKeyboard(chatId: string, messageId: string): Promise<void> {
  await call('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: Number(messageId),
    reply_markup: { inline_keyboard: [] },
  })
}

/** Acknowledge a button tap (stops the spinner, shows a toast). */
export async function answerCallback(callbackId: string, text: string): Promise<void> {
  await call('answerCallbackQuery', { callback_query_id: callbackId, text })
}

/**
 * Rewrite a message in place. With no `replyMarkup` Telegram drops the inline
 * keyboard — which is exactly what recording a final decision wants. Passing a
 * keyboard instead lets one message toggle between summary and Details without
 * spamming the chat with new messages.
 */
export async function editMessage(
  chatId: string,
  messageId: string,
  text: string,
  replyMarkup?: InlineKeyboard
): Promise<void> {
  await call('editMessageText', {
    chat_id: chatId,
    message_id: Number(messageId),
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

/**
 * Escape for LEGACY `Markdown` — the parse_mode every send here actually uses.
 *
 * This deliberately does NOT escape the MarkdownV2 set. Legacy Markdown treats a
 * backslash before an ordinary character as literal text, so escaping `.` `-` `(`
 * would print "Swan Lake\." to the owner. Only the four characters that open a
 * legacy entity need escaping — an unbalanced `_` in a production title is what
 * actually breaks a message.
 *
 * (Switching to MarkdownV2 instead would mean escaping every literal separator
 * this module writes by hand, including the `(was …)` parentheses — more surface
 * for a malformed message on the owner's only review channel.)
 */
const esc = (s: string) => s.replace(/([_*[\]`])/g, '\\$1')
const short = (u: string) => u.replace(/^https?:\/\//, '').slice(0, 60)
