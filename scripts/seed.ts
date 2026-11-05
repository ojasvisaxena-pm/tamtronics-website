/**
 * Loads the original site's content into an empty database. Safe to re-run: it only creates what's
 * missing and never overwrites or deletes anything an editor has changed.
 *   npm run seed
 */
import 'dotenv/config'

import path from 'node:path'

const assets = path.resolve(process.cwd(), 'public/assets/img')

const MEDIA = {
  logo: ['logo/tamtronics-logo.png', 'Tamtronics'],
  favicon: ['favicon.svg', 'Tamtronics Wi-Fi mark'],
  og: ['og-image.png', 'Tamtronics: see what your equipment is doing after it leaves the building'],
  device: ['equipment/nice-device.png', 'NICE cold and compression therapy unit, the equipment in the first implementation'],
  inUse: ['equipment/nice-in-use.jpg', 'A person using a NICE cold and compression therapy unit on their knee'],
  overhead: ['equipment/nice-overhead.jpg', 'Overhead view of a person using a NICE therapy unit'],
  search: ['app/app-search.png', 'Step 1 of 4: searching for the Smart Monitor nearby'],
  found: ['app/app-found.png', 'Smart Monitor found, with a Connect Now button'],
  wifi: ['app/app-wifi.png', 'Wi-Fi setup showing a list of available networks'],
  dashboard: ['app/app-dashboard.png', 'Dashboard showing the Smart Monitor with Wi-Fi and Bluetooth connected'],
} as const

type MediaKey = keyof typeof MEDIA

const btn = (label: string, href: string, style: string, arrow = false) => ({ label, href, style, arrow })
const STAGE_CTA = btn('Start a conversation', '/contact', 'ink', true)

// The contact form, as on the original site. Everything not listed uses the global's defaults,
// which repeat the original wording and rules.
const INQUIRY_FORM = {
  title: 'Business inquiry',
  intro: 'All fields are required. It takes about two minutes.',
  industry: {
    label: 'Industry',
    placeholder: 'Select the closest match',
    required: true,
    requiredMessage: 'Please choose the closest industry.',
    options: [
      { label: 'Durable medical equipment', key: 'dme' },
      { label: 'Healthcare equipment provider', key: 'healthcare' },
      { label: 'Equipment manufacturer', key: 'manufacturer' },
      { label: 'Equipment rental or distribution', key: 'rental' },
      { label: 'Other', key: 'other' },
    ],
  },
  message: { hint: "For example: the type of equipment, roughly where it operates, and what you'd like to know about it." },
  privacyNote: 'Details you share would be used only to respond to your inquiry.',
  // The preview site's "demonstration only" wording is gone because the form now really sends.
  nextLabel: 'Explore the platform',
  nextHref: '/platform',
}

const copy = (fields: Record<string, unknown>) => ({ blockType: 'copy', ...fields })
const muted = (...texts: string[]) => texts.map((text) => ({ text }))

