import { MetadataRoute } from 'next'
import { FALLBACK_STATE_METRICS } from '@/lib/overlay-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://meridian.projectlavos.com'
  const now = new Date()

  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/rank`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Add all 51 state profile pages
  const statePages: MetadataRoute.Sitemap = Object.keys(FALLBACK_STATE_METRICS).map(
    (abbr) => ({
      url: `${baseUrl}/state/${abbr.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })
  )

  return [...pages, ...statePages]
}
