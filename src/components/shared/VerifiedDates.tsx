/**
 * VerifiedDates — the visible trust signal.
 *
 * Operabase shows dates with no provenance. We confirm every published run
 * against the company's official source and stamp `last_verified` + `source_url`
 * (see the trust policy in src/data/performances.ts). This badge surfaces that
 * discipline so it reads as a brand advantage rather than a hidden database
 * field. It renders ONLY when `lastVerified` is present, so unverified / empty
 * rows never claim a confirmation they don't have.
 *
 * Two sizes: `full` (a panel line on the performance page) and `compact`
 * (an inline pill for dense list rows).
 */
import { BadgeCheck } from 'lucide-react'
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
  if (!lastVerified) return null
  const when = formatDay(lastVerified)

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-gold/85 text-[10px] tracking-[0.16em] uppercase ${className}`}
        title={`Dates confirmed with the company · ${when}`}
      >
        <BadgeCheck size={12} className="shrink-0" />
        Verified
      </span>
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
