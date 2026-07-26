/**
 * Session-refresh helper consumed by the root middleware.ts. Standard
 * @supabase/ssr recipe: read the request's cookies, call getUser() (not
 * getSession() — this validates the JWT against the auth server rather than
 * trusting the cookie blindly), and write any refreshed cookies onto the
 * response so the browser's session survives navigation.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  // Matches the rest of the codebase's "degrade gracefully when unconfigured"
  // posture — auth is simply unavailable rather than crashing every request.
  if (!isSupabaseConfigured()) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refreshes the session cookie as a side effect when the token is expired.
  await supabase.auth.getUser()

  return response
}
