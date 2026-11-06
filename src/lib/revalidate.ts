import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from 'payload'

/**
 * Cache invalidation for the public site.
 *
 * Pages are cached by Next.js (ISR) in each server instance. Every page shares the header, footer and
 * site settings, and redirects can point at any page, so any published change refreshes the whole
 * site: revalidatePath('/', 'layout'). With six pages this costs one re-render each, on their next visit.
 *
 * - cache-handler.mjs passes each clear on to the other server instances (Amplify runs several).
 * - The CDN in front (CloudFront on Amplify) can't be purged from here, so next.config.ts tells it to
 *   check back with the server on every request (s-maxage=0).
 *
 * See docs/DEPLOYMENT.md > Caching and content updates.
 */
export function revalidateAll(req?: Pick<PayloadRequest, 'payload'>, reason = 'content changed'): boolean {
  try {
    revalidatePath('/', 'layout')
    req?.payload.logger.info(`Site cache cleared: ${reason}`)
    return true
  } catch (err) {
    // Scripts (seed, migrations) run outside a Next.js request, where there is no cache to clear.
    // After running one against a deployed database, POST /api/revalidate instead.
    if (err instanceof Error && err.message.includes('static generation store missing')) return false
    req?.payload.logger.error({ err, msg: `Site cache not cleared (${reason}). The site may show old content for up to an hour.` })
    return false
  }
}

/** Media, redirects: any change can show on the site. */
export const revalidateSite: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({ collection, doc, req }) => {
  revalidateAll(req, `${collection.slug} ${doc?.id ?? ''} changed`.trim())
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ global, doc, req }) => {
  revalidateAll(req, `${global.slug} saved`)
  return doc
}

/**
 * Pages have drafts with autosave every 2 s. A draft save (the admin sends ?draft=true for Save draft
 * and autosave) only writes a new version and never changes the live page, so it is skipped. Payload
 * uses the same test (collections/operations/utilities/update.js). Everything else clears the cache:
 * publish, republish, unpublish, and any update whose kind isn't known.
 */
export const revalidatePage: CollectionAfterChangeHook = ({ doc, req }) => {
  const draftOnly = String(req.query?.draft) === 'true' && doc._status !== 'published'
  if (!draftOnly) revalidateAll(req, `page "${doc.slug}" ${doc._status === 'published' ? 'published' : 'unpublished'}`)
  return doc
}

export const revalidateDeletedPage: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidateAll(req, `page "${doc.slug}" deleted`)
  return doc
}
