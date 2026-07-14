import { Suspense } from 'react'
import type { Metadata } from 'next'
import { selectMediaSources, getMediaFacets, type MediaFilters } from '@/lib/media'
import MediaSourceCard from '@/components/read/MediaSourceCard'
import MediaFilterRail from '@/components/read/MediaFilterRail'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams: Record<string, string | string[] | undefined> }

function str(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

function parseFilters(params: Record<string, string | string[] | undefined>): MediaFilters {
  return { region: str(params.region), country: str(params.country) }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const f = parseFilters(searchParams)
  const where = f.country ?? f.region
  const title = where
    ? `Read — ballet & opera media in ${where}`
    : 'Read — where to follow ballet & opera'
  const description = where
    ? `Trusted ballet and opera publications covering ${where}, plus the international titles worth following worldwide.`
    : 'A curated directory of the world’s leading ballet and opera publications — reviews, criticism and interviews. Independent external media, linked with care.'
  return { title, description, alternates: { canonical: '/read' } }
}

/** Suspense wrapper — the rail uses useSearchParams(). */
function FilterRailSuspense(props: Parameters<typeof MediaFilterRail>[0]) {
  return (
    <Suspense fallback={<div className="hidden lg:block w-64 flex-shrink-0" />}>
      <MediaFilterRail {...props} />
    </Suspense>
  )
}

export default function ReadPage({ searchParams }: PageProps) {
  const filters = parseFilters(searchParams)
  const { filtered, national, global } = selectMediaSources(filters)
  const facets = getMediaFacets(filters)

  const where = filters.country ?? filters.region
  const heading = where ? `Reading from ${where}` : 'Where to read about ballet'

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">Read</p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            {heading}
          </h1>
          <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-2xl leading-relaxed">
            A curated index of the critics and magazines worth following — reviews,
            interviews and criticism from the world’s great stages. Every card opens an
            independent publication in a new tab.
          </p>
          <p className="mt-4 text-ivory/40 text-xs tracking-[0.16em] uppercase">
            External media · we link out, we don’t reproduce
          </p>
          <div className="mt-8 hairline border-t" />
        </div>

        <div className="flex gap-7 items-start">
          <FilterRailSuspense facets={facets} filters={filters} />

          <div className="flex-1 min-w-0">
            {/* Region / country results */}
            {national.length > 0 ? (
              <>
                {filtered && (
                  <p className="text-ivory/55 text-[11px] tracking-[0.28em] uppercase mb-5">
                    {national.length} {national.length === 1 ? 'title' : 'titles'} in {where}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {national.map((source) => (
                    <MediaSourceCard key={source.id} source={source} />
                  ))}
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center">
                <p className="font-serif text-2xl text-ivory/60 mb-3">
                  No titles based in {where} yet
                </p>
                <p className="text-ivory/50 text-sm max-w-md mx-auto">
                  Our directory is curated by hand and still growing here. The international
                  titles below cover it too — or clear the filter to see every publication.
                </p>
              </div>
            )}

            {/* Global / International bucket — always reachable under a filter */}
            {filtered && global.length > 0 && (
              <section className="mt-14">
                <div className="flex items-baseline gap-3 mb-5">
                  <h2 className="font-serif text-2xl md:text-3xl text-ivory">
                    Global &amp; international
                  </h2>
                  <span className="text-ivory/40 text-[11px] tracking-[0.24em] uppercase">
                    Worth following anywhere
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {global.map((source) => (
                    <MediaSourceCard key={source.id} source={source} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
