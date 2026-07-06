import type { Metadata } from 'next'
import { getCities } from '@/lib/cities'
import CityTile from '@/components/cities/CityTile'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Ballet & opera by city — première',
  description:
    'Browse ballet and opera by city — Paris, London, New York, Vienna, Tokyo and more. See which companies perform where, and what’s on this season.',
  openGraph: {
    title: 'Ballet & opera by city — première',
    description: 'Find ballet and opera performances in the great cultural capitals of the world.',
  },
}

export default async function CitiesPage() {
  const cities = await getCities()

  return (
    <main className="min-h-screen">
      <section className="pt-36 pb-16 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-4">Destinations</p>
          <h1 className="font-serif text-5xl md:text-6xl text-gradient-gold leading-[1.05]">
            Ballet &amp; opera by city
          </h1>
          <p className="mt-6 text-ivory/60 text-base max-w-2xl">
            The great stages of the world, gathered by city. Find who performs where — and plan the
            evening around the performance.
          </p>
        </div>
      </section>

      <section className="pb-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <CityTile
              key={city.slug}
              slug={city.slug}
              name={city.name}
              country={city.country}
              href={`/cities/${city.slug}`}
              footer={`${city.companies.length} ${
                city.companies.length === 1 ? 'company' : 'companies'
              }`}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
