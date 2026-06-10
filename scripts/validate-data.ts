/**
 * Static dataset validator.
 *
 * Zod-validates the entire curated dataset and enforces the cross-record
 * integrity rules the site depends on. Run with:
 *
 *   npm run validate:data   (→ npx tsx scripts/validate-data.ts)
 *
 * Exit code 0 = valid, 1 = one or more problems (printed to stderr).
 */
import { z } from 'zod'
import { companies } from '../src/data/companies'
import { performances } from '../src/data/performances'

/* ------------------------------------------------------------------ */
/* Zod schemas (mirror src/lib/types.ts)                               */
/* ------------------------------------------------------------------ */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'must be a real calendar date')

const CompanySchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  name: z.string().min(1),
  name_local: z.string().min(1).optional(),
  type: z.enum(['ballet', 'opera', 'both']),
  country: z.string().min(1),
  country_code: z
    .string()
    .regex(/^[a-z]{2}$/, 'country_code must be ISO alpha-2 lowercase'),
  city: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  website: z.string().url().optional(),
  instagram: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  hero_image: z.string().url().optional(),
  description_short: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  founded_year: z.number().int().min(1500).max(2027).optional(),
  is_active: z.boolean(),
})

const PerformanceSchema = z
  .object({
    id: z.string().min(1),
    company_id: z.string().min(1),
    company_slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'company_slug must be kebab-case'),
    title: z.string().min(1),
    title_original: z.string().min(1).optional(),
    kind: z.enum(['ballet', 'opera']),
    composer: z.string().min(1).optional(),
    choreographer: z.string().min(1).optional(),
    start_date: isoDate,
    end_date: isoDate,
    venue: z.string().min(1).optional(),
    ticket_url: z.string().url().optional(),
    affiliate_url: z.string().url().optional(),
    description: z.string().min(1).optional(),
    image_url: z.string().url().optional(),
    price_range: z.string().min(1).optional(),
    is_featured: z.boolean(),
  })
  .refine((p) => p.end_date >= p.start_date, {
    message: 'end_date must be >= start_date',
    path: ['end_date'],
  })

/* ------------------------------------------------------------------ */
/* Validation runner                                                   */
/* ------------------------------------------------------------------ */

const errors: string[] = []

function check(condition: boolean, message: string): void {
  if (!condition) errors.push(message)
}

// 1. Per-record zod validation.
companies.forEach((c, i) => {
  const res = CompanySchema.safeParse(c)
  if (!res.success) {
    for (const issue of res.error.issues) {
      errors.push(
        `companies[${i}] (${c.id ?? '?'}): ${issue.path.join('.')} — ${issue.message}`
      )
    }
  }
})

performances.forEach((p, i) => {
  const res = PerformanceSchema.safeParse(p)
  if (!res.success) {
    for (const issue of res.error.issues) {
      errors.push(
        `performances[${i}] (${p.id ?? '?'}): ${issue.path.join('.')} — ${issue.message}`
      )
    }
  }
})

// 2. Unique company ids & slugs.
const companyIds = new Set<string>()
const companySlugs = new Set<string>()
for (const c of companies) {
  check(!companyIds.has(c.id), `duplicate company id: ${c.id}`)
  check(!companySlugs.has(c.slug), `duplicate company slug: ${c.slug}`)
  companyIds.add(c.id)
  companySlugs.add(c.slug)
}

// 3. Unique performance ids.
const perfIds = new Set<string>()
for (const p of performances) {
  check(!perfIds.has(p.id), `duplicate performance id: ${p.id}`)
  perfIds.add(p.id)
}

// 4. company_id + company_slug consistency (FK + denormalized slug agree).
const companyById = new Map(companies.map((c) => [c.id, c]))
for (const p of performances) {
  const company = companyById.get(p.company_id)
  if (!company) {
    errors.push(
      `performance ${p.id}: company_id "${p.company_id}" has no matching company`
    )
    continue
  }
  check(
    company.slug === p.company_slug,
    `performance ${p.id}: company_slug "${p.company_slug}" != company.slug "${company.slug}"`
  )
}

// 5. Volume thresholds.
check(
  companies.length >= 24,
  `need >= 24 companies, have ${companies.length}`
)
check(
  performances.length >= 150,
  `need >= 150 performances, have ${performances.length}`
)

// 6. >= 25 runs overlapping 2026-06-10 .. 2026-08-31 (calendar full today).
const WINDOW_START = '2026-06-10'
const WINDOW_END = '2026-08-31'
const overlapping = performances.filter(
  (p) => p.end_date >= WINDOW_START && p.start_date <= WINDOW_END
)
check(
  overlapping.length >= 25,
  `need >= 25 runs overlapping ${WINDOW_START}..${WINDOW_END}, have ${overlapping.length}`
)

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const featuredCount = performances.filter((p) => p.is_featured).length
const balletCount = performances.filter((p) => p.kind === 'ballet').length
const operaCount = performances.filter((p) => p.kind === 'opera').length

if (errors.length > 0) {
  console.error(`\n✗ Dataset validation FAILED — ${errors.length} problem(s):\n`)
  for (const e of errors) console.error(`  - ${e}`)
  console.error('')
  process.exit(1)
}

console.log('✓ Dataset validation PASSED')
console.log(`  companies:            ${companies.length}`)
console.log(`  performances:         ${performances.length}`)
console.log(`    ballet / opera:     ${balletCount} / ${operaCount}`)
console.log(`    featured:           ${featuredCount}`)
console.log(`  overlapping summer:   ${overlapping.length} (window ${WINDOW_START}..${WINDOW_END})`)
console.log(`  unique company ids:   ${companyIds.size}`)
console.log(`  unique performance ids: ${perfIds.size}`)
process.exit(0)
