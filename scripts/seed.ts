/**
 * World Ballet & Opera Calendar — database seed script
 *
 * Run with:  npm run seed   (→ npx tsx scripts/seed.ts)
 *
 * Upserts the canonical company + performance seed data into Supabase.
 * The same dataset is mirrored in supabase/migrations/001_initial_schema.sql
 * (the authoritative SQL schema). This TypeScript script is the convenient
 * way to (re)seed an already-provisioned database without re-running DDL.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the
 * environment (loaded from .env.local via dotenv). RLS allows public select;
 * for writes the project's anon key must permit insert/upsert, otherwise set
 * SUPABASE_SERVICE_ROLE_KEY and it will be used instead.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/* ------------------------------------------------------------------ */
/* Seed data — kept in sync with supabase/migrations/001_initial_schema.sql */
/* ------------------------------------------------------------------ */

type CompanyType = 'ballet' | 'opera' | 'both'

interface CompanySeed {
  slug: string
  name: string
  name_local: string
  type: CompanyType
  country: string
  city: string
  lat: number
  lng: number
  website: string
  instagram: string
  hero_image: string
  description: string
  description_short: string
  founded_year: number
}

interface PerformanceSeed {
  company_slug: string
  title: string
  composer: string
  choreographer?: string
  start_date: string
  end_date: string
  venue: string
  venue_address: string
  ticket_url: string
  price_range: string
  is_featured: boolean
}

const companies: CompanySeed[] = [
  {
    slug: 'royal-ballet',
    name: 'The Royal Ballet',
    name_local: 'The Royal Ballet',
    type: 'ballet',
    country: 'United Kingdom',
    city: 'London',
    lat: 51.5129,
    lng: -0.1243,
    website: 'https://www.roh.org.uk',
    instagram: 'royalballetofficial',
    hero_image:
      'https://placehold.co/1600x900/1B2A4A/E8D5B7?text=The%20Royal%20Ballet',
    description:
      "One of the world's greatest ballet companies, based at the Royal Opera House in Covent Garden, London. Founded in 1931, the Royal Ballet is celebrated for its exceptional classical and contemporary repertoire.",
    description_short:
      'World-leading ballet company at the Royal Opera House, London.',
    founded_year: 1931,
  },
  {
    slug: 'paris-opera-ballet',
    name: 'Paris Opéra Ballet',
    name_local: "Ballet de l'Opéra de Paris",
    type: 'ballet',
    country: 'France',
    city: 'Paris',
    lat: 48.8719,
    lng: 2.3316,
    website: 'https://www.operadeparis.fr',
    instagram: 'operadeparis',
    hero_image:
      'https://placehold.co/1600x900/1B2A4A/E8D5B7?text=Paris%20Op%C3%A9ra%20Ballet',
    description:
      "The world's oldest national ballet company, founded in 1661 by King Louis XIV. Based at the Palais Garnier and Opéra Bastille, it is a cornerstone of French cultural heritage.",
    description_short:
      "World's oldest ballet company, founded in 1661 by Louis XIV.",
    founded_year: 1661,
  },
  {
    slug: 'bolshoi-ballet',
    name: 'Bolshoi Ballet',
    name_local: 'Большой балет',
    type: 'both',
    country: 'Russia',
    city: 'Moscow',
    lat: 55.7603,
    lng: 37.6189,
    website: 'https://www.bolshoi.ru',
    instagram: 'bolshoi_theatre',
    hero_image:
      'https://placehold.co/1600x900/1B2A4A/E8D5B7?text=Bolshoi%20Ballet',
    description:
      'One of the most prestigious and historically significant ballet companies in the world. The Bolshoi Theatre in Moscow has been home to extraordinary productions since 1776.',
    description_short:
      "Russia's legendary ballet company, home of Swan Lake and The Nutcracker.",
    founded_year: 1776,
  },
  {
    slug: 'metropolitan-opera',
    name: 'Metropolitan Opera',
    name_local: 'Metropolitan Opera',
    type: 'opera',
    country: 'United States',
    city: 'New York',
    lat: 40.773,
    lng: -73.9831,
    website: 'https://www.metopera.org',
    instagram: 'metropolitanopera',
    hero_image:
      'https://placehold.co/1600x900/1B2A4A/E8D5B7?text=Metropolitan%20Opera',
    description:
      'The largest classical music organization in North America. The Met presents approximately 220 performances of some 25 operas each season at Lincoln Center.',
    description_short:
      "North America's leading opera house at Lincoln Center, New York.",
    founded_year: 1883,
  },
]

