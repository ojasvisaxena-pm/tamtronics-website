import type { Field } from 'payload'

import { diagramNames } from '@/diagrams/names'

export const HEADLINE_HINT = 'Wrap words in *asterisks* to set them in the italic serif accent.'

export const diagramOptions = diagramNames.map((name) => ({ label: name, value: name }))

export const layerColorOptions = [
  { label: 'Equipment (amber)', value: 'equipment' },
  { label: 'Connectivity (lime)', value: 'connectivity' },
  { label: 'Application (sky)', value: 'application' },
  { label: 'Data (violet)', value: 'data' },
]

export const headline = (name: string, label: string, required = false): Field => ({
  name,
  type: 'text',
  label,
  required,
  admin: { description: HEADLINE_HINT },
})

/** Every image picks a media item and can describe it differently in this context. */
export const imageFields = (name = 'image', required = true): Field[] => [
  { name, type: 'upload', relationTo: 'media', required, label: 'Image' },
  { name: `${name}Alt`, type: 'text', label: 'Alt text for this use', admin: { description: 'Leave empty to use the alt text saved with the image.' } },
]

export const buttonFields: Field[] = [
  { type: 'row', fields: [
    { name: 'label', type: 'text', required: true },
    { name: 'href', type: 'text', required: true, label: 'Link', admin: { description: 'For example /platform or /industries#dme' } },
  ] },
  { type: 'row', fields: [
    {
      name: 'style',
      type: 'select',
      required: true,
      defaultValue: 'signal',
      options: [
        { label: 'Lime', value: 'signal' },
        { label: 'Outline (on dark)', value: 'ghost' },
        { label: 'Dark', value: 'ink' },
        { label: 'Outline (on lime or light)', value: 'ghostInk' },
      ],
    },
    { name: 'arrow', type: 'checkbox', label: 'Show arrow', defaultValue: true },
  ] },
]

export const buttonsField = (name = 'buttons', label = 'Buttons'): Field => ({
  name,
  type: 'array',
  label,
  labels: { singular: 'Button', plural: 'Buttons' },
  fields: buttonFields,
})

export const spaceAbove: Field = {
  name: 'spaceAbove',
  type: 'select',
  label: 'Space above',
  options: ['2', '4', '5', '6', '7'].map((v) => ({ label: `Step ${v}`, value: v })),
}

export const revealFields: Field[] = [
  { type: 'row', fields: [
    { name: 'reveal', type: 'checkbox', label: 'Animate in on scroll', defaultValue: true },
    { name: 'delay', type: 'number', label: 'Animation delay (ms)', min: 0, max: 1000 },
  ] },
]

export const chipFields: Field[] = [
  { type: 'row', fields: [
    { name: 'chipLabel', type: 'text', label: 'Label' },
    {
      name: 'chipKind',
      type: 'select',
      label: 'Label style',
      defaultValue: 'plain',
      options: [
        { label: 'Plain', value: 'plain' },
        { label: 'Conceptual illustration', value: 'concept' },
        { label: 'Amber dot', value: 'equipment' },
        { label: 'Lime dot', value: 'connectivity' },
        { label: 'Sky dot', value: 'application' },
        { label: 'Violet dot', value: 'data' },
        { label: 'Dark green dot', value: 'signalDeep' },
      ],
    },
  ] },
]
