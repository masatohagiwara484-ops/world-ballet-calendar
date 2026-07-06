/**
 * Trip derivation — turns a city's performance calendar into a bookable trip.
 *
 * Like cities.ts, trips are not stored: they are derived from the existing
 * companies + performances data, so /trips/[city] pages cost zero extra data
 * maintenance. Each trip finds the city's next performance run, clamps it to a
 * sane hotel window, and maps every night of that window to what's on stage —
 * the itinerary that the travel bundle (hotels / experiences / flights /
 * attractions) is then dated to.
 */
import { cache } from 'react'
import { getCities, getCityBySlug, type City } from './cities'
import { getPerformances } from './data'
import { searchAsync } from './search'
import { addDaysISO, todayISO } from './dates'
import type { TripContext } from './affiliate'
import type { SearchResultItem } from './types'

/** Longest hotel window we auto-date — a long run should not price a 3-week stay. */
const MAX_NIGHTS = 4

export interface TripRun {
  /** Hotel check-in (first night). */
  startDate: string
  /** Hotel check-out (morning after the last night). */
  endDate: string
}

export interface TripNight {
  date: string
  /** What's on stage in this city that evening. */
  performances: SearchResultItem[]
}

export interface CityTrip {
  city: City
  /** Trip context dated to the featured run when one exists (drives all links). */
  ctx: TripContext
  /** Every upcoming performance in the city, soonest first. */
  upcoming: SearchResultItem[]
  /** The featured (next) run's hotel window, or null when nothing is scheduled. */
  run: TripRun | null
  /** Night-by-night plan across the featured window. */
  nights: TripNight[]
}

/** Trip context for a city — coordinates from the first company that has them. */
export function cityTripContext(city: City, run?: TripRun | null): TripContext {
  const geo = city.companies.find(
    (c) => Number.isFinite(c.lat) && Number.isFinite(c.lng)
  )
  return {
    city: city.name,
    country: city.country,
    lat: geo?.lat,
    lng: geo?.lng,
    startDate: run?.startDate,
    endDate: run?.endDate,
  }
}

/**
 * The full derived trip for one city, or null when the city is unknown.
 * cache()d so generateMetadata and the page body share one derivation per
 * request instead of fetching + building the search graph twice.
 */
export const getCityTrip = cache(async function getCityTrip(
  slug: string
): Promise<CityTrip | null> {
  const city = await getCityBySlug(slug)
  if (!city) return null

  // start_date filters to runs still playing on/after today AT THE SOURCE —
  // searchAsync clamps page_size to 60, so filtering after the fact would let
  // a past-heavy city push future runs off the page.
  const today = todayISO()
  const { items } = await searchAsync({
    city: city.name,
    start_date: today,
    page_size: 200,
  })
  const upcoming = [...items].sort((a, b) => a.start_date.localeCompare(b.start_date))

  let run: TripRun | null = null
  const nights: TripNight[] = []

  if (upcoming.length > 0) {
    const first = upcoming[0]
    // Start the stay on the run's first night (or tonight if already running).
    const startDate = first.start_date > today ? first.start_date : today
    const cap = addDaysISO(startDate, MAX_NIGHTS)
    const naturalEnd = first.end_date > startDate ? first.end_date : addDaysISO(startDate, 1)
    const endDate = naturalEnd > cap ? cap : naturalEnd
    run = { startDate, endDate }

    // One entry per night of the stay (check-out day is not a night).
    for (let d = startDate; d < endDate; d = addDaysISO(d, 1)) {
      nights.push({
        date: d,
        performances: upcoming.filter((p) => p.start_date <= d && p.end_date >= d),
      })
    }
  }

  return { city, ctx: cityTripContext(city, run), upcoming, run, nights }
})

export interface TripCityCard {
  city: City
  /** Upcoming productions in this city. */
  upcomingCount: number
  /** ISO date of the soonest upcoming run, or null. */
  nextDate: string | null
}

/** Cards for the /trips index — one cheap pass over the dataset, no per-city search. */
export async function getTripCityCards(): Promise<TripCityCard[]> {
  const [cities, performances] = await Promise.all([getCities(), getPerformances()])
  const today = todayISO()

  const cards = cities.map((city) => {
    const slugs = new Set(city.companies.map((c) => c.slug))
    const upcoming = performances.filter(
      (p) => slugs.has(p.company_slug) && p.end_date >= today
    )
    // Clamp ongoing runs to today so a long-running production reads as
    // bookable now, not as a months-old "next run" (mirrors getCityTrip).
    const nextDate = upcoming.reduce<string | null>((min, p) => {
      const start = p.start_date > today ? p.start_date : today
      return min === null || start < min ? start : min
    }, null)
    return { city, upcomingCount: upcoming.length, nextDate }
  })

  // Cities with imminent dates first — those are the bookable trips.
  return cards.sort((a, b) => {
    if (a.nextDate && b.nextDate) return a.nextDate.localeCompare(b.nextDate)
    if (a.nextDate) return -1
    if (b.nextDate) return 1
    return b.city.companies.length - a.city.companies.length
  })
}
