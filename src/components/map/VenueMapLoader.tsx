'use client'

/**
 * VenueMapLoader — the client boundary that picks and loads a map.
 *
 * Both map engines reach for `window` at import time, so neither may be
 * server-rendered: next/dynamic with `ssr: false` (only legal inside a Client
 * Component, which is why this wrapper exists). We prefer Google Maps when an API
 * key is configured (more universally familiar to users), and fall back to the
 * key-less Leaflet/CARTO map otherwise — so the map always works, with or
 * without a key.
 */
import dynamic from 'next/dynamic'
import type { VenueMarker } from './VenueMap'

const loading = () => (
  <div className="h-full w-full rounded-glass bg-stage-deep animate-pulse" aria-hidden />
)

const LeafletMap = dynamic(() => import('./VenueMap'), { ssr: false, loading })
const GoogleMap = dynamic(() => import('./GoogleVenueMap'), { ssr: false, loading })

interface Props {
  venues: VenueMarker[]
  single?: boolean
  enableNearMe?: boolean
  className?: string
}

export default function VenueMapLoader(props: Props) {
  const hasGoogle = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  const Map = hasGoogle ? GoogleMap : LeafletMap
  return <Map {...props} />
}
