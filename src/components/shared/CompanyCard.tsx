import Link from 'next/link'
import GradientArt from './GradientArt'
import { typeLabel } from './design'
import type { Company } from '@/lib/types'

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group glass-card specular block overflow-hidden rounded-glass"
    >
      <GradientArt
        seed={company.slug}
        title={company.name}
        badge={typeLabel(company.type)}
        className="aspect-[16/10] w-full"
        monogramClassName="text-6xl"
      />
      <div className="p-6">
        <p className="text-gold text-[10px] tracking-[0.3em] uppercase mb-3">
          {company.city} · {company.country}
        </p>
        <h3 className="font-serif text-xl text-ivory group-hover:text-gold-bright transition-colors">
          {company.name}
        </h3>
        {company.description_short && (
          <p className="mt-3 text-ivory/62 text-sm leading-relaxed line-clamp-2">
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
