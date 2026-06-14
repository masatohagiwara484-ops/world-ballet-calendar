/**
 * GET /api/suggest?q=... — autocomplete for the search box.
 * Returns up to 8 typed suggestions (work / person / company).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { suggest } from '@/lib/search'

export const dynamic = 'force-dynamic'

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json(
    { suggestions: suggest(q) },
    { headers: { 'cache-control': 's-maxage=300, stale-while-revalidate=600' } }
  )
}
