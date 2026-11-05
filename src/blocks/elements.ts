import type { Block, Field } from 'payload'

import {
  buttonsField,
  chipFields,
  diagramOptions,
  headline,
  imageFields,
  layerColorOptions,
  revealFields,
  spaceAbove,
} from '@/fields/shared'

const titleBody: Field[] = [
  { name: 'title', type: 'text', required: true },
  { name: 'body', type: 'textarea' },
]

const Copy: Block = {
  slug: 'copy',
  interfaceName: 'CopyElement',
  labels: { singular: 'Text', plural: 'Text' },
  fields: [
    { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
    headline('heading', 'Heading'),
    { type: 'row', fields: [
      { name: 'statement', type: 'checkbox', label: 'Large statement heading' },
      { name: 'smallHeading', type: 'checkbox', label: 'Smaller heading' },
    ] },
    { name: 'lede', type: 'textarea', label: 'Intro paragraph' },
    { name: 'ledeStrong', type: 'checkbox', label: 'Darker intro paragraph' },
    { name: 'paragraphs', type: 'array', label: 'Supporting paragraphs', fields: [{ name: 'text', type: 'textarea', required: true }] },
    { type: 'row', fields: [
      { name: 'linkLabel', type: 'text', label: 'Text link label' },
      { name: 'linkHref', type: 'text', label: 'Text link URL' },
    ] },
  ],
}

const RichTextElement: Block = {
  slug: 'richText',
  interfaceName: 'RichTextElement',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [{ name: 'content', type: 'richText', required: true }],
}

const Photo: Block = {
  slug: 'photo',
  interfaceName: 'PhotoElement',
  labels: { singular: 'Photo', plural: 'Photos' },
  fields: [
    ...imageFields(),
    { type: 'row', fields: [
      { name: 'contain', type: 'checkbox', label: 'Show whole image on white' },
      { name: 'aspectRatio', type: 'text', label: 'Aspect ratio', defaultValue: '16/10' },
      { name: 'maxWidth', type: 'number', label: 'Max width (px)' },
    ] },
    { name: 'caption', type: 'text' },
    spaceAbove,
  ],
}

const RuledList: Block = {
  slug: 'ruledList',
  interfaceName: 'RuledListElement',
  labels: { singular: 'Numbered list', plural: 'Numbered lists' },
  fields: [...revealFields, { name: 'items', type: 'array', required: true, fields: titleBody }],
}

const Buttons: Block = {
  slug: 'buttons',
  interfaceName: 'ButtonsElement',
  labels: { singular: 'Buttons', plural: 'Buttons' },
  fields: [
    buttonsField(),
    { name: 'layout', type: 'select', defaultValue: 'row', options: [
      { label: 'Row', value: 'row' },
      { label: 'Stacked', value: 'stack' },
      { label: 'Single, aligned left', value: 'single' },
    ] },
    spaceAbove,
  ],
}

const DiagramFigure: Block = {
  slug: 'diagramFigure',
  interfaceName: 'DiagramFigureElement',
  labels: { singular: 'Diagram', plural: 'Diagrams' },
  fields: [
    { name: 'diagram', type: 'select', required: true, options: diagramOptions, admin: { description: 'Animated artwork kept in the codebase. Text inside a diagram is changed by a developer.' } },
    { name: 'variant', type: 'select', defaultValue: 'plain', options: [
      { label: 'Plain', value: 'plain' },
      { label: 'Home hero', value: 'hero' },
      { label: 'Dark scene panel', value: 'scene' },
      { label: 'White card', value: 'card' },
    ] },
    { name: 'tag', type: 'text', label: 'Tag', admin: { description: 'For example "Conceptual illustration".' } },
    { name: 'caption', type: 'text' },
    ...revealFields,
  ],
}

const Collage: Block = {
  slug: 'collage',
  interfaceName: 'CollageElement',
  labels: { singular: 'Equipment and app collage', plural: 'Collages' },
  fields: [
    ...imageFields('device'),
    { name: 'deviceCaption', type: 'text', defaultValue: '01 · Equipment' },
    { name: 'signalCaption', type: 'text', defaultValue: '02 · Connectivity' },
    ...imageFields('phone'),
    { name: 'phoneCaption', type: 'text', defaultValue: '03 · Application' },
    { name: 'priority', type: 'checkbox', label: 'Top of the page (load first)' },
  ],
}

const Cards: Block = {
  slug: 'cards',
  interfaceName: 'CardsElement',
  labels: { singular: 'Cards', plural: 'Cards' },
  fields: [
    spaceAbove,
    { name: 'items', type: 'array', required: true, fields: [{ name: 'label', type: 'text', label: 'Small label' }, ...titleBody] },
  ],
}

const UsageChart: Block = {
  slug: 'usageChart',
  interfaceName: 'UsageChartElement',
  labels: { singular: 'Usage chart', plural: 'Usage charts' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'subtitle', type: 'text' },
    { name: 'tag', type: 'text' },
    { name: 'tableCaption', type: 'text', label: 'Caption for screen readers' },
    {
      name: 'units',
      type: 'array',
      required: true,
      admin: { description: 'The blocks, statistics and totals are all calculated from these sessions. The chart runs from 6 AM to midnight.' },
      fields: [
        { type: 'row', fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'location', type: 'text', required: true },
        ] },
        {
          name: 'sessions',
          type: 'array',
          fields: [
            { type: 'row', fields: [
              {
                name: 'start',
                type: 'text',
                required: true,
                admin: { description: 'For example 8:10 AM' },
                validate: (v: unknown) => /^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/.test(String(v)) || 'Use a time like 8:10 AM.',
              },
              { name: 'minutes', type: 'number', required: true, min: 1, max: 1080 },
            ] },
          ],
        },
        { name: 'idleNote', type: 'text', label: 'Note when there are no sessions', admin: { description: 'For example "No sessions in 9 days".' } },
      ],
    },
  ],
}

