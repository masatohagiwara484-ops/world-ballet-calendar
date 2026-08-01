import type { Metadata } from 'next'
import { CONTACT_EMAIL, OPERATOR_NAME, OPERATOR_LOCATION } from '@/lib/site'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy — première',
  description:
    'What première collects, why, who processes it, and how to have it removed.',
}

/**
 * Written against what the code ACTUALLY does, not a template:
 *   • email capture → src/components/audience/NewsletterCapture + /api/follow
 *   • storage       → Supabase (see src/lib/data.ts, scripts/seed.ts)
 *   • hosting logs  → Vercel
 *   • maps          → Google Maps when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set,
 *                     otherwise Leaflet/CARTO tiles
 *   • unsubscribe   → /unsubscribe with a per-subscriber token
 * Anything not in that list is deliberately NOT claimed.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we collect"
      lede="première is a small, independent project. We collect as little as we can, and we would rather tell you plainly than bury it."
      updated="30 July 2026"
    >
      <LegalSection title="Who runs this site">
        <p>
          première is published by {OPERATOR_NAME}, based in {OPERATOR_LOCATION}.
          For anything on this page, including a request to delete your data,
          write to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-deep hover:text-gold">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="What we collect, and why">
        <p>
          <strong>Your email address</strong> — only if you give it to us, by
          subscribing to updates or following a company. We use it to send you
          the performance alerts and season updates you asked for. We do not
          sell it, and we do not share it for anyone else&rsquo;s marketing.
        </p>
        <p>
          <strong>Ordinary server logs</strong> — our host records the usual
          technical information a web server sees: IP address, browser, and the
          pages requested. This is standard operation and security practice,
          not profiling.
        </p>
        <p>
          We do not ask for your name, we do not take payments, and we do not
          run advertising trackers.
        </p>
      </LegalSection>

      <LegalSection title="Who else processes it">
        <p>
          <strong>Supabase</strong> stores the performance catalogue and the
          subscription list. <strong>Vercel</strong> hosts the site and produces
          the server logs described above. Both act as processors on our behalf.
        </p>
        <p>
          <strong>Maps</strong> on venue pages are served either by Google Maps
          or by open map tiles, depending on configuration. When Google Maps is
          used, your browser contacts Google directly and Google&rsquo;s own
          privacy terms apply to that request.
        </p>
        <p>
          <strong>Links out.</strong> Booking links take you to the theatre or
          to a travel partner. Once you leave première you are on their site,
          under their privacy policy. See our{' '}
          <a href="/disclosure" className="text-gold-deep hover:text-gold">
            affiliate disclosure
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Keeping and removing your data">
        <p>
          We keep your email address until you unsubscribe. Every email we send
          carries an unsubscribe link, and you can remove yourself at any time
          without asking us. You may also write to us to ask what we hold about
          you, to correct it, or to delete it — we will act on that.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If what we collect changes, this page changes with it, and the date
          above is updated. Material changes affecting subscribers will be sent
          by email.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
