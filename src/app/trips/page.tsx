import type { Metadata } from 'next'
import { getTripCityCards } from '@/lib/trips'
import { todayISO } from '@/lib/dates'
import { formatDay } from '@/components/shared/format'
import CityTile from '@/components/cities/CityTile'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Trip bundles — plan a performance trip — première',
  description:
    'Plan an entire trip around a performance: tickets, a hotel dated to the run, experiences and flights — bundled for the great ballet and opera cities of the world.',
  openGraph: {
    title: 'Trip bundles — plan a performance trip — première',
    description:
      'Tickets, hotel, experiences and flights — bundled around the stage calendar of every great ballet and opera city.',
  },
}

export default async function TripsPage() {
  const cards = await getTripCityCards()
  const today = todayISO()

  return (
    <main className="min-h-screen">
      <section className="pt-36 pb-16 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-4">
            Trip bundles
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-gradient-gold leading-[1.05]">
            Plan the trip around the performance
          </h1>
          <p className="mt-6 text-ivory/60 text-base max-w-2xl">
            Pick a city, and we assemble the evening into a journey — tickets,
            a hotel dated to the run, experiences for the daytime, and the
            flight that gets you to the curtain on time.
          </p>
        </div>
      </section>

      <section className="pb-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({ city, upcomingCount, nextDate }) => (
            <CityTile
              key={city.slug}
              slug={city.slug}
              name={city.name}
              country={city.country}
              href={`/trips/${city.slug}`}
              footer={
                nextDate
                  ? nextDate <= today
                    ? 'On stage now'
                    : `Next run · ${formatDay(nextDate)}`
                  : upcomingCount > 0
                    ? `${upcomingCount} upcoming`
                    : 'Plan ahead'
              }
            />
          ))}
        </div>
      </section>
    </main>
  )
}
