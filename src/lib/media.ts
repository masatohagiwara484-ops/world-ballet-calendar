/**
 * Read directory — selection & ordering helpers for the ballet/opera media index.
 *
 * Pure functions over the curated `mediaSources` dataset (no React, no runtime
 * deps). Phase 3 layers country/region filtering on top of these.
 */
import {
  mediaSources,
  MEDIA_REGIONS,
  type MediaSource,
  type MediaRegion,
} from '@/data/media-sources'

const REGION_ORDER = new Map(MEDIA_REGIONS.map((r, i) => [r, i]))

/**
 * Default catalogue order: international sources first (they anchor the index),
 * then grouped by region (canonical order), then alphabetical by name.
 */
export function sortMediaSources(sources: MediaSource[]): MediaSource[] {
  return [...sources].sort((a, b) => {
    // international before national
    if (a.scope !== b.scope) return a.scope === 'international' ? -1 : 1
    // region canonical order
    const ra = REGION_ORDER.get(a.region) ?? 99
    const rb = REGION_ORDER.get(b.region) ?? 99
    if (ra !== rb) return ra - rb
    // name
    return a.name.localeCompare(b.name)
  })
}

/** All sources in default order. */
export function getMediaSources(): MediaSource[] {
  return sortMediaSources(mediaSources)
}

/** Distinct regions that actually have at least one source, in canonical order. */
export function getMediaRegions(): MediaRegion[] {
  const present = new Set(mediaSources.map((m) => m.region))
  return MEDIA_REGIONS.filter((r) => present.has(r))
}

/** Distinct countries present, as { country, country_code }, alphabetical by name. */
export function getMediaCountries(): Array<{ country: string; country_code: string }> {
  const byName = new Map<string, string>()
  for (const m of mediaSources) {
    if (m.country) byName.set(m.country, m.country_code)
  }
  return [...byName.entries()]
    .map(([country, country_code]) => ({ country, country_code }))
    .sort((a, b) => a.country.localeCompare(b.country))
}

/* -------------------------------------------------------------------------- */
/* Filtering — mirrors the performances geo-filter (URL params: region/country) */
/* -------------------------------------------------------------------------- */

export interface MediaFilters {
  /** MediaRegion name, e.g. "Europe". */
  region?: string
  /** Full country name matching première's model, e.g. "Germany". */
  country?: string
}

/** True when at least one geo filter is active. */
export function hasMediaFilters(f: MediaFilters): boolean {
  return Boolean(f.region || f.country)
}

/** Does a source satisfy the active region + country filters? */
function matches(m: MediaSource, f: MediaFilters): boolean {
  if (f.region && m.region !== f.region) return false
  if (f.country && m.country !== f.country) return false
  return true
}

export interface MediaGroups {
  /** Whether any filter is active (drives the Global bucket + headings). */
  filtered: boolean
  /** Region/country-specific results in default order. */
  national: MediaSource[]
  /**
   * International sources surfaced beneath the national results when a filter is
   * active (and not already shown in `national`). Empty when no filter is set —
   * unfiltered, everything already lives in `national`.
   */
  global: MediaSource[]
}

/**
 * Split the catalogue for the /read page. With no filter, all sources land in
 * `national` (a single grid). With a region/country filter active, `national`
 * holds the matches and `global` holds the remaining international sources, so a
 * worldwide outlet (e.g. Bachtrack) is always reachable — never hidden by a
 * filter. A source HQ'd in the filtered country matches `national` directly and
 * is de-duplicated out of `global`.
 */
export function selectMediaSources(filters: MediaFilters): MediaGroups {
  const filtered = hasMediaFilters(filters)
  const national = sortMediaSources(mediaSources.filter((m) => matches(m, filters)))

  if (!filtered) {
    return { filtered, national, global: [] }
  }

  const nationalIds = new Set(national.map((m) => m.id))
  const global = sortMediaSources(
    mediaSources.filter((m) => m.scope === 'international' && !nationalIds.has(m.id))
  )
  return { filtered, national, global }
}

/* -------------------------------------------------------------------------- */
/* Facets — cross-filtered counts for the rail (same idea as src/lib/search.ts) */
/* -------------------------------------------------------------------------- */

export interface MediaFacetItem {
  value: string
  label: string
  count: number
}

export interface MediaFacets {
  region: MediaFacetItem[]
  country: MediaFacetItem[]
}

/**
 * Facet counts for the filter rail. Each dimension is counted against the set
 * constrained by the OTHER active filter, so counts stay meaningful as you drill
 * in (classic faceted-search behaviour, mirroring the performances rail).
 */
export function getMediaFacets(filters: MediaFilters): MediaFacets {
  const regionCounts = new Map<string, number>()
  const countryCounts = new Map<string, string>() // name -> code (for label)
  const countryTally = new Map<string, number>()

  for (const m of mediaSources) {
    // Region facet: apply country filter only.
    if (!filters.country || m.country === filters.country) {
      regionCounts.set(m.region, (regionCounts.get(m.region) ?? 0) + 1)
    }
    // Country facet: apply region filter only.
    if ((!filters.region || m.region === filters.region) && m.country) {
      countryCounts.set(m.country, m.country_code)
      countryTally.set(m.country, (countryTally.get(m.country) ?? 0) + 1)
    }
  }

  const region: MediaFacetItem[] = MEDIA_REGIONS.filter((r) => regionCounts.has(r)).map(
    (r) => ({ value: r, label: r, count: regionCounts.get(r) ?? 0 })
  )

  const country: MediaFacetItem[] = [...countryTally.entries()]
    .map(([name, count]) => ({ value: name, label: name, count }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return { region, country }
}
