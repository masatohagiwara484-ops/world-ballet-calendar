import { buildGraphAsync } from '@/lib/graph'
import { renderOgCard, accentFor, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Artist on première'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { slug: string } }) {
  const { personBySlug } = await buildGraphAsync()
  const person = personBySlug.get(params.slug)
  if (!person) {
    return renderOgCard({ eyebrow: 'Ballet & Opera', title: 'première' })
  }
  return renderOgCard({
    eyebrow: 'Artist',
    title: person.name,
    subtitle: 'Every production worldwide',
    accent: accentFor(params.slug),
  })
}
