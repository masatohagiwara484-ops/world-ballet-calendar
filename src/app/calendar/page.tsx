import type { Metadata } from 'next'
import SeasonCalendar from '@/components/calendar/SeasonCalendar'

export const metadata: Metadata = {
  title: 'Season Calendar',
  description:
    'The complete 2026–27 ballet and opera season, month by month. Filter by type, country, and company to plan every performance.',
}

export default function CalendarPage() {
  return (
    <main className="min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-12">
        <p className="text-[#D4AF37] text-[11px] tracking-[0.4em] uppercase mb-4">
          2026 – 2027 Season
        </p>
        <h1 className="font-serif text-5xl md:text-6xl font-light text-[#1A1A1A] leading-tight">
          The season calendar
        </h1>
        <p className="mt-5 text-[#1A1A1A]/55 text-base md:text-lg font-light max-w-2xl">
          Every run, every house, gathered into one living calendar. Move
          through the months, filter to what you love, and open any day to plan
          your evening.
        </p>
      </div>
      <SeasonCalendar />
    </main>
  )
}
