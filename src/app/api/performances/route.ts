/**
 * GET /api/performances → { performances: PerformanceWithCompany[] }
 *
 * Query params (all optional):
 *   start_date     ISO date — runs overlapping [start, end]
 *   end_date       ISO date
 *   company_slug   kebab-case company slug
 *   country        full country name as stored on the company (e.g. "France")
 *   kind           'ballet' | 'opera'
 *   featured_only  'true' | 'false' | '1' | '0'
 *
 * Thin wrapper over the data layer. Public read; never throws to the client.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPerformances } from '@/lib/data'
import type { PerformanceQuery } from '@/lib/types'

export const dynamic = 'force-dynamic'

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'must be a real calendar date')

const QuerySchema = z
  .object({
    start_date: isoDate.optional(),
    end_date: isoDate.optional(),
    company_slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'company_slug must be kebab-case')
      .optional(),
    country: z.string().min(1).max(80).optional(),
    kind: z.enum(['ballet', 'opera']).optional(),
    featured_only: z
      .enum(['true', 'false', '1', '0'])
      .transform((v) => v === 'true' || v === '1')
      .optional(),
  })
  .refine(
    (q) =>
      !q.start_date || !q.end_date || q.end_date >= q.start_date,
    { message: 'end_date must be >= start_date', path: ['end_date'] }
  )

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const raw = {
    start_date: searchParams.get('start_date') ?? undefined,
    end_date: searchParams.get('end_date') ?? undefined,
    company_slug: searchParams.get('company_slug') ?? undefined,
    country: searchParams.get('country') ?? undefined,
    kind: searchParams.get('kind') ?? undefined,
    featured_only: searchParams.get('featured_only') ?? undefined,
  }

  const parsed = QuerySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 }
    )
  }

  try {
    const performances = await getPerformances(parsed.data as PerformanceQuery)
    return NextResponse.json({ performances })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    )
  }
}
