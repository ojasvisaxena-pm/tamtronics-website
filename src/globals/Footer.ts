import type { GlobalConfig } from 'payload'

import { isLoggedIn } from '@/lib/access'
import { revalidateGlobal } from '@/lib/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: { group: 'Site' },
  access: { read: () => true, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'logo', type: 'upload', relationTo: 'media', required: true },
    { name: 'description', type: 'textarea' },
    { type: 'row', fields: [
      { name: 'ctaLabel', type: 'text', required: true, label: 'Button label' },
      { name: 'ctaHref', type: 'text', required: true, label: 'Button link' },
    ] },
    {
      name: 'columns',
      type: 'array',
      label: 'Link columns',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'links', type: 'array', fields: [
          { type: 'row', fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true, label: 'Link' },
          ] },
        ] },
      ],
    },
    { name: 'copyright', type: 'textarea', admin: { description: '{year} is replaced with the current year.' } },
    { name: 'disclaimer', type: 'textarea' },
    { name: 'giantWord', type: 'text', label: 'Large word at the bottom' },
  ],
}
