/**
 * Adapter — The Royal Ballet (Royal Opera House season listing).
 *
 * Parses a season grid where each production is an <article class="production">
 * carrying data attributes and child nodes for title, dates, creatives.
 */
import * as cheerio from 'cheerio'
import type { ScraperAdapter, RawPerformance } from '../types'

export const royalBalletAdapter: ScraperAdapter = {
  companySlug: 'royal-ballet',
  sourceUrl: 'https://www.rbo.org.uk/tickets-and-events?event-type=ballet',

  parse(html: string): RawPerformance[] {
    const $ = cheerio.load(html)
    const out: RawPerformance[] = []

    $('article.production').each((_, el) => {
      const node = $(el)
      const kind = (node.attr('data-genre') ?? '').toLowerCase()
      // The Royal Ballet listing carries both ballet and opera; this adapter
      // only claims ballet rows.
      if (kind && kind !== 'ballet') return

      const title = node.find('.production__title').text().trim()
      if (!title) return

      out.push({
        company_slug: 'royal-ballet',
        title,
        kind: 'ballet',
        composer: node.find('.production__composer').text().trim() || undefined,
        choreographer:
          node.find('.production__choreographer').text().trim() || undefined,
        start_date: node.attr('data-start-date') ?? '',
        end_date: node.attr('data-end-date') ?? undefined,
        venue: node.find('.production__venue').text().trim() || undefined,
        ticket_url:
          node.find('a.production__cta').attr('href') ||
          'https://www.rbo.org.uk/tickets-and-events',
        price_range: node.find('.production__price').text().trim() || undefined,
      })
    })

    return out
  },
}

export default royalBalletAdapter
