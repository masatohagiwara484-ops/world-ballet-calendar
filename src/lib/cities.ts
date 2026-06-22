/**
 * City derivation — the programmatic-SEO layer for "what's on in {city}".
 *
 * Cities are not a stored entity; they are derived from the companies dataset
 * (every company has a city + country). This gives us a stable set of indexable
 * landing pages — "Ballet & opera in Paris", "…in Tokyo" — that match exactly
 * the query a culture traveller types, with zero extra data to maintain. The
 * page itself pulls live performances via searchAsync(city), so each city page
 * compounds organic search traffic as the calendar fills.
 */
import { getCompanies } from './data'
import type { Company } from './types'

export interface City {
  slug: string
  name: string
  country: string
  country_code: string
  companies: Company[]
}

/** kebab-case a city name into a URL slug ("Saint Petersburg" → "saint-petersburg"). */
export function citySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** All cities that have at least one company, sorted by company count then name. */
export async function getCities(): Promise<City[]> {
  const companies = await getCompanies()
  const byCity = new Map<string, City>()
  for (const c of companies) {
    if (!c.city) continue
    const slug = citySlug(c.city)
    const existing = byCity.get(slug)
    if (existing) {
      existing.companies.push(c)
    } else {
      byCity.set(slug, {
        slug,
        name: c.city,
        country: c.country,
        country_code: c.country_code,
        companies: [c],
      })
    }
  }
  return [...byCity.values()].sort(
    (a, b) => b.companies.length - a.companies.length || a.name.localeCompare(b.name)
  )
}

/** One city by slug, or null. */
export async function getCityBySlug(slug: string): Promise<City | null> {
  const cities = await getCities()
  return cities.find((c) => c.slug === slug) ?? null
}
