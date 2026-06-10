import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getPerformances } from '@/lib/data'
import { formatRange } from '@/components/shared/format'
import { gradientFor, monogram, KIND_LABEL, bookingUrl } from '@/components/shared/design'
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
        <span
          aria-hidden
          className="absolute -bottom-20 -left-6 font-serif font-light text-white/[0.06] leading-none select-none pointer-events-none"
          style={{ fontSize: 'clamp(16rem, 42vw, 40rem)' }}
        >
          {monogram(p.title)}
        </span>

        <div className="relative max-w-4xl mx-auto">
          <Link
            href={`/companies/${p.company.slug}`}
            className="inline-flex items-center gap-1.5 text-[#D4AF37] text-[11px] tracking-[0.2em] uppercase hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            {p.company.name}
          </Link>
          <p className="text-[#D4AF37] text-[11px] tracking-[0.34em] uppercase mb-4">
            {KIND_LABEL[p.kind]} · {p.company.country}
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-white leading-[1.05]">
            {p.title}
          </h1>
          {p.title_original && p.title_original !== p.title && (
            <p className="mt-3 text-white/55 text-lg font-light italic">
              {p.title_original}
            </p>
          )}
          <p className="mt-7 text-white/80 text-lg">
            {formatRange(p.start_date, p.end_date)}
          </p>
        </div>
      </section>

      {/* Detail body */}
      <section className="py-16 md:py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-12">
          <div>
            {p.description && (
              <p className="font-serif text-xl md:text-2xl font-light text-[#1A1A1A]/80 leading-relaxed md:leading-loose mb-12">
                {p.description}
              </p>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-7 gap-x-10">
              <Detail label="Company" value={p.company.name} href={`/companies/${p.company.slug}`} />
              {venue && <Detail label="Venue" value={venue} />}
              <Detail label="Dates" value={formatRange(p.start_date, p.end_date)} />
              {p.composer && <Detail label="Composer" value={p.composer} />}
              {p.choreographer && <Detail label="Choreographer" value={p.choreographer} />}
              {p.price_range && <Detail label="Tickets from" value={p.price_range} />}
            </dl>
          </div>

          {/* Booking aside */}
          <aside className="md:sticky md:top-28 h-fit">
            <div className="border border-[#1A1A1A]/[0.08] rounded-md bg-white p-6 shadow-card">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/40 mb-2">
                Reserve your seat
              </p>
              <p className="font-serif text-xl font-light text-[#1A1A1A] mb-5">
                {p.company.name}
              </p>
              {ticket ? (
                <a
                  href={ticket}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#D4AF37] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#B8941F] transition-colors"
                >
                  Book tickets
                  <ExternalLink size={14} />
                </a>
              ) : (
                <p className="text-[#1A1A1A]/45 text-sm">
                  Booking opens closer to the performance dates.
                </p>
              )}
              <Link
                href={`/companies/${p.company.slug}`}
                className="block text-center mt-3 text-[#1B2A4A] text-[11px] tracking-[0.18em] uppercase hover:text-[#D4AF37] transition-colors"
              >
                View company
              </Link>
            </div>
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
      <dt className="text-[10px] tracking-[0.24em] uppercase text-[#1A1A1A]/35 mb-1.5">
        {label}
      </dt>
      <dd className="text-[#1A1A1A] text-base">
        {href ? (
          <Link href={href} className="hover:text-[#D4AF37] transition-colors">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
