/**
 * Per-company colour assignment for the white-based nameplate.
 *
 * Every company gets its OWN hue so no two cards read as the same colour. Hues
 * are fanned across the wheel with the golden angle (137.5°) over the roster
 * sorted by slug — a low-discrepancy sequence, so even neighbours in the grid
 * land far apart on the colour wheel. Deterministic and stable: a company keeps
 * its colour as the roster grows (order by slug only shifts new entries in).
 */
import { companies } from '@/data/companies'
import { lightGradientForHue } from '@/components/shared/design'

const GOLDEN_ANGLE = 137.508

const hueBySlug = new Map<string, number>()
;[...companies]
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .forEach((c, i) => hueBySlug.set(c.slug, (i * GOLDEN_ANGLE) % 360))

/** The hue (0–359) assigned to a company slug. */
export function companyHue(slug: string): number {
  return hueBySlug.get(slug) ?? 210
}

/** The white-based nameplate gradient for a company. */
export function companyGradient(slug: string): string {
  return lightGradientForHue(companyHue(slug))
}
