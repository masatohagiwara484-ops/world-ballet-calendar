import { ArrowUpRight } from 'lucide-react'
import GradientArt from '@/components/shared/GradientArt'
import type { MediaSource } from '@/data/media-sources'

/**
 * A single ballet/opera publication in the Read directory.
 *
 * LEGAL GUARDRAILS (do not violate — see the feature spec §6):
 *  - TEXT ONLY. The brand block is a typographic monogram (GradientArt); no
 *    publisher logo / favicon / og:image is ever fetched or embedded.
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
      className="group glass-card specular block overflow-hidden rounded-glass h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-stage"
    >
      {/* Text-only brand block — monogram on a jewel-tone gradient, never a logo */}
      <GradientArt
        seed={source.id}
        title={source.name}
        badge={source.region}
        className="aspect-[16/9] w-full"
        monogramClassName="text-5xl"
      >
        {/* children makes GradientArt non-decorative; label the independence */}
        <span className="absolute bottom-3 right-4 text-[8px] tracking-[0.3em] uppercase text-white/55">
          External media
        </span>
      </GradientArt>

      <div className="p-6 flex flex-col h-[calc(100%-0px)]">
        <p className="text-gold-deep text-[10px] tracking-[0.3em] uppercase mb-3">
          {geo}
        </p>
        <h3 className="font-serif text-xl md:text-2xl text-ivory leading-tight group-hover:text-gold-deep transition-colors">
          {source.name}
        </h3>
        <p className="mt-3 text-ivory/65 text-sm leading-relaxed">{source.blurb}</p>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-ivory/40 text-[10px] tracking-[0.24em] uppercase">
            {source.type.join(' · ')}
          </span>
          <span className="inline-flex items-center gap-1 text-gold text-[11px] tracking-[0.18em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
            External
            <ArrowUpRight size={13} aria-hidden />
          </span>
        </div>
      </div>
    </a>
  )
}
