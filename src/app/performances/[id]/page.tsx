import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getPerformances } from '@/lib/data'
import { formatRange } from '@/components/shared/format'
import { gradientFor, KIND_LABEL, bookingUrl, ticketTarget, creditLine } from '@/components/shared/design'
import { PlanYourTrip } from '@/components/shared/PlanYourTrip'
import AddToCalendar from '@/components/shared/AddToCalendar'
import VerifiedDates from '@/components/shared/VerifiedDates'
import type { PerformanceWithCompany } from '@/lib/types'

export const revalidate = 3600

interface Props {
  params: { id: string }
}

async function findPerformance(id: string): Promise<PerformanceWithCompany | null> {
  const all = await getPerformances()
  return all.find((p) => p.id === id) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await findPerformance(params.id)
  if (!p) return {}
  const desc =
    p.description ??
    `${p.title} performed by ${p.company.name}, ${formatRange(p.start_date, p.end_date)}${p.venue ? ` at ${p.venue}` : ''}.`
  return {
    title: `${p.title} — ${p.company.name}`,
    description: desc,
    openGraph: { title: `${p.title} — ${p.company.name}`, description: desc },
  }
}

export default async function PerformancePage({ params }: Props) {
  const p = await findPerformance(params.id)
  if (!p) notFound()

  const ticket = bookingUrl(p)
  // Two-tier CTA: a direct booking link when we have one, otherwise the
  // company's official site as a box-office fallback (review #1 — never a dead end).
  const tt = ticketTarget(p, p.company)
  const venue = p.venue ?? p.company.venue

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TheaterEvent',
    name: p.title,
    startDate: p.start_date,
    endDate: p.end_date,
    performer: { '@type': 'PerformingGroup', name: p.company.name },
  }
  if (venue) jsonLd.location = { '@type': 'Place', name: venue }
  if (p.description) jsonLd.description = p.description
  if (ticket)
    jsonLd.offers = {
      '@type': 'Offer',
      url: ticket,
      availability: 'https://schema.org/InStock',
    }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Gradient hero */}
      <section
        className="relative pt-36 pb-20 px-6 md:px-10 overflow-hidden"
        style={{ background: gradientFor(p.company.slug) }}
      >
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-[34rem] h-[34rem] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
        <div className="relative max-w-4xl mx-auto">
          <Link
            href={`/companies/${p.company.slug}`}
            className="inline-flex items-center gap-1.5 text-gold text-[11px] tracking-[0.2em] uppercase hover:text-gold-bright transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            {p.company.name}
          </Link>
          <p className="text-gold text-[11px] tracking-[0.34em] uppercase mb-4">
            {KIND_LABEL[p.kind]} · {p.company.country}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            {p.title}
          </h1>
          {p.title_original && p.title_original !== p.title && (
            <p className="mt-3 text-white/60 text-lg font-light italic">
              {p.title_original}
            </p>
          )}
          <p className="mt-7 text-white/85 text-lg font-medium">
            {formatRange(p.start_date, p.end_date)}
          </p>
          {venue && (
            <p className="mt-2 text-white/65 text-sm">{venue}</p>
          )}
          {creditLine(p) && (
            <p className="mt-4 text-white/50 text-sm tracking-wide">{creditLine(p)}</p>
          )}
          {p.price_range && (
            <p className="mt-3 text-gold text-sm font-medium">{p.price_range}</p>
          )}
          {(p.last_verified || p.source_url) && (
            <div className="mt-6">
              <VerifiedDates lastVerified={p.last_verified} sourceUrl={p.source_url} />
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {tt && (
              <a
                href={tt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold text-[#111] font-semibold text-xs tracking-[0.22em] uppercase hover:bg-gold-bright hover:shadow-glow-gold-strong transition-all"
              >
                {tt.isBoxOffice ? 'Visit box office' : 'Book tickets'}
                <ExternalLink size={14} />
              </a>
            )}
            <AddToCalendar
              event={{
                id: p.id,
                title: p.title,
                company: p.company.name,
                startDate: p.start_date,
                endDate: p.end_date,
                venue,
                city: p.company.city,
                country: p.company.country,
                url: ticket ?? undefined,
                description: p.description ?? undefined,
              }}
            />
          </div>
        </div>
      </section>

      {/* Detail body */}
      <section className="py-16 md:py-20 px-6 md:px-10 bg-stage-raised">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-12">
          <div>
            {p.description && (
              <p className="font-serif text-xl md:text-2xl text-ivory/75 leading-relaxed md:leading-loose mb-12">
                {p.description}
              </p>
            )}

            {/* Key facts strip */}
            <div className="glass-panel p-6 mb-10">
              <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">Production details</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-7 gap-x-10">
                <Detail label="Company" value={p.company.name} href={`/companies/${p.company.slug}`} />
                {venue && <Detail label="Venue" value={venue} />}
                <Detail label="Dates" value={formatRange(p.start_date, p.end_date)} />
                <Detail label="Discipline" value={KIND_LABEL[p.kind]} />
                {p.composer && <Detail label="Composer" value={p.composer} />}
                {p.choreographer && <Detail label="Choreography" value={p.choreographer} />}
                {p.price_range && <Detail label="Tickets from" value={p.price_range} />}
              </dl>
            </div>
          </div>

          {/* Booking aside */}
          <aside className="md:sticky md:top-28 h-fit">
            <div className="glass-panel specular p-6">
              <p className="text-[10px] tracking-[0.3em] uppercase text-ivory/50 mb-2">
                Reserve your seat
              </p>
              <p className="font-serif text-xl text-ivory mb-1">
                {p.company.name}
              </p>
              {p.price_range && (
                <p className="text-gold-deep text-sm mb-5">{p.price_range}</p>
              )}
              {!p.price_range && <div className="mb-5" />}
              {tt ? (
                <a
                  href={tt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-full bg-gold text-stage font-semibold text-xs tracking-[0.2em] uppercase hover:shadow-glow-gold hover:bg-gold-bright transition-all"
                >
                  {tt.isBoxOffice ? 'Visit box office' : 'Book tickets'}
                  <ExternalLink size={14} />
                </a>
              ) : (
                <p className="text-ivory/62 text-sm leading-relaxed">
                  Booking opens closer to the performance dates.
                </p>
              )}
              {/* Show the company link only when it isn't already the CTA target. */}
              {!(tt && tt.isBoxOffice) && (
                <Link
                  href={`/companies/${p.company.slug}`}
                  className="block text-center mt-5 text-ivory/55 text-[11px] tracking-[0.18em] uppercase hover:text-gold-deep transition-colors"
                >
                  View company &rarr;
                </Link>
              )}
            </div>

            <PlanYourTrip
              ctx={{
                city: p.company.city,
                country: p.company.country,
                lat: p.company.lat,
                lng: p.company.lng,
                startDate: p.start_date,
                endDate: p.end_date,
              }}
            />
          </aside>
        </div>
      </section>
    </main>
  )
}

function Detail({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.24em] uppercase text-ivory/38 mb-1.5">
        {label}
      </dt>
      <dd className="text-ivory text-base">
        {href ? (
          <Link href={href} className="hover:text-gold transition-colors">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
