import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const country = searchParams.get('country')
    const type = searchParams.get('type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const companyId = searchParams.get('company_id')

    // `country` lives on `companies`, not `performances`. We embed the
    // related company via the `company_id` -> `companies.id` foreign key so
    // we can filter on `companies.country`. Using `!inner` keeps the join an
    // inner join (rows without a matching company are excluded). When no
    // `country` filter is supplied the inner join is still correct because
    // every performance has a non-null `company_id`.
    let query = supabase
      .from('performances')
      .select('*, companies!inner(country)')

    if (companyId) query = query.eq('company_id', companyId)
    if (country) query = query.eq('companies.country', country)
    if (type && type !== 'all') query = query.eq('type', type)
    if (startDate) query = query.gte('start_date', startDate)
    if (endDate) query = query.lte('start_date', endDate)

    const { data, error } = await query.order('start_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      performances: data || [],
    })
  } catch (error) {
    console.error('Error fetching performances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performances' },
      { status: 500 }
    )
  }
}