const buildPages = (m: Record<MediaKey, string>) => {
  const collage = (priority: boolean) => ({
    blockType: 'collage',
    device: m.device,
    phone: m.dashboard,
    phoneAlt: 'Actual app dashboard showing the Smart Monitor device with Wi-Fi and Bluetooth connected',
    deviceCaption: '01 · Equipment',
    signalCaption: '02 · Connectivity',
    phoneCaption: '03 · Application',
    priority,
  })

  return [
    {
      slug: 'home',
      title: 'Home',
      seo: {
        title: 'Tamtronics — Connected equipment technology',
        description: 'Tamtronics is an independent technology company that adds a connected layer around existing equipment — IoT connectivity, an application, and a connected data environment — so organizations can see what their equipment is doing in the field.',
      },
      layout: [
        {
          blockType: 'hero',
          variant: 'home',
          pillars: [{ word: 'Technology' }, { word: 'Visibility' }, { word: 'Analytics' }],
          eyebrow: 'Connected equipment technology',
          heading: 'See what your equipment is doing *after it leaves* the building.',
          lede: 'Tamtronics adds a connected layer around equipment you already have: IoT connectivity, an application, and a connected data environment. Activity that used to be invisible becomes something your team can see.',
          buttons: [btn('See how the platform works', '/platform', 'signal', true), btn('Start a conversation', '/contact', 'ghost')],
          chips: [
            { label: 'DME companies', color: 'equipment' },
            { label: 'Equipment providers', color: 'connectivity' },
            { label: 'Manufacturers', color: 'application' },
            { label: 'Rental & distribution', color: 'data' },
          ],
          aside: [{ blockType: 'diagramFigure', diagram: 'hero-connected', variant: 'hero', tag: 'Conceptual illustration', caption: 'Equipment → connectivity → application & data' }],
        },
        {
          blockType: 'section',
          background: 'paper',
          head: {
            layout: 'split',
            eyebrow: 'The visibility gap',
            heading: 'Most equipment was never designed to *report back.*',
            statement: true,
            lede: "Organizations know a great deal about equipment while it's in their hands. Once it's delivered, placed, or rented out, that knowledge usually turns into assumptions, check-in calls, and periodic visits. Here's what changes when each unit reports its own use.",
            ledeDelay: 120,
          },
          content: [
            {
              blockType: 'usageChart',
              title: 'One day across four connected units',
              subtitle: 'Each block is one therapy session. Hover or focus a block for its time.',
              tag: 'Illustrative example, not real patient data',
              tableCaption: 'Illustrative usage for four connected units over one day',
              units: [
                { name: 'Unit 1', location: 'Patient home', sessions: [['8:10 AM', 25], ['12:30 PM', 25], ['4:45 PM', 25], ['8:20 PM', 25]].map(([start, minutes]) => ({ start, minutes })) },
                { name: 'Unit 2', location: 'Patient home', sessions: [['7:00 AM', 20], ['9:15 AM', 20], ['11:30 AM', 20], ['1:40 PM', 20], ['3:50 PM', 20], ['6:10 PM', 20], ['9:00 PM', 20]].map(([start, minutes]) => ({ start, minutes })) },
                { name: 'Unit 3', location: 'Clinic', sessions: [['7:45 AM', 30], ['11:00 AM', 30], ['2:15 PM', 30], ['5:30 PM', 30], ['8:45 PM', 30]].map(([start, minutes]) => ({ start, minutes })) },
                { name: 'Unit 4', location: 'Patient home', sessions: [], idleNote: 'No sessions in 9 days' },
              ],
            },
            {
              blockType: 'cards',
              spaceAbove: '6',
              items: [
                { label: 'BEFORE DELIVERY', title: 'Well understood', body: "Equipment is inventoried, prepared, and dispatched. Teams know where it is and what state it's in." },
                { label: 'IN THE FIELD', title: 'Largely unknown', body: 'Is the unit being used? Has it been idle for weeks? Is it still powered and connected? Answers usually require someone to ask.' },
                { label: 'WITH A CONNECTED LAYER', title: 'Visible by design', body: 'Relevant activity is captured at the equipment and organized where operations teams can see it, without redesigning the device.' },
              ],
            },
          ],
        },
        {
          blockType: 'split',
          background: 'white',
          widths: 'wide-right',
          alignTop: true,
          left: {
            stacked: true,
            reveal: true,
            content: [
              copy({
                eyebrow: 'What Tamtronics does',
                heading: 'A technology layer for equipment that was never built to be connected.',
                lede: 'Tamtronics takes an existing device or equipment ecosystem and builds the connected layer around it. The equipment keeps doing its job. What changes is how much an organization can see.',
                linkLabel: 'Explore the platform',
                linkHref: '/platform',
              }),
              { blockType: 'photo', image: m.inUse, aspectRatio: '16/10', caption: 'Equipment in use, away from a facility', spaceAbove: '4' },
            ],
          },
          right: {
            stacked: false,
            content: [
              {
                blockType: 'ruledList',
                reveal: true,
                delay: 120,
                items: [
                  { title: 'Connect existing equipment', body: 'Bring physical equipment into a connected environment, starting from the devices already in use.' },
                  { title: 'Capture relevant activity', body: "Observe the signals that matter for that equipment, such as whether it's powered and in use." },
                  { title: 'Make it visible to people', body: 'Surface status in an application your teams can use, from setup and pairing to day-to-day checks.' },
                  { title: 'Organize it across a fleet', body: 'Bring activity from many units into one connected data environment, so patterns are visible across equipment.' },
                ],
              },
            ],
          },
        },
        {
          blockType: 'section',
          background: 'dark-lit',
          anchorId: 'architecture',
          head: {
            layout: 'split',
            eyebrow: 'The platform',
            heading: 'Four layers. One continuous path from device to decision.',
            lede: 'Each layer is configured to the equipment being connected. Select a layer in the diagram or the list to see what it does.',
            ledeDelay: 100,
          },
          content: [
            { blockType: 'archExplorer', autoCycle: true },
            { blockType: 'buttons', layout: 'row', spaceAbove: '6', buttons: [btn('Read the full platform overview', '/platform', 'ghost', true)] },
          ],
        },
        {
          blockType: 'split',
          background: 'paper',
          widths: 'wide-left',
          left: { stacked: false, content: [collage(false)] },
          right: {
            stacked: true,
            reveal: true,
            delay: 120,
            content: [
              copy({
                eyebrow: 'First implementation',
                heading: 'Already working in the field: Anderson Care Connect.',
                lede: "The platform's first implementation was built for the internal use of a medical supplies business. A NICE cold and compression therapy unit, a Smart Monitor connectivity device, the Tamtronics Connect app, and a connected data environment, working as one system.",
                paragraphs: muted('It shows the four layers in practice. It is one ecosystem, not the limit of what the platform can connect.'),
                linkLabel: 'Walk through the implementation',
                linkHref: '/first-implementation',
              }),
            ],
          },
        },
        {
          blockType: 'section',
          background: 'paper-2',
          head: {
            layout: 'split',
            eyebrow: 'Industries',
            heading: 'Built for organizations whose equipment operates out of sight.',
            lede: "The question changes by industry. The underlying need, knowing what equipment is doing once it's deployed, is the same.",
            ledeDelay: 100,
          },
          content: [
            {
              blockType: 'tiles',
              items: [
                { title: 'DME companies', body: "Equipment placed in patients' homes, often for long periods.", href: '/industries#dme', image: m.overhead, imageAlt: 'Overhead view of a person using a NICE therapy unit, the kind of equipment DME companies place with patients' },
                { title: 'Healthcare equipment providers', body: 'Shared equipment moving between rooms, floors, and sites.', href: '/industries#healthcare', diagram: 'tile-healthcare' },
                { title: 'Manufacturers', body: "Products in customers' hands, adding connectivity without a redesign.", href: '/industries#manufacturers', diagram: 'tile-manufacturers' },
                { title: 'Rental & distribution', body: 'Fleets that go out, come back, and need to earn their keep.', href: '/industries#rental', diagram: 'tile-rental' },
              ],
            },
          ],
        },
        {
          blockType: 'split',
          background: 'dark-lit',
          widths: 'equal',
          alignTop: true,
          left: { stacked: true, reveal: true, content: [copy({ eyebrow: 'About Tamtronics', heading: 'Independent by design. *Early by honesty.*', statement: true })] },
          right: {
            stacked: true,
            reveal: true,
            delay: 120,
            content: [
              copy({
                lede: 'Tamtronics is an independent technology company that owns and develops the connected equipment platform. It is separate from any equipment provider, so organizations can explore connected equipment without working through a competitor.',
                paragraphs: muted("We're early in our commercial life and work one engagement at a time: a defined equipment category, a suitable connectivity approach, and a digital environment scoped to what the organization needs to see."),
                linkLabel: 'More about Tamtronics',
                linkHref: '/about',
              }),
            ],
          },
        },
        {
          blockType: 'ctaBand',
          heading: "Bring us one equipment category. We'll map the connected layer.",
          body: "Tell us what equipment you work with and what you'd like to be able to see. A first conversation is about fit, not a sales process.",
          buttons: [STAGE_CTA, btn('Review the platform first', '/platform', 'ghostInk')],
        },
      ],
    },

    {
      slug: 'platform',
      title: 'Platform',
      seo: {
        title: 'Platform — How Tamtronics connects equipment | Tamtronics',
        description: 'The Tamtronics platform has four layers — equipment, IoT connectivity, an application, and a connected data environment — configured around the equipment being connected.',
      },
      layout: [
        {
          blockType: 'hero',
          variant: 'page',
          breadcrumb: 'Platform',
          heading: 'Four layers between a device and a *clear answer.*',
          lede: 'The Tamtronics platform connects physical equipment, IoT connectivity, an application, and a connected data environment. Each layer is configured to the equipment in question, so the platform can be arranged around different devices and different questions.',
          aside: [{ blockType: 'buttons', layout: 'stack', buttons: [btn('Discuss a use case', '/contact', 'signal', true), btn('See it in practice', '/first-implementation', 'ghost')] }],
        },
        {
          blockType: 'section',
          background: 'dark',
          tight: true,
          noTopPadding: true,
          head: { layout: 'hidden', heading: 'How the layers connect' },
          content: [
            {
              blockType: 'pipeline',
              items: [
                { title: 'Equipment', body: 'A device in the field does what it was built to do.' },
                { title: 'IoT connectivity', body: 'Relevant activity is observed and relayed onward.' },
                { title: 'Application', body: 'People set up, pair, and check on equipment.' },
                { title: 'Connected data', body: 'Activity across many units is organized in one place.' },
              ],
            },
          ],
        },
        {
          blockType: 'section',
          background: 'dark-lit',
          anchorId: 'architecture',
          noTopPadding: true,
          head: {
            layout: 'stacked',
            eyebrow: 'Architecture',
            heading: 'Explore the layers.',
            lede: 'Activity travels upward, from the equipment at the bottom to the connected data environment at the top. Select a layer to open it.',
          },
          content: [{ blockType: 'archExplorer', autoCycle: true }],
        },
        {
          blockType: 'section',
          background: 'paper',
          head: {
            layout: 'stacked',
            eyebrow: 'Layer by layer',
            heading: "What each layer does, and what we don't assume.",
            lede: 'Each layer has a clear job. Specific hardware, networks, and integrations are chosen during an engagement, based on the equipment, rather than fixed in advance.',
          },
          content: [
            {
              blockType: 'layerDetail',
              anchorId: 'layer-equipment',
              icon: 'layer-icon-equipment',
              label: 'Layer 01',
              title: 'Equipment',
              visual: 'photo',
              image: m.device,
              imageAlt: 'NICE cold and compression therapy unit',
              visualCaption: 'First implementation: NICE therapy unit',
              lede: 'The equipment stays the equipment. The connected layer is arranged around devices that are already built, placed, rented, or sold.',
              facts: [
                { title: 'Its job', body: 'Operate as designed. The equipment is the subject of visibility, not something the platform replaces.' },
                { title: 'What varies', body: "How the equipment is powered, where it operates, how long it's deployed, and who is responsible for it." },
              ],
            },
            {
              blockType: 'layerDetail',
              anchorId: 'layer-connectivity',
              icon: 'layer-icon-connectivity',
              label: 'Layer 02',
              title: 'IoT connectivity',
              visual: 'signal',
              visualCaption: 'The connected layer',
              lede: 'Connectivity hardware observes relevant equipment activity and relays it into the connected environment.',
              facts: [
                { title: 'Its job', body: 'Turn activity at the equipment into signals that can travel, without changing how the equipment works.' },
                { title: 'Approaches that may be evaluated', body: 'External connectivity hardware, direct hardware integration, sensor-based approaches, or integration with existing systems.' },
              ],
              note: 'Which approach applies is decided during assessment. No specific interface, port, network, or protocol is implied here.',
            },
            {
              blockType: 'layerDetail',
              anchorId: 'layer-application',
              icon: 'layer-icon-application',
              label: 'Layer 03',
              title: 'Application',
              visual: 'phone',
              image: m.dashboard,
              imageAlt: 'Actual Tamtronics Connect app dashboard showing a connected Smart Monitor',
              visualCaption: 'Actual app screen',
              lede: 'An application gives people a direct view of connected equipment: setting it up, pairing it, and checking its status.',
              facts: [
                { title: 'Its job', body: "Make connected equipment approachable for the people around it, whether they're in operations, the field, or support." },
                { title: 'What varies', body: "Who uses it, which steps they need, and how it's presented. Where applicable, it can reflect the organization's own brand." },
              ],
            },
            {
              blockType: 'layerDetail',
              anchorId: 'layer-data',
              icon: 'layer-icon-data',
              label: 'Layer 04',
              title: 'Connected data environment',
              visual: 'none',
              closeSection: true,
              lede: 'Activity from many units is organized in one environment, so a team can look across a fleet rather than one device at a time.',
              facts: [
                { title: 'Its job', body: 'Keep equipment activity organized and accessible instead of scattered across devices, notes, and calls.' },
                { title: 'What varies', body: "Which activity is kept, how it's grouped, and what an organization needs to see. Scope is set per engagement." },
              ],
            },
          ],
        },
        {
          blockType: 'split',
          background: 'dark-lit',
          widths: 'equal',
          left: {
            stacked: true,
            reveal: true,
            content: [
              copy({
                eyebrow: 'From activity to answer',
                heading: 'How equipment activity becomes something a person can see.',
                lede: 'A simplified view of the path. The specific signals depend on the equipment and the connectivity approach.',
              }),
              {
                blockType: 'ruledList',
                reveal: false,
                items: [
                  { title: 'Something happens at the equipment', body: "It's switched on, starts a session, runs, or goes idle." },
                  { title: 'The connected layer notices', body: 'Relevant activity is captured as a signal and relayed onward.' },
                  { title: "It's organized with everything else", body: 'The signal joins activity from other units in the data environment.' },
                  { title: 'Someone can see it', body: 'Status appears in the application, for one unit or across many.' },
                ],
              },
            ],
          },
          right: {
            stacked: false,
            content: [{ blockType: 'diagramFigure', diagram: 'fleet-scene', variant: 'scene', tag: 'Conceptual illustration', caption: 'A fleet-level view of unit status', reveal: true, delay: 120 }],
          },
        },
        {
          blockType: 'section',
          background: 'white',
          head: {
            layout: 'split',
            eyebrow: 'Why visibility matters',
            heading: 'Questions that are hard to answer today.',
            lede: "We don't promise outcomes before we've seen your equipment. These are the kinds of questions connected equipment visibility is meant to help answer.",
          },
          content: [
            {
              blockType: 'cards',
              items: [
                { label: 'USE', title: 'Is this unit actually being used?', body: 'Know whether deployed equipment is in use or sitting idle, without calling to ask.' },
                { label: 'UTILIZATION', title: 'Where is equipment underused?', body: 'See patterns across a fleet that are invisible when units are checked one at a time.' },
                { label: 'STATUS', title: 'Is it powered and connected?', body: 'Spot units that have gone offline or lost power, so follow-up starts from facts.' },
              ],
            },
          ],
        },
        {
          blockType: 'split',
          background: 'paper-2',
          widths: 'equal',
          alignTop: true,
          left: {
            stacked: true,
            reveal: true,
            content: [
              copy({
                eyebrow: 'Implementation',
                heading: 'Configured per ecosystem, not sold as a fixed bundle.',
                lede: 'Which components belong in an implementation depends on the equipment, where it operates, and what an organization needs to see. A conversation usually starts with one equipment category and one question worth answering.',
              }),
            ],
          },
          right: {
            stacked: false,
            content: [
              {
                blockType: 'ruledList',
                reveal: true,
                delay: 120,
                items: [
                  { title: 'Define the equipment ecosystem', body: 'Which equipment, where it operates, and which activity is worth capturing.' },
                  { title: 'Select a connectivity approach', body: 'Chosen for how the device is powered and used.' },
                  { title: 'Shape the application', body: 'Built around the people who will use it day to day.' },
                  { title: 'Organize the data environment', body: 'Scoped to what the organization needs to see across its fleet.' },
                ],
              },
            ],
          },
        },
        {
          blockType: 'ctaBand',
          heading: 'Have a use case in mind?',
          body: "Tell us about the equipment and the question you'd like to answer. We'll talk through which layers apply.",
          buttons: [STAGE_CTA, btn('See industries', '/industries', 'ghostInk')],
        },
      ],
    },

    {
      slug: 'first-implementation',
      title: 'First Implementation',
      seo: {
        title: 'First Implementation — Anderson Care Connect | Tamtronics',
        description: 'Anderson Care Connect is the first implementation of the Tamtronics platform: a NICE therapy unit, a Smart Monitor connectivity device, the Tamtronics Connect app, and a connected data environment working as one system.',
      },
      layout: [
        {
          blockType: 'hero',
          variant: 'feature',
          breadcrumb: 'First Implementation',
          eyebrow: 'Implementation 01',
          heading: 'Anderson Care Connect: the platform, *working in the field.*',
          lede: 'The first implementation of the Tamtronics platform was built for the internal use of Anderson Medical Supplies. It takes one piece of equipment, a NICE cold and compression therapy unit, through all four layers: from the device to a connected data environment.',
          buttons: [btn('Start the walkthrough', '#walkthrough', 'signal', true), btn('Talk about your equipment', '/contact', 'ghost')],
          aside: [collage(true)],
        },
        {
          blockType: 'section',
          background: 'paper',
          head: {
            layout: 'split',
            eyebrow: 'Platform vs. implementation',
            heading: 'One implementation. Not the boundary of the platform.',
            lede: "Tamtronics is the platform company. Anderson Care Connect is the first ecosystem built on that platform, for one organization's internal use. The equipment is specific; the model is not.",
          },
          content: [{ blockType: 'diagramFigure', diagram: 'relation', variant: 'card', reveal: true }],
        },
        {
          blockType: 'section',
          background: 'dark-lit',
          anchorId: 'walkthrough',
          head: {
            layout: 'split',
            eyebrow: 'Walkthrough',
            heading: 'Four stages, from the device to the fleet view.',
            lede: 'Follow how the implementation fits together. Stages 1 and 3 show the actual equipment and app. Stages 2 and 4 are conceptual illustrations.',
          },
          content: [
            {
              blockType: 'walkthrough',
              intervalMs: 7000,
              steps: [
                {
                  stageLabel: '01 · Equipment', tabTitle: 'The device', color: 'equipment', visual: 'photo',
                  images: [{ image: m.device, imageAlt: 'NICE cold and compression therapy unit with its touchscreen display' }],
                  chipLabel: 'Actual equipment', chipKind: 'equipment',
                  heading: 'A NICE therapy unit, operating exactly as it always has.',
                  body: "The equipment layer is a NICE cold and compression therapy unit, the kind of device placed with patients for recovery at home. It's third-party equipment, and nothing about how it works was changed.",
                  factLabel: 'What it shows', factText: 'The platform starts from existing equipment instead of requiring a new device.',
                },
                {
                  stageLabel: '02 · Connectivity', tabTitle: 'The Smart Monitor', color: 'connectivity', visual: 'diagram', diagram: 'iot-scene',
                  chipLabel: 'Conceptual illustration', chipKind: 'concept',
                  heading: 'The Smart Monitor becomes the IoT layer.',
                  body: 'A compact connectivity device, called the Smart Monitor in the app, works alongside the therapy unit without modifying it. It observes relevant activity and relays it wirelessly into the connected environment.',
                  factLabel: 'What becomes observable', factText: 'Signals such as session start and stop, run time, and whether the device is online.',
                },
                {
                  stageLabel: '03 · Application', tabTitle: 'The app', color: 'application', visual: 'phones',
                  images: [
                    { image: m.search, imageAlt: 'Tamtronics Connect app, step 1 of 4, searching for a nearby Smart Monitor' },
                    { image: m.dashboard, imageAlt: 'Tamtronics Connect app dashboard showing Wi-Fi and Bluetooth connected' },
                  ],
                  chipLabel: 'Actual app screens', chipKind: 'application',
                  heading: 'The Tamtronics Connect app: setup, pairing, and status.',
                  body: 'A four-step setup finds the Smart Monitor over Bluetooth, confirms it, and connects it to Wi-Fi. The dashboard then shows the device, its Wi-Fi and Bluetooth status, equipment guides, and support contacts.',
                  factLabel: 'What it shows', factText: 'Connected equipment can be approachable for the people around it, not only for technical teams.',
                },
                {
                  stageLabel: '04 · Data', tabTitle: 'The environment', color: 'data', visual: 'diagram', diagram: 'fleet-scene',
                  chipLabel: 'Conceptual illustration', chipKind: 'concept',
                  heading: 'A connected data environment for more than one unit.',
                  body: 'Activity is organized in one environment so it can be seen across many units at once, instead of one device at a time.',
                  factLabel: 'What it shows', factText: 'The step from "is this unit on?" to "how is our equipment being used across the fleet?"',
                },
              ],
            },
          ],
        },
        {
          blockType: 'section',
          background: 'dark',
          noTopPadding: true,
          head: {
            layout: 'stacked',
            eyebrow: 'What becomes visible',
            heading: 'Four kinds of signal, captured by the connected layer.',
            lede: "The connected layer observes activity as it happens. That's enough to answer basic but valuable questions about how equipment is used.",
          },
          content: [
            {
              blockType: 'signals',
              items: [
                { diagram: 'glyph-session', title: 'Session start / stop', body: 'When the device begins and ends a period of use.' },
                { diagram: 'glyph-duration', title: 'Run duration', body: 'How long the device runs during a session.' },
                { diagram: 'glyph-power', title: 'Power state', body: 'Whether the device is currently drawing power.' },
                { diagram: 'glyph-connectivity', title: 'Connectivity status', body: 'Whether the connected layer is online and reporting.' },
              ],
            },
            { blockType: 'smallPrint', text: 'Signal glyphs are illustrative and do not show real readings.', spaceAbove: '5' },
          ],
        },
        {
          blockType: 'section',
          background: 'paper',
          head: {
            layout: 'split',
            eyebrow: 'The application flow',
            heading: 'The actual app, from first setup to live status.',
            lede: 'Tamtronics Connect handles pairing and network setup, then settles into a dashboard showing the device and its connection state. These are screens from the app used in this implementation.',
            chipLabel: 'Actual app screens',
            chipKind: 'signalDeep',
          },
          content: [
            {
              blockType: 'screens',
              items: [
                { image: m.search, caption: 'Device search' },
                { image: m.found, caption: 'Device found' },
                { image: m.wifi, caption: 'Wi-Fi setup' },
                { image: m.dashboard, caption: 'Dashboard' },
              ],
            },
          ],
        },
        {
          blockType: 'section',
          background: 'white',
          head: { layout: 'stacked', eyebrow: 'Keeping it accurate', heading: "What this implementation is, and what it isn't." },
          content: [
            {
              blockType: 'compare',
              columns: [
                {
                  title: 'It is',
                  items: muted(
                    'A working connected equipment ecosystem across all four layers',
                    "Built for Anderson Medical Supplies' internal use",
                    'Assembled from third-party equipment (a NICE therapy unit) and a Smart Monitor connectivity device, plus the Tamtronics Connect app and data environment',
                    'Evidence that the four-layer model works around an existing device',
                  ),
                },
                {
                  title: "It isn't",
                  negative: true,
                  items: muted(
                    'A product bundle sold to other organizations as-is',
                    'The limit of which equipment the platform can connect',
                    'A case study with published performance results',
                    "A sign that Tamtronics is part of an equipment provider's business",
                  ),
                },
              ],
            },
          ],
        },
        {
          blockType: 'ctaBand',
          heading: 'Your equipment, the same four layers.',
          body: 'If you already have equipment in the field, the same platform layers can be explored around your own products.',
          buttons: [STAGE_CTA, btn('See the platform layers', '/platform', 'ghostInk')],
        },
      ],
    },

    {
      slug: 'industries',
      title: 'Industries',
      seo: {
        title: 'Industries — Who connected equipment visibility is for | Tamtronics',
        description: 'How connected equipment visibility may apply to DME companies, healthcare equipment providers, manufacturers, and rental and distribution operations.',
      },
      layout: [
        {
          blockType: 'hero',
          variant: 'compact',
          breadcrumb: 'Industries',
          heading: 'When equipment leaves the building, visibility *usually goes with it.*',
          lede: 'Four kinds of organization where a connected layer could change what a team can see. Each has its own version of the problem, and its own questions worth answering.',
        },
        {
          blockType: 'industryNav',
          ariaLabel: 'Industries on this page',
          items: [
            { label: 'DME companies', anchorId: 'dme' },
            { label: 'Healthcare equipment providers', anchorId: 'healthcare' },
            { label: 'Manufacturers', anchorId: 'manufacturers' },
            { label: 'Rental & distribution', anchorId: 'rental' },
          ],
        },
        industry({
          anchorId: 'dme', background: 'paper',
          image: m.inUse, chipLabel: 'Equipment from the first implementation', chipKind: 'equipment',
          eyebrow: '01 · Durable medical equipment',
          heading: "Equipment in patients' homes, out of sight for months.",
          gap: 'DME units are delivered to patients and may stay in a home for long periods. Between delivery and pickup, the organization often has limited insight into whether a unit is being used or sitting idle.',
          fit: 'Connectivity at the equipment can surface basic activity, such as whether a unit is powered and in use, without relying on a phone call. This is the pattern demonstrated by the first implementation, built around a NICE cold and compression therapy unit.',
          questions: ["Which placed units haven't been used recently?", 'Which units are offline or unplugged?', 'Where is follow-up actually needed?'],
          ctaLabel: 'Discuss a DME use case', ctaHref: '/contact?industry=dme',
        }),
        industry({
          anchorId: 'healthcare', background: 'paper-2', flip: true,
          diagram: 'industry-healthcare', chipLabel: 'Conceptual illustration', chipKind: 'concept',
          eyebrow: '02 · Healthcare equipment providers',
          heading: 'Shared equipment that moves between rooms, floors, and sites.',
          gap: "When equipment is shared across facilities or departments, it's easy to lose track of what's in use, what's available, and what hasn't moved in weeks. Teams fill the gap with walk-arounds and manual counts.",
          fit: 'Status from each unit can be organized in one environment, giving a shared view of equipment activity across locations instead of a separate picture for each.',
          questions: ['Which units are in use right now, and which are idle?', 'Is our equipment pool the right size for actual use?', 'Which devices have stopped reporting?'],
          ctaLabel: 'Discuss a healthcare use case', ctaHref: '/contact?industry=healthcare',
        }),
        industry({
          anchorId: 'manufacturers', background: 'paper',
          diagram: 'industry-manufacturers', chipLabel: 'Conceptual illustration', chipKind: 'concept',
          eyebrow: '03 · Equipment manufacturers',
          heading: "Products in customers' hands, with no line back to you.",
          gap: 'Once a product ships, a manufacturer usually learns about it through support tickets, returns, or distributor reports. Designing connectivity into a new product generation is a long and expensive path.',
          fit: "A connected layer can be explored around existing products, alongside an application that can carry the manufacturer's own brand where applicable. It's a way to learn what connectivity is worth before committing to a redesign.",
          questions: ['How are our products actually used after sale?', 'Could a connected experience strengthen our offering?', 'Which product line would be the right place to start?'],
          ctaLabel: 'Discuss a manufacturer use case', ctaHref: '/contact?industry=manufacturer',
        }),
        industry({
          anchorId: 'rental', background: 'paper-2', flip: true,
          diagram: 'industry-rental', chipLabel: 'Conceptual illustration', chipKind: 'concept',
          eyebrow: '04 · Rental & distribution',
          heading: 'Fleets that go out, come back, and need to earn their keep.',
          gap: "Rental and distribution businesses depend on equipment moving through a cycle. Units on rent are often unaccounted for until they return, and it's hard to tell which rented units are actually being used.",
          fit: "Activity from units in the field can be organized into a fleet view, giving operations a clearer picture of what's out, what's active, and what may be ready to come back.",
          questions: ['Which rented units are actually in use?', 'How does real usage compare with rental periods?', 'Which units might be ready for return or redeployment?'],
          ctaLabel: 'Discuss a rental or distribution use case', ctaHref: '/contact?industry=rental',
        }),
        {
          blockType: 'section',
          background: 'dark-lit',
          head: { layout: 'stacked', eyebrow: 'The common pattern', heading: 'Different industries, the same four moves.' },
          content: [
            {
              blockType: 'pipeline',
              items: [
                { title: 'Identify the equipment', body: 'One category, one population of units, one question.' },
                { title: 'Add the connected layer', body: 'Connectivity suited to how the equipment is powered and used.' },
                { title: 'Give people an interface', body: 'An application for setup, pairing, and status.' },
                { title: 'Organize the activity', body: 'A data environment where a fleet can be seen at once.' },
              ],
            },
            { blockType: 'smallPrint', text: 'Industry descriptions reflect common operating patterns. They are not customer case studies.', spaceAbove: '7' },
          ],
        },
        {
          blockType: 'ctaBand',
          heading: "Don't see your industry?",
          body: "If your equipment operates outside your own facilities, there's probably something worth discussing.",
          buttons: [STAGE_CTA, btn('See the platform', '/platform', 'ghostInk')],
        },
      ],
    },

    {
      slug: 'about',
      title: 'About',
      seo: {
        title: 'About — An independent connected equipment technology company | Tamtronics',
        description: 'Tamtronics is an independent, early-stage technology company that owns and develops a connected equipment platform for DME companies, equipment providers, manufacturers, and rental and distribution operations.',
      },
      layout: [
        {
          blockType: 'hero',
          variant: 'page',
          breadcrumb: 'About',
          heading: 'An independent company for *connected equipment.*',
          lede: "Tamtronics owns and develops the technology that connects physical equipment to the people who need to understand it. We're early, we're focused, and we're deliberately independent.",
        },
        {
          blockType: 'split',
          background: 'paper',
          widths: 'equal',
          alignTop: true,
          left: { stacked: true, reveal: true, content: [copy({ eyebrow: 'Purpose', heading: "Equipment does important work out of sight. It *shouldn't stay invisible.*", statement: true })] },
          right: {
            stacked: true,
            reveal: true,
            delay: 120,
            prose: true,
            content: [
              { blockType: 'photo', image: m.overhead, imageAlt: 'Overhead view of a person recovering with a NICE therapy unit', contain: true, aspectRatio: '1/1', maxWidth: 420 },
              copy({
                lede: "A great deal of valuable equipment operates far from the organizations responsible for it: in homes, in facilities, on rental, in customers' hands. Most of it was never designed to report on what it's doing.",
                ledeStrong: true,
                paragraphs: muted(
                  'Tamtronics exists to close that gap. We build the connected layer around existing equipment, made up of IoT connectivity, an application, and a connected data environment, so organizations can see relevant activity instead of assuming it.',
                  'The platform is already working in its first implementation. Our direction is to make it available to organizations across durable medical equipment, healthcare equipment, manufacturing, and rental and distribution.',
                ),
              }),
            ],
          },
        },
        {
          blockType: 'section',
          background: 'white',
          head: {
            layout: 'split',
            eyebrow: 'Independence',
            heading: 'Why Tamtronics is its own company.',
            lede: "The platform's first implementation was built for Anderson Medical Supplies' internal use. Tamtronics is the separate technology company that owns the broader platform and makes it available to others.",
          },
          content: [
            {
              blockType: 'compare',
              columns: [
                { label: 'Tamtronics', title: 'The technology company', items: muted('Owns and develops the connected equipment platform', 'Works with organizations across several industries', 'Has its own identity, positioning, and conversations') },
                { label: 'Anderson Medical Supplies', title: "The first implementation's user", items: muted('An existing medical supplies business', 'Uses Anderson Care Connect, the first implementation, internally', "Separate from Tamtronics' work with other organizations") },
              ],
            },
            { blockType: 'note', spaceAbove: '5', reveal: true, text: "We keep Tamtronics separate because organizations should be able to explore connected equipment without feeling they're working through a business that competes with them." },
          ],
        },
        {
          blockType: 'section',
          background: 'dark-lit',
          head: { layout: 'stacked', eyebrow: 'How we work', heading: 'Engagement by engagement, starting from the equipment.' },
          content: [
            {
              blockType: 'cards',
              items: [
                { label: '01', title: 'Start specific', body: 'One equipment category and one question worth answering is a better starting point than a broad platform rollout.' },
                { label: '02', title: "Configure, don't bundle", body: 'Connectivity, application, and data environment are shaped to the equipment, not sold as a fixed package.' },
                { label: '03', title: "Say what's real", body: "We describe what the platform has done and what it's designed to do, and keep the two clearly apart." },
              ],
            },
          ],
        },
        {
          blockType: 'split',
          background: 'paper-2',
          widths: 'equal',
          alignTop: true,
          left: { stacked: true, reveal: true, content: [copy({ eyebrow: 'Where we are', heading: 'Early in our commercial life, on purpose.' })] },
          right: {
            stacked: true,
            reveal: true,
            delay: 120,
            content: [
              copy({
                lede: "Tamtronics is preparing for broader availability. Right now, we're having early conversations with organizations that have equipment in the field and a clear reason to want visibility into it.",
                ledeStrong: true,
                paragraphs: muted("If that's you, the best time to talk is before any decision is made, while the questions are still being shaped."),
              }),
              { blockType: 'photo', image: m.inUse, imageAlt: "A NICE therapy unit in use, the equipment in Tamtronics' first implementation", aspectRatio: '16/10', caption: 'Where it started: one device, connected end to end' },
              { blockType: 'buttons', layout: 'single', buttons: [STAGE_CTA] },
            ],
          },
        },
      ],
    },

    {
      slug: 'contact',
      title: 'Contact',
      seo: {
        title: 'Contact — Start a conversation | Tamtronics',
        description: "Tell Tamtronics about your equipment and what you'd like to be able to see. A low-pressure first conversation about connected equipment.",
      },
      layout: [
        {
          blockType: 'hero',
          variant: 'compact',
          breadcrumb: 'Contact',
          heading: "Start with the equipment. *We'll take it from there.*",
          lede: "Tell us what you work with and what you'd like to be able to see. A first conversation is about understanding fit, not a sales process.",
        },
        {
          blockType: 'contactForm',
          // The form's wording and rules are the Business Inquiry Form global, seeded below.
          aside: [
            copy({ eyebrow: 'What happens next', heading: 'A simple, three-step conversation.', smallHeading: true }),
            {
              blockType: 'ruledList',
              reveal: false,
              items: [
                { title: 'A short call', body: 'The equipment category, where units operate, and what you want to see.' },
                { title: 'A connected approach', body: 'Which layers apply and which components are worth including.' },
                { title: 'A scoped implementation', body: 'Configured to your ecosystem rather than sold as a fixed bundle.' },
              ],
            },
            { blockType: 'photo', image: m.inUse, imageAlt: 'Therapy equipment in use away from a central facility', aspectRatio: '16/10', caption: 'Equipment that works outside your walls' },
            { blockType: 'note', reveal: false, text: "Tamtronics usually hears from DME companies, equipment providers, manufacturers, and rental and distribution operations. If your equipment works outside your own facilities, there's likely something to discuss." },
          ],
        },
      ],
    },
  ]
}

