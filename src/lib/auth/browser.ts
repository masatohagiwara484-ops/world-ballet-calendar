/**
 * Auth-capable browser client — the counterpart to src/lib/supabase.ts's
 * anon/nullable client, but session-aware (cookies via @supabase/ssr) so it
 * can call supabase.auth.signInWithOtp() / onAuthStateChange() from client
 * components. Unlike src/lib/supabase.ts this throws if unconfigured: pages
 * that reach this module (login, /my/companies) already require Supabase.
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
}
