'use client'

import { useEffect, useRef } from 'react'
import { gsap, EASE, DURATION } from '@/lib/gsap'
import dynamic from 'next/dynamic'

const GlobeView = dynamic(() => import('@/components/map/GlobeView'), {
  ssr: false,
  loading: () => <div className="h-full bg-[#F5F0EA]" />,
})

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLHeadingElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'instant' })

    const tl = gsap.timeline({ delay: 0.2 })

    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    )
    .fromTo(
      titleRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: DURATION.cinematic, ease: EASE.cinematic },
      '-=0.3'
    )
    .fromTo(
      subtitleRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.smooth },
      '-=1.2'
    )
    .fromTo(
      descRef.current,
      { opacity: 0 },
      { opacity: 1, duration: DURATION.normal, ease: EASE.gentle },
      '-=0.8'
    )
    .fromTo(
      ctaRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: DURATION.normal, ease: EASE.smooth },
      '-=0.5'
    )
  }, [])

  return (
    <section
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0) 65%), linear-gradient(180deg, #FFFFFF 0%, #F5F0EA 100%)',
      }}
    >
      {/* Globe Background */}
      <div className="absolute inset-0 opacity-40">
        <GlobeView />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FAF8F5] to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 text-center px-8 max-w-5xl mx-auto">
        <p
          ref={badgeRef}
          className="text-[#C9A961] text-[10px] tracking-[0.5em] uppercase mb-8 opacity-0"
        >
          The World Calendar
        </p>

        <h1
          ref={titleRef}
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-light leading-none mb-4 text-[#1A1A1A] opacity-0"
        >
          Every stage.
        </h1>

        <h2
          ref={subtitleRef}
          className="font-serif text-6xl md:text-8xl lg:text-9xl font-light leading-none mb-12 text-[#1A1A1A]/25 opacity-0"
        >
          Every season.
        </h2>

        <p
          ref={descRef}
          className="text-[#1A1A1A]/50 text-base md:text-lg font-light tracking-wide max-w-xl mx-auto mb-12 opacity-0"
        >
          Discover ballet and opera performances across<br />
          the world&apos;s greatest companies and opera houses.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center opacity-0">
          <a
            href="#map"
            className="px-10 py-4 bg-[#D4AF37] text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#C9A961] transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Explore the Map
          </a>
          <a
            href="#companies"
            className="px-10 py-4 border border-[#1A1A1A]/20 text-[#1A1A1A]/60 text-xs tracking-[0.2em] uppercase hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-all duration-300"
          >
            Browse Companies
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-gradient-to-b from-[#D4AF37]/40 to-transparent animate-pulse" />
        <span className="text-[#1A1A1A]/20 text-[9px] tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  )
}
