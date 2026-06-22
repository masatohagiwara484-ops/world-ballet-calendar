import { getCityBySlug } from '@/lib/cities'
import { renderOgCard, accentFor, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Ballet & opera by city — première'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { slug: string } }) {
  const city = await getCityBySlug(params.slug)
  if (!city) {
    return renderOgCard({ eyebrow: 'Ballet & Opera', title: 'première' })
  }
  const n = city.companies.length
  return renderOgCard({
    eyebrow: `Ballet & Opera · ${city.country}`,
    title: city.name,
    subtitle: `${n} ${n === 1 ? 'company' : 'companies'} on stage`,
    accent: accentFor(city.slug),
  })
}
