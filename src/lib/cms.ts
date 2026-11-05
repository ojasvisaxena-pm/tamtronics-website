import config from '@payload-config'
import { draftMode } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { pagePath } from '@/lib/paths'

export const getCms = () => getPayload({ config })

export const getPage = cache(async (slug: string) => {
  const payload = await getCms()
  const { isEnabled: draft } = await draftMode()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    draft,
    // /preview only turns draft mode on for signed-in users, so this is safe.
    overrideAccess: draft,
  })
  return docs[0] ?? null
})

export const getHeader = cache(async () => (await getCms()).findGlobal({ slug: 'header', depth: 1 }))
export const getFooter = cache(async () => (await getCms()).findGlobal({ slug: 'footer', depth: 1 }))
export const getSettings = cache(async () => (await getCms()).findGlobal({ slug: 'siteSettings', depth: 1 }))
export const getLayers = cache(async () => (await getCms()).findGlobal({ slug: 'platformLayers' }))
export const getInquiryForm = cache(async () => (await getCms()).findGlobal({ slug: 'inquiryForm', depth: 0 }))

export const findRedirect = cache(async (from: string) => {
  const payload = await getCms()
  const { docs } = await payload.find({ collection: 'redirects', where: { from: { equals: from } }, limit: 1, depth: 1 })
  const to = docs[0]?.to
  if (!to) return null
  if (to.type === 'custom') return to.url ?? null
  const value = to.reference?.value
  return value && typeof value === 'object' ? pagePath(value.slug) : null
})
