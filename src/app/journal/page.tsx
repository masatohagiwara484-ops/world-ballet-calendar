import type { Metadata } from 'next'
import { journal } from '@/data/journal'
import ArticleCard from '@/components/journal/ArticleCard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Journal',
  description:
    'Travel guides, work explainers and company stories for balletomanes — how to see ballet and opera around the world, and plan the trip around it.',
  alternates: { canonical: '/journal' },
}

export default function JournalPage() {
  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">
            The Journal
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            On ballet, opera &amp; the journey
          </h1>
          <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-xl leading-relaxed">
            Travel guides, work explainers and company stories — written by hand,
            to help you fall for a performance and plan the trip around it.
          </p>
          <div className="mt-10 hairline border-t" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {journal.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </main>
  )
}
