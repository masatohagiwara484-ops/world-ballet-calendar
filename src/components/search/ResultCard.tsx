import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { formatRange } from '@/components/shared/format'
import { gradientFor, monogram, KIND_LABEL, ticketTarget } from '@/components/shared/design'
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

/** Kind label that handles 'concert' safely (KIND_LABEL only has ballet|opera). */
function kindLabel(kind: string): string {
  if (kind === 'ballet' || kind === 'opera') return KIND_LABEL[kind]
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}

export default function ResultCard({ item }: Props) {
  const tt = ticketTarget(item, item.company)
  const gradient = gradientFor(item.company.slug)
  const initials = monogram(item.company.name)

  // Filter credits to meaningful groups (non-empty)
  const creditGroups = item.credits.filter((g) => g.people.length > 0)

  return (
    <article className="glass-card specular overflow-hidden rounded-glass flex">
      {/* Art tile — jewel gradient with monogram */}
      <div
        className="w-16 flex-shrink-0 flex items-center justify-center rounded-l-glass"
        style={{ background: gradient }}
        aria-hidden
      >
        <span className="font-serif text-lg text-white/90 select-none tracking-wide">
          {initials}
        </span>
      </div>

      <div className="flex-1 p-5 sm:p-6 min-w-0">
        {/* Eyebrow */}
        <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-2">
          {kindLabel(item.kind)} · {item.company.country}
        </p>

        {/* Title — links to work page */}
        <h2 className="font-serif text-xl sm:text-2xl text-ivory mb-1 leading-snug">
          <Link
            href={`/works/${item.work_slug}`}
            className="hover:text-gold transition-colors"
          >
            {item.title}
          </Link>
        </h2>
        {item.title_original && item.title_original !== item.title && (
          <p className="text-ivory/50 text-sm italic mb-1">{item.title_original}</p>
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
        <p className="text-gold-deep text-sm font-medium mb-3 tabular-nums">
          {formatRange(item.start_date, item.end_date)}
        </p>

        {/* Credits — person names link to people pages */}
        {creditGroups.length > 0 && (
          <div className="space-y-1 mb-3">
            {creditGroups.map((g) => (
              <p key={g.role} className="text-ivory/50 text-xs leading-relaxed">
                <span className="text-ivory/60">{roleLabel(g.role)}</span>
                {' · '}
                {g.people.map((person, idx) => (
                  <span key={person.slug}>
                    {idx > 0 && ', '}
                    <Link
                      href={`/people/${encodeURIComponent(person.slug)}`}
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
        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-black/[0.07]">
          <span className="text-ivory/50 text-xs">
            {item.price_range ?? (item.price.min != null ? `From ${item.price.currency ?? '€'}${item.price.min}` : '')}
          </span>
          {tt && (
            <a
              href={tt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold-deep text-[11px] tracking-[0.18em] uppercase hover:bg-gold/20 transition-colors"
            >
              {tt.isBoxOffice ? 'Box office' : 'Tickets'}
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
