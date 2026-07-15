import { gradientFor, monogram } from './design'

interface GradientArtProps {
  /** Stable key for palette selection (slug or id). */
  seed: string
  /** Text to derive the oversized initials from. */
  title: string
  className?: string
  /** Tailwind classes for the monogram size. */
  monogramClassName?: string
  /** Optional tiny label rendered in the corner (e.g. "Ballet"). */
  badge?: string
  /**
   * 'monogram' (default) shows oversized initials; 'nameplate' sets the FULL
   * `title` as an editorial title-plate (a printed-brochure cover), so a card's
   * "art" is the company's own name in type — no initials, no photography.
   */
  mode?: 'monogram' | 'nameplate'
  children?: React.ReactNode
}

/**
 * Editorial gradient "art" — replaces external photography. A deep luxury
 * gradient with an oversized Playfair monogram and a fine ornamental rule,
 * so cards & heroes read like a printed season brochure.
 */
export default function GradientArt({
  seed,
  title,
  className = '',
  monogramClassName = 'text-7xl',
  badge,
  mode = 'monogram',
  children,
}: GradientArtProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: gradientFor(seed) }}
      /* Monogram art is decorative; a nameplate carries the real name, so keep it readable. */
      aria-hidden={mode === 'nameplate' ? undefined : !children}
    >
      {/* Ornamental hairline frame */}
      <div className="absolute inset-3 border border-white/10 rounded-[2px]" />
      {/* Soft gold glow */}
      <div
        className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
      />
      {badge && (
        <span className="absolute top-4 left-4 text-[9px] tracking-[0.32em] uppercase text-white/55 z-10">
          {badge}
        </span>
      )}

      {mode === 'nameplate' ? (
        /* Editorial title-plate — the full name IS the art (no initials). */
        <span className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center select-none">
          <span className="h-px w-8 bg-white/25 mb-4" aria-hidden />
          <span
            className="font-serif font-light text-white/95 leading-[1.12] [text-wrap:balance]"
            style={{ fontSize: 'clamp(1.35rem, 2.1vw + 0.9rem, 2.2rem)', textShadow: '0 2px 30px rgba(0,0,0,0.35)' }}
          >
            {title}
          </span>
          <span className="h-px w-8 bg-white/25 mt-4" aria-hidden />
        </span>
      ) : (
        <span
          className={`absolute inset-0 flex items-center justify-center font-serif font-light text-white/90 select-none ${monogramClassName}`}
          style={{ textShadow: '0 2px 30px rgba(0,0,0,0.35)' }}
        >
          {monogram(title)}
        </span>
      )}
      {children}
    </div>
  )
}
