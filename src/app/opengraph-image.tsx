import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og'

export const alt = 'première — the world’s great stages, worth the journey'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default async function Image() {
  return renderOgCard({
    eyebrow: 'Ballet & Opera · Worldwide',
    title: 'première',
    subtitle: 'Discover the performance. Plan the journey.',
    accent: '#2D1B4E',
  })
}
