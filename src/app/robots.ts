import type { MetadataRoute } from 'next'

import { getSettings } from '@/lib/cms'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings()
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/preview'] },
    sitemap: `${settings.siteUrl}/sitemap.xml`,
  }
}
