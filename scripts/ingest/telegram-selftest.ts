/**
 * Offline proof that the Telegram review surface is safe and well-formed.
 *
 * `telegram:check` proves the WIRING is live (needs a real bot token).
 * This proves the LOGIC is right and needs nothing at all — so CI runs it on
 * every PR, where no bot, no Supabase and no network exist:
 *
 *   1. authorisation — who may publish from a tap (fails closed)
 *   2. the publish guard — what an "Approve all" actually puts on the live site
 *   3. message shape — pagination, and Telegram's hard 4096-char / 64-byte limits
 *
 *   npm run telegram:selftest
 */
import { isOwner } from '../../src/lib/telegram-auth'
import { partitionForPublish, describeHidden } from '../../src/lib/review-guard'
import {
  formatDetail,
  formatDigest,
  digestKeyboard,
  detailKeyboard,
  DETAIL_PAGE_SIZE,
  type DetailRow,
} from '../../src/lib/telegram'

let failures = 0

function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    console.error(`  ✗ ${label}`)
    failures += 1
  }
}

/** Telegram rejects a sendMessage body over 4096 characters. */
const TELEGRAM_TEXT_LIMIT = 4096
/** …and callback_data over 64 bytes. */
const CALLBACK_DATA_LIMIT = 64

function testAuth(): void {
  console.log('\n=== authorisation ===')
  check('owner id matches', isOwner(12345, { TELEGRAM_CHAT_ID: '12345' }))
  check('numeric and string ids compare equal', isOwner('12345', { TELEGRAM_CHAT_ID: '12345' }))
  check('a stranger is refused', !isOwner(999, { TELEGRAM_CHAT_ID: '12345' }))
  check('unset config fails CLOSED', !isOwner(12345, {}))
  check('empty sender is refused', !isOwner(undefined, { TELEGRAM_CHAT_ID: '12345' }))
  check(
    'allowlist overrides the chat id',
    isOwner(777, { TELEGRAM_CHAT_ID: '12345', TELEGRAM_ALLOWED_USER_IDS: '777, 888' }) &&
      !isOwner(12345, { TELEGRAM_CHAT_ID: '12345', TELEGRAM_ALLOWED_USER_IDS: '777, 888' })
  )
}

function testGuard(): void {
  console.log('\n=== publish guard (what an Approve tap really publishes) ===')
  const rows = [
    { id: 'good', title: 'Swan Lake', start_date: '2026-09-12', end_date: '2026-10-04', change_kind: 'new' },
    { id: 'cancelled', title: 'Giselle', start_date: '2026-09-20', end_date: null, change_kind: 'cancelled' },
    { id: 'bad-year', title: 'Onegin', start_date: '0026-09-12', end_date: null, change_kind: 'new' },
    { id: 'long-run', title: 'Nutcracker', start_date: '2026-01-01', end_date: '2027-06-01', change_kind: 'new' },
    { id: 'tour', title: 'Ballettführung', start_date: '2026-09-12', end_date: null, change_kind: 'new' },
    { id: 'sale', title: 'Costume Sale', start_date: '2026-09-12', end_date: null, change_kind: 'new' },
  ]
  const { publishIds, hideIds, hidden } = partitionForPublish(rows)

  check('a clean performance publishes', publishIds.includes('good'))
  check('only the clean row publishes', publishIds.length === 1)
  check('a cancellation is hidden, never published', hideIds.includes('cancelled'))
  check('a year-0026 row never reaches the site', hideIds.includes('bad-year'))
  check('a 500-day "run" is caught as two merged engagements', hideIds.includes('long-run'))
  check('a guided tour is not a performance', hideIds.includes('tour'))
  check('a costume sale is not a performance', hideIds.includes('sale'))
  check('every row is accounted for', publishIds.length + hideIds.length === rows.length)
  check('the receipt names the reasons', /cancelled/.test(describeHidden(hidden)))

  // "Aufführung" must NOT be mistaken for "Führung" (a guided tour).
  const german = partitionForPublish([
    { id: 'auf', title: 'Uraufführung: Schwanensee', start_date: '2026-09-12', end_date: null, change_kind: 'new' },
  ])
  check('a German premiere is not mistaken for a guided tour', german.publishIds.includes('auf'))
}

