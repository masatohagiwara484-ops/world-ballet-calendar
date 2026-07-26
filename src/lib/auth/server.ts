/**
 * Auth-capable server client — for Server Components / Route Handlers that
 * need the visitor's session (auth.uid()) via cookies. See src/lib/auth/browser.ts
 * for the client-side counterpart and src/lib/supabase.ts for the anon,
 * session-less client used by public reads.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Called from a Server Component (no response to write cookies
            // to) — middleware refreshes the session on the next request.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, '', options)
          } catch {
            // Same as set() above.
          }
        },
      },
    }
  )
}
