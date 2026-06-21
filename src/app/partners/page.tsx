import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plan Your Visit — première',
  description:
    'Hotels near the great opera houses, curated tours and backstage experiences, and flights to the cultural capitals — coming soon to première.',
  openGraph: {
    title: 'Plan Your Visit — première',
    description:
      'Hotels, tours, and flights curated for ballet and opera-goers — coming soon.',
  },
}

/* ---------- Upcoming category data ---------- */

type Category = {
  icon: string
  label: string
  eyebrow: string
  headline: string
  body: string
  accent: string
}

const categories: Category[] = [
  {
    icon: '🏨',
    label: 'Hotels',
    eyebrow: 'Accommodation',
    headline: 'Stay steps from the stage',
    body:
      'Hand-picked hotels within walking distance of the great opera houses and ballet theatres. We are curating a collection that balances proximity, comfort, and a sense of occasion — so the evening does not end when the curtain falls.',
    accent: '#1B2A4A',
  },
  {
    icon: '🎭',
    label: 'Experiences',
    eyebrow: 'Backstage & Tours',
    headline: 'Beyond the performance',
    body:
      'Rehearsal visits, backstage tours, meet-the-artist evenings, and institution-led cultural programmes at the world\'s great companies. Think GetYourGuide and Tiqets — but filtered for the serious ballet and opera-goer.',
    accent: '#1A3A2E',
  },
  {
    icon: '✈️',
    label: 'Flights',
    eyebrow: 'Travel',
    headline: 'Fly to the cultural capitals',
    body:
      'Curated flight options to the cities where the season\'s premieres take the stage — London, Paris, Vienna, Milan, New York, Tokyo. We plan to surface flexible fares so you can build a trip around a performance, not around an airline schedule.',
    accent: '#2D1B4E',
  },
]

/* ---------- Category Card ---------- */

function CategoryCard({ cat }: { cat: Category }) {
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
        <p className="text-ivory/70 text-sm leading-relaxed">
          {cat.body}
        </p>
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
            Coming Soon
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-tight text-gradient-gold mb-6">
            Plan your performance trip
          </h1>
          <p className="text-ivory/70 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            A performance is the heart of the evening. Everything around it —
            where you stay, how you get there, what you discover along the way —
            will soon be curated here, in one place, specifically for ballet and
            opera-goers.
          </p>
        </div>
      </section>

      {/* "Coming soon" badge */}
      <div className="flex justify-center px-6 pb-12">
        <div
          className="glass-pill px-6 py-2.5 inline-flex items-center gap-2"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-gold-deep animate-pulse"
          />
          <span
            style={{
              color: '#A8842A',
              fontSize: '11px',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            In development — launching later in 2026
          </span>
        </div>
      </div>

      {/* Three upcoming categories */}
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
              the first search to the final bow. Our ambition is to surface
              curated hotels, tours, and flights alongside every performance
              listing — so you can plan an entire trip from a single calendar.
              When we launch the travel layer, we will only surface services we
              believe genuinely serve our audience.
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
              When this feature launches, premi&egrave;re may
              earn a referral fee when you book accommodation, experiences, or
              travel through links on this site. This will come at no additional
              cost to you, and it will help us keep the calendar free,
              independent, and continually updated. We will only surface services
              we believe genuinely serve our audience — the performance always
              comes first.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
