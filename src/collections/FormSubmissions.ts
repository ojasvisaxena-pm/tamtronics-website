import type { CollectionConfig, Field } from 'payload'

import { isAdmin, isLoggedIn } from '@/lib/access'

const delivery = (name: string, label: string): Field => ({
  name,
  type: 'select',
  label,
  defaultValue: 'pending',
  index: true,
  // Set by the server only; nobody edits a delivery record by hand.
  access: { update: () => false },
  admin: { readOnly: true },
  options: [
    { label: 'Waiting to send', value: 'pending' },
    { label: 'Sending', value: 'sending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' },
    { label: 'Not sent (turned off)', value: 'disabled' },
    { label: 'Not sent (email not set up)', value: 'not-configured' },
  ],
})

/** Business Inquiry Form submissions. Created only by /api/inquiry, which validates and rate-limits. */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Form Submission', plural: 'Form Submissions' },
  admin: {
    group: 'Forms',
    useAsTitle: 'name',
    defaultColumns: ['id', 'name', 'email', 'company', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'company', 'message'],
    description: 'Everything sent through the Business Inquiry Form. Newest first.',
    pagination: { defaultLimit: 25 },
  },
  defaultSort: '-createdAt',
  access: { read: isLoggedIn, create: () => false, update: isLoggedIn, delete: isAdmin },
  timestamps: true,
  fields: [
    { type: 'row', fields: [
      { name: 'name', type: 'text', required: true, label: 'Sender name', admin: { readOnly: true } },
      { name: 'email', type: 'email', required: true, index: true, label: 'Sender email', admin: { readOnly: true } },
    ] },
    { type: 'row', fields: [
      { name: 'company', type: 'text', label: 'Company', admin: { readOnly: true } },
      { name: 'industry', type: 'text', label: 'Industry', index: true, admin: { readOnly: true } },
    ] },
    { name: 'message', type: 'textarea', label: 'Message', admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      index: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    { name: 'notes', type: 'textarea', admin: { position: 'sidebar', description: 'Internal notes. Never sent to anyone.' } },
    {
      type: 'collapsible',
      label: 'Email delivery',
      admin: { position: 'sidebar', initCollapsed: false },
      fields: [
        delivery('teamEmail', 'Email to the team'),
        delivery('confirmationEmail', 'Confirmation to the sender'),
        {
          name: 'emailError',
          type: 'text',
          label: 'Last delivery problem',
          access: { update: () => false },
          admin: { readOnly: true, condition: (data) => Boolean(data?.emailError) },
        },
      ],
    },
  ],
}
