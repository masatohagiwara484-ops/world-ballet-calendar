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

/**
 * A WHITE-BASED gradient for a given hue — the whisper-tint plate used by
 * company cards. Stays inside White Gradient Luxury: near-white, low saturation,
 * so ink text and gold rules sit cleanly on top. Hue assignment (so no two
 * companies read alike) lives in src/lib/companyPalette.ts.
 */
export function lightGradientForHue(hue: number): string {
  const h = Math.round(((hue % 360) + 360) % 360)
  const soft = `hsl(${h} 36% 90%)`
  const softer = `hsl(${h} 30% 95%)`
  return `linear-gradient(135deg, #FFFFFF 0%, ${softer} 48%, ${soft} 100%)`
}

/**
 * Country flag as an emoji from an ISO 3166-1 alpha-2 code (e.g. "gb" → 🇬🇧).
 * Pure Unicode — no external image/asset is loaded. Returns "" for a bad code.
 * (Note: some platforms, e.g. Windows Chrome, render the two letters instead of
 * a flag glyph; swap for an SVG flag set later if that matters.)
 */
export function flagEmoji(countryCode: string): string {
  const cc = (countryCode || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(cc)) return ''
  const A = 0x1f1e6
  return String.fromCodePoint(
    A + (cc.charCodeAt(0) - 65),
    A + (cc.charCodeAt(1) - 65)
  )
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

/** A ticket destination plus whether it's a direct booking link or the company's
 *  official site used as a box-office fallback (so the CTA can label itself). */
export interface TicketTarget {
  url: string
  /** true → company official site (label "Visit box office"); false → direct
   *  booking/ticket link (label "Book tickets"). */
  isBoxOffice: boolean
}

/**
 * Resolve where a "buy tickets" CTA should point. Prefers a direct booking link;
 * when none was captured for this performance, falls back to the company's
 * official website as a box-office link, so there is ALWAYS a path to purchase
 * rather than a dead end (the gap behind review #1). Returns null only when even
 * the company website is unknown.
 */
export function ticketTarget(
  p: Pick<Performance, 'affiliate_url' | 'ticket_url'>,
  company?: { website?: string | null }
): TicketTarget | null {
  const direct = p.affiliate_url ?? p.ticket_url
  if (direct) return { url: direct, isBoxOffice: false }
  if (company?.website) return { url: company.website, isBoxOffice: true }
  return null
}
