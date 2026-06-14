import type { Metadata } from 'next'
import { getCompanies } from '@/lib/data'
import CompanyDirectory from '@/components/companies/CompanyDirectory'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Companies',
  description:
    'Explore the world&rsquo;s great ballet and opera companies — from the Royal Ballet to the Paris Opéra, the Bolshoi to the Met. Filter by type and country.',
}

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <main className="min-h-screen pt-28 pb-24 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="text-gold-deep text-[11px] tracking-[0.4em] uppercase mb-5">
            World Directory
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-gradient-gold leading-[1.05]">
            The companies
          </h1>
          <p className="mt-6 text-ivory/60 text-base md:text-lg max-w-xl leading-relaxed">
            The houses and ensembles that define the world&rsquo;s ballet and
            opera — from London to Tokyo, Paris to New York.
          </p>
          <div className="mt-10 hairline border-t" />
        </div>
        <CompanyDirectory companies={companies} />
      </div>
    </main>
  )
}
