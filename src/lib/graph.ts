/**
 * Entity-graph builder — the heart of cross-cutting search.
 *
 * Takes the flat curated dataset (companies + performances, each with
 * free-text composer / choreographer strings) and derives the normalized
 * graph the catalogue is searched against:
 *
 *     people   ← parsed & de-duplicated from every credit field
 *     works    ← merged by title+kind, so one "Swan Lake" unites every company
 *     venues   ← one per company location
 *     productions ← work × company × choreographer
 *     performances ← the flat runs, enriched with graph links + search doc
 *
 * Built once per process and memoized. The shape mirrors the Supabase schema
 * (supabase/migrations/) exactly, so when live scraped data replaces the seed,
 * search.ts keeps working unchanged — it only ever reads this graph.
 */
import type {
  Company,
  CreditGroup,
  PerformanceWithCompany,
  Person,
  PersonRole,
  PriceBand,
  Production,
  Venue,
  Work,
  WorkKind,
} from './types'
import { PERSON_ROLES } from './types'
import { companies as staticCompanies } from '@/data/companies'
import { performances as staticPerformances } from '@/data/performances'
import { parseCredits, parsePrice, slugify, sortName, toEur, workTitleKey } from './normalize'
import { getCompanies, getPerformances } from './data'

/** A performance enriched with everything search & the results UI need. */
export interface GraphPerformance extends PerformanceWithCompany {
  work_slug: string
  production_id: string
  credits: CreditGroup[]
  /** Flat person slugs (any role) for fast filtering. */
  person_slugs: string[]
  choreographer_slugs: string[]
  composer_slugs: string[]
  price: PriceBand
  /** Lowercased haystack: title, work, company, venue, city, country, people. */
  doc: string
  /** Min ticket price converted to EUR for cross-currency range filtering. */
  price_eur_min?: number
}

export interface Graph {
  people: Person[]
  works: Work[]
  venues: Venue[]
  productions: Production[]
  performances: GraphPerformance[]
  /** Lookups by slug. */
  personBySlug: Map<string, Person>
  workBySlug: Map<string, Work>
  companyBySlug: Map<string, Company>
}

let cached: Graph | null = null

/** Order credits are displayed in. */
const ROLE_ORDER: PersonRole[] = [
  'composer',
  'choreographer',
  'conductor',
  'director',
  'dancer',
  'singer',
  'musician',
]

/**
 * Build (or return the memoized) graph from the given dataset. Defaults to the
 * curated static data; an explicit dataset can be passed for tests.
 */
