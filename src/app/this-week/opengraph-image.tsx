import { renderWeekCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'
import { getThisWeek, shortRunLabel } from '@/lib/this-week'

export const alt = 'This week on stage — première'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const revalidate = 3600

export default async function Image() {
  const { rangeLabel, performances } = await getThisWeek()
  return renderWeekCard({
    rangeLabel,
    items: performances.map((p) => ({
      date: shortRunLabel(p.start_date, p.end_date),
      title: p.title,
      company: p.company.name,
      kind: p.kind,
    })),
  })
}
