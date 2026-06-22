import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { getCities } from '@/lib/cities'
import { gradientFor } from '@/components/shared/design'

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
            <Link
              key={city.slug}
              href={`/cities/${city.slug}`}
              className="group relative overflow-hidden rounded-glass p-8 min-h-[180px] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
              style={{ background: gradientFor(city.slug) }}
            >
              <div
                aria-hidden
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-2xl"
                style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
              />
              <div className="relative">
                <p className="text-white/55 text-[10px] tracking-[0.3em] uppercase mb-2">
                  {city.country}
                </p>
                <h2 className="font-serif text-3xl text-white leading-tight">{city.name}</h2>
              </div>
              <div className="relative flex items-center justify-between">
                <span className="text-white/70 text-sm">
                  {city.companies.length}{' '}
                  {city.companies.length === 1 ? 'company' : 'companies'}
                </span>
                <ArrowUpRight
                  size={18}
                  className="text-gold opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
