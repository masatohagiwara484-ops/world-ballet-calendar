/**
 * Shared editorial-design helpers for the White Gradient Luxury system.
 * NO external photography anywhere — every "image" surface is a typographic
 * gradient composed here, so the site reads like a printed season brochure.
 * Each gradient is a rich jewel-tone wash (navy / forest / wine / plum) that
 * sits like a colour plate against the warm-white page, with white monogram
 * text reading clearly on top.
 */
import type { Company, Performance } from '@/lib/types'

/** Rich jewel-tone accent gradients, rotated deterministically per entity. */
export const LUXE_GRADIENTS: string[] = [
  'linear-gradient(135deg, #243B63 0%, #1B2A4A 55%, #111B30 100%)', // midnight navy
  'linear-gradient(135deg, #235041 0%, #1A3A2E 55%, #0F2419 100%)', // deep forest
  'linear-gradient(135deg, #5E2839 0%, #4A1F2E 55%, #2E121C 100%)', // wine bordeaux
  'linear-gradient(135deg, #3D2667 0%, #2D1B4E 55%, #1B1030 100%)', // royal plum
]

/** Stable hash so the same slug/id always gets the same palette. */
function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function gradientFor(key: string): string {
  return LUXE_GRADIENTS[hashString(key) % LUXE_GRADIENTS.length]
}

/** 1–2 letter monogram from a company/performance name. */
export function monogram(name: string): string {
  const words = name
    .replace(/^(the|le|la|les|el|de)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return '·'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export const KIND_LABEL: Record<'ballet' | 'opera', string> = {
  ballet: 'Ballet',
  opera: 'Opera',
}

export function typeLabel(type: Company['type']): string {
  if (type === 'both') return 'Ballet & Opera'
  return type === 'ballet' ? 'Ballet' : 'Opera'
}

/** Composer / choreographer credit line for a performance. */
export function creditLine(p: Pick<Performance, 'composer' | 'choreographer'>): string | null {
  const parts: string[] = []
  if (p.composer) parts.push(`Music · ${p.composer}`)
  if (p.choreographer) parts.push(`Choreography · ${p.choreographer}`)
  return parts.length ? parts.join('   ·   ') : null
}

/** Best available booking URL for a performance. */
export function bookingUrl(p: Pick<Performance, 'affiliate_url' | 'ticket_url'>): string | null {
  return p.affiliate_url ?? p.ticket_url ?? null
}
