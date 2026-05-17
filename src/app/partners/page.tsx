import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Partners — World Ballet & Opera Calendar',
  description:
    'The trusted ticketing and travel partners behind the World Ballet & Opera Calendar — bringing the world’s finest stages within reach.',
  openGraph: {
    title: 'Our Partners — World Ballet & Opera Calendar',
    description:
      'The trusted ticketing and travel partners behind the World Ballet & Opera Calendar.',
  },
}

/* ---------- Data ---------- */

type Partner = {
  name: string
  monogram: string
  description: string
  accent: 'navy' | 'forest' | 'purple' | 'gold'
}

const accentMap: Record<Partner['accent'], string> = {
  navy: '#1B2A4A',
  forest: '#1A3A2E',
  purple: '#2D1B4E',
  gold: '#D4AF37',
}

const ticketingPartners: Partner[] = [
  {
    name: 'The Royal Opera House',
    monogram: 'RO',
    description:
      'Direct access to Covent Garden seasons — ballet and opera from one of the world’s most storied stages.',
    accent: 'navy',
  },
  {
    name: 'Paris Opéra',
    monogram: 'PO',
    description:
      'Reserve seats at the Palais Garnier and Opéra Bastille, home of the oldest national ballet company.',
    accent: 'forest',
  },
  {
    name: 'Bolshoi Theatre',
    monogram: 'BT',
    description:
      'A historic Moscow institution renowned for grand-scale classical ballet and operatic repertoire.',
    accent: 'purple',
  },
  {
    name: 'Metropolitan Opera',
    monogram: 'MO',
    description:
      'Tickets to the Met at Lincoln Center — the largest classical music organisation in North America.',
    accent: 'gold',
  },
]

const travelPartners: Partner[] = [
  {
    name: 'SkyTeam Travel',
    monogram: 'ST',
    description:
      'Curated flight itineraries to the cultural capitals where the season’s premieres take the stage.',
    accent: 'navy',
  },
  {
    name: 'Global Air Partners',
    monogram: 'GA',
    description:
      'Premium-cabin fares and flexible routing for the dedicated patron travelling between performances.',
    accent: 'purple',
  },
  {
    name: 'Maison Stay Collection',
    monogram: 'MS',
    description:
      'Hand-picked hotels within walking distance of the great opera houses and ballet theatres.',
    accent: 'gold',
  },
]

/* ---------- Card ---------- */

function PartnerCard({ partner }: { partner: Partner }) {
  const accent = accentMap[partner.accent]
  return (
    <article className="group relative bg-white rounded-lg overflow-hidden border border-[#1A1A1A]/[0.08] shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300">
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="p-8">
        {/* Logo placeholder — serif monogram */}
        <div
          className="w-16 h-16 flex items-center justify-center rounded border-2 mb-6"
          style={{ borderColor: accent }}
        >
          <span
            className="font-serif text-2xl font-light"
            style={{ color: accent }}
          >
            {partner.monogram}
          </span>
        </div>
        <h3 className="font-serif text-xl font-light text-[#1A1A1A] mb-3">
          {partner.name}
        </h3>
        <p className="text-[#1A1A1A]/60 text-sm leading-relaxed">
          {partner.description}
        </p>
      </div>
    </article>
  )
}

/* ---------- Page ---------- */

export default function PartnersPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 100%)' }}
    >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-white/[0.92] backdrop-blur-md border-b border-[#1A1A1A]/[0.08] shadow-sm">
        <Link
          href="/"
          className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase hover:opacity-70 transition-opacity duration-300"
        >
          ← World Calendar
        </Link>
        <span className="text-[#1A1A1A]/40 text-xs tracking-widest uppercase">
          Partners
        </span>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-16 px-8 md:px-16 lg:px-24 border-b border-[#1A1A1A]/[0.08]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[#D4AF37] text-xs tracking-[0.3em] uppercase mb-5">
            Trusted Network
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight text-[#1A1A1A] mb-6">
            Our Partners
          </h1>
          <p className="text-[#1A1A1A]/60 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-light">
            We work alongside the world’s most respected ticketing platforms
            and travel partners to bring every performance — and every journey to
            it — within reach.
          </p>
        </div>
      </section>

      {/* Ticketing Partners */}
      <section className="py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-serif text-3xl font-light text-[#1A1A1A]">
              Ticketing Partners
            </h2>
            <span className="text-[#1A1A1A]/40 text-sm">
              {ticketingPartners.length} venues
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {ticketingPartners.map((partner) => (
              <PartnerCard key={partner.name} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Travel Partners */}
      <section className="pb-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-serif text-3xl font-light text-[#1A1A1A]">
              Travel Partners
            </h2>
            <span className="text-[#1A1A1A]/40 text-sm">
              {travelPartners.length} services
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {travelPartners.map((partner) => (
              <PartnerCard key={partner.name} partner={partner} />
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate disclosure */}
      <section className="pb-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <div className="border border-[#1A1A1A]/[0.08] rounded-lg bg-white/60 p-6">
            <p className="text-[#1A1A1A]/40 text-[10px] tracking-[0.3em] uppercase mb-3">
              Affiliate Disclosure
            </p>
            <p className="text-[#1A1A1A]/50 text-xs leading-relaxed">
              World Ballet &amp; Opera Calendar may earn a commission when you
              book tickets, flights, or accommodation through links to our
              partners. This comes at no additional cost to you and helps us keep
              the calendar free, independent, and continually updated. We only
              partner with services we believe genuinely serve our audience.
            </p>
          </div>
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
