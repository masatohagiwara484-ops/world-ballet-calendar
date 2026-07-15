/**
 * The Read directory — première's ballet & opera media index.
 *
 * A curated directory of the world's leading ballet/opera publications, rendered
 * as text-only outbound-link cards. This is a goodwill curation surface, NOT an
 * aggregator: we link out, we never reproduce third-party content.
 *
 * HARD LEGAL GUARDRAILS (see docs/features/journal-media-directory-spec.md §6):
 *  1. Text only. A publication's brand is rendered as typography / an in-house
 *     monogram (src/components/shared/design.ts). NEVER fetch, hotlink or embed a
 *     publisher's logo, favicon-as-brand, article image or og:image.
 *  2. Self-authored blurbs. `blurb` is the owner's own words — never the
 *     publication's own tagline verbatim.
 *  3. Clear external affordance. Cards open with target="_blank"
 *     rel="noopener noreferrer" and show an "External ↗" indicator.
 *  4. No implied endorsement. An "External media" label marks these as
 *     independent third parties, not première properties or partners.
 *
 * Geography model: `country`/`country_code` use première's EXACT identifiers
 * (full display name + ISO 3166-1 alpha-2 lowercase — the same values companies
 * use), so a "media in {country}" view is consistent with the performances
 * filter. `region` is a directory-local grouping (première has no site-wide
 * region enum); see the notes for the rationale.
 *
 * How to add a source: append one entry below with all required fields, then run
 *   npm run validate:data
 * No code changes are needed — the /read page renders every entry automatically.
 */

/** Directory-local geographic grouping (première has no site-wide region enum). */
export type MediaRegion =
  | 'Europe'
  | 'North America'
  | 'Asia'
  | 'Russia'
  | 'Latin America'
  | 'Oceania'

export const MEDIA_REGIONS: MediaRegion[] = [
  'Europe',
  'North America',
  'Asia',
  'Russia',
  'Latin America',
  'Oceania',
]

/**
 * Editorial reach. `international` sources also surface in a "Global" bucket when
 * a region/country filter is active, so a UK reader still sees Bachtrack.
 */
export type MediaScope = 'international' | 'national'

/**
 * `verify` = URL still to be owner-confirmed before public launch. Still renders;
 * flagged internally + listed in the implementation notes.
 */
export type MediaStatus = 'ok' | 'verify'

export interface MediaSource {
  /** Stable, unique, kebab-case slug. */
  id: string
  /** Display name — TEXT-RENDERED as a monogram/typography, never a logo. */
  name: string
  /** Outbound link to the publication. */
  url: string
  /** Directory-local region grouping. */
  region: MediaRegion
  /**
   * Full country name matching première's model (e.g. "United Kingdom"), or ""
   * for a source with no single home country. NOT an ISO code.
   */
  country: string
  /** ISO 3166-1 alpha-2, lowercase (e.g. "gb"), or "" if truly global. */
  country_code: string
  /** `international` sources also appear in the Global bucket (see MediaScope). */
  scope: MediaScope
  /** ISO 639-1 codes — display-only metadata (no language filter in v1). */
  languages: string[]
  /** Free-text coverage tags ("reviews", "listings", …). */
  type: string[]
  /** Owner-authored one-liner. Non-empty; never the publisher's own tagline. */
  blurb: string
  /** `verify` entries need URL confirmation before launch. */
  status: MediaStatus
}

/**
 * v1 seed. Curated manually — quality over volume. Latin America / Oceania are
 * intentionally thin for now (room to grow). Do not add third-party logos.
 */
