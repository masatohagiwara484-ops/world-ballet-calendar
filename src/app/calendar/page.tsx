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
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-14">
        <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">
          2026 – 2027 Season
        </p>
        <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
          The season calendar
        </h1>
        <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-xl leading-relaxed">
          Every run, every house — gathered into one living calendar. Move
          through the months, filter to what you love, and open any day to
          plan your evening.
        </p>
        <div className="mt-10 hairline border-t" />
      </div>
      <SeasonCalendar />
    </main>
  )
}
