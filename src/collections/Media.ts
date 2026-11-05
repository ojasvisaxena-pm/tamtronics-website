import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { isAdmin, isLoggedIn } from '@/lib/access'
import { revalidateSite } from '@/lib/revalidate'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content', useAsTitle: 'alt', defaultColumns: ['filename', 'alt', 'updatedAt'] },
  access: { read: () => true, create: isLoggedIn, update: isLoggedIn, delete: isAdmin },
  hooks: { afterChange: [revalidateSite], afterDelete: [revalidateSite] },
  upload: {
    staticDir: process.env.MEDIA_DIR || path.resolve(dirname, '../../media'),
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    // The frontend resizes through next/image; this size is only for admin previews.
    imageSizes: [{ name: 'thumbnail', width: 400 }],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt text',
      admin: { description: 'Describe the image for people who cannot see it.' },
    },
    { name: 'description', type: 'textarea', admin: { description: 'Internal notes: source, rights, where it is used.' } },
  ],
}
