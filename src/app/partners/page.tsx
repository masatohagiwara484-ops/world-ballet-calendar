import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PARTNER_STATUS } from '@/lib/affiliate'

export const metadata: Metadata = {
  title: 'Plan Your Visit — première',
  description:
    'Hotels near the great opera houses, curated tours and backstage experiences, and flights to the cultural capitals — the travel layer of première is live.',
  openGraph: {
    title: 'Plan Your Visit — première',
    description:
      'Hotels, tours, and flights curated for ballet and opera-goers — live on every performance and trip page.',
  },
}

/* ---------- Partner category data ---------- */

type PartnerState = 'live' | 'links-active' | 'deep-link'

type Category = {
  icon: string
  label: string
  eyebrow: string
  headline: string
  body: string
  accent: string
  partner: string
  state: PartnerState
}

const STATE_LABEL: Record<PartnerState, string> = {
  live: 'Live — partnership active',
  'links-active': 'Links live — partnership pending',
  'deep-link': 'Live — direct link',
}

const categories: Category[] = [
  {
    icon: '🏨',
    label: 'Hotels',
    eyebrow: 'Accommodation',
    headline: 'Stay steps from the stage',
    body:
      'Hotel searches near the great opera houses and ballet theatres, pre-dated to the run you are booking. Every performance and trip page links straight into a stay that matches the curtain times — so the evening does not end when the curtain falls.',
    accent: '#1B2A4A',
    partner: 'Booking.com',
    state: PARTNER_STATUS.booking ? 'live' : 'links-active',
  },
  {
    icon: '🎭',
    label: 'Experiences',
    eyebrow: 'Backstage & Tours',
    headline: 'Beyond the performance',
    body:
      'Tours, museums and cultural experiences in each performance city — the daytime around the evening. Surfaced through GetYourGuide and Tiqets, filtered by the city you are travelling to.',
    accent: '#1A3A2E',
    partner: 'GetYourGuide · Tiqets',
    state: PARTNER_STATUS.getyourguide || PARTNER_STATUS.tiqets ? 'live' : 'links-active',
  },
  {
    icon: '✈️',
    label: 'Flights',
    eyebrow: 'Travel',
    headline: 'Fly to the cultural capitals',
    body:
      'Flight searches to the cities where the season’s premieres take the stage — London, Paris, Vienna, Milan, New York, Tokyo — dated to the performance run, so you build the trip around the curtain, not the airline schedule.',
    accent: '#2D1B4E',
    partner: 'Google Flights',
    state: PARTNER_STATUS.flights ? 'live' : 'deep-link',
  },
]

/* ---------- Category Card ---------- */

function CategoryCard({ cat }: { cat: Category }) {
  const live = cat.state !== 'links-active'
  return (
    <article className="glass-card specular relative overflow-hidden rounded-glass">
      {/* Jewel accent top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: cat.accent }} />
      <div className="p-8 md:p-10">
        {/* Icon in a light monogram well */}
        <div
          className="w-14 h-14 flex items-center justify-center rounded-glass-sm border mb-6"
          style={{
            borderColor: 'rgba(26,22,15,0.10)',
            background: 'rgba(255,255,255,0.80)',
            boxShadow: '0 4px 16px rgba(26,22,15,0.06)',
          }}
        >
          <span role="img" aria-hidden="true" className="text-2xl leading-none">
            {cat.icon}
          </span>
        </div>

        <p
          className="mb-3"
          style={{
            color: '#A8842A',
            fontSize: '11px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {cat.eyebrow}
        </p>
        <h3 className="font-serif text-2xl text-ivory mb-4">
          {cat.headline}
        </h3>
        <p className="text-ivory/70 text-sm leading-relaxed mb-6">
          {cat.body}
        </p>

        {/* Partner + status */}
        <div className="flex items-center justify-between gap-3 pt-4"
          style={{ borderTop: '1px solid rgba(26,22,15,0.08)' }}
        >
          <span className="text-ivory/55 text-xs">{cat.partner}</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-gold-deep' : 'bg-ivory/25'}`}
            />
            <span
              style={{
                color: live ? '#A8842A' : 'rgba(26,26,26,0.40)',
                fontSize: '10px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              {STATE_LABEL[cat.state]}
            </span>
          </span>
        </div>
      </div>
    </article>
  )
}

/* ---------- Page ---------- */

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-stage">
      {/* Hero */}
      <section className="pt-40 pb-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="mb-5"
            style={{
              color: '#A8842A',
              fontSize: '11px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
            }}
          >
            The travel layer
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-tight text-gradient-gold mb-6">
            Plan your performance trip
          </h1>
          <p className="text-ivory/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            A performance is the heart of the evening. Everything around it —
            where you stay, how you get there, what you discover along the way —
            is now bundled on every performance page and in our city trip
            guides, curated specifically for ballet and opera-goers.
          </p>
          <div className="mt-9">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gold text-[#111] font-semibold text-xs tracking-[0.22em] uppercase hover:bg-gold-bright hover:shadow-glow-gold transition-all"
            >
              Browse trip bundles
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Live status badge */}
      <div className="flex justify-center px-6 pb-12">
        <div className="glass-pill px-6 py-2.5 inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-deep" />
          <span
            style={{
              color: '#A8842A',
              fontSize: '11px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Live — first partnerships active
          </span>
        </div>
      </div>

      {/* Three partner categories */}
      <section className="py-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.label} cat={cat} />
            ))}
          </div>
        </div>
      </section>

      {/* Vision statement */}
      <section className="py-20 px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel p-10 md:p-14 text-center">
            <p
              className="mb-5"
              style={{
                color: '#A8842A',
                fontSize: '11px',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
              }}
            >
              Our vision
            </p>
            <p className="font-serif text-2xl md:text-3xl text-ivory leading-snug mb-6">
              The full journey, not just the ticket.
            </p>
            <p className="text-ivory/70 text-sm leading-relaxed">
              We believe attending the ballet or opera should be effortless from
              the first search to the final bow. Curated hotels, tours, and
              flights now sit alongside every performance listing — so you can
              plan an entire trip from a single calendar. We only surface
              services we believe genuinely serve our audience.
            </p>
          </div>
        </div>
      </section>

      {/* Disclosure note */}
      <section className="pb-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-glass-sm px-6 py-5"
            style={{
              border: '1px solid rgba(26,22,15,0.08)',
              background: 'rgba(255,255,255,0.50)',
            }}
          >
            <p
              className="mb-2"
              style={{
                color: '#A8842A',
                fontSize: '10px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              A note on independence
            </p>
            <p className="text-ivory/60 text-xs leading-relaxed">
              premi&egrave;re may earn a referral fee when you book
              accommodation, experiences, or travel through links on this site.
              This comes at no additional cost to you, and it helps us keep the
              calendar free, independent, and continually updated. We only
              surface services we believe genuinely serve our audience — the
              performance always comes first.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
