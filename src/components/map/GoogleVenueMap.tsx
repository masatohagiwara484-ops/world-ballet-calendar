'use client'

/**
 * GoogleVenueMap — the venue map on Google Maps.
 *
 * Owners and visitors already know Google Maps' gestures, search, and Street
 * View, so it reads as more "universally usable" than a custom tile map. This is
 * the primary map whenever NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured;
 * VenueMapLoader falls back to the Leaflet map when it isn't (so the page never
 * breaks for want of a key).
 *
 * Every covered house is a gold 📍 pin; clicking one opens an InfoWindow that
 * links to the house — the entry point to the "plan the trip" panel.
 */
import { useState } from 'react'
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { Navigation } from 'lucide-react'
import type { VenueMarker } from './VenueMap'

interface Props {
  venues: VenueMarker[]
  single?: boolean
  enableNearMe?: boolean
  className?: string
}

// Gold pin as an inline SVG data-URI, so we depend on no external asset and no
// `google` global at render time.
const GOLD_PIN =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="6.5" fill="#D4AF37" stroke="#FFFFFF" stroke-width="1.6"/>
      <circle cx="11" cy="11" r="10" fill="none" stroke="#D4AF37" stroke-opacity="0.35" stroke-width="1.2"/>
    </svg>`
  )

/** Geolocation control — fly to the visitor when they ask. */
function NearMe() {
  const map = useMap()
  const [state, setState] = useState<'idle' | 'locating' | 'denied'>('idle')

  function locate() {
    if (!map || typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('denied')
      return
    }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState('idle')
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map.setZoom(7)
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  return (
    <button
      onClick={locate}
      disabled={state === 'locating'}
      className="absolute z-[500] bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[11px] tracking-[0.18em] uppercase text-stage font-medium shadow-lg hover:bg-gold-bright transition-colors disabled:opacity-60"
      title={state === 'denied' ? 'Location unavailable — explore the map freely' : 'Find houses near me'}
    >
      <Navigation size={13} />
      {state === 'locating' ? 'Locating…' : state === 'denied' ? 'Location off' : 'Near me'}
    </button>
  )
}

export default function GoogleVenueMap({
  venues,
  single = false,
  enableNearMe = false,
  className = '',
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  const center =
    single && venues[0]
      ? { lat: venues[0].lat, lng: venues[0].lng }
      : { lat: 42, lng: 12 }
  const zoom = single ? 12 : 2
  const open = openSlug ? venues.find((v) => v.slug === openSlug) : null

  // Defensive: VenueMapLoader only mounts this when the key exists, but guard so
  // a misconfiguration shows a hint rather than a blank/crash.
  if (!apiKey) {
    return (
      <div className={`relative grid place-items-center rounded-glass bg-stage-deep ${className}`}>
        <p className="text-ivory/50 text-sm">Map unavailable — Google Maps key not configured.</p>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-glass ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          minZoom={2}
          gestureHandling={single ? 'cooperative' : 'greedy'}
          disableDefaultUI={single}
          zoomControl
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={!single}
          colorScheme="DARK"
          style={{ width: '100%', height: '100%' }}
        >
          {venues.map((v) => (
            <Marker
              key={v.slug}
              position={{ lat: v.lat, lng: v.lng }}
              icon={GOLD_PIN}
              title={v.name}
              onClick={() => setOpenSlug(v.slug)}
            />
          ))}

          {open && (
            <InfoWindow
              position={{ lat: open.lat, lng: open.lng }}
              onCloseClick={() => setOpenSlug(null)}
              pixelOffset={[0, -12]}
            >
              <div style={{ padding: '4px 6px', minWidth: 150 }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 15, color: '#1A1A1A' }}>
                  {open.name}
                </span>
                {open.venue && (
                  <span style={{ display: 'block', fontSize: 12, color: 'rgba(26,26,26,0.65)', marginTop: 2 }}>
                    {open.venue}
                  </span>
                )}
                <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#A8842A', marginTop: 4 }}>
                  {open.city} · {open.country}
                </span>
                <a
                  href={`/companies/${open.slug}`}
                  style={{ display: 'inline-block', marginTop: 8, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A8842A', textDecoration: 'underline' }}
                >
                  View house →
                </a>
              </div>
            </InfoWindow>
          )}

          {enableNearMe && !single && <NearMe />}
        </Map>
      </APIProvider>
    </div>
  )
}