export const mediaSources: MediaSource[] = [
  {
    id: 'bachtrack',
    name: 'Bachtrack',
    url: 'https://bachtrack.com/dance',
    region: 'Europe',
    country: 'United Kingdom',
    country_code: 'gb',
    scope: 'international',
    languages: ['en', 'fr', 'de', 'es'],
    type: ['reviews', 'listings'],
    blurb:
      'Worldwide classical & dance reviews and listings — dozens of ballet notices a month from Paris to New York.',
    status: 'ok',
  },
  {
    id: 'fjord-review',
    name: 'Fjord Review',
    url: 'https://fjordreview.com/',
    region: 'North America',
    country: 'United States',
    country_code: 'us',
    scope: 'international',
    languages: ['en'],
    type: ['reviews', 'essays'],
    blurb: 'Long-form, world-class dance criticism with an international eye.',
    status: 'ok',
  },
  {
    id: 'ballet-herald',
    name: 'The Ballet Herald',
    url: 'https://www.balletherald.com/',
    region: 'North America',
    country: 'United States',
    country_code: 'us',
    scope: 'national',
    languages: ['en'],
    type: ['news', 'reviews', 'interviews'],
    blurb: 'Independent ballet news, performance reviews and artist interviews.',
    status: 'ok',
  },
  {
    id: 'dance-magazine',
    name: 'Dance Magazine',
    url: 'https://dancemagazine.com/',
    region: 'North America',
    country: 'United States',
    country_code: 'us',
    scope: 'national',
    languages: ['en'],
    type: ['features', 'interviews'],
    blurb:
      'The long-running US voice on ballet and dance, strong on features and profiles.',
    status: 'ok',
  },
  {
    id: 'pointe-magazine',
    name: 'Pointe Magazine',
    url: 'https://pointemagazine.com/',
    region: 'North America',
    country: 'United States',
    country_code: 'us',
    scope: 'national',
    languages: ['en'],
    type: ['features', 'training'],
    blurb: 'Career and repertoire coverage aimed at serious ballet dancers.',
    status: 'ok',
  },
  {
    id: 'dance-europe',
    name: 'Dance Europe',
    url: 'https://danceeurope.net/',
    region: 'Europe',
    country: 'United Kingdom',
    country_code: 'gb',
    scope: 'international',
    languages: ['en'],
    type: ['reviews', 'features'],
    blurb: 'Long-standing bilingual magazine covering dance across Europe.',
    status: 'ok',
  },
  {
    id: 'criticaldance',
    name: 'CriticalDance',
    url: 'https://criticaldance.org/',
    region: 'North America',
    country: 'United States',
    country_code: 'us',
    scope: 'international',
    languages: ['en'],
    type: ['reviews'],
    blurb: 'Reviews and features on dance worldwide.',
    status: 'ok',
  },
  {
    id: 'dancetabs',
    name: 'DanceTabs',
    url: 'https://dancetabs.com/',
    region: 'Europe',
    country: 'United Kingdom',
    country_code: 'gb',
    scope: 'international',
    languages: ['en'],
    type: ['reviews'],
    blurb: 'UK-based reviews spanning international ballet and dance.',
    status: 'ok',
  },
  {
    id: 'ballett-journal',
    name: 'Ballett-Journal',
    url: 'https://ballett-journal.de/',
    region: 'Europe',
    country: 'Germany',
    country_code: 'de',
    scope: 'national',
    languages: ['de'],
    type: ['criticism', 'backstage'],
    blurb: 'Independent German ballet journal with sharp, insider criticism.',
    status: 'ok',
  },
  {
    id: 'tanznetz',
    name: 'tanznetz.de',
    url: 'https://www.tanznetz.de/',
    region: 'Europe',
    country: 'Germany',
    country_code: 'de',
    scope: 'national',
    languages: ['de'],
    type: ['portal', 'reviews'],
    blurb: 'Germany’s large dance portal — news, reviews and listings.',
    status: 'ok',
  },
  {
    id: 'dance-for-you',
    name: 'Dance for You Magazine',
    url: 'https://www.danceforyou-magazine.com/',
    region: 'Europe',
    country: 'Germany',
    country_code: 'de',
    scope: 'international',
    languages: ['de', 'en'],
    type: ['features'],
    blurb: 'German/English international dance magazine, published since 2004.',
    status: 'ok',
  },
  {
    id: 'danser-canal-historique',
    name: 'Danser Canal Historique',
    url: 'https://www.dansercanalhistorique.fr/',
    region: 'Europe',
    country: 'France',
    country_code: 'fr',
    scope: 'national',
    languages: ['fr'],
    type: ['criticism', 'interviews'],
    blurb:
      'French critical writing and interviews on ballet and contemporary dance.',
    status: 'ok',
  },
  {
    id: 'resmusica',
    name: 'ResMusica (Danse)',
    url: 'https://www.resmusica.com/',
    region: 'Europe',
    country: 'France',
    country_code: 'fr',
    scope: 'national',
    languages: ['fr'],
    type: ['reviews'],
    blurb:
      'French classical arts site with a dedicated dance/ballet review section.',
    status: 'ok',
  },
  {
    id: 'ballet2000',
    name: 'Ballet2000',
    url: 'https://www.ballet2000.com/',
    region: 'Europe',
    country: 'Italy',
    country_code: 'it',
    scope: 'international',
    languages: ['fr', 'it', 'en'],
    type: ['reviews', 'features'],
    blurb: 'Trilingual European magazine on ballet and contemporary dance.',
    status: 'ok',
  },
  {
    id: 'la-personne',
    name: 'La Personne',
    url: 'https://www.lapersonne.com/en/',
    region: 'Russia',
    country: 'Russia',
    country_code: 'ru',
    scope: 'national',
    languages: ['ru', 'en'],
    type: ['interviews', 'photo'],
    blurb:
      'Russian online ballet magazine — dancer interviews, reviews and photography.',
    status: 'ok',
  },
  {
    id: 'chacott-dance-magazine',
    name: 'Chacott / Dance Magazine (JP)',
    url: 'https://www.chacott-jp.com/news/',
    region: 'Asia',
    country: 'Japan',
    country_code: 'jp',
    scope: 'national',
    languages: ['ja'],
    type: ['reports', 'interviews'],
    blurb:
      'Japan’s leading ballet coverage — world tours, interviews and performance reports.',
    status: 'ok',
  },
  {
    id: 'ballet-channel',
    name: 'Ballet Channel',
    url: 'https://balletchannel.jp/',
    region: 'Asia',
    country: 'Japan',
    country_code: 'jp',
    scope: 'national',
    languages: ['ja'],
    type: ['web magazine'],
    blurb: 'Japanese web magazine focused on ballet features and interviews.',
    status: 'ok',
  },
]
