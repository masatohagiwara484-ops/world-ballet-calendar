import { getPerformances } from '@/lib/data'
import { formatRange } from '@/components/shared/format'
import { KIND_LABEL } from '@/components/shared/design'
import { renderOgCard, accentFor, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'Performance on première'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image({ params }: { params: { id: string } }) {
  const all = await getPerformances()
  const p = all.find((x) => x.id === params.id)
  if (!p) {
    return renderOgCard({ eyebrow: 'Ballet & Opera', title: 'première' })
  }
  return renderOgCard({
    eyebrow: `${KIND_LABEL[p.kind]} · ${p.company.name}`,
    title: p.title,
    subtitle: `${formatRange(p.start_date, p.end_date)}${p.venue ? ` · ${p.venue}` : ''}`,
    accent: accentFor(p.company.slug),
  })
}
