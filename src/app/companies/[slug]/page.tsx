import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PerformanceCard from '@/components/performance/PerformanceCard'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('companies')
    .select('slug')
    .eq('is_active', true)

  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { data } = await supabase
    .from('companies')
    .select('name, description_short, city, country')
    .eq('slug', params.slug)
    .single()

  if (!data) return {}

  return {
    title: `${data.name} — World Ballet & Opera Calendar`,
    description: data.description_short ?? `${data.name} performances in ${data.city}`,
    openGraph: {
      title: data.name,
      description: data.description_short ?? `${data.name} performances in ${data.city}`,
    },
  }
}

export default async function CompanyPage({ params }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error || !company) notFound()

  const { data: performances } = await supabase
    .from('performances')
    .select('*')
    .eq('company_id', company.id)
    .gte('start_date', today)
    .order('start_date')

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#0A0A0A]/80 backdrop-blur-sm border-b border-white/5">
        <Link
          href="/"
          className="text-[#C9A961] text-xs tracking-[0.3em] uppercase hover:opacity-70 transition-opacity duration-300"
        >
          ← World Calendar
        </Link>
        <span className="text-white/30 text-xs tracking-widest uppercase">
          {company.type} · {company.city}
        </span>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-8 md:px-16 lg:px-24 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <p className="text-[#C9A961] text-xs tracking-[0.3em] uppercase mb-4">
                {company.country} · Est. {company.founded_year}
              </p>
              <h1 className="font-serif text-5xl md:text-7xl font-light leading-tight mb-4">
                {company.name}
              </h1>
              {company.name_local && company.name_local !== company.name && (
                <p className="text-white/30 text-lg font-light">
                  {company.name_local}
                </p>
              )}
            </div>

            {/* External links */}
            <div className="flex flex-wrap gap-3">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-[#C9A961] text-[#C9A961] text-xs tracking-widest uppercase hover:bg-[#C9A961]/10 transition-all duration-300"
                >
                  Official Site
                </a>
              )}
              {company.instagram && (
                <a
                  href={`https://instagram.com/${company.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 border border-white/20 text-white/50 text-xs tracking-widest uppercase hover:border-white/40 hover:text-white/70 transition-all duration-300"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>

          {company.description && (
            <p className="mt-10 text-white/50 text-base leading-relaxed max-w-3xl font-light">
              {company.description}
            </p>
          )}
        </div>
      </section>

      {/* Performances */}
      <section className="py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-serif text-3xl font-light">
              Upcoming Performances
            </h2>
            <span className="text-white/30 text-sm">
              {performances?.length ?? 0} scheduled
            </span>
          </div>

          {performances && performances.length > 0 ? (
            <div className="grid gap-6">
              {performances.map((perf) => (
                <PerformanceCard
                  key={perf.id}
                  performance={perf}
                  companyCity={company.city}
                  companyCountry={company.country}
                />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border border-white/5">
              <p className="text-white/20 text-xs tracking-[0.3em] uppercase mb-3">
                No upcoming performances
              </p>
              <p className="text-white/30 text-sm">
                Check back for the next season announcement.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-white/30 text-xs tracking-widest uppercase hover:text-white/50 transition-colors duration-300"
          >
            ← Back to Calendar
          </Link>
          <p className="text-white/20 text-xs">
            World Ballet &amp; Opera Calendar &copy; 2026
          </p>
        </div>
      </footer>
    </main>
  )
}
