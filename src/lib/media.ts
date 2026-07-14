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
