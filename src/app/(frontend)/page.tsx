import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageRenderer } from '@/components/PageRenderer'
import { getPage, getSettings } from '@/lib/cms'
import { pageMetadata } from '@/lib/metadata'
import { HOME_SLUG } from '@/lib/paths'

// Cached, and refreshed immediately by the CMS hooks when content is published.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(HOME_SLUG)
  return page ? pageMetadata(page) : {}
}

export default async function HomePage() {
  const [page, settings] = await Promise.all([getPage(HOME_SLUG), getSettings()])
  if (!page) notFound()

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: `${settings.siteUrl}/`,
    description: settings.organizationDescription ?? undefined,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }} />
      <PageRenderer page={page} />
    </>
  )
}