const ArchExplorer: Block = {
  slug: 'archExplorer',
  interfaceName: 'ArchExplorerElement',
  labels: { singular: 'Four-layer explorer', plural: 'Four-layer explorers' },
  admin: { group: 'Interactive' },
  fields: [
    { name: 'autoCycle', type: 'checkbox', label: 'Cycle through layers until the visitor interacts', defaultValue: true, admin: { description: 'The text comes from the Platform Layers global.' } },
  ],
}

const Tiles: Block = {
  slug: 'tiles',
  interfaceName: 'TilesElement',
  labels: { singular: 'Link tiles', plural: 'Link tiles' },
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      fields: [
        ...titleBody,
        { name: 'href', type: 'text', required: true, label: 'Link' },
        ...imageFields('image', false),
        { name: 'diagram', type: 'select', options: diagramOptions, admin: { description: 'Used when no image is chosen.' } },
      ],
    },
  ],
}

const Pipeline: Block = {
  slug: 'pipeline',
  interfaceName: 'PipelineElement',
  labels: { singular: 'Four-step pipeline', plural: 'Pipelines' },
  fields: [{ name: 'items', type: 'array', required: true, minRows: 1, maxRows: 4, fields: titleBody }],
}

const Compare: Block = {
  slug: 'compare',
  interfaceName: 'CompareElement',
  labels: { singular: 'Comparison', plural: 'Comparisons' },
  fields: [
    {
      name: 'columns',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 2,
      fields: [
        { name: 'label', type: 'text', label: 'Small label' },
        { name: 'title', type: 'text', required: true },
        { name: 'negative', type: 'checkbox', label: 'Use crosses instead of ticks' },
        { name: 'items', type: 'array', required: true, fields: [{ name: 'text', type: 'text', required: true }] },
      ],
    },
  ],
}

