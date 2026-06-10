/**
 * Scraper normalizer.
 *
 * Turns loosely-typed RawPerformance records (from adapters) into validated
 * Performance records ready to upsert. Responsibilities:
 *   - parse human date strings into ISO YYYY-MM-DD using date-fns
 *   - coerce / default fields
 *   - validate with zod and REJECT invalid rows (never throw on bad input)
 *   - derive a stable id when an adapter doesn't supply one
 *
 * normalizeMany() returns the valid rows plus a list of rejection reasons so
 * the CLI / workflow can report what was dropped without crashing.
 */
import { z } from 'zod'
import { parse as parseDate, isValid, format } from 'date-fns'
import type { Performance } from '../../src/lib/types'
import type { RawPerformance } from './types'

/** Date formats we accept from scraped pages, in priority order. */
const DATE_FORMATS = [
  'yyyy-MM-dd',
  'd MMMM yyyy',
  'dd MMMM yyyy',
  'd MMM yyyy',
  'dd MMM yyyy',
  'MMMM d, yyyy',
  'MMM d, yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'dd.MM.yyyy',
]

/** Parse a free-form date string to ISO (YYYY-MM-DD), or null if unparseable. */
export function toIsoDate(input: string | undefined): string | null {
  if (!input) return null
  const raw = input.trim()
  if (!raw) return null

  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : raw
  }

  for (const fmt of DATE_FORMATS) {
    const parsed = parseDate(raw, fmt, new Date())
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd')
  }
  return null
}

/** kebab-case a string for id derivation. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const PerformanceSchema = z
  .object({
    id: z.string().min(1),
    company_id: z.string().min(1),
    company_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().min(1),
    title_original: z.string().min(1).optional(),
    kind: z.enum(['ballet', 'opera']),
    composer: z.string().min(1).optional(),
    choreographer: z.string().min(1).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

export interface NormalizeResult {
  valid: Performance[]
  rejected: { raw: RawPerformance; reason: string }[]
}

/**
 * Normalize a single raw record. Returns the Performance or a rejection
 * reason. companyId maps the adapter's slug to the canonical company id.
 */
export function normalizeOne(
  raw: RawPerformance,
  companyId: string
): { ok: true; value: Performance } | { ok: false; reason: string } {
  const start = toIsoDate(raw.start_date)
  if (!start) {
    return { ok: false, reason: `unparseable start_date "${raw.start_date}"` }
  }
  // Default a missing end_date to the start date (single-day run).
  const end = toIsoDate(raw.end_date) ?? start

  const kindRaw = (raw.kind ?? '').toLowerCase().trim()
  const kind = kindRaw === 'ballet' || kindRaw === 'opera' ? kindRaw : undefined
  if (!kind) {
    return { ok: false, reason: `invalid kind "${raw.kind ?? ''}"` }
  }

  const title = (raw.title ?? '').trim()
  if (!title) return { ok: false, reason: 'missing title' }

  const id =
    raw.id?.trim() ||
    `p-${raw.company_slug}-${slugify(title)}-${start.slice(0, 4)}`

  const candidate: Performance = {
    id,
    company_id: companyId,
    company_slug: raw.company_slug,
    title,
    title_original: raw.title_original?.trim() || undefined,
    kind,
    composer: raw.composer?.trim() || undefined,
    choreographer: raw.choreographer?.trim() || undefined,
    start_date: start,
    end_date: end,
    venue: raw.venue?.trim() || undefined,
    ticket_url: raw.ticket_url?.trim() || undefined,
    price_range: raw.price_range?.trim() || undefined,
    is_featured: raw.is_featured ?? false,
  }

  const result = PerformanceSchema.safeParse(candidate)
  if (!result.success) {
    const reason = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return { ok: false, reason }
  }
  return { ok: true, value: result.data as Performance }
}

/**
 * Normalize a batch. companyIdBySlug resolves slugs to canonical ids; a row
 * whose company slug is unknown is rejected rather than thrown.
 */
export function normalizeMany(
  raws: RawPerformance[],
  companyIdBySlug: Map<string, string>
): NormalizeResult {
  const valid: Performance[] = []
  const rejected: { raw: RawPerformance; reason: string }[] = []

  for (const raw of raws) {
    const companyId = companyIdBySlug.get(raw.company_slug)
    if (!companyId) {
      rejected.push({ raw, reason: `unknown company_slug "${raw.company_slug}"` })
      continue
    }
    const res = normalizeOne(raw, companyId)
    if (res.ok) valid.push(res.value)
    else rejected.push({ raw, reason: res.reason })
  }

  return { valid, rejected }
}
