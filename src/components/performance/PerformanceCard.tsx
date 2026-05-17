'use client'

import type { Performance } from '@/lib/supabase'

interface Props {
  performance: Performance
  companyCity: string
  companyCountry?: string
}

export default function PerformanceCard({ performance, companyCity }: Props) {
  const startDate = new Date(performance.start_date + 'T00:00:00')
  const endDate = performance.end_date ? new Date(performance.end_date + 'T00:00:00') : null

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const hotelUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(companyCity)}&checkin=${performance.start_date}&checkout=${performance.end_date ?? performance.start_date}&label=world-ballet-opera-calendar`

  const ticketUrl = performance.affiliate_url ?? performance.ticket_url ?? null

  return (
    <article className="group bg-white rounded-lg p-8 border border-[#1A1A1A]/[0.08] shadow-card hover:shadow-card-hover hover:border-[#D4AF37]/30 transition-all duration-500">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Performance info */}
        <div className="flex-1">
          {performance.is_featured && (
            <span className="inline-block mb-3 px-3 py-1 bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase">
              Featured
            </span>
          )}

          <h3 className="font-serif text-2xl font-light mb-2 text-[#1A1A1A] group-hover:text-[#D4AF37] transition-colors duration-300">
            {performance.title}
          </h3>

          {performance.composer && (
            <p className="text-[#1A1A1A]/50 text-sm mb-1">
              {performance.composer}
              {performance.choreographer && ` · Choreography: ${performance.choreographer}`}
            </p>
          )}

          {performance.venue && (
            <p className="text-[#1A1A1A]/40 text-sm mt-3 tracking-wide">
              {performance.venue}
            </p>
          )}
        </div>

        {/* Dates + actions */}
        <div className="md:text-right shrink-0">
          <div className="mb-4">
            <p className="text-[#1A1A1A] text-sm font-medium">
              {formatDate(startDate)}
            </p>
            {endDate && (
              <p className="text-[#1A1A1A]/40 text-xs mt-1">
                — {formatDate(endDate)}
              </p>
            )}
          </div>

          {performance.price_range && (
            <p className="text-[#D4AF37] text-xs tracking-wider mb-4">
              {performance.price_range}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {ticketUrl && (
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 min-h-[44px] flex items-center justify-center bg-[#D4AF37] text-white text-xs tracking-widest uppercase hover:bg-[#C9A961] transition-all duration-300 text-center font-medium rounded"
              >
                Book Tickets
              </a>
            )}
            <a
              href={hotelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 min-h-[44px] flex items-center justify-center border border-[#1A1A1A]/15 text-[#1A1A1A]/50 text-xs tracking-widest uppercase hover:border-[#1A1A1A]/30 hover:text-[#1A1A1A]/70 transition-all duration-300 text-center rounded"
            >
              Hotels in {companyCity}
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
