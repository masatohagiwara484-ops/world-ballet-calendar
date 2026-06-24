import type { Metadata } from 'next'
import { getCompanies } from '@/lib/data'
import VenueMapLoader from '@/components/map/VenueMapLoader'
import type { VenueMarker } from '@/components/map/VenueMap'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Map',
  description:
    'The world&rsquo;s great ballet and opera houses on one map. Find the companies near you and plan a performance worth the journey.',
}

export default async function MapPage() {
  const companies = await getCompanies()

  // Only houses we can actually place. lat/lng are required on Company, but
  // guard anyway so a bad row can never blank the map.
  const venues: VenueMarker[] = companies
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      city: c.city,
      country: c.country,
      venue: c.venue,
      lat: c.lat,
      lng: c.lng,
    }))

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">
            Where in the world
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            The map of great houses
          </h1>
          <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-xl leading-relaxed">
            Every house we cover, placed on the map. Find the companies near you —
            or somewhere worth travelling to — and plan a performance around the
            trip.
          </p>
          <p className="mt-4 text-ivory/40 text-sm">
            {venues.length} {venues.length === 1 ? 'house' : 'houses'} on the map
          </p>
        </div>

        <VenueMapLoader
          venues={venues}
          enableNearMe
          className="h-[68vh] min-h-[460px] w-full glass-panel"
        />
      </div>
    </main>
  )
}
