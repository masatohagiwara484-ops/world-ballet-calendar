/**
 * Adapter — Paris Opera Ballet (Opéra national de Paris season).
 *
 * Parses a list where each show is a <li class="season-event"> with a
 * <time datetime> for start, a data attribute for the end, and French-style
 * "d MMMM yyyy" date text the normalizer can also handle.
 */
import * as cheerio from 'cheerio'
import type { ScraperAdapter, RawPerformance } from '../types'

export const parisOperaBalletAdapter: ScraperAdapter = {
  companySlug: 'paris-opera-ballet',
  sourceUrl: 'https://www.operadeparis.fr/en/season-26-27/ballet',

  parse(html: string): RawPerformance[] {
    const $ = cheerio.load(html)
    const out: RawPerformance[] = []

    $('li.season-event').each((_, el) => {
      const node = $(el)
      const discipline = (node.attr('data-discipline') ?? '').toLowerCase()
      if (discipline && discipline !== 'ballet') return

      const title = node.find('.season-event__title').text().trim()
      if (!title) return

      // Start: prefer the machine-readable <time datetime>, else the text.
      const startAttr = node.find('time.season-event__start').attr('datetime')
      const startText = node.find('time.season-event__start').text().trim()

      out.push({
        company_slug: 'paris-opera-ballet',
        title,
        title_original:
          node.find('.season-event__title-original').text().trim() || undefined,
        kind: 'ballet',
        composer:
          node.find('.season-event__composer').text().trim() || undefined,
        choreographer:
          node.find('.season-event__choreographer').text().trim() || undefined,
        start_date: startAttr || startText || '',
        end_date:
          node.find('time.season-event__end').attr('datetime') ||
          node.attr('data-end') ||
          undefined,
        venue: node.find('.season-event__venue').text().trim() || undefined,
        ticket_url:
          node.find('a.season-event__link').attr('href') ||
          'https://www.operadeparis.fr/en',
      })
    })

    return out
  },
}

export default parisOperaBalletAdapter
