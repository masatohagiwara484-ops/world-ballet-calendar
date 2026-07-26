/**
 * Refreshes the Supabase auth session cookie on every navigable request.
 * Standard @supabase/ssr pattern — see src/lib/auth/middleware.ts. No route
 * protection here: the only auth-gated page (/my/companies) checks the
 * session itself and shows a sign-in prompt rather than redirecting.
 */
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff|woff2)$).*)',
  ],
}
