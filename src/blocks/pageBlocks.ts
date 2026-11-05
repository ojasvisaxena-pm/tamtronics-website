import type { Block, Field } from 'payload'

import { elementBlocks } from '@/blocks/elements'
import { buttonsField, chipFields, diagramOptions, headline, imageFields, layerColorOptions } from '@/fields/shared'

const sectionOptions: Field[] = [
  { type: 'row', fields: [
    {
      name: 'background',
      type: 'select',
      required: true,
      defaultValue: 'paper',
      options: [
        { label: 'Paper', value: 'paper' },
        { label: 'Paper, darker', value: 'paper-2' },
        { label: 'White', value: 'white' },
        { label: 'Dark', value: 'dark' },
        { label: 'Dark with glow', value: 'dark-lit' },
      ],
    },
    { name: 'anchorId', type: 'text', label: 'Anchor ID', admin: { description: 'Lets links jump here, for example architecture.' } },
  ] },
  { type: 'row', fields: [
    { name: 'tight', type: 'checkbox', label: 'Reduced padding' },
    { name: 'noTopPadding', type: 'checkbox', label: 'No top padding' },
  ] },
]

const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'variant', type: 'select', required: true, defaultValue: 'page', options: [
      { label: 'Home', value: 'home' },
      { label: 'Inner page', value: 'page' },
      { label: 'Inner page, compact', value: 'compact' },
      { label: 'Inner page, large with visual', value: 'feature' },
    ] },
    { name: 'pillars', type: 'array', label: 'Animated words above the hero', maxRows: 3, fields: [{ name: 'word', type: 'text', required: true }] },
    { name: 'breadcrumb', type: 'text', label: 'Breadcrumb label', admin: { description: 'Current page name. Leave empty on the home page.' } },
    { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
    headline('heading', 'Heading', true),
    { name: 'lede', type: 'textarea', label: 'Intro paragraph' },
    buttonsField(),
    { name: 'chips', type: 'array', label: 'Audience labels', fields: [
      { type: 'row', fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'color', type: 'select', required: true, options: layerColorOptions },
      ] },
    ] },
    { name: 'aside', type: 'blocks', label: 'Right-hand side', blocks: elementBlocks, maxRows: 1 },
  ],
}

const Section: Block = {
  slug: 'section',
  interfaceName: 'SectionBlock',
  labels: { singular: 'Content section', plural: 'Content sections' },
  fields: [
    ...sectionOptions,
    {
      name: 'head',
      type: 'group',
      label: 'Section heading',
      fields: [
        { name: 'layout', type: 'select', required: true, defaultValue: 'stacked', options: [
          { label: 'Stacked', value: 'stacked' },
          { label: 'Heading left, intro right', value: 'split' },
          { label: 'Hidden, for screen readers only', value: 'hidden' },
          { label: 'No heading', value: 'none' },
        ] },
        { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
        headline('heading', 'Heading'),
        { name: 'statement', type: 'checkbox', label: 'Large statement heading' },
        { name: 'lede', type: 'textarea', label: 'Intro paragraph' },
        { name: 'ledeDelay', type: 'number', label: 'Intro animation delay (ms)' },
        ...chipFields,
      ],
    },
    { name: 'content', type: 'blocks', label: 'Contents', blocks: elementBlocks },
  ],
}

const column = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    { type: 'row', fields: [
      { name: 'stacked', type: 'checkbox', label: 'Stack with even spacing', defaultValue: true },
      { name: 'reveal', type: 'checkbox', label: 'Animate in on scroll', defaultValue: true },
      { name: 'delay', type: 'number', label: 'Animation delay (ms)' },
      { name: 'prose', type: 'checkbox', label: 'Long-form text' },
    ] },
    { name: 'content', type: 'blocks', label: 'Contents', blocks: elementBlocks },
  ],
})

const Split: Block = {
  slug: 'split',
  interfaceName: 'SplitBlock',
  labels: { singular: 'Two-column section', plural: 'Two-column sections' },
  fields: [
    ...sectionOptions,
    { type: 'row', fields: [
      { name: 'widths', type: 'select', required: true, defaultValue: 'equal', options: [
        { label: 'Equal', value: 'equal' },
        { label: 'Wider left', value: 'wide-left' },
        { label: 'Wider right', value: 'wide-right' },
      ] },
      { name: 'alignTop', type: 'checkbox', label: 'Align columns to the top' },
    ] },
    column('left', 'Left column'),
    column('right', 'Right column'),
  ],
}

const CtaBand: Block = {
  slug: 'ctaBand',
  interfaceName: 'CtaBandBlock',
  labels: { singular: 'Call-to-action band', plural: 'Call-to-action bands' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    buttonsField(),
  ],
}

const IndustryNav: Block = {
  slug: 'industryNav',
  interfaceName: 'IndustryNavBlock',
  labels: { singular: 'Sticky section menu', plural: 'Sticky section menus' },
  fields: [
    { name: 'ariaLabel', type: 'text', label: 'Label for screen readers', defaultValue: 'Sections on this page' },
    { name: 'items', type: 'array', required: true, fields: [
      { type: 'row', fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'anchorId', type: 'text', required: true, label: 'Anchor ID of the section' },
      ] },
    ] },
  ],
}

const Industry: Block = {
  slug: 'industry',
  interfaceName: 'IndustryBlock',
  labels: { singular: 'Industry section', plural: 'Industry sections' },
  fields: [
    { type: 'row', fields: [
      { name: 'anchorId', type: 'text', required: true, label: 'Anchor ID' },
      { name: 'background', type: 'select', required: true, defaultValue: 'paper', options: [
        { label: 'Paper', value: 'paper' },
        { label: 'Paper, darker', value: 'paper-2' },
      ] },
      { name: 'flip', type: 'checkbox', label: 'Picture on the right' },
    ] },
    ...imageFields('image', false),
    { name: 'diagram', type: 'select', options: diagramOptions, admin: { description: 'Used when no image is chosen.' } },
    ...chipFields,
    { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
    { name: 'heading', type: 'text', required: true },
    { name: 'blocks', type: 'array', label: 'Text blocks', fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'body', type: 'textarea' },
      { name: 'questions', type: 'array', fields: [{ name: 'text', type: 'text', required: true }] },
    ] },
    { type: 'row', fields: [
      { name: 'ctaLabel', type: 'text', required: true, label: 'Button label' },
      { name: 'ctaHref', type: 'text', required: true, label: 'Button link', admin: { description: 'For example /contact?industry=dme, which preselects the contact form.' } },
    ] },
  ],
}

const ContactForm: Block = {
  slug: 'contactForm',
  interfaceName: 'ContactFormBlock',
  labels: { singular: 'Inquiry form', plural: 'Inquiry forms' },
  admin: { group: 'Interactive' },
  fields: [
    {
      name: 'aside',
      type: 'blocks',
      label: 'Sidebar contents',
      blocks: elementBlocks,
      admin: { description: 'Shown beside the form. The form itself (fields, messages, emails) is edited in Forms > Business Inquiry Form.' },
    },
  ],
}

export const pageBlocks: Block[] = [Hero, Section, Split, CtaBand, IndustryNav, Industry, ContactForm]
