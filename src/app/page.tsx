import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getCompanies, getPerformances } from '@/lib/data'
import HeroGlobe from '@/components/globe/HeroGlobe'
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
      <HeroGlobe />

      {/* This Week on Stage */}
      <section
        aria-label="This week on stage"
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-[#D4AF37] text-[11px] tracking-[0.4em] uppercase mb-3">
                On Stage Now
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-[#1A1A1A]">
                This week on stage
              </h2>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1.5 text-[#1B2A4A] text-xs tracking-[0.2em] uppercase hover:text-[#D4AF37] transition-colors"
            >
              Full calendar
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {strip.length > 0 ? (
            <div className="border-b border-[#1A1A1A]/[0.08]">
              {strip.map((p) => (
                <PerformanceListItem key={p.id} performance={p} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-[#1A1A1A]/40 text-sm border-y border-[#1A1A1A]/[0.08]">
              The new season is being announced. Check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Companies teaser */}
      <section
        aria-label="Featured companies"
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <p className="text-[#D4AF37] text-[11px] tracking-[0.4em] uppercase mb-3">
                Directory
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-[#1A1A1A]">
                The companies
              </h2>
            </div>
            <Link
              href="/companies"
              className="inline-flex items-center gap-1.5 text-[#1B2A4A] text-xs tracking-[0.2em] uppercase hover:text-[#D4AF37] transition-colors"
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
        className="py-20 md:py-28 px-6 md:px-10 border-t border-[#1A1A1A]/[0.08]"
        style={{ background: '#FAF8F5' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1A1A1A]/[0.07] border border-[#1A1A1A]/[0.07] rounded-md overflow-hidden">
            {[
              {
                step: '01',
                title: 'Discover by globe',
                body: 'Spin the world and find companies in every cultural capital, from London to Tokyo.',
              },
              {
                step: '02',
                title: 'Plan by calendar',
                body: 'Browse the full season month by month, filtered to ballet or opera, country or company.',
              },
              {
                step: '03',
                title: 'Follow companies',
                body: 'Open a company to read its story and see every production of the 2026–27 season.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white p-10">
                <p className="font-serif text-3xl font-light text-[#D4AF37] mb-5">
                  {item.step}
                </p>
                <h3 className="font-serif text-xl font-light text-[#1A1A1A] mb-3">
                  {item.title}
                </h3>
                <p className="text-[#1A1A1A]/55 text-sm leading-relaxed">
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
