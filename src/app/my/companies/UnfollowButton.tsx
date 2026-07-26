'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/auth/browser'

export default function UnfollowButton({
  entitySlug,
  entityLabel,
}: {
  entitySlug: string
  entityLabel: string
}) {
  const router = useRouter()
  const [removing, setRemoving] = useState(false)

  async function unfollow() {
    setRemoving(true)
    const supabase = createClient()
    // RLS scopes this delete to the signed-in visitor's own rows.
    await supabase.from('follows').delete().eq('entity_type', 'company').eq('entity_slug', entitySlug)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={unfollow}
      disabled={removing}
      className="text-ivory/45 text-[11px] tracking-[0.16em] uppercase hover:text-gold transition-colors disabled:opacity-60"
    >
      {removing ? <Loader2 size={12} className="animate-spin inline" /> : `Unfollow ${entityLabel}`}
    </button>
  )
}
