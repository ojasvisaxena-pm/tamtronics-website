import type { CollectionConfig } from 'payload'

import { pageBlocks } from '@/blocks/pageBlocks'
import { isAdmin, isLoggedIn, publishedOrLoggedIn } from '@/lib/access'
import { pagePath, RESERVED_SLUGS } from '@/lib/paths'
import { revalidateDeletedPage, revalidatePage } from '@/lib/revalidate'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    preview: (doc) => `/preview?path=${encodeURIComponent(pagePath(String(doc.slug)))}`,
  },
  access: { read: publishedOrLoggedIn, create: isLoggedIn, update: isLoggedIn, delete: isAdmin },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  hooks: { afterChange: [revalidatePage], afterDelete: [revalidateDeletedPage] },
  fields: [
    { name: 'title', type: 'text', required: true, admin: { description: 'Internal name, and the browser title if no SEO title is set.' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The address: "platform" is served at /platform. "home" is the home page. If you change it, add a redirect.',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) return 'Use lowercase letters, numbers and hyphens only.'
        if (RESERVED_SLUGS.includes(value)) return 'This address is used by the system. Please choose another.'
        return true
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page sections',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              label: 'Sections',
              labels: { singular: 'Section', plural: 'Sections' },
              blocks: pageBlocks,
              admin: { description: 'Add, remove and drag sections to reorder the page.' },
            },
          ],
        },
        {
          name: 'seo',
          label: 'SEO',
          fields: [
            { name: 'title', type: 'text', label: 'SEO title', admin: { description: 'Shown in search results and browser tabs. Aim for under 60 characters.' } },
            { name: 'description', type: 'textarea', label: 'Meta description', admin: { description: 'Aim for under 160 characters.' } },
            { name: 'canonical', type: 'text', label: 'Canonical URL', admin: { description: 'Leave empty to use this page’s own address.' } },
            { name: 'ogTitle', type: 'text', label: 'Social title', admin: { description: 'Defaults to the SEO title.' } },
            { name: 'ogDescription', type: 'textarea', label: 'Social description', admin: { description: 'Defaults to the meta description.' } },
            { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Social image', admin: { description: 'Defaults to the image in Site Settings.' } },
            { name: 'noindex', type: 'checkbox', label: 'Hide from search engines' },
            {
              name: 'structuredData',
              type: 'code',
              label: 'Structured data (JSON-LD)',
              admin: { language: 'json', description: 'Optional schema.org JSON for this page.' },
              validate: (value: unknown) => {
                if (!value) return true
                try {
                  JSON.parse(String(value))
                  return true
                } catch {
                  return 'This is not valid JSON.'
                }
              },
            },
          ],
        },
      ],
    },
  ],
}
