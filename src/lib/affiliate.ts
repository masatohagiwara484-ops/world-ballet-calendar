/**
 * Affiliate / travel deep-links — the revenue layer ("make a night of it").
 *
 * Each builder returns a link that WORKS TODAY (a normal search on the partner
 * site) and silently upgrades to a commission-bearing link the moment its
 * affiliate id is present in the environment. No id → the link still sends the
 * visitor somewhere useful; we simply earn nothing until we join that program.
 *
 * Put the ids in the environment (never commit them). They are NEXT_PUBLIC_*
 * because the links render in the page:
 *   NEXT_PUBLIC_BOOKING_AID        — Booking.com affiliate id (hotels)
 *   NEXT_PUBLIC_GYG_PARTNER_ID     — GetYourGuide partner id (tours/experiences)
 *   NEXT_PUBLIC_TIQETS_PARTNER     — Tiqets partner id (museums/attractions)
 */
import { addDaysISO } from './dates'

export interface TripContext {
  city: string
  country: string
  /** Venue coordinates when known — city-derived contexts may lack them. */
  lat?: number
  lng?: number
  /** Performance dates → sensible hotel check-in/out defaults. */
  startDate?: string
  endDate?: string
}

const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID
// GetYourGuide partner ID — NEXT_PUBLIC so it's client-visible (not a secret).
// Falls back to the production partner ID when the env var is absent.
const GYG_PID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID ?? 'UCDLK80'
const TIQETS_PID = process.env.NEXT_PUBLIC_TIQETS_PARTNER

/** True when at least one affiliate program is wired (drives disclosure copy). */
export const AFFILIATE_ACTIVE = Boolean(BOOKING_AID || GYG_PID || TIQETS_PID)

/** Hotels near the venue, dated to the run (Booking.com). */
export function hotelsUrl(ctx: TripContext): string {
  const params = new URLSearchParams({
    ss: `${ctx.city}, ${ctx.country}`,
    group_adults: '2',
  })
  if (ctx.lat != null && ctx.lng != null) {
    params.set('latitude', String(ctx.lat))
    params.set('longitude', String(ctx.lng))
  }
  if (ctx.startDate) {
    params.set('checkin', ctx.startDate)
    params.set(
      'checkout',
      ctx.endDate && ctx.endDate > ctx.startDate ? ctx.endDate : addDaysISO(ctx.startDate, 1)
    )
  }
  if (BOOKING_AID) params.set('aid', BOOKING_AID)
  return `https://www.booking.com/searchresults.html?${params.toString()}`
}

/** Tours & experiences in the city (GetYourGuide). */
export function experiencesUrl(ctx: TripContext): string {
  const params = new URLSearchParams({ q: ctx.city })
  if (GYG_PID) params.set('partner_id', GYG_PID)
  return `https://www.getyourguide.com/s/?${params.toString()}`
}

/** Museums & attractions in the city (Tiqets). */
export function attractionsUrl(ctx: TripContext): string {
  const params = new URLSearchParams({ q: ctx.city })
  if (TIQETS_PID) params.set('partner', TIQETS_PID)
  return `https://www.tiqets.com/en/search?${params.toString()}`
}

/**
 * Flights to the city, dated to the run (Google Flights deep link).
 * No affiliate program yet — a useful link today that can be swapped for a
 * commission-bearing flights partner behind an env id later, exactly like the
 * builders above.
 */
export function flightsUrl(ctx: TripContext): string {
  let q = `flights to ${ctx.city}`
  if (ctx.startDate) {
    q += ` on ${ctx.startDate}`
    if (ctx.endDate && ctx.endDate > ctx.startDate) q += ` through ${ctx.endDate}`
  }
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`
}

/* ==========================================================================
 * Trip bundle — the single source of truth for every travel surface
 * --------------------------------------------------------------------------
 * One ordered list drives the performance-page sidebar and the /trips pages;
 * PARTNER_STATUS below drives the /partners status board. `live` = the
 * affiliate id for that partner is configured (the link earns commission); a
 * non-live link still works — it simply earns nothing yet.
 * ========================================================================== */

export type BundleKey = 'hotels' | 'experiences' | 'flights' | 'attractions'

export interface BundleLink {
  key: BundleKey
  label: string
  partner: string
  href: string
  /** True when this partner's affiliate id is configured (commission-bearing). */
  live: boolean
}

/** Per-partner affiliate state — drives the /partners status board. */
export const PARTNER_STATUS = {
  booking: Boolean(BOOKING_AID),
  getyourguide: Boolean(GYG_PID),
  tiqets: Boolean(TIQETS_PID),
  flights: false, // deep link only — no flights affiliate program yet
} as const

/** The travel bundle for a trip context: hotel → experiences → flight → attractions. */
export function tripBundle(ctx: TripContext): BundleLink[] {
  return [
    {
      key: 'hotels',
      label: 'Hotels near the venue',
      partner: 'Booking.com',
      href: hotelsUrl(ctx),
      live: PARTNER_STATUS.booking,
    },
    {
      key: 'experiences',
      label: 'Tours & experiences',
      partner: 'GetYourGuide',
      href: experiencesUrl(ctx),
      live: PARTNER_STATUS.getyourguide,
    },
    {
      key: 'flights',
      label: 'Flights to the city',
      partner: 'Google Flights',
      href: flightsUrl(ctx),
      live: PARTNER_STATUS.flights,
    },
    {
      key: 'attractions',
      label: 'Museums & attractions',
      partner: 'Tiqets',
      href: attractionsUrl(ctx),
      live: PARTNER_STATUS.tiqets,
    },
  ]
}
