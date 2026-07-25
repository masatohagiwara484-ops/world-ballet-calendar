/**
 * Email transport — Resend REST API via fetch (no SDK dependency).
 *
 * Same posture as telegram.ts: pure transport, env-gated, null-safe. With no
 * RESEND_API_KEY every call silently no-ops (returns false), so the approval
 * webhook, crawl and site behave identically on machines without the key.
 *
 *   RESEND_API_KEY — server-only secret (Vercel + .env.local).
 *   EMAIL_FROM     — verified sender. Defaults to Resend's onboarding sender,
 *                    which can only deliver to the account owner's own address —
 *                    perfect for testing, swap in the custom domain once it is
 *                    verified in Resend (no code change).
 */

const API = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'première <onboarding@resend.dev>'

function apiKey(): string | null {
  const k = process.env.RESEND_API_KEY
  return k && !k.includes('placeholder') ? k : null
}

/** The sender identity alerts go out under. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM
}

export interface OutboundEmail {
  to: string
  subject: string
  html: string
  /** Plain-text alternative — always provide one (deliverability + readers). */
  text: string
  /** One-click unsubscribe URL → List-Unsubscribe headers. */
  unsubscribeUrl?: string
}

/**
 * Send one email. Returns true on acceptance, false on no-op/failure — NEVER
 * throws, so a mail hiccup can never break the approval flow that calls it.
 */
export async function sendEmail(msg: OutboundEmail): Promise<boolean> {
  const key = apiKey()
  if (!key) return false
  try {
    const headers: Record<string, string> = {}
    if (msg.unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${msg.unsubscribeUrl}>`
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    }
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        headers,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[email] send failed (${res.status}): ${body.slice(0, 200)}`)
      return false
    }
    return true
  } catch (err) {
    console.warn(`[email] send error: ${err instanceof Error ? err.message : String(err)}`)
    return false
  }
}
