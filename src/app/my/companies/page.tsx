import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/auth/server'
import { getCompanies } from '@/lib/data'
import CompanyCard from '@/components/shared/CompanyCard'
import UnfollowButton from './UnfollowButton'

export const metadata: Metadata = {
  title: 'Your companies — première',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

interface FollowRow {
  entity_slug: string
}

export default async function MyCompaniesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-8 bg-stage">
        <div className="text-center max-w-md">
          <p className="text-gold-deep text-xs tracking-[0.3em] uppercase mb-6">première</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-6 text-gradient-gold">
            The companies you follow
          </h1>
          <p className="text-ivory/70 text-base mb-12 leading-relaxed">
            Sign in to see them gathered in one place.
          </p>
          <Link
            href="/login?next=/my/companies"
            className="inline-block px-8 py-3 rounded-full border border-gold-deep/60 text-gold-deep text-xs tracking-widest uppercase hover:bg-gold-deep/10 transition-all duration-300"
          >
            Sign in
          </Link>
        </div>
      </main>
    )
  }

  const { data: followData } = await supabase
    .from('follows')
    .select('entity_slug')
    .eq('user_id', user.id)
    .eq('entity_type', 'company')

  const followedSlugs = new Set(((followData ?? []) as FollowRow[]).map((r) => r.entity_slug))
  const companies = (await getCompanies()).filter((c) => followedSlugs.has(c.slug))

  return (
    <main className="min-h-screen px-8 py-24 bg-stage">
      <div className="max-w-5xl mx-auto">
        <p className="text-gold-deep text-xs tracking-[0.3em] uppercase mb-4">première</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-12 text-gradient-gold">
          The companies you follow
        </h1>

        {companies.length === 0 ? (
          <p className="text-ivory/60 text-base leading-relaxed">
            You&rsquo;re not following any companies yet. Visit a company&rsquo;s page and follow
            it to see it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div key={company.slug} className="relative">
                <CompanyCard company={company} />
                <div className="mt-3">
                  <UnfollowButton entitySlug={company.slug} entityLabel={company.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
