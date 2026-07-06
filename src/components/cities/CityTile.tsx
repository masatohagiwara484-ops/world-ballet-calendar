/**
 * CityTile — the shared city card used by the /cities and /trips indexes.
 * One component owns the scene/scrim/gradient treatment so a legibility tweak
 * lands on both surfaces; callers differ only in href and the footer slot.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gradientFor } from '@/components/shared/design'
import CityScene, { hasCityScene } from './CityScene'

interface Props {
  slug: string
  name: string
  country: string
  href: string
  /** Bottom-left line — e.g. "3 companies" or "Next run · 12 Sep 2026". */
  footer: ReactNode
}

export default function CityTile({ slug, name, country, href, footer }: Props) {
  const scene = hasCityScene(slug)
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-glass p-8 min-h-[180px] flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
      // Cities with a bespoke skyline scene let it fill the tile; the rest
      // keep the jewel gradient.
      style={scene ? undefined : { background: gradientFor(slug) }}
    >
      {scene ? (
        <>
          <CityScene
            slug={slug}
            className="absolute inset-0 w-full h-full scale-105 group-hover:scale-110 transition-transform duration-500 pointer-events-none"
          />
          {/* Scrim so the gold/white type stays legible over the scene. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,8,12,0.20) 0%, rgba(8,8,12,0.30) 55%, rgba(8,8,12,0.82) 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 blur-2xl"
          style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
        />
      )}
      <div className="relative">
        <p className="text-white/55 text-[10px] tracking-[0.3em] uppercase mb-2">
          {country}
        </p>
        <h2 className="font-serif text-3xl text-white leading-tight">{name}</h2>
      </div>
      <div className="relative flex items-center justify-between">
        <span className="text-white/70 text-sm">{footer}</span>
        <ArrowUpRight
          size={18}
          className="text-gold opacity-70 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </Link>
  )
}
