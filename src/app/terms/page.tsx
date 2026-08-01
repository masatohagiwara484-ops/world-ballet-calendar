import type { Metadata } from 'next'
import { CONTACT_EMAIL, OPERATOR_NAME, OPERATOR_LOCATION } from '@/lib/site'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms — première',
  description:
    'The terms of using première, including what our performance listings are and are not.',
}

/**
 * The section that actually matters here is "Always confirm with the theatre".
 * We publish dates crawled from official listings; houses change and cancel
 * programmes, and someone may book flights around what they read here. Saying
 * so plainly is both honest and the correct limitation of liability.
 */
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of use"
      lede="The short version: our listings are a guide to help you discover and plan. The theatre's own box office is always the final word."
      updated="30 July 2026"
    >
      <LegalSection title="What première is">
        <p>
          première is an editorial guide to ballet and opera seasons at a
          curated set of the world&rsquo;s theatres, published by{' '}
          {OPERATOR_NAME} in {OPERATOR_LOCATION}. We are independent: we are not
          an agent of, nor affiliated with, the companies and theatres we list,
          and we do not sell tickets.
        </p>
      </LegalSection>

      <LegalSection title="Always confirm with the theatre">
        <p>
          <strong>
            Check every date, time and price with the theatre before you book
            travel.
          </strong>{' '}
          We take our listings from each house&rsquo;s own published season and
          show you when we last verified them, but programmes change: casts are
          swapped, runs are extended, performances are cancelled, and a house
          can update its schedule at any time without telling us.
        </p>
        <p>
          We work hard to be accurate and will correct anything you report — see{' '}
          <a href="/contact" className="text-gold-deep hover:text-gold">
            contact
          </a>{' '}
          — but we cannot accept responsibility for travel, accommodation or
          other costs incurred in reliance on a listing. The booking contract is
          always between you and the theatre or travel provider.
        </p>
      </LegalSection>

      <LegalSection title="Links to other sites">
        <p>
          Booking and travel links lead to third parties whose terms and privacy
          policies govern what happens there. Some of those links earn us a
          commission; see the{' '}
          <a href="/disclosure" className="text-gold-deep hover:text-gold">
            affiliate disclosure
          </a>
          . We are not responsible for their content or their service.
        </p>
      </LegalSection>

      <LegalSection title="Using our content">
        <p>
          The writing, design and editorial selection on this site are ours.
          Please do not republish them wholesale. Quoting a passage with a link
          back is welcome. Performance facts — titles, dates, venues — belong to
          the theatres and we claim no ownership of them.
        </p>
        <p>
          Please do not use automated tools in ways that disrupt the service.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          The site is provided as it is, and we do not promise it will be
          uninterrupted or error-free. We may change or withdraw any part of it.
        </p>
      </LegalSection>

      <LegalSection title="Governing law and contact">
        <p>
          These terms are governed by the laws of Japan. Questions go to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-deep hover:text-gold">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