function testMessages(): void {
  console.log('\n=== message shape ===')
  const row = (i: number): DetailRow => ({
    title: `A Very Long Production Title Number ${i} — with subtitle`,
    kind: i % 2 ? 'ballet' : 'opera',
    start_date: '2026-09-12',
    end_date: '2026-10-04',
    venue: 'Royal Opera House, Covent Garden, London',
    price_range: '£20–£100',
    ticket_url: 'https://example.com/tickets/a-rather-long-path/that-keeps-going/12345',
    affiliate_url: null,
    confidence: 0.82,
    change_kind: 'new',
  })
  const many = Array.from({ length: 25 }, (_, i) => row(i))
  const pages = Math.ceil(many.length / DETAIL_PAGE_SIZE)

  check('detail paginates', pages === 5)
  check(
    'every detail page fits Telegram’s 4096-char limit',
    Array.from({ length: pages }, (_, p) => formatDetail('Royal Ballet', many, p)).every(
      (t) => t.length <= TELEGRAM_TEXT_LIMIT
    )
  )
  check('an out-of-range page clamps instead of rendering empty', formatDetail('Royal Ballet', many, 99).length > 50)
  check('a single-row batch still renders', formatDetail('Royal Ballet', [row(0)], 0).includes('page 1 of 1'))

  const digest = formatDigest({
    companyName: 'Royal Ballet',
    runId: '2026-08-10-04-17',
    batchId: '2026-08-10-04-17:royal-ballet',
    lines: many.map((r) => ({
      change_kind: 'new',
      title: r.title,
      start_date: r.start_date,
      end_date: r.end_date ?? r.start_date,
      kind: r.kind ?? undefined,
      price: r.price_range,
      confidence: r.confidence,
    })),
    sourceUrl: 'https://example.com/whats-on',
  })
  check('a 25-change digest fits the 4096-char limit', digest.length <= TELEGRAM_TEXT_LIMIT)

  // The worst realistic batch id: longest run id + longest company slug.
  const worstBatch = '2026-08-10-04-17:new-national-theatre-tokyo'
  const allData = [
    ...digestKeyboard(worstBatch, 'https://example.com').inline_keyboard.flat(),
    ...detailKeyboard(worstBatch, 1, 9, 'https://example.com').inline_keyboard.flat(),
  ]
    .map((b) => b.callback_data)
    .filter(Boolean) as string[]
  check(
    'every callback_data fits the 64-byte limit',
    allData.every((d) => Buffer.byteLength(d, 'utf8') <= CALLBACK_DATA_LIMIT)
  )
  check('the Details button survives the longest batch id', allData.some((d) => d.startsWith('detail:')))
  check(
    'the standing pending batch id also fits',
    Buffer.byteLength('detail:pending:new-national-theatre-tokyo:9', 'utf8') <= CALLBACK_DATA_LIMIT
  )
}

/**
 * Legacy `Markdown` is the parse_mode every send uses, so `esc` must NOT emit the
 * MarkdownV2 escapes — a stray `\.` is printed literally to the owner.
 */
function testEscaping(): void {
  console.log('\n=== markdown escaping (legacy parse_mode) ===')
  const tricky: DetailRow = {
    title: 'Roméo et Juliette (rev. 2026) — Act I–III, No. 4',
    kind: 'ballet',
    start_date: '2026-09-12',
    end_date: '2026-10-04',
    venue: 'Palais Garnier, Paris',
    price_range: '€20–€100',
    ticket_url: 'https://example.com/tickets',
    affiliate_url: null,
    confidence: 0.95,
    change_kind: 'new',
  }
  const detail = formatDetail('Opéra national de Paris', [tricky], 0)
  const digest = formatDigest({
    companyName: 'Opéra national de Paris',
    runId: '2026-08-10-04-17',
    batchId: 'pending:opera-national-de-paris',
    lines: [
      {
        change_kind: 'date-changed',
        title: tricky.title,
        start_date: '2026-09-12',
        end_date: '2026-10-04',
        was: '2026-09-05',
        kind: 'ballet',
        price: tricky.price_range,
        confidence: 0.95,
      },
    ],
    sourceUrl: 'https://example.com/whats-on',
  })

  // A backslash may only ever precede a legacy-Markdown control character.
  const strayEscape = /\\([^_*[\]`\\])/
  check('no stray backslash escapes in the Details view', !strayEscape.test(detail))
  check('no stray backslash escapes in the digest', !strayEscape.test(digest))
  check('punctuation survives verbatim', detail.includes('Act I–III, No. 4'))
  check('the numbered heading is not escaped', detail.includes('*1. '))
  check(
    'entity-opening characters are still escaped',
    formatDetail('X', [{ ...tricky, title: 'Swan_Lake' }], 0).includes('Swan\\_Lake')
  )
}

console.log('=== telegram review self-test ===')
testAuth()
testGuard()
testMessages()
testEscaping()

if (failures > 0) {
  console.error(`\n✗ ${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\n✅ Telegram review logic is sound — auth fails closed, the guard holds, messages fit.')
