import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { PageRenderer } from '@/components/PageRenderer'
import { findRedirect, getPage } from '@/lib/cms'
import { pageMetadata } from '@/lib/metadata'
import { HOME_SLUG } from '@/lib/paths'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

// Inner pages are built on first request, then cached.
export const generateStaticParams = async () => []

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = slug === HOME_SLUG ? null : await getPage(slug)
  return page ? pageMetadata(page) : {}
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params

  // /home redirects to / in next.config.ts, so the home page is never served twice.
  const page = slug === HOME_SLUG ? null : await getPage(slug)
  if (page) return <PageRenderer page={page} />

  // next.config.ts strips .html first, so a redirect saved as "/old-page.html" is looked up both ways.
  const target = (await findRedirect(`/${slug}`)) ?? (await findRedirect(`/${slug}.html`))
  if (target) permanentRedirect(target)
  notFound()
}
