'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Company } from '@/lib/supabase'

const goldIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;
    background:#C9A961;
    border:2px solid rgba(255,255,255,0.8);
    border-radius:50%;
    cursor:pointer;
    box-shadow:0 0 8px rgba(201,169,97,0.6);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

interface WorldMapProps {
  filter?: 'all' | 'ballet' | 'opera'
}

export default function WorldMap({ filter = 'all' }: WorldMapProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = filter === 'all' ? '/api/companies' : `/api/companies?type=${filter}`
    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setCompanies(data.companies ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <p className="text-gray-400 text-sm tracking-widest uppercase">Loading…</p>
        </div>
      )}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="bg-gray-950"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        {companies.map((company) => (
          <Marker
            key={company.id}
            position={[company.lat, company.lng]}
            icon={goldIcon}
          >
            <Popup>
              <div style={{
                background: '#0A0A0A',
                color: '#FAFAF8',
                padding: '12px 14px',
                minWidth: '180px',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '2px',
              }}>
                <p style={{
                  fontSize: '10px',
                  color: '#C9A961',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}>
                  {company.type} · {company.city}
                </p>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '10px',
                  lineHeight: '1.3',
                }}>
                  {company.name}
                </h3>
                <a
                  href={`/companies/${company.slug}`}
                  style={{
                    fontSize: '11px',
                    color: '#C9A961',
                    textDecoration: 'none',
                    letterSpacing: '0.05em',
                  }}
                >
                  View performances →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
