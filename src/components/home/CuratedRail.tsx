import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import GradientArt from '@/components/shared/GradientArt'
import VerifiedDates from '@/components/shared/VerifiedDates'
import { formatRange } from '@/components/shared/format'
import { creditLine, KIND_LABEL } from '@/components/shared/design'
import type { PerformanceWithCompany } from '@/lib/types'

/**
 * CuratedRail — the editorial moat made visible.
 *
 * Operabase lists everything and curates nothing. Our defensible edge is human
 * judgement: a hand-picked set of the season's unmissable runs (the is_featured
 * flag is the editor's pick). This rail puts that judgement at the top of the
 * home page as a printed-brochure-style row of poster cards — the first thing
 * that says "this is a curated point of view, not a database dump."
 *
 * It renders NOTHING when there are no featured runs, so the home page degrades
 * honestly to its other sections rather than showing an empty editorial promise.
 */
export default function CuratedRail({
  performances,
}: {
  performances: PerformanceWithCompany[]
}) {
  if (performances.length === 0) return null

  return (
    <section
      aria-label="Unmissable this season"
      className="relative py-20 md:py-28 px-6 md:px-10"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 15% 0%, rgba(212,175,55,0.07) 0%, transparent 55%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-3">
          <div>
            <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-3">
              Curated · This Season
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-gradient-gold">
              Unmissable this season
            </h2>
          </div>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-1.5 text-ivory/62 text-xs tracking-[0.2em] uppercase hover:text-gold transition-colors shrink-0"
          >
            The full season
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <p className="text-ivory/55 text-sm md:text-base leading-relaxed max-w-2xl mb-10">
          The handful of productions our editors would cross a border to see —
          chosen by hand, dates confirmed with each house.
        </p>

        {/* Scroll-snap rail. Bleeds to the screen edge so the next card peeks,
            signalling "there's more" without a visible scrollbar. */}
        <div className="-mx-6 px-6 md:-mx-10 md:px-10">
          <ul
            className="flex gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {performances.map((p) => (
              <li key={p.id} className="snap-start shrink-0 w-[76vw] sm:w-72 lg:w-80">
                <CuratedCard performance={p} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/** A single poster-style editorial card for a curated run. */
function CuratedCard({ performance: p }: { performance: PerformanceWithCompany }) {
  const credit = creditLine(p)
  return (
    <Link
      href={`/performances/${p.id}`}
      className="group glass-card specular block overflow-hidden rounded-glass h-full"
    >
      <GradientArt
        seed={p.id}
        title={p.title}
        badge={KIND_LABEL[p.kind]}
        mode="nameplate"
        className="aspect-[4/5] w-full"
      />
      <div className="p-6">
        {/* Title is the poster above; lead here with the run + place. */}
        <p className="text-gold text-sm font-medium tabular-nums group-hover:text-gold-deep transition-colors">
          {formatRange(p.start_date, p.end_date)}
        </p>
        <p className="mt-2 text-ivory text-base leading-snug">
          {p.company.name}
          {p.venue ? ` · ${p.venue}` : p.company.venue ? ` · ${p.company.venue}` : ''}
        </p>
        {credit && (
          <p className="mt-2 text-ivory/38 text-xs leading-relaxed line-clamp-1">{credit}</p>
        )}
        {p.last_verified && (
          <VerifiedDates lastVerified={p.last_verified} variant="compact" className="mt-3" />
        )}
      </div>
    </Link>
  )
}
