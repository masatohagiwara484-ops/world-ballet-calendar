/**
 * VerifiedDates — the visible trust signal.
 *
 * Operabase shows dates with no provenance. We confirm published runs against
 * the company's official source and store `last_verified` + `source_url` (see the
 * trust policy in src/data/performances.ts). This badge surfaces that discipline
 * so it reads as a brand advantage rather than a hidden database field.
 *
 * Honest by construction — it shows the strongest claim the data supports:
 *   - `last_verified` present → "Dates confirmed with the company · <date>"
 *     (the full trust claim; links to the source when we have one).
 *   - only `source_url` present → "Official source" link, with NO confirmation
 *     claim (we have provenance but no verification timestamp).
 *   - neither → renders nothing.
 *
 * Two sizes: `full` (a panel line on the performance page) and `compact`
 * (an inline pill for dense list rows).
 */
import { BadgeCheck, Link2 } from 'lucide-react'
import { formatDay } from './format'

interface Props {
  lastVerified?: string
  sourceUrl?: string
  variant?: 'full' | 'compact'
  className?: string
}

export default function VerifiedDates({
  lastVerified,
  sourceUrl,
  variant = 'full',
  className = '',
}: Props) {
  if (!lastVerified && !sourceUrl) return null
  const when = lastVerified ? formatDay(lastVerified) : null

  if (variant === 'compact') {
    // Dense rows: only the strong "Verified" claim earns a pill; a bare source
    // link would be noise here.
    if (!lastVerified) return null
    return (
      <span
        className={`inline-flex items-center gap-1 text-gold/85 text-[10px] tracking-[0.16em] uppercase ${className}`}
        title={`Dates confirmed with the company${when ? ` · ${when}` : ''}`}
      >
        <BadgeCheck size={12} className="shrink-0" />
        Verified
      </span>
    )
  }

  // Provenance-only: we have a source but no verification date. Be precise.
  if (!lastVerified && sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`inline-flex items-center gap-2 text-xs text-ivory/55 hover:text-gold transition-colors ${className}`}
      >
        <Link2 size={15} className="shrink-0 text-gold/80" />
        <span>
          Listing from the{' '}
          <span className="text-gold/80 underline underline-offset-2">official source</span>
        </span>
      </a>
    )
  }

  const inner = (
    <>
      <BadgeCheck size={16} className="shrink-0 text-gold" />
      <span className="text-ivory/70">
        Dates confirmed with the company
        <span className="text-ivory/45"> · {when}</span>
      </span>
    </>
  )

  // When we know the source, the badge doubles as a citation link — the proof
  // is one tap away, which is the whole point of the trust claim.
  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={`inline-flex items-center gap-2 text-xs hover:text-gold transition-colors ${className}`}
      >
        {inner}
        <span className="text-gold/70 underline underline-offset-2">official source</span>
      </a>
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 text-xs ${className}`}>{inner}</span>
  )
}