export function buildGraph(
  companies: Company[] = staticCompanies,
  performances = staticPerformances
): Graph {
  if (cached && companies === staticCompanies && performances === staticPerformances) {
    return cached
  }

  const companyById = new Map(companies.map((c) => [c.id, c]))
  const companyBySlug = new Map(companies.map((c) => [c.slug, c]))

  const people = new Map<string, Person>()
  const personRoles = new Map<string, Set<PersonRole>>()
  const works = new Map<string, Work>()
  const venues = new Map<string, Venue>()
  const productions = new Map<string, Production>()

  /** Resolve-or-create a person, accumulating the role they appear in. */
  function upsertPerson(name: string, role: PersonRole): Person {
    const slug = slugify(name)
    let person = people.get(slug)
    if (!person) {
      person = {
        id: `pe-${slug}`,
        slug,
        name: name.trim(),
        sort_name: sortName(name),
        roles: [],
      }
      people.set(slug, person)
      personRoles.set(slug, new Set())
    }
    personRoles.get(slug)!.add(role)
    return person
  }

  /** One venue per company location. */
  function upsertVenue(company: Company): Venue {
    const name = company.venue ?? `${company.name} — ${company.city}`
    const slug = slugify(name)
    let venue = venues.get(slug)
    if (!venue) {
      venue = {
        id: `v-${slug}`,
        slug,
        name,
        city: company.city,
        country: company.country,
        country_code: company.country_code,
        lat: company.lat,
        lng: company.lng,
      }
      venues.set(slug, venue)
    }
    return venue
  }

  const enriched: GraphPerformance[] = []

  for (const p of performances) {
    const company = companyById.get(p.company_id)
    if (!company) continue
    upsertVenue(company)

    // Concert programmes are not in the seed yet; ballet/opera map 1:1.
    const kind: WorkKind = p.kind

    // Composer(s) & choreographer(s) → people.
    const composerCredits = parseCredits(p.composer)
    const choreoCredits = parseCredits(p.choreographer)
    const composerPeople = composerCredits.map((c) => upsertPerson(c.name, 'composer'))
    const choreoPeople = choreoCredits.map((c) => upsertPerson(c.name, 'choreographer'))

    // Work — merged across companies by article-folded title + kind, so every
    // company's "The Nutcracker" / "Nutcracker" resolves to one Work.
    const titleSlugBase = workTitleKey(p.title)
    const workKey = `${titleSlugBase}|${kind}`
    let work = works.get(workKey)
    if (!work) {
      // Public slug stays clean unless a same-title work of another kind exists.
      const clash = [...works.values()].some((w) => w.slug === titleSlugBase)
      const publicSlug = clash ? `${titleSlugBase}-${kind}` : titleSlugBase
      work = {
        id: `w-${titleSlugBase}-${kind}`,
        slug: publicSlug,
        title: p.title,
        title_original: p.title_original,
        kind,
        composer_id: composerPeople[0]?.id,
      }
      works.set(workKey, work)
    }

    // Production — work × company × primary choreographer.
    const choreoPrimary = choreoPeople[0]
    const prodId = `pr-${company.slug}-${work.slug}`
    if (!productions.has(prodId)) {
      productions.set(prodId, {
        id: prodId,
        work_id: work.id,
        company_id: company.id,
        choreographer_id: choreoPrimary?.id,
        title: p.title,
      })
    }

    // Grouped credit lines for display, built directly from the resolved people.
    const byRole = new Map<PersonRole, Array<{ slug: string; name: string }>>([
      ['composer', composerPeople.map((pe) => ({ slug: pe.slug, name: pe.name }))],
      ['choreographer', choreoPeople.map((pe) => ({ slug: pe.slug, name: pe.name }))],
    ])
    const creditGroups: CreditGroup[] = ROLE_ORDER.filter(
      (r) => (byRole.get(r)?.length ?? 0) > 0
    ).map((role) => ({ role, people: byRole.get(role)! }))

    const price = parsePrice(p.price_range)
    const personSlugs = [...composerPeople, ...choreoPeople].map((pe) => pe.slug)

    const doc = [
      p.title,
      p.title_original,
      company.name,
      company.name_local,
      p.venue ?? company.venue,
      company.city,
      company.country,
      kind,
      ...composerPeople.map((pe) => pe.name),
      ...choreoPeople.map((pe) => pe.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    enriched.push({
      ...p,
      company,
      work_slug: work.slug,
      production_id: prodId,
      credits: creditGroups,
      person_slugs: Array.from(new Set(personSlugs)),
      choreographer_slugs: choreoPeople.map((pe) => pe.slug),
      composer_slugs: composerPeople.map((pe) => pe.slug),
      price,
      price_eur_min: price.min != null ? toEur(price.min, price.currency) : undefined,
      doc,
    })
  }

  // Finalize accumulated roles onto people.
  for (const [slug, person] of people) {
    person.roles = PERSON_ROLES.filter((r) => personRoles.get(slug)?.has(r))
  }

  const graph: Graph = {
    people: [...people.values()].sort((a, b) => a.sort_name.localeCompare(b.sort_name)),
    works: [...works.values()].sort((a, b) => a.title.localeCompare(b.title)),
    venues: [...venues.values()].sort((a, b) => a.name.localeCompare(b.name)),
    productions: [...productions.values()],
    performances: enriched.sort((a, b) => a.start_date.localeCompare(b.start_date)),
    personBySlug: new Map([...people.values()].map((p) => [p.slug, p])),
    workBySlug: new Map([...works.values()].map((w) => [w.slug, w])),
    companyBySlug,
  }

  if (companies === staticCompanies && performances === staticPerformances) {
    cached = graph
  }
  return graph
}

/**
 * Build the graph from LIVE data — the Supabase-backed data layer when it is
 * configured & reachable, otherwise the curated static dataset (the data layer
 * handles that fallback silently). This is the source search & entity pages use
 * in production so owner-approved scraped rows reach live search.
 *
 * `getPerformances()` already filters to review_status='published', so only
 * approved rows enter the graph. The returned PerformanceWithCompany rows carry
 * every Performance field plus company_id, so the pure builder above consumes
 * them unchanged; the static-only memo is intentionally bypassed.
 */
export async function buildGraphAsync(): Promise<Graph> {
  const [companies, performances] = await Promise.all([
    getCompanies(),
    getPerformances(),
  ])
  return buildGraph(companies, performances)
}
