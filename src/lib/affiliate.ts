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

export interface TripContext {
  city: string
  country: string
  lat: number
  lng: number
  /** Performance dates → sensible hotel check-in/out defaults. */
  startDate?: string
  endDate?: string
}

const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AID
const GYG_PID = process.env.NEXT_PUBLIC_GYG_PARTNER_ID
const TIQETS_PID = process.env.NEXT_PUBLIC_TIQETS_PARTNER

/** True when at least one affiliate program is wired (drives disclosure copy). */
export const AFFILIATE_ACTIVE = Boolean(BOOKING_AID || GYG_PID || TIQETS_PID)

function nextDayUTC(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Hotels near the venue, dated to the run (Booking.com). */
export function hotelsUrl(ctx: TripContext): string {
  const params = new URLSearchParams({
    ss: `${ctx.city}, ${ctx.country}`,
    latitude: String(ctx.lat),
    longitude: String(ctx.lng),
    group_adults: '2',
  })
  if (ctx.startDate) {
    params.set('checkin', ctx.startDate)
    params.set(
      'checkout',
      ctx.endDate && ctx.endDate > ctx.startDate ? ctx.endDate : nextDayUTC(ctx.startDate)
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
