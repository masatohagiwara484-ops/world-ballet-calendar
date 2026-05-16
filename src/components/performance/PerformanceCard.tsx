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

  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(companyCity)}&checkin=${performance.start_date}&checkout=${performance.end_date ?? performance.start_date}&label=world-ballet-opera-calendar`

  return (
    <article className="group border border-white/5 p-8 hover:border-[#C9A961]/30 transition-all duration-500 bg-white/[0.01] hover:bg-white/[0.03]">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Performance info */}
        <div className="flex-1">
          {performance.is_featured && (
            <span className="inline-block mb-3 px-3 py-1 bg-[#C9A961]/15 text-[#C9A961] text-[10px] tracking-[0.2em] uppercase">
              Featured
            </span>
          )}

          <h3 className="font-serif text-2xl font-light mb-2 group-hover:text-[#C9A961] transition-colors duration-300">
            {performance.title}
          </h3>

          {performance.composer && (
            <p className="text-white/40 text-sm mb-1">
              {performance.composer}
              {performance.choreographer && ` · Choreography: ${performance.choreographer}`}
            </p>
          )}

          {performance.venue && (
            <p className="text-white/25 text-sm mt-3 tracking-wide">
              {performance.venue}
            </p>
          )}
        </div>

        {/* Dates + actions */}
        <div className="md:text-right shrink-0">
          <div className="mb-4">
            <p className="text-white/80 text-sm font-medium">
              {formatDate(startDate)}
            </p>
            {endDate && (
              <p className="text-white/30 text-xs mt-1">
                — {formatDate(endDate)}
              </p>
            )}
          </div>

          {performance.price_range && (
            <p className="text-[#C9A961] text-xs tracking-wider mb-4">
              {performance.price_range}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {performance.ticket_url && (
              <a
                href={performance.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-[#C9A961] text-[#0A0A0A] text-xs tracking-widest uppercase hover:bg-[#D4B870] transition-all duration-300 text-center font-medium"
              >
                Book Tickets
              </a>
            )}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-white/10 text-white/35 text-xs tracking-widest uppercase hover:border-white/25 hover:text-white/55 transition-all duration-300 text-center"
            >
              Hotels in {companyCity}
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
