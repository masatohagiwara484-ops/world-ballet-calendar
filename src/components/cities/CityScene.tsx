/**
 * CityScene — a self-composed, full-bleed SVG "photograph" of a city's signature
 * skyline, drawn entirely in code (no external photography, no egress — see the
 * house rule in components/shared/design.ts). Each scene captures the mood the
 * stock photo would have carried — Paris under a clear sunlit sky, London with
 * Big Ben over Westminster Bridge at sunset, Tokyo Tower at twilight — but
 * re-rendered in the brand's jewel-tone + champagne-gold palette so the site
 * still reads like a printed season brochure.
 *
 * Used as the background of the /cities index tiles and the /cities/[slug] hero.
 * The caller sizes the element and lays a dark scrim on top for text legibility.
 * Returns null for cities without a bespoke scene, so the caller falls back to
 * the jewel gradient.
 *
 * Each scene is authored in a 1200×675 (16:9) viewBox. Gradient/filter ids are
 * suffixed with the slug so multiple scenes can coexist on the index page.
 */
import type { CSSProperties } from 'react'

const GOLD = '#D4AF37'
const GOLD_BRIGHT = '#E7C766'
const GOLD_DEEP = '#A6822B'

/** Slugs that currently have a bespoke scene. */
export const CITY_SCENE_SLUGS = new Set(['london', 'tokyo', 'paris'])

export function hasCityScene(slug: string): boolean {
  return CITY_SCENE_SLUGS.has(slug)
}

interface Props {
  slug: string
  className?: string
  style?: CSSProperties
}

/** A scatter of faint gold stars across the upper sky. */
function Stars(seed: number, count = 14) {
  const stars = []
  let s = seed
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = 0; i < count; i++) {
    const x = 40 + rnd() * 1120
    const y = 20 + rnd() * 220
    const r = 0.7 + rnd() * 1.3
    stars.push(
      <circle key={i} cx={x} cy={y} r={r} fill={GOLD_BRIGHT} opacity={0.18 + rnd() * 0.4} />
    )
  }
  return <g aria-hidden>{stars}</g>
}

