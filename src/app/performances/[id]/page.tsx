import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company, Performance } from '@/lib/supabase'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

type PerformanceWithCompany = Performance & {
  companies: Company
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from('performances')
    .select('*, companies(*)')
    .eq('id', params.id)
    .single()

  const perf = data as PerformanceWithCompany | null
  if (!perf) return {}

  const companyName = perf.companies?.name ?? 'World Ballet & Opera Calendar'
  const titleStr = `${perf.title} — ${companyName}`
  const descStr = perf.description ?? `Discover ${perf.title} presented by ${companyName}. Plan your trip, find tickets, and explore upcoming performance seasons.`

  return {
    title: `${titleStr} — World Ballet & Opera Calendar`,
    description: descStr,
    openGraph: {
      title: titleStr,
      description: descStr,
      images: perf.image_url ? [{ url: perf.image_url }] : undefined,
    },
  }
}

export default async function PerformanceDetailPage({ params }: Props) {
  const { data } = await supabase
    .from('performances')
    .select('*, companies(*)')
    .eq('id', params.id)
    .single()

  const perf = data as PerformanceWithCompany | null
  if (!perf) notFound()

  const startDate = new Date(perf.start_date + 'T00:00:00')
  const endDate = perf.end_date ? new Date(perf.end_date + 'T00:00:00') : null

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Booking and Hotel URLs
  const bookingUrl = perf.affiliate_url ?? perf.ticket_url ?? '#'
  const hotelUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
    perf.companies.city
  )}&checkin=${perf.start_date}&checkout=${perf.end_date ?? perf.start_date}&label=world-ballet-opera-calendar`

  // Use performance image, fallback to company hero image, fallback to default Unsplash
  const coverImage = perf.image_url || perf.companies.hero_image || 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=1600&auto=format&fit=crop'

  // Structured Data JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TheaterEvent',
    name: perf.title,
    startDate: perf.start_date,
    endDate: perf.end_date || perf.start_date,
    location: {
      '@type': 'Place',
      name: perf.venue || perf.companies.city,
      address: perf.venue_address || `${perf.companies.city}, ${perf.companies.country}`,
    },
    image: coverImage,
    description: perf.description || `${perf.title} performed by ${perf.companies.name}`,
    performer: {
      '@type': 'PerformingGroup',
      name: perf.companies.name,
    },
    offers: perf.ticket_url ? {
      '@type': 'Offer',
      url: bookingUrl,
      availability: 'https://schema.org/InStock',
    } : undefined
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
          Performance Details
        </span>
      </nav>

      {/* Hero Header */}
      <section className="relative pt-40 pb-20 px-8 md:px-16 lg:px-24 border-b border-[#1A1A1A]/[0.08] overflow-hidden">
        {/* Parallax cover background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
          aria-hidden="true"
        />
        {/* White gradient overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.85) 60%, #F5F0EA 100%)',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1">
            <Link
              href={`/companies/${perf.companies.slug}`}
              className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-4 hover:underline inline-block"
            >
              {perf.companies.name}
            </Link>
            {perf.is_featured && (
              <span className="block w-fit mb-4 px-3 py-1 bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase font-semibold rounded-sm">
                Featured Production
              </span>
            )}
            <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight text-[#1A1A1A] mb-4">
              {perf.title}
            </h1>
            {perf.title_original && perf.title_original !== perf.title && (
              <p className="text-[#1A1A1A]/40 text-lg font-light italic mb-2">
                {perf.title_original}
              </p>
            )}
            {(perf.composer || perf.choreographer) && (
              <p className="text-[#1A1A1A]/60 text-base md:text-lg font-light tracking-wide mt-2">
                {perf.composer}
                {perf.choreographer && ` · Choreographed by ${perf.choreographer}`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 min-w-[200px] shrink-0">
            {perf.ticket_url && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#D4AF37] text-white text-xs tracking-[0.2em] uppercase hover:bg-[#B8941F] transition-all duration-300 text-center font-medium shadow-md hover:shadow-lg"
              >
                Book Tickets
              </a>
            )}
            <a
              href={hotelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-[#1A1A1A]/20 text-[#1A1A1A]/60 bg-white/60 backdrop-blur-sm text-xs tracking-[0.2em] uppercase hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-all duration-300 text-center"
            >
              Hotels in {perf.companies.city}
            </a>
          </div>
        </div>
      </section>

      {/* Info & Storytelling Section */}
      <section className="py-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Storytelling Description */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-3xl font-light text-[#1A1A1A] mb-8">
              About the Production
            </h2>
            {perf.description ? (
              <p className="font-serif text-[#1A1A1A]/70 text-lg md:text-xl leading-relaxed md:leading-loose font-light whitespace-pre-line">
                {perf.description}
              </p>
            ) : (
              <p className="font-serif text-[#1A1A1A]/40 text-lg md:text-xl leading-relaxed font-light italic">
                No description has been published for this season yet. Check back for upcoming program notes and casting announcements.
              </p>
            )}
          </div>

          {/* Performance Meta Sidebar Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#1A1A1A]/[0.08] p-8 rounded-xl shadow-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D4AF37]" />
              <h3 className="font-serif text-xl font-light text-[#1A1A1A] mb-6">Performance Details</h3>

              <div className="space-y-6">
                <div>
                  <p className="text-[#1A1A1A]/40 text-[10px] tracking-[0.25em] uppercase mb-1">Company</p>
                  <Link
                    href={`/companies/${perf.companies.slug}`}
                    className="text-[#D4AF37] font-medium text-sm hover:underline"
                  >
                    {perf.companies.name}
                  </Link>
                </div>

                <div>
                  <p className="text-[#1A1A1A]/40 text-[10px] tracking-[0.25em] uppercase mb-1">Dates</p>
                  <p className="text-[#1A1A1A] font-medium text-sm">
                    {formatDate(startDate)}
                    {endDate && ` — ${formatDate(endDate)}`}
                  </p>
                </div>

                {perf.venue && (
                  <div>
                    <p className="text-[#1A1A1A]/40 text-[10px] tracking-[0.25em] uppercase mb-1">Venue</p>
                    <p className="text-[#1A1A1A] font-medium text-sm">{perf.venue}</p>
                    {perf.venue_address && (
                      <p className="text-[#1A1A1A]/40 text-xs mt-1 leading-relaxed">{perf.venue_address}</p>
                    )}
                  </div>
                )}

                {perf.price_range && (
                  <div>
                    <p className="text-[#1A1A1A]/40 text-[10px] tracking-[0.25em] uppercase mb-1">Price Range</p>
                    <p className="text-[#D4AF37] font-semibold text-sm">{perf.price_range}</p>
                  </div>
                )}

                <div>
                  <p className="text-[#1A1A1A]/40 text-[10px] tracking-[0.25em] uppercase mb-1">Location</p>
                  <p className="text-[#1A1A1A] font-medium text-sm">
                    {perf.companies.city}, {perf.companies.country}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A]/[0.08] py-8 px-8 bg-white/[0.4]">
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
