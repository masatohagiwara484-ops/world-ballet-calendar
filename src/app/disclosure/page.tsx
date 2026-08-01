import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '@/lib/site'
import LegalPage, { LegalSection } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Affiliate disclosure — première',
  description:
    'How première earns: some booking and travel links pay us a commission, at no extra cost to you, and never in exchange for editorial coverage.',
}

/**
 * Required before any affiliate ID goes live (ROADMAP M5 → M6): affiliate
 * networks and consumer-protection rules in several markets require a clear,
 * findable disclosure. Written to be honest about the one real risk — that
 * money could bend the editorial — and to state plainly that it does not.
 */
export default function DisclosurePage() {
  return (
    <LegalPage
      eyebrow="Disclosure"
      title="How première earns"
      lede="Some of the links here pay us a commission. It costs you nothing extra, and it never buys a place in our listings."
      updated="30 July 2026"
    >
      <LegalSection title="The plain version">
        <p>
          When you book a hotel, a tour, or occasionally a ticket through a link
          on this site, the company you book with may pay us a small commission.
          <strong> You pay exactly the same price</strong> as you would going
          there directly.
        </p>
        <p>
          That commission is how an independent, ad-free guide can exist without
          charging readers or filling pages with advertising.
        </p>
      </LegalSection>

      <LegalSection title="What money does not buy">
        <p>
          <strong>Which companies and performances we list is an editorial
          decision, and it is not for sale.</strong> No theatre pays to appear
          here, no commission influences which houses we cover or which
          performances we highlight, and we do not accept payment to write about
          a production.
        </p>
        <p>
          Where we point you to travel partners, the choice of partner is made
          on whether it is genuinely useful for someone travelling to a
          performance — not on which pays most.
        </p>
      </LegalSection>

      <LegalSection title="Where these links appear">
        <p>
          Mainly in the trip-planning sections of performance and city pages —
          hotels near the theatre, tours and experiences in the city, and travel
          to get there. Links straight to a theatre&rsquo;s own box office are
          usually plain links that earn us nothing; we include them because you
          need them.
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          If anything here reads as unclear, or you think something is
          insufficiently disclosed, tell us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-deep hover:text-gold">
            {CONTACT_EMAIL}
          </a>
          . See also our{' '}
          <a href="/terms" className="text-gold-deep hover:text-gold">
            terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-gold-deep hover:text-gold">
            privacy
          </a>{' '}
          pages.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
