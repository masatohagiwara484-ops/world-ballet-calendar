'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Placeholder data (replaced by Supabase later)
const companies = [
  { name: 'Royal Ballet', lat: 51.3127, lng: -0.1269, city: 'London' },
  { name: 'Paris Opéra Ballet', lat: 48.8748, lng: 2.3359, city: 'Paris' },
  { name: 'Bolshoi Ballet', lat: 55.7605, lng: 37.6192, city: 'Moscow' },
]

const goldIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color:#c9a961;width:12px;height:12px;border-radius:50%;border:2px solid white;cursor:pointer;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function WorldMap() {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      className="bg-gray-900"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
      />
      {companies.map((company) => (
        <Marker
          key={company.name}
          position={[company.lat, company.lng]}
          icon={goldIcon}
        >
          <Popup>
            <div className="text-black">
              <h3 className="font-bold">{company.name}</h3>
              <p className="text-sm">{company.city}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
