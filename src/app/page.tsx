'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const GlobeView = dynamic(() => import('@/components/map/GlobeView'), {
  ssr: false,
  loading: () => <div className="h-screen bg-black" />,
})

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-950 flex items-center justify-center">
    <p className="text-gray-600 text-sm tracking-widest uppercase">Loading…</p>
  </div>,
})

type MapFilter = 'all' | 'ballet' | 'opera'

const FILTERS: { label: string; value: MapFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Ballet', value: 'ballet' },
  { label: 'Opera', value: 'opera' },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-screen bg-black" />

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Globe */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <GlobeView />
        </div>
        <div className="relative z-10 text-center pointer-events-none">
          <h1 className="font-serif text-6xl md:text-8xl font-light tracking-tight mb-4">
            Every stage.
          </h1>
          <h2 className="font-serif text-6xl md:text-8xl font-light tracking-tight mb-12 text-gray-400">
            Every season.
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto px-4">
            Discover ballet and opera performances around the world.
          </p>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto">
          <h3 className="font-serif text-4xl mb-4 text-center">Find by location</h3>

          {/* Filter buttons */}
          <div className="flex justify-center gap-3 mb-10">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setMapFilter(value)}
                className={`px-6 py-2 text-sm tracking-widest uppercase border transition-all duration-300 ${
                  mapFilter === value
                    ? 'border-[#C9A961] text-[#C9A961] bg-[#C9A961]/10'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden border border-gray-800 h-[500px]">
            <WorldMap filter={mapFilter} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>World Ballet &amp; Opera Calendar &copy; 2026</p>
        </div>
      </footer>
    </div>
  )
}
