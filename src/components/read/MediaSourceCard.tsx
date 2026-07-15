import { ArrowUpRight } from 'lucide-react'
import type { MediaSource } from '@/data/media-sources'

/**
 * A single ballet/opera publication in the Read directory.
 *
 * LEGAL GUARDRAILS (do not violate — see the feature spec §6):
 *  - TEXT ONLY. Purely typographic — no publisher logo / favicon / og:image /
 *    monogram art is ever fetched or embedded.
 *  - The whole card is one outbound anchor: target="_blank" rel="noopener
 *    noreferrer", with an "External ↗" affordance and an "External media" label
 *    marking it as an independent third party.
 */
export default function MediaSourceCard({ source }: { source: MediaSource }) {
  const geo = source.country
    ? `${source.region} · ${source.country}`
    : `${source.region} · Global`

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Read ${source.name} — external media, opens in a new tab`}
      className="group glass-card specular flex flex-col h-full rounded-glass p-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-stage"
    >
      {/* Region · country + independence label */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-gold-deep text-[10px] tracking-[0.3em] uppercase">{geo}</p>
        <span className="flex-shrink-0 text-ivory/35 text-[8px] tracking-[0.3em] uppercase mt-0.5">
          External media
        </span>
      </div>

      {/* Name */}
      <h3 className="font-serif text-2xl md:text-[1.7rem] leading-tight text-ivory group-hover:text-gold-deep transition-colors">
        {source.name}
      </h3>
      <span className="mt-3 block h-px w-10 bg-gold/40 group-hover:w-16 transition-all duration-500" aria-hidden />

      {/* Blurb */}
      <p className="mt-4 text-ivory/65 text-sm leading-relaxed">{source.blurb}</p>

      {/* Footer */}
      <div className="mt-auto pt-6 flex items-end justify-between gap-3">
        <span className="min-w-0 text-ivory/40 text-[10px] tracking-[0.22em] uppercase leading-relaxed">
          {source.type.join(' · ')}
        </span>
        <ArrowUpRight
          size={16}
          aria-hidden
          className="flex-shrink-0 text-gold/70 group-hover:text-gold-deep group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300"
        />
      </div>
    </a>
  )
}
