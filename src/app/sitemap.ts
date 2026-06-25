import type { MetadataRoute } from 'next'
import { getCompanies, getPerformances } from '@/lib/data'
import { getCities } from '@/lib/cities'
import { buildGraphAsync } from '@/lib/graph'
import { journal } from '@/data/journal'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://worldballetoperacalender.vercel.app'

  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/calendar`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/this-week`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/cities`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/map`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/journal`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Editorial long-tail (#9) — evergreen, so safe in the static block.
  const journalPages: MetadataRoute.Sitemap = journal.map((a) => ({
    url: `${baseUrl}/journal/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  try {
    const [companies, performances, cities, graph] = await Promise.all([
      getCompanies(),
      getPerformances(),
      getCities(),
      buildGraphAsync(),
    ])

    const companyPages: MetadataRoute.Sitemap = companies.map((c) => ({
      url: `${baseUrl}/companies/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    // Programmatic-SEO pages: city, work and person landing pages each match a
    // real query a culture traveller or fan types, and compound organic traffic
    // as the calendar fills. These are the no-ad-spend growth surface.
    const cityPages: MetadataRoute.Sitemap = cities.map((c) => ({
      url: `${baseUrl}/cities/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const workPages: MetadataRoute.Sitemap = [...graph.workBySlug.values()].map((w) => ({
      url: `${baseUrl}/works/${w.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    const personPages: MetadataRoute.Sitemap = [...graph.personBySlug.values()].map((p) => ({
      url: `${baseUrl}/people/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    }))

    const performancePages: MetadataRoute.Sitemap = performances.map((p) => ({
      url: `${baseUrl}/performances/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [
      ...staticRoutes,
      ...journalPages,
      ...companyPages,
      ...cityPages,
      ...workPages,
      ...personPages,
      ...performancePages,
    ]
  } catch {
    return [...staticRoutes, ...journalPages]
  }
}
