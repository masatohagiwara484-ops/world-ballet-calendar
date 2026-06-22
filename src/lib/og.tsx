/**
 * Shared Open Graph card renderer — the brand image behind every share.
 *
 * When a première link is posted to X / LINE / iMessage / Slack / WhatsApp, the
 * platform renders the page's OG image as a preview card. This builds that card
 * on the fly per page (1200×630) in the house style — deep ink, champagne gold,
 * the première wordmark — so every shared link is, in effect, a branded ad.
 *
 * Implementation notes:
 *   • Uses next/og (Satori). Satori needs explicit flex layout on any element
 *     with multiple children, so every container below sets display:flex.
 *   • Renders with next/og's bundled default font (no external font fetch), so
 *     generation never depends on egress. A serif (Playfair) can be layered in
 *     later by bundling a .ttf and passing it via the `fonts` option.
 */
import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const INK = '#0B0B0D'
const GOLD = '#D4AF37'
const GOLD_SOFT = '#C9A84C'
const CREAM = '#F5F0E6'
const CREAM_DIM = 'rgba(245,240,230,0.62)'

export interface OgCardOptions {
  /** Small uppercase line above the title ("BALLET · THE ROYAL BALLET"). */
  eyebrow?: string
  /** The headline (work / performance / city / company name). */
  title: string
  /** Secondary line under the title (composer, dates, country…). */
  subtitle?: string
  /** A jewel-tone accent wash for the corner glow (defaults to navy). */
  accent?: string
}

/** Deterministic jewel accent so the same entity always gets the same wash. */
const ACCENTS = ['#1B2A4A', '#1A3A2E', '#4A1F2E', '#2D1B4E']
export function accentFor(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h << 5) - h + key.charCodeAt(i)
  return ACCENTS[Math.abs(h) % ACCENTS.length]
}

/** Render a branded OG card to an ImageResponse. */
export function renderOgCard(opts: OgCardOptions): ImageResponse {
  const accent = opts.accent ?? '#1B2A4A'
  // Clamp the title so very long names stay on the card.
  const title = opts.title.length > 64 ? `${opts.title.slice(0, 63)}…` : opts.title

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Jewel + gold corner glow */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            right: -200,
            width: 760,
            height: 760,
            borderRadius: 760,
            background: `radial-gradient(circle, ${accent} 0%, rgba(11,11,13,0) 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 520,
            background: 'radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(11,11,13,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <div style={{ color: GOLD, fontSize: 30, letterSpacing: 12, fontWeight: 600 }}>
            première
          </div>
          {/* Gold diamond drawn as a rotated square (no special glyph → no font fetch). */}
          <div
            style={{
              width: 12,
              height: 12,
              marginLeft: 20,
              background: GOLD_SOFT,
              transform: 'rotate(45deg)',
              display: 'flex',
            }}
          />
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {opts.eyebrow ? (
            <div
              style={{
                color: GOLD_SOFT,
                fontSize: 24,
                letterSpacing: 8,
                textTransform: 'uppercase',
                marginBottom: 22,
                display: 'flex',
              }}
            >
              {opts.eyebrow}
            </div>
          ) : null}
          <div
            style={{
              color: CREAM,
              fontSize: title.length > 30 ? 76 : 96,
              fontWeight: 700,
              lineHeight: 1.05,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {opts.subtitle ? (
            <div style={{ color: CREAM_DIM, fontSize: 34, marginTop: 26, display: 'flex' }}>
              {opts.subtitle}
            </div>
          ) : null}
        </div>

        {/* Footer rule + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ width: 90, height: 2, background: GOLD, marginBottom: 22, display: 'flex' }} />
          <div style={{ color: CREAM_DIM, fontSize: 24, letterSpacing: 3, display: 'flex' }}>
            every stage in the world
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
