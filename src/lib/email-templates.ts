/**
 * Follower-alert email template — hand-rolled table HTML (email clients allow
 * no external CSS/fonts, so this is deliberately self-contained: serif stack
 * that degrades to Georgia, the house gold, an ivory ground, hairline rules).
 * Editorial voice, no aggregator shouting. Every alert carries a plain-text
 * alternative and a one-click unsubscribe.
 */
import { formatRange } from '@/components/shared/format'

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldballetoperacalender.vercel.app'

const GOLD = '#A8842A'
const INK = '#1A1A1A'
const FAINT = '#8A857C'
const GROUND = '#FAFAF8'
const SERIF = "Georgia, 'Times New Roman', serif"
const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"

export interface AlertRow {
  id: string
  title: string
  start_date: string
  end_date: string
  change_kind: string
}

export interface AlertInput {
  companyName: string
  /** Rows with change_kind 'new'. */
  added: AlertRow[]
  /** Rows with change_kind 'date-changed'. */
  redated: AlertRow[]
  unsubscribeUrl: string
}

/** Subject line, editorial register: «The Royal Ballet» — new dates announced. */
export function alertSubject(input: AlertInput): string {
  const what =
    input.added.length > 0 ? 'new dates announced' : 'dates updated'
  return `${input.companyName} — ${what}`
}

function rowHtml(r: AlertRow): string {
  const range = formatRange(r.start_date, r.end_date)
  const url = `${SITE_URL}/performances/${encodeURIComponent(r.id)}`
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid rgba(26,22,15,0.08);">
        <a href="${url}" style="font-family:${SERIF};font-size:18px;color:${INK};text-decoration:none;">${escapeHtml(r.title)}</a>
        <div style="font-family:${SANS};font-size:13px;color:${GOLD};margin-top:4px;">${escapeHtml(range)}</div>
      </td>
    </tr>`
}

function sectionHtml(heading: string, rows: AlertRow[]): string {
  if (rows.length === 0) return ''
  return `
    <tr><td style="padding-top:28px;">
      <div style="font-family:${SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${FAINT};">${heading}</div>
    </td></tr>
    ${rows.map(rowHtml).join('')}`
}

export function alertHtml(input: AlertInput): string {
  const shareText = encodeURIComponent(
    `${input.companyName} — new performance dates on première`
  )
  const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(SITE_URL)}`
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${GROUND};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GROUND};">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:26px;border-bottom:1px solid rgba(26,22,15,0.12);">
          <span style="font-family:${SERIF};font-size:26px;color:${INK};">premi&egrave;re</span>
          <span style="font-family:${SANS};font-size:9px;letter-spacing:0.34em;text-transform:uppercase;color:${FAINT};padding-left:10px;">Ballet &amp; Opera</span>
        </td></tr>

        <tr><td style="padding-top:30px;">
          <div style="font-family:${SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${GOLD};">You follow</div>
          <div style="font-family:${SERIF};font-size:30px;color:${INK};padding-top:6px;">${escapeHtml(input.companyName)}</div>
        </td></tr>

        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${sectionHtml('Newly announced', input.added)}
            ${sectionHtml('Dates updated', input.redated)}
          </table>
        </td></tr>

        <tr><td style="padding-top:30px;">
          <a href="${SITE_URL}/companies" style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${GOLD};text-decoration:none;">View the season &rarr;</a>
        </td></tr>

        <tr><td style="padding-top:44px;border-top:1px solid rgba(26,22,15,0.08);margin-top:36px;">
          <div style="font-family:${SANS};font-size:11px;color:${FAINT};line-height:1.7;">
            Dates confirmed against the company's official listing before this email was sent.<br/>
            <a href="${shareUrl}" style="color:${FAINT};">Share on X</a>
            &nbsp;&middot;&nbsp;
            <a href="${input.unsubscribeUrl}" style="color:${FAINT};">Unsubscribe</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function alertText(input: AlertInput): string {
  const lines: string[] = [`première — ${input.companyName}`, '']
  if (input.added.length) {
    lines.push('Newly announced:')
    for (const r of input.added)
      lines.push(
        `  ${r.title} · ${formatRange(r.start_date, r.end_date)} · ${SITE_URL}/performances/${r.id}`
      )
    lines.push('')
  }
  if (input.redated.length) {
    lines.push('Dates updated:')
    for (const r of input.redated)
      lines.push(
        `  ${r.title} · ${formatRange(r.start_date, r.end_date)} · ${SITE_URL}/performances/${r.id}`
      )
    lines.push('')
  }
  lines.push(`Unsubscribe: ${input.unsubscribeUrl}`)
  return lines.join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
