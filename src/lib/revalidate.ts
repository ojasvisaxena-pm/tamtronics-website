import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { pagePath } from '@/lib/paths'

// revalidatePath only works inside a Next.js request; the seed script runs outside one.
const safely = (fn: () => void) => {
  try {
    fn()
  } catch {
    /* outside a Next.js request */
  }
}

export const revalidateSite: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({ doc }) => {
  safely(() => revalidatePath('/', 'layout'))
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc }) => {
  safely(() => revalidatePath('/', 'layout'))
  return doc
}

export const revalidatePage: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  safely(() => {
    if (doc._status === 'published') revalidatePath(pagePath(doc.slug))
    // Unpublished or renamed: the old URL has to stop serving the cached copy.
    if (previousDoc?.slug && (previousDoc.slug !== doc.slug || doc._status !== 'published')) {
      revalidatePath(pagePath(previousDoc.slug))
    }
  })
  return doc
}

export const revalidateDeletedPage: CollectionAfterDeleteHook = ({ doc }) => {
  safely(() => revalidatePath(pagePath(doc.slug)))
  return doc
}
