'use client'

import { useCallback, useEffect, useRef } from 'react'
import Globe, { GlobeMethods } from 'react-globe.gl'
import type { Company } from '@/lib/types'

interface GlobeInnerProps {
  companies: Company[]
  width: number
  height: number
  onSelect: (company: Company | null) => void
  onHover: (company: Company | null) => void
}

type Marker = Company & { lat: number; lng: number }

const GOLD = '#D4AF37'

export default function GlobeInner({
  companies,
  width,
  height,
  onSelect,
  onHover,
}: GlobeInnerProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)

  const markers: Marker[] = companies
    .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
    .map((c) => ({ ...c }))

  const handleReady = useCallback(() => {
    const g = globeRef.current
    if (!g) return
    g.pointOfView({ lat: 30, lng: 10, altitude: 2.2 }, 0)
    const controls = g.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.enableZoom = true
    controls.minDistance = 180
    controls.maxDistance = 600
  }, [])

  // Re-assert point of view on first data arrival (markers settle the camera).
  useEffect(() => {
    const g = globeRef.current
    if (g && markers.length > 0) {
      g.pointOfView({ lat: 30, lng: 10, altitude: 2.2 }, 800)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers.length])

  return (
    <Globe
      ref={globeRef}
      width={width}
      height={height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="/textures/earth.jpg"
      bumpImageUrl="/textures/earth-specular.jpg"
      showAtmosphere
      atmosphereColor={GOLD}
      atmosphereAltitude={0.18}
      onGlobeReady={handleReady}
      labelsData={markers}
      labelLat={(d: object) => (d as Marker).lat}
      labelLng={(d: object) => (d as Marker).lng}
      labelText={(d: object) => (d as Marker).name}
      labelSize={() => 0.9}
      labelDotRadius={() => 0.42}
      labelColor={() => GOLD}
      labelResolution={2}
      labelAltitude={0.01}
      labelLabel={(d: object) => {
        const m = d as Marker
        return `
          <div style="
            font-family: Georgia, serif;
            background: rgba(255,255,255,0.96);
            color: #1A1A1A;
            border: 1px solid rgba(26,26,26,0.10);
            border-left: 3px solid ${GOLD};
            border-radius: 4px;
            padding: 8px 12px;
            box-shadow: 0 8px 30px rgba(26,26,26,0.18);
            max-width: 220px;
          ">
            <div style="font-size:14px;font-weight:500;">${escapeHtml(m.name)}</div>
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(26,26,26,0.5);margin-top:3px;">
              ${escapeHtml(m.city)} · ${escapeHtml(m.country)}
            </div>
          </div>`
      }}
      onLabelClick={(d: object) => onSelect(d as Marker)}
      onLabelHover={(d: object | null) => onHover(d ? (d as Marker) : null)}
    />
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
