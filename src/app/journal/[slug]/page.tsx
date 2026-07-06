import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { journal, getArticle } from '@/data/journal'
import { getCompanies } from '@/lib/data'
import GradientArt from '@/components/shared/GradientArt'
import JournalBody from '@/components/journal/JournalBody'
import NewsletterCapture from '@/components/audience/NewsletterCapture'
import { PlanYourTrip } from '@/components/shared/PlanYourTrip'
import type { Company } from '@/lib/types'

export const revalidate = 3600

export function generateStaticParams() {
  return journal.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const article = getArticle(params.slug)
  if (!article) return { title: 'Not found' }
  return {
    title: article.title,
    description: article.seo.description,
    keywords: article.seo.keywords,
    alternates: { canonical: `/journal/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.seo.description,
    },
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug)
  if (!article) notFound()

  const companies = await getCompanies()
  const related = (article.relatedCompanySlugs ?? [])
    .map((slug) => companies.find((c) => c.slug === slug))
    .filter((c): c is Company => Boolean(c))

  // Trip CTA needs venue coordinates; borrow them from a covered house in the
  // article's city (or the first related house) so "make a night of it" works.
  const tripCompany =
    article.cta?.kind === 'trip'
      ? companies.find((c) => article.cta?.city && c.city === article.cta.city) ?? related[0]
      : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seo.description,
    articleSection: article.category,
    keywords: article.seo.keywords.join(', '),
    author: { '@type': 'Organization', name: 'première' },
    publisher: { '@type': 'Organization', name: 'première' },
  }

  return (
    <main className="min-h-screen pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative pt-28 md:pt-32 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/journal"
            className="inline-flex items-center gap-1.5 text-ivory/50 text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors"
          >
            <ArrowLeft size={14} />
            The Journal
          </Link>
          <p className="mt-8 text-gold text-[11px] tracking-[0.4em] uppercase">
            {article.category} · {article.readingTime} · {article.publishedLabel}
          </p>
          <h1 className="mt-4 font-serif text-4xl md:text-6xl text-gradient-gold leading-[1.05]">
            {article.title}
          </h1>
          <p className="mt-6 text-ivory/65 text-lg md:text-xl leading-relaxed font-light">
            {article.dek}
          </p>
        </div>
        <div className="max-w-4xl mx-auto mt-12">
          <GradientArt
            seed={article.heroSeed}
            title={article.title}
            badge={article.category}
            className="aspect-[16/8] w-full rounded-glass"
            monogramClassName="text-8xl"
          />
        </div>
      </section>

      {/* Body */}
      <article className="mt-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          <JournalBody blocks={article.body} />
        </div>
      </article>

      {/* Related houses — internal links to deepen the funnel */}
      {related.length > 0 && (
        <section className="mt-20 px-6 md:px-10">
          <div className="max-w-3xl mx-auto border-t border-black/[0.08] pt-10">
            <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-6">
              Houses in this story
            </p>
            <div className="flex flex-wrap gap-3">
              {related.map((c) => (
                <Link
                  key={c.slug}
                  href={`/companies/${c.slug}`}
                  className="glass-pill px-5 py-2.5 text-sm text-ivory hover:text-gold border border-black/[0.08] hover:border-gold/40 transition-colors"
                >
                  {c.name}
                  <span className="text-ivory/40"> · {c.city}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Funnel CTA */}
      <section className="mt-16 px-6 md:px-10">
        <div className="max-w-3xl mx-auto">
          {tripCompany ? (
            <div>
              <p className="font-serif text-2xl md:text-3xl text-ivory mb-2">
                Make a night of it in {tripCompany.city}
              </p>
              <p className="text-ivory/55 text-sm mb-2">
                Plan the trip around a performance — hotels near the house, tours
                and the city itself.
              </p>
              <PlanYourTrip
                ctx={{
                  city: tripCompany.city,
                  country: tripCompany.country,
                  lat: tripCompany.lat,
                  lng: tripCompany.lng,
                }}
              />
            </div>
          ) : (
            <NewsletterCapture />
          )}
        </div>
      </section>
    </main>
  )
}
