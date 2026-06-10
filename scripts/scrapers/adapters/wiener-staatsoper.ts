/**
 * Adapter — Wiener Staatsoper (Vienna State Opera repertoire calendar).
 *
 * Parses a table where each <tr class="repertoire-row"> holds opera (and
 * occasionally ballet) entries with German "dd.MM.yyyy" date cells.
 */
import * as cheerio from 'cheerio'
import type { ScraperAdapter, RawPerformance } from '../types'

export const wienerStaatsoperAdapter: ScraperAdapter = {
  companySlug: 'wiener-staatsoper',
  sourceUrl: 'https://www.wiener-staatsoper.at/en/season-tickets/calendar/',

  parse(html: string): RawPerformance[] {
    const $ = cheerio.load(html)
    const out: RawPerformance[] = []

    $('tr.repertoire-row').each((_, el) => {
      const node = $(el)
      const category = (node.attr('data-category') ?? 'opera').toLowerCase()
      const kind = category === 'ballet' ? 'ballet' : 'opera'

      const title = node.find('td.rep-title').text().trim()
      if (!title) return

      out.push({
        company_slug: 'wiener-staatsoper',
        title,
        title_original:
          node.find('td.rep-title').attr('data-original') || undefined,
        kind,
        composer: node.find('td.rep-composer').text().trim() || undefined,
        start_date:
          node.find('td.rep-start').attr('data-iso') ||
          node.find('td.rep-start').text().trim() ||
          '',
        end_date:
          node.find('td.rep-end').attr('data-iso') ||
          node.find('td.rep-end').text().trim() ||
          undefined,
        venue: node.find('td.rep-venue').text().trim() || 'Wiener Staatsoper',
        ticket_url:
          node.find('a.rep-tickets').attr('href') ||
          'https://www.wiener-staatsoper.at/en/tickets',
        price_range: node.find('td.rep-price').text().trim() || undefined,
      })
    })

    return out
  },
}

export default wienerStaatsoperAdapter
