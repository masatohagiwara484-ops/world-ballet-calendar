/**
 * Curated performance dataset — STUB.
 * The backend workstream replaces this with the full 2026-27 season dataset.
 */
import type { Performance } from '@/lib/types'

export const performances: Performance[] = [
  {
    id: 'p-rb-swan-lake-2026',
    company_id: 'c-royal-ballet',
    company_slug: 'royal-ballet',
    title: 'Swan Lake',
    kind: 'ballet',
    composer: 'Pyotr Ilyich Tchaikovsky',
    choreographer: 'Liam Scarlett after Marius Petipa and Lev Ivanov',
    start_date: '2026-06-12',
    end_date: '2026-07-04',
    venue: 'Royal Opera House',
    ticket_url: 'https://www.roh.org.uk/tickets-and-events',
    is_featured: true,
  },
  {
    id: 'p-pob-giselle-2026',
    company_id: 'c-paris-opera-ballet',
    company_slug: 'paris-opera-ballet',
    title: 'Giselle',
    kind: 'ballet',
    composer: 'Adolphe Adam',
    choreographer: 'Jean Coralli and Jules Perrot',
    start_date: '2026-06-20',
    end_date: '2026-07-10',
    venue: 'Palais Garnier',
    ticket_url: 'https://www.operadeparis.fr/en/season-26-27',
    is_featured: true,
  },
]
