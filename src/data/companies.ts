/**
 * Curated company dataset — STUB.
 * The backend workstream replaces this with the full 20+ company dataset.
 */
import type { Company } from '@/lib/types'

export const companies: Company[] = [
  {
    id: 'c-royal-ballet',
    slug: 'royal-ballet',
    name: 'The Royal Ballet',
    type: 'ballet',
    country: 'United Kingdom',
    country_code: 'gb',
    city: 'London',
    lat: 51.5129,
    lng: -0.1243,
    venue: 'Royal Opera House',
    website: 'https://www.roh.org.uk',
    description_short: 'World-leading ballet company at the Royal Opera House, London.',
    founded_year: 1931,
    is_active: true,
  },
  {
    id: 'c-paris-opera-ballet',
    slug: 'paris-opera-ballet',
    name: 'Paris Opéra Ballet',
    name_local: "Ballet de l'Opéra de Paris",
    type: 'ballet',
    country: 'France',
    country_code: 'fr',
    city: 'Paris',
    lat: 48.8719,
    lng: 2.3316,
    venue: 'Palais Garnier',
    website: 'https://www.operadeparis.fr',
    description_short: "The world's oldest national ballet company, founded 1669.",
    founded_year: 1669,
    is_active: true,
  },
]
