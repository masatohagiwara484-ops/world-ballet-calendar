/**
 * TripItinerary — the night-by-night plan on a /trips/[city] page.
 *
 * Each night of the featured stay lists what's on stage that evening, linked
 * to the performance page (and its ticket link one click away). Free evenings
 * are honest about it — a night at leisure, not a blank row.
 */
import Link from 'next/link'
import { formatDay } from '@/components/shared/format'
import type { TripNight } from '@/lib/trips'

export default function TripItinerary({ nights }: { nights: TripNight[] }) {
  return (
    <ol className="space-y-0">
      {nights.map((night, i) => (
        <li
          key={night.date}
          className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-5 border-b border-ivory/[0.08] last:border-b-0"
        >
          <div className="sm:w-40 flex-shrink-0">
            <p className="text-gold-deep text-[10px] tracking-[0.3em] uppercase mb-1">
              Night {i + 1}
            </p>
            <p className="text-gold text-sm font-medium tabular-nums">
              {formatDay(night.date)}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            {night.performances.length > 0 ? (
              <ul className="space-y-1.5">
                {night.performances.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/performances/${p.id}`}
                      className="group inline-flex flex-wrap items-baseline gap-x-2"
                    >
                      <span className="font-serif text-base text-ivory group-hover:text-gold transition-colors">
                        {p.title}
                      </span>
                      <span className="text-ivory/45 text-xs">
                        {p.company.name}
                        {(p.venue ?? p.company.venue) && (
                          <span className="text-ivory/30">
                            {' '}· {p.venue ?? p.company.venue}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ivory/40 text-sm italic">
                An evening at leisure — explore the city.
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
