'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-light tracking-wider hover:text-[#C9A961] transition-colors duration-300">
          Ballet &amp; Opera
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#map" className="text-white/40 text-xs tracking-widest uppercase hover:text-white/80 transition-colors duration-300">
            Map
          </Link>
          <Link href="/#companies" className="text-white/40 text-xs tracking-widest uppercase hover:text-white/80 transition-colors duration-300">
            Companies
          </Link>
          <a
            href="#premium"
            className="px-5 py-2 border border-[#C9A961]/40 text-[#C9A961] text-xs tracking-widest uppercase hover:bg-[#C9A961]/10 transition-all duration-300"
          >
            Premium
          </a>
        </div>
      </div>
    </nav>
  )
}
