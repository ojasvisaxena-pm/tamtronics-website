import type { Metadata } from 'next'

import { getSettings } from '@/lib/cms'
import { pagePath } from '@/lib/paths'
import type { Media, Page } from '@/payload-types'

const absolute = (url: string | null | undefined, base: string) => {
  if (!url) return undefined
  return url.startsWith('http') ? url : `${base}${url}`
}

export async function pageMetadata(page: Page): Promise<Metadata> {
  const settings = await getSettings()
  const seo = page.seo ?? {}
  const base = settings.siteUrl
  const title = seo.title || page.title
  const description = seo.description || settings.defaultDescription || undefined
  const url = seo.canonical || `${base}${pagePath(page.slug)}`
  const image = (seo.ogImage || settings.ogImage) as Media | null | undefined
  const imageUrl = absolute(image?.url, base)

  return {
    metadataBase: new URL(base),
    title,
    description,
    alternates: { canonical: url },
    robots: seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      url,
      images: imageUrl ? [imageUrl] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  }
}
