/**
 * GET /api/companies/[slug] → { company: Company, performances: PerformanceWithCompany[] }
 *
 * Returns the company plus its full run of performances (chronological).
 * 404 when the slug matches no company. Public read; never leaks internals.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCompanyBySlug, getPerformances } from '@/lib/data'

export const dynamic = 'force-dynamic'

const SlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case')

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const slugResult = SlugSchema.safeParse(params.slug)
  if (!slugResult.success) {
    return NextResponse.json({ error: 'Invalid company slug' }, { status: 400 })
  }

  try {
    const company = await getCompanyBySlug(slugResult.data)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const performances = await getPerformances({ company_slug: company.slug })
    return NextResponse.json({ company, performances })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}
