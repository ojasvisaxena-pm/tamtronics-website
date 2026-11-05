import type { GlobalConfig } from 'payload'

import { isLoggedIn } from '@/lib/access'
import { revalidateGlobal } from '@/lib/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: { group: 'Site' },
  access: { read: () => true, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'logo', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'navItems',
      type: 'array',
      label: 'Navigation',
      labels: { singular: 'Menu item', plural: 'Menu items' },
      admin: { description: 'Drag to reorder.' },
      fields: [
        { type: 'row', fields: [
          { name: 'label', type: 'text', required: true },
          { name: 'href', type: 'text', required: true, label: 'Link' },
        ] },
        { name: 'mobileOnly', type: 'checkbox', label: 'Only in the mobile menu' },
      ],
    },
    { type: 'row', fields: [
      { name: 'ctaLabel', type: 'text', required: true, label: 'Button label' },
      { name: 'ctaHref', type: 'text', required: true, label: 'Button link' },
    ] },
  ],
}
