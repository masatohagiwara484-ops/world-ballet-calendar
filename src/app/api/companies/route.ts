/**
 * GET /api/companies → { companies: Company[] }
 *
 * Thin wrapper over the data layer. Public read; never throws to the client.
 * Supports an optional ?type=ballet|opera|both filter applied in-memory.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCompanies } from '@/lib/data'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  type: z.enum(['ballet', 'opera', 'both']).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const parsed = QuerySchema.safeParse({
    type: searchParams.get('type') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 }
    )
  }

  try {
    let companies = await getCompanies()
    const { type } = parsed.data
    if (type) companies = companies.filter((c) => c.type === type)
    return NextResponse.json({ companies })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}
