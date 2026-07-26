/**
 * GET /auth/callback — exchanges the magic-link code for a session, then
 * redirects to ?next (defaulting to /my/companies). Standard @supabase/ssr
 * PKCE recipe.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const rawNext = url.searchParams.get('next')
  const next = rawNext && rawNext.startsWith('/') ? rawNext : '/my/companies'

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
