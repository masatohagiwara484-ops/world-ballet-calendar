'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Performance, Company } from '@/lib/supabase'

interface PerformanceModalProps {
  isOpen: boolean
  onClose: () => void
  performance: (Performance & { company?: Company }) | null
  accentColor?: string
}

export default function PerformanceModal({
  isOpen,
  onClose,
  performance,
  accentColor = 'gold',
}: PerformanceModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen || !backdropRef.current || !modalRef.current) return

    const tl = gsap.timeline()

    tl.fromTo(
      backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    ).fromTo(
      modalRef.current,
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1.0, duration: 0.3, ease: 'back.out(1.5)' },
      0
    )

    // Move focus into the modal so keyboard/screen-reader users land inside it.
    closeButtonRef.current?.focus()
  }, [isOpen])

  const handleClose = async () => {
    if (!backdropRef.current || !modalRef.current) return

    await gsap
      .timeline()
      .to(modalRef.current, { opacity: 0, scale: 0.92, duration: 0.2 })
      .to(backdropRef.current, { opacity: 0, duration: 0.2 }, 0)

    onClose()
  }

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!backdropRef.current || !modalRef.current) return

        gsap
          .timeline()
          .to(modalRef.current, { opacity: 0, scale: 0.92, duration: 0.2 })
          .to(backdropRef.current, { opacity: 0, duration: 0.2 }, 0)
          .then(() => onClose())
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !performance) return null

  const accentColorMap: Record<string, string> = {
    navy: '#1B2A4A',
    forest: '#1A3A2E',
    purple: '#2D1B4E',
    gold: '#D4AF37',
  }

  const accentBgColor = accentColorMap[accentColor] || accentColorMap.gold

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const companyCountry = performance.company?.country || null
  const bookingUrl = performance.affiliate_url ?? performance.ticket_url ?? null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none"
      onClick={handleClose}
      style={{
        backgroundColor: 'rgba(26, 26, 26, 0.4)',
        backdropFilter: 'blur(4px)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="performance-modal-title"
        className="relative w-full max-w-2xl bg-gradient-to-br from-white to-[#FAF8F5] rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: accentBgColor }}
        />

        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          aria-label="Close performance details"
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-[#1A1A1A]/40 hover:text-[#1A1A1A]/80 transition-colors z-10"
        >
          <span className="text-xl" aria-hidden="true">×</span>
        </button>

        {/* Content */}
        <div className="p-8 md:p-12">
          {/* Performance badge */}
          <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-4 font-medium">
            Performance
          </p>

          {/* Title */}
          <h2
            id="performance-modal-title"
            className="font-serif text-4xl md:text-5xl font-light text-[#1A1A1A] mb-4"
          >
            {performance.title}
          </h2>

          {/* Meta info */}
          <div className="flex flex-wrap gap-6 md:gap-8 mb-6 pb-6 border-b border-[#1A1A1A]/08">
            <div>
              <p className="text-[#1A1A1A]/40 text-xs uppercase tracking-widest mb-1">
                Date
              </p>
              <p className="text-[#1A1A1A] font-medium text-sm">
                {formatDate(performance.start_date)}
              </p>
            </div>

            {performance.company?.type && (
              <div>
                <p className="text-[#1A1A1A]/40 text-xs uppercase tracking-widest mb-1">
                  Type
                </p>
                <p className="text-[#1A1A1A] font-medium text-sm capitalize">
                  {performance.company.type}
                </p>
              </div>
            )}

            {companyCountry && (
              <div>
                <p className="text-[#1A1A1A]/40 text-xs uppercase tracking-widest mb-1">
                  Country
                </p>
                <p className="text-[#1A1A1A] font-medium text-sm">{companyCountry}</p>
              </div>
            )}

            {performance.venue && (
              <div>
                <p className="text-[#1A1A1A]/40 text-xs uppercase tracking-widest mb-1">
                  Venue
                </p>
                <p className="text-[#1A1A1A] font-medium text-sm">{performance.venue}</p>
              </div>
            )}
          </div>

          {/* Composer & Choreographer */}
          {(performance.composer || performance.choreographer) && (
            <div className="mb-6 pb-6 border-b border-[#1A1A1A]/08">
              {performance.composer && (
                <div className="mb-3">
                  <p className="text-[#1A1A1A]/40 text-xs uppercase tracking-widest mb-1">
                    Composer
                  </p>
                  <p className="text-[#1A1A1A] text-sm">{performance.composer}</p>
                </div>
              )}
              {performance.choreographer && (
                <div>
                  <p className="text-[#1A1A1A]/40 text-xs uppercase tracking-widest mb-1">
                    Choreographer
                  </p>
                  <p className="text-[#1A1A1A] text-sm">{performance.choreographer}</p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {performance.description && (
            <p className="text-[#1A1A1A]/60 text-base leading-relaxed mb-8">
              {performance.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center px-10 py-4 bg-[#D4AF37] text-white text-xs tracking-[0.2em] uppercase font-medium rounded shadow-md hover:bg-[#C9A961] hover:scale-[1.03] hover:shadow-lg transition-all duration-300"
              >
                Book Tickets
              </a>
            )}
            {performance.price_range && (
              <span className="text-[#1A1A1A]/50 text-xs">
                {performance.price_range}
              </span>
            )}
            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-8 py-3 border border-[#1A1A1A]/15 text-[#1A1A1A]/60 text-sm tracking-widest uppercase rounded hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-all sm:ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
