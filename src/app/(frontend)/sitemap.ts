import type { MetadataRoute } from 'next'

import { getCms, getSettings } from '@/lib/cms'
import { pagePath } from '@/lib/paths'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [payload, settings] = await Promise.all([getCms(), getSettings()])
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ _status: { equals: 'published' } }, { 'seo.noindex': { not_equals: true } }] },
    limit: 500,
    depth: 0,
    pagination: false,
    select: { slug: true, updatedAt: true },
  })
  return docs.map((doc) => ({ url: `${settings.siteUrl}${pagePath(doc.slug)}`, lastModified: doc.updatedAt }))
}
