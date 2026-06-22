import { getCompanyBySlug } from '@/lib/data'
import { typeLabel } from '@/components/shared/design'
import { renderOgCard, accentFor, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Company on première'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { slug: string } }) {
  const company = await getCompanyBySlug(params.slug)
  if (!company) {
    return renderOgCard({ eyebrow: 'Ballet & Opera', title: 'première' })
  }
  return renderOgCard({
    eyebrow: `${typeLabel(company.type)} · ${company.country}`,
    title: company.name,
    subtitle: company.city,
    accent: accentFor(company.slug),
  })
}
