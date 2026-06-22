import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getCities, getCityBySlug } from '@/lib/cities'
import { searchAsync } from '@/lib/search'
import { gradientFor, monogram } from '@/components/shared/design'
import EntityPerformanceRow from '@/components/entity/EntityPerformanceRow'
import FollowButton from '@/components/audience/FollowButton'
import type { SearchResultItem } from '@/lib/types'

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const cities = await getCities()
  return cities.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = await getCityBySlug(params.slug)
  if (!city) return {}
  const title = `Ballet & opera in ${city.name} — what’s on`
  const description = `Every ballet and opera performance in ${city.name}, ${city.country} — companies, dates, venues and tickets, all in one place on première.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  }
}

export default async function CityPage({ params }: Props) {
  const city = await getCityBySlug(params.slug)
  if (!city) notFound()

  const { items, total } = await searchAsync({ city: city.name, page_size: 200 })

  // Group by year for visual organisation.
  const byYear = new Map<string, SearchResultItem[]>()
  for (const item of items) {
    const year = item.start_date.slice(0, 4)
    const group = byYear.get(year) ?? []
    group.push(item)
    byYear.set(year, group)
  }
  const years = [...byYear.keys()].sort()
  const gradient = gradientFor(city.slug)

  return (
    <main className="min-h-screen">
      {/* Gradient hero */}
      <section
        className="relative pt-36 pb-24 px-6 md:px-10 overflow-hidden"
        style={{ background: gradient }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[34rem] h-[34rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
        <span
          aria-hidden
          className="absolute -bottom-16 -left-6 font-serif font-light text-white/[0.06] leading-none select-none pointer-events-none"
          style={{ fontSize: 'clamp(14rem, 40vw, 38rem)' }}
        >
          {monogram(city.name)}
        </span>

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/cities"
            className="inline-flex items-center gap-1.5 text-gold text-[11px] tracking-[0.2em] uppercase hover:text-gold-bright transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            All cities
          </Link>

          <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-5">{city.country}</p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            {city.name}
          </h1>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-white/60 text-sm">
              {total} {total === 1 ? 'production' : 'productions'}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-white/60 text-sm">
              {city.companies.length}{' '}
              {city.companies.length === 1 ? 'company' : 'companies'}
            </span>
          </div>

          {/* Companies in this city */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {city.companies.map((c) => (
              <Link
                key={c.slug}
                href={`/companies/${c.slug}`}
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs text-white/80 hover:border-gold hover:text-gold transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Performance list */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
                What’s on
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-ivory">
                Performances in {city.name}
              </h2>
            </div>
            <FollowButton
              entityType="city"
              entitySlug={city.slug}
              entityLabel={city.name}
              prompt={`Follow ${city.name}`}
            />
          </div>

          {total === 0 ? (
            <div className="glass-panel py-20 text-center">
              <p className="text-ivory/40 text-xs tracking-[0.3em] uppercase mb-3">
                No performances listed yet
              </p>
              <p className="text-ivory/55 text-sm">
                Follow {city.name} above and we’ll email you the moment new dates are announced.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {years.map((year) => (
                <div key={year}>
                  <p className="text-gold-deep/70 text-[11px] tracking-[0.4em] uppercase mb-4">
                    {year}
                  </p>
                  <div className="glass-panel specular px-5 sm:px-8 py-2">
                    {byYear.get(year)!.map((item) => (
                      <EntityPerformanceRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
