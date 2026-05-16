'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'

export default function ProjectNameLoader() {
  const loaderRef = useRef<HTMLDivElement>(null)
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    if (!loaderRef.current) return

    const isFirstLoad = typeof window !== 'undefined' && !localStorage.getItem('ballet_visited')

    if (!isFirstLoad) {
      setShowLoader(false)
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setShowLoader(false)
        localStorage.setItem('ballet_visited', 'true')
      },
    })

    tl.fromTo(
      loaderRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.0, ease: 'power2.inOut' }
    )
      .to(loaderRef.current, { opacity: 1, duration: 2.5 })
      .to(loaderRef.current, { opacity: 0, duration: 0.5, ease: 'power2.inOut' })
  }, [])

  if (!showLoader) return null

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 bg-[#2a2a3e] flex items-center justify-center z-[9999] opacity-0"
    >
      <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-[#E8D5B7] text-center px-8">
        World Ballet &amp; Opera Calendar
      </h1>
    </div>
  )
}
