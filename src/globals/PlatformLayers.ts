import type { GlobalConfig } from 'payload'

import { isLoggedIn } from '@/lib/access'
import { revalidateGlobal } from '@/lib/revalidate'

/** One source for the four-layer explorer, which appears on both Home and Platform. */
export const PlatformLayers: GlobalConfig = {
  slug: 'platformLayers',
  label: 'Platform Layers',
  admin: { group: 'Site', description: 'The text of the four-layer explorer on the Home and Platform pages.' },
  access: { read: () => true, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'glanceTitle', type: 'text', required: true, defaultValue: 'At a glance', label: 'Heading above each list' },
    {
      name: 'layers',
      type: 'array',
      required: true,
      minRows: 4,
      maxRows: 4,
      admin: { description: 'Exactly four, matching the plates in the diagram.' },
      fields: [
        { type: 'row', fields: [
          { name: 'key', type: 'select', required: true, label: 'Diagram plate', options: [
            { label: 'Equipment', value: 'equipment' },
            { label: 'Connectivity', value: 'connectivity' },
            { label: 'Application', value: 'application' },
            { label: 'Data', value: 'data' },
          ] },
          { name: 'title', type: 'text', required: true },
          { name: 'subtitle', type: 'text', required: true },
        ] },
        { name: 'body', type: 'textarea', required: true },
        { name: 'points', type: 'array', fields: [{ name: 'text', type: 'text', required: true }] },
      ],
    },
  ],
}
