'use client'

/**
 * VenueMapLoader — the client boundary for the Leaflet map.
 *
 * Leaflet reaches for `window` at import time, so the actual map must never be
 * server-rendered. next/dynamic with `ssr: false` is only allowed inside a
 * Client Component, so this thin wrapper exists purely to provide that boundary
 * (server pages import THIS, not VenueMap directly) and to show an on-brand
 * placeholder while the map chunk loads.
 */
import dynamic from 'next/dynamic'
import type { VenueMarker } from './VenueMap'

const VenueMap = dynamic(() => import('./VenueMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-glass bg-stage-deep animate-pulse" aria-hidden />
  ),
})

interface Props {
  venues: VenueMarker[]
  single?: boolean
  enableNearMe?: boolean
  className?: string
}

export default function VenueMapLoader(props: Props) {
  return <VenueMap {...props} />
}