function industry(i: {
  anchorId: string
  background: string
  flip?: boolean
  image?: string
  diagram?: string
  chipLabel: string
  chipKind: string
  eyebrow: string
  heading: string
  gap: string
  fit: string
  questions: string[]
  ctaLabel: string
  ctaHref: string
}) {
  return {
    blockType: 'industry',
    anchorId: i.anchorId,
    background: i.background,
    flip: i.flip ?? false,
    image: i.image,
    diagram: i.diagram,
    chipLabel: i.chipLabel,
    chipKind: i.chipKind,
    eyebrow: i.eyebrow,
    heading: i.heading,
    blocks: [
      { title: 'The visibility gap', body: i.gap },
      { title: 'Where a connected layer fits', body: i.fit },
      { title: 'Questions worth asking', questions: i.questions.map((text) => ({ text })) },
    ],
    ctaLabel: i.ctaLabel,
    ctaHref: i.ctaHref,
  }
}

const LAYERS = [
  {
    key: 'equipment', title: 'Equipment', subtitle: 'The device, operating as designed',
    body: 'Everything starts with equipment already in use: the devices an organization builds, rents, distributes, or places with patients and customers. The platform is arranged around that equipment rather than replacing it.',
    points: ['Starts from one existing equipment category', 'In the first implementation, the device itself was not modified', 'Which equipment is a fit is assessed case by case'],
  },
  {
    key: 'connectivity', title: 'IoT connectivity', subtitle: 'How relevant activity leaves the device',
    body: 'A connectivity layer observes relevant equipment activity and relays it onward. The right approach depends on how the equipment is powered, where it operates, and what is worth knowing about it.',
    points: ['First implementation: a Smart Monitor connectivity device', 'Other approaches can be evaluated per equipment type', 'No specific protocol or network is assumed up front'],
  },
  {
    key: 'application', title: 'Application', subtitle: 'Where people set up and check status',
    body: 'A mobile or web application gives the people around the equipment a clear interface: setting up a connection, pairing a device, and seeing its current status.',
    points: ['Guided setup and device pairing', 'Device and connection status in one place', 'Shaped around the people who will use it'],
  },
  {
    key: 'data', title: 'Connected data environment', subtitle: 'Where a fleet becomes visible',
    body: 'Activity from many units is organized in one environment instead of being scattered across devices, spreadsheets, and phone calls. That makes it possible to look across equipment, not just at one unit.',
    points: ['Activity organized across many units', 'A foundation for visibility into use and utilization', 'Scope set by what the organization needs to see'],
  },
]

