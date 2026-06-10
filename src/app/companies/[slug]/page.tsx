import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCompanies, getCompanyBySlug, getPerformances } from '@/lib/data'
import { gradientFor, monogram, typeLabel } from '@/components/shared/design'
import PerformanceListItem from '@/components/shared/PerformanceListItem'
import type { Company, PerformanceWithCompany } from '@/lib/types'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const companies = await getCompanies()
  return companies.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug)
  if (!company) return {}
  const desc =
    company.description_short ??
    `${company.name} — ${typeLabel(company.type)} in ${company.city}, ${company.country}.`
  return {
    title: company.name,
    description: desc,
    openGraph: { title: company.name, description: desc },
  }
}

function buildJsonLd(
  company: Company,
  performances: PerformanceWithCompany[]
): Record<string, unknown>[] {
  const group: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'PerformingGroup',
    name: company.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.city,
      addressCountry: company.country,
    },
  }
  if (company.founded_year) group.foundingDate = String(company.founded_year)
  if (company.website) group.url = company.website
  if (company.description ?? company.description_short)
    group.description = company.description ?? company.description_short

  const events = performances.map((p) => {
    const event: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'TheaterEvent',
      name: p.title,
      startDate: p.start_date,
      endDate: p.end_date,
      performer: { '@type': 'PerformingGroup', name: company.name },
    }
    if (p.venue) event.location = { '@type': 'Place', name: p.venue }
    const ticket = p.affiliate_url ?? p.ticket_url
    if (ticket)
      event.offers = {
        '@type': 'Offer',
        url: ticket,
        availability: 'https://schema.org/InStock',
      }
    return event
  })

  return [group, ...events]
}

export default async function CompanyPage({ params }: Props) {
  const company = await getCompanyBySlug(params.slug)
  if (!company) notFound()

  const performances = await getPerformances({ company_slug: company.slug })
  const jsonLd = buildJsonLd(company, performances)
  const heritage = company.founded_year ? 2026 - company.founded_year : null

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Editorial gradient hero */}
      <section
        className="relative pt-36 pb-20 px-6 md:px-10 overflow-hidden"
        style={{ background: gradientFor(company.slug) }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[34rem] h-[34rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
        <span
          aria-hidden
          className="absolute -bottom-16 -left-6 font-serif font-light text-white/[0.06] leading-none select-none pointer-events-none"
          style={{ fontSize: 'clamp(16rem, 42vw, 40rem)' }}
        >
          {monogram(company.name)}
        </span>

        <div className="relative max-w-5xl mx-auto">
          <p className="text-gold text-[11px] tracking-[0.34em] uppercase mb-5">
            {typeLabel(company.type)} · {company.country}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            {company.name}
          </h1>
          {company.name_local && company.name_local !== company.name && (
            <p className="mt-3 text-white/60 text-lg font-light">
              {company.name_local}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-white/70 text-sm">
            <span>{company.city}</span>
            {company.venue && <span>{company.venue}</span>}
            {company.founded_year && <span>Founded {company.founded_year}</span>}
            {heritage && heritage > 0 && (
              <span className="text-gold">{heritage}+ years of heritage</span>
            )}
          </div>

          {(company.website || company.instagram) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill px-6 py-3 border border-gold/50 text-gold text-[11px] tracking-[0.2em] uppercase hover:bg-gold/10 hover:shadow-glow-gold transition-all"
                >
                  Official site
                </a>
              )}
              {company.instagram && (
                <a
                  href={`https://instagram.com/${company.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill px-6 py-3 border border-ivory/30 text-ivory/80 text-[11px] tracking-[0.2em] uppercase hover:border-ivory/60 transition-colors"
                >
                  Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      {(company.description || company.description_short) && (
        <section className="py-16 md:py-20 px-6 md:px-10 bg-stage-elevated">
          <div className="max-w-3xl mx-auto">
            <p className="font-serif text-xl md:text-2xl text-ivory/80 leading-relaxed md:leading-loose">
              {company.description ?? company.description_short}
            </p>
          </div>
        </section>
      )}

      {/* Season */}
      <section className="py-16 md:py-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-serif text-3xl md:text-4xl text-ivory">
              2026 – 27 Season
            </h2>
            <span className="text-ivory/40 text-sm">
              {performances.length} {performances.length === 1 ? 'production' : 'productions'}
            </span>
          </div>

          {performances.length > 0 ? (
            <div className="glass-panel specular px-5 sm:px-8 py-2">
              {performances.map((p, i) => (
                <div key={p.id} className={i === 0 ? '[&>a]:border-t-0' : ''}>
                  <PerformanceListItem performance={p} hideCompany />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel py-20 text-center">
              <p className="text-ivory/40 text-xs tracking-[0.3em] uppercase mb-3">
                Season to be announced
              </p>
              <p className="text-ivory/62 text-sm">
                This company&rsquo;s 2026–27 programme will appear here soon.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
