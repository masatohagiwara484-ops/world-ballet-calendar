import type { Metadata } from 'next'
import { Mail, ArrowUpRight } from 'lucide-react'
import { CONTACT_EMAIL, OPERATOR_NAME, OPERATOR_LOCATION } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact — première',
  description:
    'Reach première — corrections to a listing, an invitation from a company or theatre, partnership enquiries, or a note from a reader.',
  openGraph: {
    title: 'Contact — première',
    description:
      'Corrections, company and theatre enquiries, partnerships — how to reach première.',
  },
}

/**
 * Reasons to write, each with its own pre-filled subject line so the inbox
 * sorts itself. A correction route is not optional for a product whose first
 * promise is "never a wrong date" — readers and theatres need a way to tell us
 * when something is off, and theatres writing in is also how a listing
 * relationship starts.
 */
const REASONS = [
  {
    eyebrow: 'Corrections',
    headline: 'A date looks wrong',
    body:
      'Every performance we publish carries the date we verified and a link to its source. If something has changed, or we have it wrong, tell us — we would rather show nothing than mislead a traveller who is booking a journey around a curtain time.',
    subject: 'Correction to a listing',
    accent: '#1B2A4A',
  },
  {
    eyebrow: 'Companies & Theatres',
    headline: 'You are a company or a house',
    body:
      'If you programme a season and would like it represented here — or would like your listings corrected, expanded, or linked to your own box office — write to us. We list a deliberately small number of houses and we would rather hear from you than guess.',
    subject: 'Company / theatre enquiry',
    accent: '#1A3A2E',
  },
  {
    eyebrow: 'Partnerships',
    headline: 'Working together',
    body:
      'Travel partners, cultural institutions, and publications who share an audience with us. We keep the commercial layer quiet and relevant, and we are selective about who appears alongside a season.',
    subject: 'Partnership enquiry',
    accent: '#2D1B4E',
  },
  {
    eyebrow: 'Readers',
    headline: 'Everything else',
    body:
      'A house we should be covering, something that did not work, or a note about a performance you travelled for. We read everything, and the roster grows from what people ask for.',
    subject: 'Hello from a reader',
    accent: '#A8842A',
  },
]

const mailto = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[première] ${subject}`)}`

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-stage">
      {/* Hero */}
      <section className="pt-40 pb-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="mb-5"
            style={{
              color: '#A8842A',
              fontSize: '11px',
              letterSpacing: '0.4em',
              textTransform: 'uppercase',
            }}
          >
            Contact
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-ivory mb-6 leading-tight">
            Write to us
          </h1>
          <p className="text-ivory/70 text-base md:text-lg leading-relaxed">
            première is a small, deliberately curated project. Every message is
            read by a person.
          </p>

          <a
            href={mailto('Hello')}
            className="mt-10 inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gold text-stage font-semibold text-xs tracking-[0.22em] uppercase hover:bg-gold-bright hover:shadow-glow-gold transition-all"
          >
            <Mail size={15} />
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      {/* Reasons */}
      <section className="pb-24 px-6 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          {REASONS.map((r) => (
            <article
              key={r.subject}
              className="glass-card specular relative overflow-hidden rounded-glass"
            >
              <div className="h-1 w-full" style={{ backgroundColor: r.accent }} />
              <div className="p-8 md:p-10">
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
                  {r.eyebrow}
                </p>
                <h2 className="font-serif text-2xl text-ivory mb-4">{r.headline}</h2>
                <p className="text-ivory/70 text-sm leading-relaxed mb-6">{r.body}</p>
                <a
                  href={mailto(r.subject)}
                  className="inline-flex items-center gap-2 text-sm text-gold-deep hover:text-gold transition-colors"
                >
                  {r.subject}
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Who runs this */}
        <div className="max-w-5xl mx-auto mt-10">
          <div
            className="glass-panel specular px-8 md:px-10 py-8"
            style={{ borderRadius: 'var(--radius-glass, 1rem)' }}
          >
            <p
              className="mb-3"
              style={{
                color: 'rgba(26,26,26,0.45)',
                fontSize: '10px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
              }}
            >
              Who runs première
            </p>
            <p className="text-ivory/70 text-sm leading-relaxed">
              première is published by {OPERATOR_NAME}, based in {OPERATOR_LOCATION}.
              Correspondence in English or Japanese is equally welcome.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