async function seed() {
  // Loaded after dotenv so the config sees the environment.
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  const media = {} as Record<MediaKey, string>
  for (const [key, [file, alt]] of Object.entries(MEDIA) as Array<[MediaKey, readonly [string, string]]>) {
    const filename = path.basename(file)
    const { docs } = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
    const doc = docs[0] ?? (await payload.create({ collection: 'media', data: { alt }, filePath: path.join(assets, file) }))
    media[key] = doc.id
    console.log(docs[0] ? `media exists: ${filename}` : `media added: ${filename}`)
  }

  for (const page of buildPages(media)) {
    const { totalDocs } = await payload.count({ collection: 'pages', where: { slug: { equals: page.slug } } })
    if (totalDocs) {
      console.log(`page exists, left alone: ${page.slug}`)
      continue
    }
    // The shape is checked at runtime by Payload's own validation, which fails loudly here.
    await payload.create({ collection: 'pages', data: { ...page, _status: 'published' } as never, draft: false })
    console.log(`page added: ${page.slug}`)
  }

  // A global counts as untouched until its required field has a value.
  const header = await payload.findGlobal({ slug: 'header', depth: 0 })
  if (!header.logo) {
    await payload.updateGlobal({
      slug: 'header',
      data: {
        logo: media.logo,
        navItems: [
          { label: 'Home', href: '/' },
          { label: 'Platform', href: '/platform' },
          { label: 'First Implementation', href: '/first-implementation' },
          { label: 'Industries', href: '/industries' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact', mobileOnly: true },
        ],
        ctaLabel: 'Start a conversation',
        ctaHref: '/contact',
      },
    })
    console.log('global added: header')
  }

  const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })
  if (!footer.logo) {
    await payload.updateGlobal({
      slug: 'footer',
      data: {
        logo: media.logo,
        description: "An independent technology company building the connected layer between physical equipment and the people who need to see what it's doing.",
        ctaLabel: 'Start a conversation',
        ctaHref: '/contact',
        columns: [
          { title: 'Explore', links: [{ label: 'Platform', href: '/platform' }, { label: 'First Implementation', href: '/first-implementation' }, { label: 'Industries', href: '/industries' }] },
          { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Contact', href: '/contact' }] },
        ],
        copyright: '© {year} Tamtronics. Diagrams and interface visuals on this site are conceptual illustrations unless labeled otherwise.',
        disclaimer: 'Third-party equipment referenced is used to illustrate the technology environment.',
        giantWord: 'Tamtronics',
      },
    })
    console.log('global added: footer')
  }

  const layers = await payload.findGlobal({ slug: 'platformLayers', depth: 0 })
  if (!layers.layers?.length) {
    await payload.updateGlobal({
      slug: 'platformLayers',
      data: {
        glanceTitle: 'At a glance',
        layers: LAYERS.map((l) => ({ ...l, key: l.key as 'equipment', points: l.points.map((text) => ({ text })) })),
      },
    })
    console.log('global added: platformLayers')
  }

  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })
  if (!settings.siteName) {
    await payload.updateGlobal({
      slug: 'siteSettings',
      data: {
        siteName: 'Tamtronics',
        siteUrl: 'https://tamtronics.com',
        defaultDescription: 'Independent connected equipment technology company.',
        organizationDescription: 'Independent connected equipment technology company.',
        favicon: media.favicon,
        ogImage: media.og,
        themeColor: '#090d16',
      },
    })
    console.log('global added: siteSettings')
  }

  const inquiryForm = await payload.findGlobal({ slug: 'inquiryForm', depth: 0 })
  if (!inquiryForm.updatedAt) {
    // Partial groups are completed from the field defaults.
    await payload.updateGlobal({ slug: 'inquiryForm', data: INQUIRY_FORM as never })
    console.log('global added: inquiryForm')
  }

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
