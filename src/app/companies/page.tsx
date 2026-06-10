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
        <div className="mb-12">
          <p className="text-gold text-[11px] tracking-[0.4em] uppercase mb-4">
            Directory
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-gradient-gold leading-tight">
            The companies
          </h1>
          <p className="mt-5 text-ivory/62 text-base md:text-lg max-w-2xl">
            The houses and ensembles that define the world&rsquo;s ballet and
            opera. Search by name, or filter by discipline and country.
          </p>
        </div>
        <CompanyDirectory companies={companies} />
      </div>
    </main>
  )
}
