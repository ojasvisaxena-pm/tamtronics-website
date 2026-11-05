import type { GlobalConfig } from 'payload'

import { isLoggedIn } from '@/lib/access'
import { revalidateGlobal } from '@/lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site Settings',
  admin: { group: 'Site' },
  access: { read: () => true, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { type: 'row', fields: [
      { name: 'siteName', type: 'text', required: true },
      {
        name: 'siteUrl',
        type: 'text',
        required: true,
        label: 'Public website address',
        admin: { description: 'No trailing slash. Used for canonical URLs, social tags and the sitemap.' },
        validate: (v: unknown) => /^https?:\/\/[^/\s]+$/.test(String(v)) || 'Use a full address such as https://tamtronics.com',
      },
    ] },
    { name: 'defaultDescription', type: 'textarea', label: 'Default meta description' },
    { name: 'organizationDescription', type: 'text', label: 'Short company description for search engines' },
    { type: 'row', fields: [
      { name: 'favicon', type: 'upload', relationTo: 'media' },
      { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Default social image' },
    ] },
    { name: 'themeColor', type: 'text', defaultValue: '#090d16', label: 'Browser theme colour' },
    {
      name: 'gtmId',
      type: 'text',
      label: 'Google Tag Manager ID',
      admin: { description: 'For example GTM-XXXXXXX. Leave empty for no tracking; check consent requirements before adding one.' },
      validate: (v: unknown) => !v || /^GTM-[A-Z0-9]+$/.test(String(v)) || 'Use the format GTM-XXXXXXX.',
    },
  ],
}
