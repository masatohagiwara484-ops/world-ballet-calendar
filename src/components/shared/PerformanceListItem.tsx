import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { formatRange } from './format'
import { creditLine, KIND_LABEL } from './design'
import type { PerformanceWithCompany } from '@/lib/types'

interface Props {
  performance: PerformanceWithCompany
  /** Hide the company name (e.g. on a company profile where it's redundant). */
  hideCompany?: boolean
}

/** A refined editorial row for a performance run — timeline style. */
export default function PerformanceListItem({ performance: p, hideCompany }: Props) {
  const credit = creditLine(p)
  return (
    <Link
      href={`/performances/${p.id}`}
      className="group grid grid-cols-[auto_1fr_auto] items-start gap-5 sm:gap-8 py-7 border-t border-[#1A1A1A]/[0.08] hover:bg-white/60 transition-colors duration-300 px-2 -mx-2"
    >
      <div className="pt-1 w-28 sm:w-36 shrink-0">
        <p className="text-[#1A1A1A] text-sm font-medium tabular-nums">
          {formatRange(p.start_date, p.end_date)}
        </p>
        <p className="mt-1 text-[#D4AF37] text-[10px] tracking-[0.28em] uppercase">
          {KIND_LABEL[p.kind]}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="font-serif text-xl sm:text-2xl font-light text-[#1A1A1A] group-hover:text-[#1B2A4A] transition-colors">
          {p.title}
        </h3>
        {!hideCompany && (
          <p className="mt-1 text-[#1A1A1A]/55 text-sm">
            {p.company.name}
            {p.venue ? ` · ${p.venue}` : p.company.venue ? ` · ${p.company.venue}` : ''}
          </p>
        )}
        {hideCompany && p.venue && (
          <p className="mt-1 text-[#1A1A1A]/55 text-sm">{p.venue}</p>
        )}
        {credit && (
          <p className="mt-2 text-[#1A1A1A]/40 text-xs leading-relaxed">{credit}</p>
        )}
      </div>

      <ArrowUpRight
        size={18}
        className="mt-2 text-[#1A1A1A]/20 group-hover:text-[#D4AF37] transition-colors shrink-0"
      />
    </Link>
  )
}
