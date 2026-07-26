'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/auth/browser'

export default function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="text-ivory/45 text-[11px] tracking-[0.16em] uppercase hover:text-gold transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 size={12} className="animate-spin inline" /> : 'Sign out'}
    </button>
  )
}
