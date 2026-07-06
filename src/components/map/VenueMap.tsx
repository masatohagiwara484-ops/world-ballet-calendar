'use client'

/**
 * VenueMap — the world's great houses, placed on the map.
 *
 * The travel thesis (STRATEGY §) lives or dies on *place*: you don't just
 * discover a performance, you discover that it's a weekend in Paris. This map is
 * the visual entry point to that — every curated house as a gold pin on a quiet,
 * on-brand basemap, each linking back to its profile (and from there, the
 * "plan the trip" panel).
 *
 * Leaflet touches `window`, so this component is only ever mounted through
 * VenueMapLoader (next/dynamic, ssr:false). It imports Leaflet's base CSS for
 * layout; the luxury skin (controls, popups) lives in globals.css.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation } from 'lucide-react'

export interface VenueMarker {
  slug: string
  name: string
  city: string
  country: string
  venue?: string
  lat: number
  lng: number
}

interface Props {
  venues: VenueMarker[]
  /** Single-venue mode: tight zoom, no near-me, compact height. */
  single?: boolean
  /** Offer the browser-geolocation "near me" control (explorer only). */
  enableNearMe?: boolean
  className?: string
}

/** A gold pin rendered as HTML, so we never depend on Leaflet's image assets. */
function goldPin() {
  return L.divIcon({
    className: 'venue-pin',
    html: '<span class="venue-pin-dot"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  })
}

/** Imperative helper: fly to the visitor's location when they ask for it. */
function NearMe() {
  const map = useMap()
  const [state, setState] = useState<'idle' | 'locating' | 'denied'>('idle')

  function locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('denied')
      return
    }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState('idle')
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 6, { duration: 1.4 })
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  return (
    <button
      onClick={locate}
      className="absolute z-[500] bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[11px] tracking-[0.18em] uppercase text-stage font-medium shadow-lg hover:bg-gold-bright transition-colors disabled:opacity-60"
      disabled={state === 'locating'}
      title={state === 'denied' ? 'Location unavailable — explore the map freely' : 'Find houses near me'}
    >
      <Navigation size={13} />
      {state === 'locating' ? 'Locating…' : state === 'denied' ? 'Location off' : 'Near me'}
    </button>
  )
}

export default function VenueMap({ venues, single = false, enableNearMe = false, className = '' }: Props) {
  const icon = useMemo(() => goldPin(), [])
  // Center/zoom: a single venue gets a tight frame; the explorer opens on a
  // gentle world view centred on Europe (where most curated houses sit).
  const center: [number, number] = single && venues[0]
    ? [venues[0].lat, venues[0].lng]
    : [42, 12]
  const zoom = single ? 12 : 2

  // Leaflet can mis-measure its container if it mounts hidden; nudge it.
  const ref = useRef<L.Map | null>(null)
  useEffect(() => {
    const t = setTimeout(() => ref.current?.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`relative overflow-hidden rounded-glass ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={2}
        scrollWheelZoom={!single}
        worldCopyJump
        ref={ref as never}
        className="h-full w-full"
        style={{ background: '#0d1018' }}
      >
        {/* Quiet dark basemap — Carto "dark matter", no labels fighting the gold. */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {venues.map((v) => (
          <Marker key={v.slug} position={[v.lat, v.lng]} icon={icon}>
            <Popup>
              <span className="venue-popup block">
                <span className="block font-serif text-base text-ivory leading-tight">{v.name}</span>
                {v.venue && <span className="block text-ivory/70 text-xs mt-0.5">{v.venue}</span>}
                <span className="block text-gold text-[10px] tracking-[0.18em] uppercase mt-1">
                  {v.city} · {v.country}
                </span>
                <a
                  href={`/companies/${v.slug}`}
                  className="inline-block text-gold text-[11px] tracking-[0.16em] uppercase mt-2 underline underline-offset-2"
                >
                  View house →
                </a>
              </span>
            </Popup>
          </Marker>
        ))}
        {enableNearMe && !single && <NearMe />}
      </MapContainer>
    </div>
  )
}
