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
  children,
}: GradientArtProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: gradientFor(seed) }}
      aria-hidden={!children}
    >
      {/* Ornamental hairline frame */}
      <div className="absolute inset-3 border border-white/10 rounded-[2px]" />
      {/* Soft gold glow */}
      <div
        className="absolute -top-1/3 -right-1/4 w-2/3 h-2/3 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
      />
      {badge && (
        <span className="absolute top-4 left-4 text-[9px] tracking-[0.32em] uppercase text-white/55">
          {badge}
        </span>
      )}
      <span
        className={`absolute inset-0 flex items-center justify-center font-serif font-light text-white/90 select-none ${monogramClassName}`}
        style={{ textShadow: '0 2px 30px rgba(0,0,0,0.35)' }}
      >
        {monogram(title)}
      </span>
      {children}
    </div>
  )
}
