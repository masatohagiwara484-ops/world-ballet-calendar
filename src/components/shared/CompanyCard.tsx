import Link from 'next/link'
import GradientArt from './GradientArt'
import { typeLabel } from './design'
import type { Company } from '@/lib/types'

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group block bg-white border border-[#1A1A1A]/[0.08] rounded-md overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
    >
      <GradientArt
        seed={company.slug}
        title={company.name}
        badge={typeLabel(company.type)}
        className="aspect-[16/10] w-full"
        monogramClassName="text-6xl"
      />
      <div className="p-6">
        <p className="text-[#D4AF37] text-[10px] tracking-[0.3em] uppercase mb-3">
          {company.city} · {company.country}
        </p>
        <h3 className="font-serif text-xl font-light text-[#1A1A1A] group-hover:text-[#1B2A4A] transition-colors">
          {company.name}
        </h3>
        {company.description_short && (
          <p className="mt-3 text-[#1A1A1A]/55 text-sm leading-relaxed line-clamp-2">
            {company.description_short}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[#1A1A1A]/35 text-[11px] tracking-[0.18em] uppercase">
            {company.founded_year ? `Est. ${company.founded_year}` : ' '}
          </span>
          <span className="text-[#D4AF37] text-[11px] tracking-[0.18em] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            Explore &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
