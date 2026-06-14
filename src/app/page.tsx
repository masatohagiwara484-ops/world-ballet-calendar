import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getCompanies, getPerformances } from '@/lib/data'
import SearchHero from '@/components/home/SearchHero'
import CompanyCard from '@/components/shared/CompanyCard'
import PerformanceListItem from '@/components/shared/PerformanceListItem'

export const revalidate = 3600

/** This week's window, anchored to the current date. */
function thisWeekRange(): { start: string; end: string } {
  const now = new Date()
  const start = now.toISOString().slice(0, 10)
  const end = new Date(now.getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
  return { start, end }
}

export default async function HomePage() {
  const { start, end } = thisWeekRange()

  const [companies, weekPerformances, featured] = await Promise.all([
    getCompanies(),
    getPerformances({ start_date: start, end_date: end }),
    getPerformances({ featured_only: true }),
  ])

  // Prefer this-week runs; fall back to featured, then the earliest upcoming.
  let strip = weekPerformances
  if (strip.length === 0) strip = featured
  if (strip.length === 0) strip = await getPerformances({ start_date: start })
  strip = strip.slice(0, 5)

  const teaser = companies.slice(0, 8)

  return (
    <>
      <SearchHero />

      {/* This Week on Stage */}
      <section
        aria-label="This week on stage"
        className="relative py-20 md:py-28 px-6 md:px-10"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-3">
                On Stage Now
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-gradient-gold">
                This week on stage
              </h2>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 text-ivory/62 text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors"
            >
              Full calendar
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {strip.length > 0 ? (
            <div className="glass-panel specular px-5 sm:px-8 py-2">
              {strip.map((p, i) => (
                <div key={p.id} className={i === 0 ? '[&>a]:border-t-0' : ''}>
                  <PerformanceListItem performance={p} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-ivory/60 text-sm glass-panel">
              The new season is being announced. Check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Companies teaser */}
      <section
        aria-label="Featured companies"
        className="relative py-20 md:py-28 px-6 md:px-10 bg-stage-elevated"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 80% 0%, rgba(27,42,74,0.10) 0%, transparent 55%)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-3">
                Directory
              </p>
              <h2 className="font-serif text-4xl md:text-5xl text-ivory">
                The companies
              </h2>
            </div>
            <Link
              href="/companies"
              className="inline-flex items-center gap-1.5 text-ivory/62 text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors"
            >
              All companies
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teaser.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-label="How it works"
        className="py-20 md:py-28 px-6 md:px-10"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                title: 'Search by one word',
                body: 'Type a work, an artist, or a city — and surface every matching performance on Earth instantly.',
              },
              {
                step: '02',
                title: 'Filter the world',
                body: 'Narrow results by date, price, discipline, company, or choreographer across every major stage.',
              },
              {
                step: '03',
                title: 'Follow & never miss',
                body: 'Get on-sale alerts for your favourite companies and works the moment tickets go live. Coming soon.',
              },
            ].map((item) => (
              <div key={item.step} className="glass-card specular p-10">
                <p className="font-serif text-3xl text-gradient-gold mb-5">
                  {item.step}
                </p>
                <h3 className="font-serif text-xl text-ivory mb-3">
                  {item.title}
                </h3>
                <p className="text-ivory/62 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
