import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { buildGraph, buildGraphAsync } from '@/lib/graph'
import { searchAsync } from '@/lib/search'
import { gradientFor, monogram } from '@/components/shared/design'
import EntityPerformanceRow from '@/components/entity/EntityPerformanceRow'
import type { SearchResultItem } from '@/lib/types'

export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: { slug: string }
}

/** Human-readable kind label, handles 'concert'. */
function kindLabel(kind: string): string {
  if (kind === 'ballet') return 'Ballet'
  if (kind === 'opera') return 'Opera'
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

export async function generateStaticParams() {
  const { works } = buildGraph()
  return works.map((w) => ({ slug: w.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { workBySlug } = await buildGraphAsync()
  const work = workBySlug.get(params.slug)
  if (!work) return {}

  const title = `${work.title} — where to see it worldwide`
  const description = `Find every performance of ${work.title} (${kindLabel(work.kind)}) worldwide — companies, dates, venues and tickets, all in one place.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary', title, description },
  }
}

export default async function WorkPage({ params }: Props) {
  const { workBySlug, personBySlug } = await buildGraphAsync()
  const work = workBySlug.get(params.slug)
  if (!work) notFound()

  // Resolve composer name if present
  const composer = work.composer_id
    ? [...personBySlug.values()].find((p) => p.id === work.composer_id) ?? null
    : null

  // Fetch every performance of this work
  const { items, total } = await searchAsync({ work_slug: params.slug, page_size: 200 })

  // Group by year for visual organisation
  const byYear = new Map<string, SearchResultItem[]>()
  for (const item of items) {
    const year = item.start_date.slice(0, 4)
    const group = byYear.get(year) ?? []
    group.push(item)
    byYear.set(year, group)
  }
  const years = [...byYear.keys()].sort()

  const gradient = gradientFor(params.slug)

  // JSON-LD
  const jsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: work.title,
      ...(work.title_original ? { alternateName: work.title_original } : {}),
      ...(composer ? { author: { '@type': 'Person', name: composer.name } } : {}),
      genre: kindLabel(work.kind),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${work.title} — worldwide performances`,
      numberOfItems: total,
      itemListElement: items.slice(0, 50).map((item, idx) => {
        const event: Record<string, unknown> = {
          '@type': 'TheaterEvent',
          position: idx + 1,
          name: item.title,
          startDate: item.start_date,
          endDate: item.end_date,
          performer: { '@type': 'PerformingGroup', name: item.company.name },
        }
        const venue = item.venue ?? item.company.venue
        if (venue) event.location = { '@type': 'Place', name: venue }
        const ticket = item.affiliate_url ?? item.ticket_url
        if (ticket)
          event.offers = {
            '@type': 'Offer',
            url: ticket,
            availability: 'https://schema.org/InStock',
          }
        return event
      }),
    },
  ]

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
        {/* Gold aura */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[34rem] h-[34rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
        {/* Watermark monogram */}
        <span
          aria-hidden
          className="absolute -bottom-16 -left-6 font-serif font-light text-white/[0.06] leading-none select-none pointer-events-none"
          style={{ fontSize: 'clamp(14rem, 40vw, 38rem)' }}
        >
          {monogram(work.title)}
        </span>

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-gold text-[11px] tracking-[0.2em] uppercase hover:text-gold-bright transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            All works
          </Link>

          <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-5">
            {kindLabel(work.kind)}
            {composer && (
              <span className="text-white/50">
                {' '}·{' '}
                <Link
                  href={`/people/${composer.slug}`}
                  className="hover:text-gold transition-colors"
                >
                  {composer.name}
                </Link>
              </span>
            )}
          </p>

          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            {work.title}
          </h1>
          {work.title_original && work.title_original !== work.title && (
            <p className="mt-3 text-white/55 text-lg font-light italic">
              {work.title_original}
            </p>
          )}

          <div className="mt-10 flex items-center gap-6">
            <span className="text-white/60 text-sm">
              {total}{' '}
              {total === 1 ? 'production worldwide' : 'productions worldwide'}
            </span>
          </div>
        </div>
      </section>

      {/* Performance list */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
              Where to see it
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-ivory">
              Worldwide productions
            </h2>
          </div>

          {total === 0 ? (
            <div className="glass-panel py-20 text-center">
              <p className="text-ivory/40 text-xs tracking-[0.3em] uppercase mb-3">
                No productions listed yet
              </p>
              <p className="text-ivory/55 text-sm">
                Check back soon — this work&rsquo;s upcoming productions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {years.map((year) => (
                <div key={year}>
                  <h3 className="font-serif text-xl text-ivory/50 mb-4 border-b border-ivory/[0.08] pb-3">
                    {year}
                  </h3>
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
