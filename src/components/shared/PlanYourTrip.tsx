/**
 * "Plan your trip" — the travel-affiliate aside shown beside a performance.
 *
 * Turns a single show into a trip: hotels dated to the run, experiences,
 * flights and attractions in the city. The bundle itself is TripBundleStrip
 * (single source of truth with /trips and /partners); this aside adds the
 * city header and the door into the full /trips/[city] guide.
 */
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { TripContext } from '@/lib/affiliate'
import { citySlug } from '@/lib/cities'
import TripBundleStrip from './TripBundleStrip'

export function PlanYourTrip({ ctx }: { ctx: TripContext }) {
  return (
    <div className="glass-panel p-6 mt-6">
      <p className="text-[10px] tracking-[0.3em] uppercase text-ivory/50 mb-1">Make a night of it</p>
      <p className="text-ivory/45 text-[11px] mb-4">{ctx.city}, {ctx.country}</p>
      <TripBundleStrip ctx={ctx} variant="vertical" />
      <Link
        href={`/trips/${citySlug(ctx.city)}`}
        className="mt-4 flex items-center justify-between rounded-xl px-3 py-3 border border-gold/25 bg-gold/[0.06] hover:bg-gold/[0.12] hover:border-gold/50 transition-all group"
      >
        <span className="text-gold-deep text-[11px] tracking-[0.18em] uppercase">
          Full trip guide — {ctx.city}
        </span>
        <ArrowUpRight size={14} className="text-gold-deep opacity-70 group-hover:opacity-100 transition-opacity" />
      </Link>
    </div>
  )
}