const performances: PerformanceSeed[] = [
  {
    company_slug: 'royal-ballet',
    title: 'Swan Lake',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Marius Petipa & Lev Ivanov',
    start_date: '2026-06-01',
    end_date: '2026-06-28',
    venue: 'Royal Opera House',
    venue_address: 'Bow St, London WC2E 9DD',
    ticket_url: 'https://www.roh.org.uk',
    price_range: '£25 – £250',
    is_featured: true,
  },
  {
    company_slug: 'royal-ballet',
    title: 'The Sleeping Beauty',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Frederick Ashton',
    start_date: '2026-07-15',
    end_date: '2026-08-10',
    venue: 'Royal Opera House',
    venue_address: 'Bow St, London WC2E 9DD',
    ticket_url: 'https://www.roh.org.uk',
    price_range: '£30 – £280',
    is_featured: false,
  },
  {
    company_slug: 'paris-opera-ballet',
    title: 'Giselle',
    composer: 'Adolphe Adam',
    choreographer: 'Jean Coralli & Jules Perrot',
    start_date: '2026-06-10',
    end_date: '2026-07-05',
    venue: 'Palais Garnier',
    venue_address: "Place de l'Opéra, 75009 Paris",
    ticket_url: 'https://www.operadeparis.fr',
    price_range: '€15 – €210',
    is_featured: true,
  },
  {
    company_slug: 'paris-opera-ballet',
    title: 'The Nutcracker',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Rudolf Nureyev',
    start_date: '2026-12-01',
    end_date: '2026-12-31',
    venue: 'Opéra Bastille',
    venue_address: 'Place de la Bastille, 75012 Paris',
    ticket_url: 'https://www.operadeparis.fr',
    price_range: '€15 – €195',
    is_featured: false,
  },
  {
    company_slug: 'bolshoi-ballet',
    title: 'Don Quixote',
    composer: 'Ludwig Minkus',
    choreographer: 'Marius Petipa',
    start_date: '2026-06-20',
    end_date: '2026-07-10',
    venue: 'Bolshoi Theatre',
    venue_address: 'Teatralnaya pl., 1, Moscow, 125009',
    ticket_url: 'https://www.bolshoi.ru',
    price_range: '₽3,000 – ₽30,000',
    is_featured: true,
  },
  {
    company_slug: 'metropolitan-opera',
    title: 'La Traviata',
    composer: 'Giuseppe Verdi',
    start_date: '2026-06-05',
    end_date: '2026-06-25',
    venue: 'Metropolitan Opera House',
    venue_address: '30 Lincoln Center Plaza, New York, NY 10023',
    ticket_url: 'https://www.metopera.org',
    price_range: '$25 – $399',
    is_featured: true,
  },
  {
    company_slug: 'metropolitan-opera',
    title: 'Carmen',
    composer: 'Georges Bizet',
    start_date: '2026-07-10',
    end_date: '2026-08-05',
    venue: 'Metropolitan Opera House',
    venue_address: '30 Lincoln Center Plaza, New York, NY 10023',
    ticket_url: 'https://www.metopera.org',
    price_range: '$30 – $450',
    is_featured: false,
  },
]

/* ------------------------------------------------------------------ */
/* Seeding logic                                                       */
/* ------------------------------------------------------------------ */

async function seed(): Promise<void> {
  console.log('Seeding companies…')

  const { data: companyRows, error: companyError } = await supabase
    .from('companies')
    .upsert(companies, { onConflict: 'slug' })
    .select('id, slug')

  if (companyError) {
    console.error('Failed to upsert companies:', companyError.message)
    process.exit(1)
  }

  const idBySlug = new Map<string, string>(
    (companyRows ?? []).map((row) => [row.slug as string, row.id as string])
  )
  console.log(`  ${idBySlug.size} companies upserted.`)

  console.log('Seeding performances…')

  const performanceRows = performances.map(
    ({ company_slug, ...rest }) => {
      const company_id = idBySlug.get(company_slug)
      if (!company_id) {
        throw new Error(`No company found for slug "${company_slug}"`)
      }
      return { company_id, ...rest }
    }
  )

  const { error: performanceError } = await supabase
    .from('performances')
    .upsert(performanceRows, { onConflict: 'company_id,title,start_date' })

  if (performanceError) {
    console.error('Failed to upsert performances:', performanceError.message)
    process.exit(1)
  }

  console.log(`  ${performanceRows.length} performances upserted.`)
  console.log('Seed complete.')
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
