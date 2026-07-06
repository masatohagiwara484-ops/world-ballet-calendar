import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { getCities } from '@/lib/cities'
import { getCityTrip } from '@/lib/trips'
import { gradientFor, monogram } from '@/components/shared/design'
import { formatRange, formatDay } from '@/components/shared/format'
import CityScene, { hasCityScene } from '@/components/cities/CityScene'
import TripBundleStrip from '@/components/shared/TripBundleStrip'
import TripItinerary from '@/components/trips/TripItinerary'
import FollowButton from '@/components/audience/FollowButton'

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: { city: string }
}

export async function generateStaticParams() {
  const cities = await getCities()
  return cities.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await getCityTrip(params.city)
  if (!trip) return {}
  const { city, run } = trip
  const title = `A ballet & opera trip to ${city.name} — hotels, tickets & itinerary`
  const description = run
    ? `Plan a performance trip to ${city.name}, ${city.country}: the next run opens ${formatDay(run.startDate)} — tickets, a hotel dated to the stay, experiences and flights, in one bundle.`
    : `Plan a performance trip to ${city.name}, ${city.country} — tickets, hotels, experiences and flights around the city's ballet and opera season, in one bundle.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  }
}

export default async function TripPage({ params }: Props) {
  const trip = await getCityTrip(params.city)
  if (!trip) notFound()

  const { city, ctx, upcoming, run, nights } = trip
  const gradient = gradientFor(city.slug)
  const scene = hasCityScene(city.slug)
  const featured = upcoming[0]

  // TouristTrip JSON-LD — the itinerary is the city's upcoming stage calendar.
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: `A ballet & opera trip to ${city.name}`,
    description: `A performance-first trip to ${city.name}, ${city.country} — tickets, hotel, experiences and flights planned around the stage calendar.`,
    touristType: 'Culture traveller',
  }
  if (upcoming.length > 0) {
    jsonLd.itinerary = {
      '@type': 'ItemList',
      itemListElement: upcoming.slice(0, 10).map((p, i) => {
        const event: Record<string, unknown> = {
          '@type': 'TheaterEvent',
          name: p.title,
          startDate: p.start_date,
          endDate: p.end_date,
          performer: { '@type': 'PerformingGroup', name: p.company.name },
        }
        const venue = p.venue ?? p.company.venue
        if (venue) event.location = { '@type': 'Place', name: venue }
        return { '@type': 'ListItem', position: i + 1, item: event }
      }),
    }
  }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Gradient hero */}
      <section
        className="relative pt-36 pb-24 px-6 md:px-10 overflow-hidden"
        style={{ background: gradient }}
      >
        {scene && (
          <>
            <CityScene
              slug={city.slug}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(8,8,12,0.55) 0%, rgba(8,8,12,0.35) 42%, rgba(8,8,12,0.78) 100%)',
              }}
            />
          </>
        )}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[34rem] h-[34rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
        {!scene && (
          <span
            aria-hidden
            className="absolute -bottom-16 -left-6 font-serif font-light text-white/[0.06] leading-none select-none pointer-events-none"
            style={{ fontSize: 'clamp(14rem, 40vw, 38rem)' }}
          >
            {monogram(city.name)}
          </span>
        )}

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 text-gold text-[11px] tracking-[0.2em] uppercase hover:text-gold-bright transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            All trips
          </Link>

          <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-5">
            Trip bundle · {city.country}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            A ballet &amp; opera weekend in {city.name}
          </h1>

          {run ? (
            <p className="mt-8 text-white/85 text-lg font-medium">
              Next stay · {formatRange(run.startDate, run.endDate)}
            </p>
          ) : (
            <p className="mt-8 text-white/70 text-lg">
              No dates announced yet — plan ahead below.
            </p>
          )}
          <p className="mt-3 text-white/60 text-sm max-w-2xl">
            The performance is the heart of the evening. Everything around it —
            the seat, the hotel, the flight, the day before curtain — bundled
            into one plan.
          </p>
        </div>
      </section>

      {/* The bundle */}
      <section className="py-16 md:py-20 px-6 md:px-10 bg-stage-raised">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
              The bundle
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-ivory">
              Build the trip in five steps
            </h2>
            {run && (
              <p className="mt-3 text-ivory/55 text-sm max-w-2xl">
                Hotel and flight links below are pre-dated to the stay —{' '}
                {formatRange(run.startDate, run.endDate)}.
              </p>
            )}
          </div>
          <TripBundleStrip
            ctx={ctx}
            variant="grid"
            tickets={
              featured
                ? {
                    href: `/performances/${featured.id}`,
                    label: `Tickets — ${featured.title}`,
                    sub: 'Start with the performance',
                  }
                : {
                    href: `/cities/${city.slug}`,
                    label: `What's on in ${city.name}`,
                    sub: 'Start with the performance',
                  }
            }
          />
        </div>
      </section>

      {/* Night-by-night itinerary */}
      <section className="py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
                Night by night
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-ivory">
                Your evenings in {city.name}
              </h2>
            </div>
            <FollowButton
              entityType="city"
              entitySlug={city.slug}
              entityLabel={city.name}
              prompt={`Follow ${city.name}`}
            />
          </div>

          {nights.length > 0 ? (
            <div className="glass-panel specular px-5 sm:px-8 py-2">
              <TripItinerary nights={nights} />
            </div>
          ) : (
            <div className="glass-panel py-20 text-center">
              <p className="text-ivory/40 text-xs tracking-[0.3em] uppercase mb-3">
                No performances listed yet
              </p>
              <p className="text-ivory/55 text-sm">
                Follow {city.name} above and we&rsquo;ll email you the moment new
                dates are announced — the bundle links already work for any
                dates you choose.
              </p>
            </div>
          )}

          {/* More dates + cross-link to the city page */}
          {upcoming.length > 1 && (
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="text-ivory/50 text-sm">
                {upcoming.length} upcoming productions in {city.name}
              </p>
              <Link
                href={`/cities/${city.slug}`}
                className="inline-flex items-center gap-1.5 text-gold-deep text-[11px] tracking-[0.18em] uppercase hover:text-gold transition-colors"
              >
                See the full calendar
                <ArrowUpRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
