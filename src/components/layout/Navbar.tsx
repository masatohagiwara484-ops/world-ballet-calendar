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
        ? 'bg-[#2a2a3e]/95 backdrop-blur-md border-b border-[#E8D5B7]/15'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-light tracking-wider hover:text-[#D4AF37] transition-colors duration-300">
          Ballet &amp; Opera
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#map" className="text-[#E8D5B7]/40 text-xs tracking-widest uppercase hover:text-[#E8D5B7] transition-colors duration-300">
            Map
          </Link>
          <Link href="/#companies" className="text-[#E8D5B7]/40 text-xs tracking-widest uppercase hover:text-[#E8D5B7] transition-colors duration-300">
            Companies
          </Link>
          <a
            href="#premium"
            className="px-5 py-2 border border-[#D4AF37]/40 text-[#D4AF37] text-xs tracking-widest uppercase hover:bg-[#D4AF37]/10 transition-all duration-300"
          >
            Premium
          </a>
        </div>
      </div>
    </nav>
  )
}
