'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const GlobeView = dynamic(() => import('@/components/map/GlobeView'), {
  ssr: false,
  loading: () => <div className="h-screen bg-black" />,
})

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-900" />,
})

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

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
          <h3 className="font-serif text-4xl mb-12 text-center">
            Find by location
          </h3>
          <div className="rounded-lg overflow-hidden border border-gray-800 h-96">
            <WorldMap />
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
