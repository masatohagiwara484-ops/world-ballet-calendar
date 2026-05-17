import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company, Performance } from '@/lib/supabase'
import PerformanceCard from '@/components/performance/PerformanceCard'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('companies')
    .select('slug')
    .eq('is_active', true)

  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { data } = await supabase
    .from('companies')
    .select('name, description_short, city, country')
    .eq('slug', params.slug)
    .single()

  if (!data) return {}

  return {
    title: `${data.name} — World Ballet & Opera Calendar`,
    description: data.description_short ?? `${data.name} performances in ${data.city}`,
    openGraph: {
      title: data.name,
      description: data.description_short ?? `${data.name} performances in ${data.city}`,
    },
  }
}

/* ---------- JSON-LD structured data helpers ---------- */

type JsonLd = Record<string, unknown>

function buildPerformingGroup(company: Company): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PerformingGroup',
    name: company.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.city,
      addressCountry: company.country,
    },
  }
  if (company.founded_year) node.foundingDate = String(company.founded_year)
  if (company.website) node.url = company.website
  if (company.description_short ?? company.description) {
    node.description = company.description_short ?? company.description
  }
  return node
}

function buildTheaterEvents(
  company: Company,
  performances: Performance[]
): JsonLd[] {
  const performer: JsonLd = {
    '@type': 'PerformingGroup',
    name: company.name,
  }

  return performances.map((perf) => {
    const event: JsonLd = {
      '@context': 'https://schema.org',
      '@type': 'TheaterEvent',
      name: perf.title,
      startDate: perf.start_date,
      performer,
    }
    if (perf.end_date) event.endDate = perf.end_date

    if (perf.venue) {
      const place: JsonLd = {
        '@type': 'Place',
        name: perf.venue,
      }
      if (perf.venue_address) {
        place.address = perf.venue_address
      }
      event.location = place
    }

    const ticketUrl = perf.affiliate_url ?? perf.ticket_url
    if (ticketUrl) {
      event.offers = {
        '@type': 'Offer',
        url: ticketUrl,
        availability: 'https://schema.org/InStock',
      }
    }
    return event
  })
}

export default async function CompanyPage({ params }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !company) notFound()

  const { data: performancesData } = await supabase
    .from('performances')
    .select('*')
    .eq('company_id', company.id)
    .gte('start_date', today)
    .order('start_date')

  const performances: Performance[] = performancesData ?? []

  const structuredData: JsonLd[] = [
    buildPerformingGroup(company),
    ...buildTheaterEvents(company, performances),
  ]

  const heritageYears = company.founded_year ? 2026 - company.founded_year : null

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}
    >
      {/* SEO — JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-white/[0.92] backdrop-blur-md border-b border-[#1A1A1A]/[0.08] shadow-sm">
        <Link
          href="/"
          className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase hover:opacity-70 transition-opacity duration-300"
        >
          ← World Calendar
        </Link>
        <span className="text-[#1A1A1A]/40 text-xs tracking-widest uppercase">
          {company.type} · {company.city}
        </span>
      </nav>

      {/* Hero */}
      {company.hero_image ? (
        <section className="relative pt-40 pb-20 px-8 md:px-16 lg:px-24 border-b border-[#1A1A1A]/[0.08] overflow-hidden">
          {/* Hero background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${company.hero_image})` }}
            aria-hidden
          />
          {/* White gradient overlay for legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.82) 55%, #F5F0EA 100%)',
            }}
            aria-hidden
          />
          <div className="relative max-w-5xl mx-auto">
            <HeroContent company={company} heritageYears={heritageYears} />
          </div>
        </section>
      ) : (
        <section className="pt-40 pb-20 px-8 md:px-16 lg:px-24 border-b border-[#1A1A1A]/[0.08]">
          <div className="max-w-5xl mx-auto">
            <HeroContent company={company} heritageYears={heritageYears} />
          </div>
        </section>
      )}

      {/* Performances */}
      <section className="py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-serif text-3xl font-light text-[#1A1A1A]">
              Upcoming Performances
            </h2>
            <span className="text-[#1A1A1A]/40 text-sm">
              {performances.length} scheduled
            </span>
          </div>

          {performances.length > 0 ? (
            <div className="grid gap-6">
              {performances.map((perf) => (
                <PerformanceCard
                  key={perf.id}
                  performance={perf}
                  companyCity={company.city}
                  companyCountry={company.country}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border border-[#1A1A1A]/[0.08] rounded-lg bg-white/60">
              <p className="text-[#1A1A1A]/30 text-xs tracking-[0.3em] uppercase mb-3">
                No upcoming performances
              </p>
              <p className="text-[#1A1A1A]/40 text-sm">
                Check back for the next season announcement.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/[0.08] py-8 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-[#1A1A1A]/40 text-xs tracking-widest uppercase hover:text-[#1A1A1A] transition-colors duration-300"
          >
            ← Back to Calendar
          </Link>
          <p className="text-[#1A1A1A]/30 text-xs">
            World Ballet &amp; Opera Calendar &copy; 2026
          </p>
        </div>
      </footer>
    </main>
  )
}

/* ---------- Hero content (shared between image / text hero) ---------- */

function HeroContent({
  company,
  heritageYears,
}: {
  company: Company
  heritageYears: number | null
}) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div>
          <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-4">
            {company.country}
            {company.founded_year ? ` · Est. ${company.founded_year}` : ''}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-4 text-[#1A1A1A]">
            {company.name}
          </h1>
          {company.name_local && company.name_local !== company.name && (
            <p className="text-[#1A1A1A]/40 text-lg font-light">
              {company.name_local}
            </p>
          )}
          {heritageYears !== null && heritageYears > 0 && (
            <p className="mt-4 text-[#D4AF37] text-[11px] tracking-[0.25em] uppercase font-medium">
              {heritageYears}+ years of heritage
            </p>
          )}
        </div>

        {/* External links */}
        <div className="flex flex-wrap gap-3">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] text-xs tracking-widest uppercase hover:bg-[#D4AF37]/10 transition-all duration-300"
            >
              Official Site
            </a>
          )}
          {company.instagram && (
            <a
              href={`https://instagram.com/${company.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-[#1A1A1A]/30 text-[#1A1A1A]/60 text-xs tracking-widest uppercase hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-all duration-300"
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      {company.description && (
        <p className="mt-10 font-serif text-[#1A1A1A]/70 text-lg md:text-xl leading-relaxed md:leading-loose max-w-3xl font-light">
          {company.description}
        </p>
      )}
    </>
  )
}
