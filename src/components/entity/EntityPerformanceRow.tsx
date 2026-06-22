/**
 * Compact performance row for entity pages (/works/[slug] and /people/[slug]).
 * NOT part of src/components/search — built independently as a lighter list item
 * suited to the entity context (no heavy card chrome, more table-like layout).
 */
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { formatRange } from '@/components/shared/format'
import { bookingUrl } from '@/components/shared/design'
import type { SearchResultItem, CreditGroup } from '@/lib/types'

const ROLE_LABELS: Record<CreditGroup['role'], string> = {
  choreographer: 'Choreography',
  composer: 'Music',
  dancer: 'Dancer',
  conductor: 'Conductor',
  director: 'Director',
  singer: 'Singer',
  musician: 'Musician',
}

interface Props {
  item: SearchResultItem
  /** Suppress role groups that are redundant on a person page (caller decides). */
  highlightRole?: CreditGroup['role']
  /**
   * Lead with the performance/work TITLE instead of the company name. Used where
   * the company is not the page's subject (e.g. a city page lists many different
   * works) — there the production name is what the reader needs to see. The
   * title links to the performance detail page so tickets are one click away.
   * Defaults to false so work/person pages keep leading with the company.
   */
  showTitle?: boolean
}

export default function EntityPerformanceRow({ item, highlightRole, showTitle }: Props) {
  const ticket = bookingUrl(item)
  const venue = item.venue ?? item.company.venue
  const creditGroups = item.credits.filter((g) => g.people.length > 0)

  return (
    <article className="group relative flex flex-col sm:flex-row sm:items-start gap-4 py-6 border-b border-ivory/[0.08] last:border-b-0">
      {/* Left: date column */}
      <div className="sm:w-36 flex-shrink-0">
        <p className="text-gold text-sm font-medium tabular-nums leading-snug">
          {formatRange(item.start_date, item.end_date)}
        </p>
        <p className="text-ivory/40 text-[11px] mt-1 uppercase tracking-[0.18em]">
          {item.kind}
        </p>
      </div>

      {/* Centre: title/company + venue + credits */}
      <div className="flex-1 min-w-0">
        {showTitle ? (
          <>
            {/* Lead with the production name, linked to its detail page. */}
            <p className="font-serif text-base sm:text-lg text-ivory leading-snug mb-0.5">
              <Link
                href={`/performances/${item.id}`}
                className="hover:text-gold transition-colors"
              >
                {item.title}
              </Link>
            </p>
            <p className="text-ivory/55 text-sm mb-2">
              <Link
                href={`/companies/${item.company.slug}`}
                className="hover:text-gold transition-colors"
              >
                {item.company.name}
              </Link>
              {venue && <span className="text-ivory/35"> · {venue}</span>}
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-base sm:text-lg text-ivory leading-snug mb-0.5">
              <Link
                href={`/companies/${item.company.slug}`}
                className="hover:text-gold transition-colors"
              >
                {item.company.name}
              </Link>
            </p>
            <p className="text-ivory/55 text-sm mb-2">
              {item.company.city}
              {item.company.country !== item.company.city && (
                <span className="text-ivory/35"> · {item.company.country}</span>
              )}
              {venue && <span className="text-ivory/35"> · {venue}</span>}
            </p>
          </>
        )}

        {/* Show credits only when they add info (e.g. on a work page, show who performed what) */}
        {creditGroups.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {creditGroups.map((g) => (
              <p key={g.role} className="text-ivory/38 text-xs leading-relaxed">
                <span
                  className={
                    g.role === highlightRole
                      ? 'text-gold-deep'
                      : 'text-ivory/50'
                  }
                >
                  {ROLE_LABELS[g.role] ?? g.role}
                </span>
                {' · '}
                {g.people.map((person, idx) => (
                  <span key={person.slug}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/people/${person.slug}`}
                      className="hover:text-gold transition-colors"
                    >
                      {person.name}
                    </Link>
                  </span>
                ))}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Right: price + ticket */}
      <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 flex-shrink-0">
        {item.price_range && (
          <span className="text-ivory/45 text-xs">
            {item.price_range}
          </span>
        )}
        {ticket && (
          <a
            href={ticket}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gold/8 border border-gold/25 text-gold-deep text-[10px] tracking-[0.18em] uppercase hover:bg-gold/15 hover:border-gold/50 transition-all"
          >
            Tickets
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </article>
  )
}
