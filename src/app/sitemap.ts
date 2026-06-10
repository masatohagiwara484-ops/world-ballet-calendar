import type { MetadataRoute } from 'next'
import { getCompanies, getPerformances } from '@/lib/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://worldballetoperacalender.vercel.app'

  const now = new Date()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/calendar`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  try {
    const [companies, performances] = await Promise.all([
      getCompanies(),
      getPerformances(),
    ])

    const companyPages: MetadataRoute.Sitemap = companies.map((c) => ({
      url: `${baseUrl}/companies/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const performancePages: MetadataRoute.Sitemap = performances.map((p) => ({
      url: `${baseUrl}/performances/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticRoutes, ...companyPages, ...performancePages]
  } catch {
    return staticRoutes
  }
}
