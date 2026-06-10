/**
 * Shared editorial-design helpers for the White Gradient Luxury system.
 * NO external photography anywhere — every "image" surface is a typographic
 * gradient composed here, so the site reads like a printed season brochure.
 */
import type { Company, Performance } from '@/lib/types'

/** Deep luxury accent gradients, rotated deterministically per entity. */
export const LUXE_GRADIENTS: string[] = [
  'linear-gradient(135deg, #1B2A4A 0%, #0E1730 55%, #1B2A4A 100%)', // navy
  'linear-gradient(135deg, #1A3A2E 0%, #0C201A 55%, #1A3A2E 100%)', // forest
  'linear-gradient(135deg, #2D1B4E 0%, #170D2A 55%, #2D1B4E 100%)', // purple
  'linear-gradient(135deg, #3A2D12 0%, #1C1607 50%, #6B5316 100%)', // gold-bronze
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
