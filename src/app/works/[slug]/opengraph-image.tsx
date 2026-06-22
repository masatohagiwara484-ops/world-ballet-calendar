import { buildGraphAsync } from '@/lib/graph'
import { KIND_LABEL } from '@/components/shared/design'
import { renderOgCard, accentFor, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Where to see this work worldwide — première'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { slug: string } }) {
  const { workBySlug, personBySlug } = await buildGraphAsync()
  const work = workBySlug.get(params.slug)
  if (!work) {
    return renderOgCard({ eyebrow: 'Ballet & Opera', title: 'première' })
  }
  const composer = work.composer_id
    ? [...personBySlug.values()].find((p) => p.id === work.composer_id) ?? null
    : null
  const kind = work.kind === 'ballet' || work.kind === 'opera' ? KIND_LABEL[work.kind] : 'Performance'
  return renderOgCard({
    eyebrow: composer ? `${kind} · ${composer.name}` : kind,
    title: work.title,
    subtitle: 'Where to see it worldwide',
    accent: accentFor(params.slug),
  })
}
