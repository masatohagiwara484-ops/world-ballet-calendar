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
      className="group grid grid-cols-[auto_1fr_auto] items-start gap-5 sm:gap-8 py-7 border-t border-white/[0.08] hover:bg-white/[0.04] transition-colors duration-300 px-3 -mx-3 rounded-glass-sm"
    >
      <div className="pt-1 w-28 sm:w-36 shrink-0">
        <p className="text-gold text-sm font-medium tabular-nums">
          {formatRange(p.start_date, p.end_date)}
        </p>
        <p className="mt-1 text-ivory/40 text-[10px] tracking-[0.28em] uppercase">
          {KIND_LABEL[p.kind]}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="font-serif text-xl sm:text-2xl text-ivory group-hover:text-gold-bright transition-colors">
          {p.title}
        </h3>
        {!hideCompany && (
          <p className="mt-1 text-ivory/62 text-sm">
            {p.company.name}
            {p.venue ? ` · ${p.venue}` : p.company.venue ? ` · ${p.company.venue}` : ''}
          </p>
        )}
        {hideCompany && p.venue && (
          <p className="mt-1 text-ivory/62 text-sm">{p.venue}</p>
        )}
        {credit && (
          <p className="mt-2 text-ivory/38 text-xs leading-relaxed">{credit}</p>
        )}
      </div>

      <ArrowUpRight
        size={18}
        className="mt-2 text-ivory/30 group-hover:text-gold transition-colors shrink-0"
      />
    </Link>
  )
}
