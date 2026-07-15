import Link from 'next/link'
import CompanyNameplate from './CompanyNameplate'
import type { Company } from '@/lib/types'

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group glass-card specular block overflow-hidden rounded-glass"
    >
      <CompanyNameplate company={company} className="aspect-[16/10] w-full" />
      <div className="p-6">
        {/* Name is the nameplate above (the card's "art"); lead here with place. */}
        <p className="text-gold text-[10px] tracking-[0.3em] uppercase group-hover:text-gold-deep transition-colors">
          {company.city} · {company.country}
        </p>
        {company.description_short && (
          <p className="font-warbler mt-3 text-ivory/62 text-sm leading-relaxed line-clamp-2">
            {company.description_short}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-ivory/38 text-[11px] tracking-[0.18em] uppercase">
            {company.founded_year ? `Est. ${company.founded_year}` : ' '}
          </span>
          <span className="text-gold text-[11px] tracking-[0.18em] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
            Explore &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
