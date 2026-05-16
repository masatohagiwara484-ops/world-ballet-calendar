import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Company = {
  id: string
  slug: string
  name: string
  name_local?: string
  type: 'ballet' | 'opera' | 'both'
  country: string
  city: string
  lat: number
  lng: number
  website?: string
  instagram?: string
  hero_image?: string
  description?: string
  description_short?: string
  founded_year?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Performance = {
  id: string
  company_id: string
  title: string
  title_original?: string
  composer?: string
  choreographer?: string
  start_date: string
  end_date?: string
  venue?: string
  venue_address?: string
  ticket_url?: string
  affiliate_url?: string
  description?: string
  image_url?: string
  price_range?: string
  is_featured: boolean
  created_at: string
  updated_at: string
}