const Note: Block = {
  slug: 'note',
  interfaceName: 'NoteElement',
  labels: { singular: 'Note', plural: 'Notes' },
  fields: [{ name: 'text', type: 'textarea', required: true }, spaceAbove, { name: 'reveal', type: 'checkbox', label: 'Animate in on scroll', defaultValue: true }],
}

const SmallPrint: Block = {
  slug: 'smallPrint',
  interfaceName: 'SmallPrintElement',
  labels: { singular: 'Small print', plural: 'Small print' },
  fields: [{ name: 'text', type: 'textarea', required: true }, spaceAbove],
}

const Signals: Block = {
  slug: 'signals',
  interfaceName: 'SignalsElement',
  labels: { singular: 'Signal list', plural: 'Signal lists' },
  fields: [{ name: 'items', type: 'array', required: true, fields: [{ name: 'diagram', type: 'select', required: true, options: diagramOptions }, ...titleBody] }],
}

const Screens: Block = {
  slug: 'screens',
  interfaceName: 'ScreensElement',
  labels: { singular: 'App screens', plural: 'App screens' },
  fields: [{ name: 'items', type: 'array', required: true, fields: [...imageFields(), { name: 'caption', type: 'text', required: true }] }],
}

const LayerDetail: Block = {
  slug: 'layerDetail',
  interfaceName: 'LayerDetailElement',
  labels: { singular: 'Layer detail', plural: 'Layer details' },
  fields: [
    { name: 'anchorId', type: 'text', label: 'Anchor ID' },
    { name: 'icon', type: 'select', required: true, options: diagramOptions },
    { type: 'row', fields: [
      { name: 'label', type: 'text', required: true, label: 'Small label' },
      { name: 'title', type: 'text', required: true },
    ] },
    { name: 'visual', type: 'select', defaultValue: 'none', options: [
      { label: 'None', value: 'none' },
      { label: 'Photo', value: 'photo' },
      { label: 'Animated signal', value: 'signal' },
      { label: 'Phone screen', value: 'phone' },
    ] },
    ...imageFields('image', false),
    { name: 'visualCaption', type: 'text' },
    { name: 'lede', type: 'textarea', required: true },
    { name: 'facts', type: 'array', fields: titleBody },
    { name: 'note', type: 'textarea' },
    { name: 'closeSection', type: 'checkbox', label: 'Last in the list (adds the closing rule)' },
  ],
}

const Walkthrough: Block = {
  slug: 'walkthrough',
  interfaceName: 'WalkthroughElement',
  labels: { singular: 'Walkthrough', plural: 'Walkthroughs' },
  admin: { group: 'Interactive' },
  fields: [
    { name: 'intervalMs', type: 'number', label: 'Time on each stage (ms)', defaultValue: 7000, min: 2000 },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { type: 'row', fields: [
          { name: 'stageLabel', type: 'text', required: true, label: 'Tab label' },
          { name: 'tabTitle', type: 'text', required: true, label: 'Tab title' },
          { name: 'color', type: 'select', required: true, options: layerColorOptions },
        ] },
        { name: 'visual', type: 'select', required: true, defaultValue: 'photo', options: [
          { label: 'Photo', value: 'photo' },
          { label: 'Diagram', value: 'diagram' },
          { label: 'Phone screens', value: 'phones' },
        ] },
        { name: 'images', type: 'array', label: 'Images', fields: imageFields() },
        { name: 'diagram', type: 'select', options: diagramOptions },
        ...chipFields,
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        { name: 'factLabel', type: 'text' },
        { name: 'factText', type: 'textarea' },
      ],
    },
  ],
}

/** Everything that can go inside a section or column. */
export const elementBlocks: Block[] = [
  Copy,
  RichTextElement,
  Photo,
  Cards,
  RuledList,
  Buttons,
  Note,
  SmallPrint,
  DiagramFigure,
  Collage,
  UsageChart,
  Tiles,
  Pipeline,
  Compare,
  Signals,
  Screens,
  LayerDetail,
  ArchExplorer,
  Walkthrough,
]
