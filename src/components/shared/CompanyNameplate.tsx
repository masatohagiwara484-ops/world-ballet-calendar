import { flagEmoji, typeLabel } from './design'
import { companyGradient } from '@/lib/companyPalette'
import type { Company } from '@/lib/types'

/**
 * The editorial title-plate that replaces a company's "colour image".
 *
 * White Gradient Luxury, per-company: a WHITE-BASED gradient tinted uniquely
 * from the slug (no two companies share a colour), the company's FULL NAME set
 * in ink serif as the card's art (never initials, never photography), a gold
 * hairline frame, the discipline badge, and a small country-flag chip. All
 * type/CSS — no external asset is loaded.
 */
export default function CompanyNameplate({
  company,
  className = '',
}: {
  company: Company
  className?: string
}) {
  const flag = flagEmoji(company.country_code)

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: companyGradient(company.slug) }}
    >
      {/* Gold hairline frame */}
      <div className="absolute inset-3 border border-gold/20 rounded-[2px]" />
      {/* Soft gold corner glow */}
      <div
        aria-hidden
        className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.35) 0%, transparent 70%)' }}
      />

      {/* Discipline badge */}
      <span className="absolute top-4 left-4 text-[9px] tracking-[0.32em] uppercase text-ivory/45 z-10">
        {typeLabel(company.type)}
      </span>

      {/* Country flag chip */}
      {flag && (
        <span
          className="absolute top-3.5 right-4 inline-flex items-center gap-1.5 text-ivory/45 z-10"
          title={company.country}
        >
          <span className="text-base leading-none" aria-hidden>
            {flag}
          </span>
          <span className="text-[9px] tracking-[0.24em] uppercase">{company.country_code}</span>
        </span>
      )}

      {/* Full name — the plate itself (readable, not decorative) */}
      <span className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
        <span className="h-px w-8 bg-gold/35 mb-4" aria-hidden />
        <span
          className="font-serif font-light text-ivory leading-[1.12] [text-wrap:balance]"
          style={{ fontSize: 'clamp(1.35rem, 2.1vw + 0.9rem, 2.2rem)' }}
        >
          {company.name}
        </span>
        <span className="h-px w-8 bg-gold/35 mt-4" aria-hidden />
      </span>
    </div>
  )
}