function ParisScene(id: string) {
  const tower = {
    fill: 'none',
    stroke: `url(#${id}-gold)`,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B1A30" />
          <stop offset="34%" stopColor="#1E3A5F" />
          <stop offset="60%" stopColor="#3E6088" />
          <stop offset="82%" stopColor="#9A8E78" />
          <stop offset="100%" stopColor="#DAC089" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="50%" cy="64%" r="46%">
          <stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity="0.9" />
          <stop offset="34%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_BRIGHT} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
        <filter id={`${id}-haze`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <rect width="1200" height="675" fill={`url(#${id}-sky)`} />
      {Stars(7, 10)}
      <rect width="1200" height="675" fill={`url(#${id}-sun)`} />

      {/* Soft drifting haze */}
      <g fill={GOLD_BRIGHT} opacity="0.10" filter={`url(#${id}-haze)`}>
        <ellipse cx="250" cy="180" rx="150" ry="20" />
        <ellipse cx="930" cy="140" rx="190" ry="22" />
        <ellipse cx="640" cy="250" rx="120" ry="16" />
      </g>

      {/* Distant skyline */}
      <g fill="#0A1322" opacity="0.85">
        <rect x="0" y="582" width="1200" height="93" />
        <rect x="70" y="548" width="60" height="40" />
        <rect x="150" y="560" width="38" height="30" />
        <rect x="980" y="540" width="70" height="48" />
        <rect x="1080" y="556" width="44" height="34" />
        <rect x="900" y="566" width="36" height="24" />
      </g>

      {/* Eiffel Tower */}
      <g transform="translate(600 150) scale(2.2)">
        <g {...tower} strokeWidth="2.2">
          <path d="M0 0 V26" />
          <path d="M-50 226 C-14 136 -4 64 0 26 C4 64 14 136 50 226" />
          <path d="M-26 174 H26" />
          <path d="M-36 200 H36" />
          <path d="M-52 226 H52" />
          <path d="M-30 226 Q0 182 30 226" />
        </g>
        <g {...tower} strokeWidth="1.1" opacity="0.5">
          <path d="M0 26 V226" />
          <path d="M-18 174 L-30 226 M18 174 L30 226" />
          <path d="M-12 130 H12" />
        </g>
      </g>
    </>
  )
}

function LondonScene(id: string) {
  const tower = {
    fill: 'none',
    stroke: `url(#${id}-gold)`,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  // Westminster Bridge — a run of shallow arches across the Thames.
  const arches = []
  const deckY = 452
  const span = 152
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * span
    arches.push(
      <path
        key={i}
        d={`M${x} ${deckY} Q${x + span / 2} ${deckY + 46} ${x + span} ${deckY}`}
      />
    )
  }
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A1033" />
          <stop offset="26%" stopColor="#3B1C46" />
          <stop offset="50%" stopColor="#6E2A3C" />
          <stop offset="72%" stopColor="#B05A39" />
          <stop offset="88%" stopColor="#E0A24E" />
          <stop offset="100%" stopColor="#F2CE7A" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="46%" cy="68%" r="40%">
          <stop offset="0%" stopColor="#FFF1CE" stopOpacity="0.95" />
          <stop offset="22%" stopColor={GOLD_BRIGHT} stopOpacity="0.7" />
          <stop offset="60%" stopColor={GOLD} stopOpacity="0.18" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-river`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A1726" />
          <stop offset="100%" stopColor="#120A18" />
        </linearGradient>
        <linearGradient id={`${id}-reflect`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity="0.55" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_BRIGHT} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>

      <rect width="1200" height="675" fill={`url(#${id}-sky)`} />
      <rect width="1200" height="675" fill={`url(#${id}-sun)`} />
      {/* Low sun disc on the horizon */}
      <circle cx="552" cy="458" r="46" fill="#FFF3D6" opacity="0.9" />

      {/* River */}
      <rect x="0" y="466" width="1200" height="209" fill={`url(#${id}-river)`} />
      <rect x="506" y="466" width="92" height="209" fill={`url(#${id}-reflect)`} />

      {/* Westminster Bridge */}
      <g
        fill="none"
        stroke="#0C0712"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.9"
      >
        <line x1="20" y1="452" x2="1196" y2="452" />
        {arches}
      </g>
      <g fill="none" stroke={`url(#${id}-gold)`} strokeWidth="1.6" opacity="0.6">
        <line x1="20" y1="447" x2="1196" y2="447" />
      </g>

      {/* Big Ben — Elizabeth Tower */}
      <g transform="translate(905 118) scale(1.55)">
        <g {...tower} strokeWidth="2.4">
          <path d="M0 0 L0 12" />
          <path d="M-16 30 L0 8 L16 30 Z" />
          <path d="M-14 30 H14 V46 H-14 Z" />
          <path d="M-12 46 H12 V182 H-12 Z" />
          <circle cx="0" cy="84" r="12" />
          <path d="M-20 182 H20 V224 H-20 Z" />
        </g>
        <g {...tower} strokeWidth="1.3" opacity="0.7">
          <path d="M0 76 V84 L6 88" />
          <path d="M-12 134 H12" />
          <path d="M-12 152 H12" />
        </g>
      </g>
    </>
  )
}

function TokyoScene(id: string) {
  const tower = {
    fill: 'none',
    stroke: `url(#${id}-gold)`,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  // Distant lit windows in the skyline.
  const windows = []
  let s = 31
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = 0; i < 70; i++) {
    const x = 20 + rnd() * 1160
    const y = 560 + rnd() * 100
    windows.push(
      <rect key={i} x={x} y={y} width={3} height={3} fill={GOLD_BRIGHT} opacity={0.3 + rnd() * 0.5} />
    )
  }
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0E1B33" />
          <stop offset="30%" stopColor="#28244F" />
          <stop offset="55%" stopColor="#4A2350" />
          <stop offset="80%" stopColor="#8A3D45" />
          <stop offset="100%" stopColor="#D79A5E" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="58%" r="44%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.4" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBF3DD" />
          <stop offset="78%" stopColor="#E9DCBC" />
          <stop offset="100%" stopColor="#E9DCBC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_BRIGHT} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>

      <rect width="1200" height="675" fill={`url(#${id}-sky)`} />
      {Stars(19, 16)}
      <circle cx="1010" cy="148" r="46" fill={`url(#${id}-moon)`} />
      <circle cx="1010" cy="148" r="30" fill="#FBF3DD" opacity="0.95" />
      <rect width="1200" height="675" fill={`url(#${id}-glow)`} />

      {/* Skyline */}
      <g fill="#0A1020" opacity="0.9">
        <rect x="0" y="566" width="1200" height="109" />
        <rect x="60" y="528" width="70" height="48" />
        <rect x="160" y="544" width="40" height="32" />
        <rect x="250" y="520" width="52" height="56" />
        <rect x="900" y="524" width="64" height="52" />
        <rect x="1000" y="540" width="42" height="36" />
        <rect x="1080" y="516" width="56" height="60" />
      </g>
      {windows}

      {/* Tokyo Tower */}
      <g transform="translate(600 150) scale(2.08)">
        <g {...tower} strokeWidth="2.2">
          <path d="M0 0 V28" />
          <path d="M-44 226 C-10 138 -4 66 0 28 C4 66 10 138 44 226" />
          <path d="M-16 108 H16 V128 H-16 Z" />
          <path d="M-26 164 H26 V184 H-26 Z" />
          <path d="M-48 226 H48" />
        </g>
        <g {...tower} strokeWidth="1.1" opacity="0.6">
          <path d="M-36 226 L0 184 L36 226" />
          <path d="M-26 184 L0 226 L26 184" />
          <path d="M0 28 V226" />
        </g>
      </g>
    </>
  )
}

export default function CityScene({ slug, className, style }: Props) {
  let scene: JSX.Element | null = null
  if (slug === 'paris') scene = ParisScene(slug)
  else if (slug === 'london') scene = LondonScene(slug)
  else if (slug === 'tokyo') scene = TokyoScene(slug)

  if (!scene) return null

  return (
    <svg
      viewBox="0 0 1200 675"
      role="img"
      aria-hidden
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      {scene}
    </svg>
  )
}
