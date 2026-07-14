import type { Metadata } from 'next'
import { getMediaSources } from '@/lib/media'
import MediaSourceCard from '@/components/read/MediaSourceCard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Read — where to follow ballet & opera',
  description:
    'A curated directory of the world’s leading ballet and opera publications — reviews, criticism and interviews. Independent external media, linked with care.',
  alternates: { canonical: '/read' },
}

export default function ReadPage() {
  const sources = getMediaSources()

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">
            Read
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            Where to read about ballet
          </h1>
          <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-2xl leading-relaxed">
            A curated index of the critics and magazines worth following — reviews,
            interviews and criticism from the world’s great stages. Every card opens an
            independent publication in a new tab.
          </p>
          <p className="mt-4 text-ivory/40 text-xs tracking-[0.16em] uppercase">
            External media · we link out, we don’t reproduce
          </p>
          <div className="mt-10 hairline border-t" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => (
            <MediaSourceCard key={source.id} source={source} />
          ))}
        </div>
      </div>
    </main>
  )
}
