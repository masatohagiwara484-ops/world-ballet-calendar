import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { formatRange } from '@/components/shared/format'
import { gradientFor, KIND_LABEL, bookingUrl } from '@/components/shared/design'
import type { SearchResultItem, CreditGroup } from '@/lib/types'

interface Props {
  item: SearchResultItem
}

/** Capitalize any string for role display. */
function roleLabel(role: CreditGroup['role']): string {
  const map: Record<string, string> = {
    choreographer: 'Choreography',
    composer: 'Music',
    dancer: 'Dancer',
    conductor: 'Conductor',
    director: 'Director',
    singer: 'Singer',
    musician: 'Musician',
  }
  return map[role] ?? (role.charAt(0).toUpperCase() + role.slice(1))
}

/** Param key for a person credit in search. */
function personParam(role: CreditGroup['role']): string {
  if (role === 'choreographer') return 'choreographer'
  if (role === 'composer') return 'composer'
  return 'person'
}

/** Kind label that handles 'concert' safely (KIND_LABEL only has ballet|opera). */
function kindLabel(kind: string): string {
  if (kind === 'ballet' || kind === 'opera') return KIND_LABEL[kind]
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

export default function ResultCard({ item }: Props) {
  const ticket = bookingUrl(item)
  const gradient = gradientFor(item.company.slug)

  // Filter credits to meaningful groups (non-empty)
  const creditGroups = item.credits.filter((g) => g.people.length > 0)

  return (
    <article className="glass-card specular overflow-hidden rounded-glass flex">
      {/* Left accent bar */}
      <div
        className="w-1 flex-shrink-0 rounded-l-glass"
        style={{ background: gradient }}
        aria-hidden
      />

      <div className="flex-1 p-5 sm:p-6 min-w-0">
        {/* Eyebrow */}
        <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-2">
          {kindLabel(item.kind)} · {item.company.country}
        </p>

        {/* Title */}
        <h2 className="font-serif text-xl sm:text-2xl text-ivory mb-1 leading-snug">
          <Link
            href={`/performances/${item.id}`}
            className="hover:text-gold-bright transition-colors"
          >
            {item.title}
          </Link>
        </h2>
        {item.title_original && item.title_original !== item.title && (
          <p className="text-ivory/38 text-sm italic mb-1">{item.title_original}</p>
        )}

        {/* Company · City */}
        <p className="text-ivory/62 text-sm mb-3">
          <Link
            href={`/companies/${item.company.slug}`}
            className="hover:text-gold transition-colors"
          >
            {item.company.name}
          </Link>
          {' · '}
          <Link
            href={`/search?city=${encodeURIComponent(item.company.city)}`}
            className="hover:text-gold transition-colors"
          >
            {item.company.city}
          </Link>
        </p>

        {/* Dates */}
        <p className="text-gold text-sm font-medium mb-3 tabular-nums">
          {formatRange(item.start_date, item.end_date)}
        </p>

        {/* Credits */}
        {creditGroups.length > 0 && (
          <div className="space-y-1 mb-3">
            {creditGroups.map((g) => (
              <p key={g.role} className="text-ivory/38 text-xs leading-relaxed">
                <span className="text-ivory/55">{roleLabel(g.role)}</span>
                {' · '}
                {g.people.map((person, idx) => (
                  <span key={person.slug}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/search?${personParam(g.role)}=${encodeURIComponent(person.slug)}`}
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

        {/* Price + Ticket CTA */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-white/[0.08]">
          <span className="text-ivory/38 text-xs">
            {item.price_range ?? (item.price.min != null ? `From ${item.price.currency ?? '€'}${item.price.min}` : '')}
          </span>
          {ticket && (
            <a
              href={ticket}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[11px] tracking-[0.18em] uppercase hover:bg-gold/20 transition-colors"
            >
              Tickets
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
