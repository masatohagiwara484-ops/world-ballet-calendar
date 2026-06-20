/**
 * "Plan your trip" — the travel-affiliate aside shown beside a performance.
 *
 * Turns a single show into a trip: hotels near the venue, plus experiences and
 * attractions in the city. Every link is built by src/lib/affiliate.ts, so it
 * works immediately and starts earning the moment the affiliate ids are set.
 */
import { Building2, Compass, Ticket, ExternalLink } from 'lucide-react'
import { hotelsUrl, experiencesUrl, attractionsUrl, type TripContext } from '@/lib/affiliate'

export function PlanYourTrip({ ctx }: { ctx: TripContext }) {
  const links = [
    { label: 'Hotels near the venue', sub: 'Booking.com', href: hotelsUrl(ctx), Icon: Building2 },
    { label: 'Tours & experiences', sub: 'GetYourGuide', href: experiencesUrl(ctx), Icon: Compass },
    { label: 'Museums & attractions', sub: 'Tiqets', href: attractionsUrl(ctx), Icon: Ticket },
  ]

  return (
    <div className="glass-panel p-6 mt-6">
      <p className="text-[10px] tracking-[0.3em] uppercase text-ivory/50 mb-1">Make a night of it</p>
      <p className="text-ivory/45 text-[11px] mb-4">{ctx.city}, {ctx.country}</p>
      <ul className="space-y-2.5">
        {links.map(({ label, sub, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-3 rounded-xl px-3 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
            >
              <Icon size={18} className="text-gold-deep shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-ivory text-sm">{label}</span>
                <span className="block text-ivory/40 text-[11px]">{sub}</span>
              </span>
              <ExternalLink size={13} className="text-ivory/30 group-hover:text-gold-deep transition-colors" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-ivory/35 text-[10px] leading-relaxed">
        We may earn a referral fee on bookings made through these links — at no extra cost to you.
      </p>
    </div>
  )
}
