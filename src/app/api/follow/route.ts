/**
 * POST /api/follow — capture an email + what it wants alerts about.
 *
 * Body: { email, entityType, entitySlug, entityLabel?, locale? }
 * Returns 200 { ok:true, already } on success; 4xx { ok:false, reason } on a
 * client/config problem. Never leaks whether an email already existed beyond the
 * idempotent `already` flag, and never returns audience data.
 */
import { NextResponse } from 'next/server'
import { addFollow, type EntityType } from '@/lib/audience'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  email?: unknown
  entityType?: unknown
  entitySlug?: unknown
  entityLabel?: unknown
  locale?: unknown
}

const asStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

export async function POST(request: Request): Promise<NextResponse> {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_body' }, { status: 400 })
  }

  const email = asStr(body.email)
  const entityType = asStr(body.entityType) as EntityType | undefined
  const entitySlug = asStr(body.entitySlug)
  if (!email || !entityType || !entitySlug) {
    return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 })
  }

  const result = await addFollow({
    email,
    entityType,
    entitySlug,
    entityLabel: asStr(body.entityLabel),
    locale: asStr(body.locale),
  })

  // One concise log line per capture so the funnel is observable in Vercel logs
  // (no PII beyond the entity followed — the email itself is never logged).
  console.log(
    `[follow] ${entityType}:${entitySlug} → ${result.ok ? (result.already ? 'already' : 'new') : `fail:${result.reason}`}`
  )

  if (result.ok) return NextResponse.json(result, { status: 200 })

  // Map a failure reason to the right status. 'unconfigured'/'error' are our
  // fault (5xx); the rest are the caller's (4xx).
  const status = result.reason === 'unconfigured' || result.reason === 'error' ? 503 : 400
  return NextResponse.json(result, { status })
}
