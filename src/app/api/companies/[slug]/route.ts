import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (companyError) throw companyError
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    const { data: performances, error: perfError } = await supabase
      .from('performances')
      .select('*')
      .eq('company_id', company.id)
      .gte('start_date', today)
      .order('start_date')

    if (perfError) throw perfError

    return NextResponse.json({ company, performances: performances ?? [] })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}
