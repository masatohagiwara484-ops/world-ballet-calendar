/**
 * Shared editorial-design helpers for the Liquid Glass × Champagne Noir system.
 * NO external photography anywhere — every "image" surface is a typographic
 * gradient composed here, so the site reads like a printed season brochure
 * lit by an opera house at night. Each gradient is a deep glass-dark wash with
 * a warm champagne/wine/navy tint so monogram text (white/ivory) reads clearly.
 */
import type { Company, Performance } from '@/lib/types'

/** Deep glass-dark accent gradients, rotated deterministically per entity. */
export const LUXE_GRADIENTS: string[] = [
  'linear-gradient(135deg, #1B2A4A 0%, #0B1426 55%, #0A0908 100%)', // midnight navy
  'linear-gradient(135deg, #4A1F2E 0%, #2A0F18 55%, #0A0908 100%)', // wine bordeaux
  'linear-gradient(135deg, #3A2D12 0%, #1C1607 50%, #0A0908 100%)', // bronze gold
  'linear-gradient(135deg, #121110 0%, #1A1816 50%, #0A0908 100%)', // stage noir
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
