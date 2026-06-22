import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'première — every stage in the world'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgCard({
    eyebrow: 'Ballet & Opera · Worldwide',
    title: 'première',
    subtitle: 'One search. Every stage on Earth.',
    accent: '#2D1B4E',
  })
}
