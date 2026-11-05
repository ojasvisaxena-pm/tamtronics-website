import type { Field, GlobalConfig } from 'payload'

import { isAdminField, isLoggedIn, isLoggedInField } from '@/lib/access'
import { FREE_MAIL_DEFAULT } from '@/lib/inquiry'
import { revalidateGlobal } from '@/lib/revalidate'

const TOKENS = 'You can use {min} and {max}.'

type TextDefaults = {
  label: string
  minLength: number
  maxLength: number
  cap: number
  requiredMessage: string
  tooShortMessage: string
  tooLongMessage: string
  extra?: Field[]
}

/** Label, placeholder, required, length limits and their messages for one text field. */
const textField = (name: string, title: string, d: TextDefaults): Field => ({
  name,
  type: 'group',
  label: title,
  fields: [
    { type: 'row', fields: [
      { name: 'label', type: 'text', required: true, defaultValue: d.label },
      { name: 'placeholder', type: 'text', admin: { description: 'Shown inside the empty field. Optional.' } },
    ] },
    ...(d.extra ?? []),
    { type: 'row', fields: [
      { name: 'required', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
      { name: 'minLength', type: 'number', label: 'Minimum characters', min: 0, max: d.cap, defaultValue: d.minLength, admin: { width: '33%' } },
      {
        name: 'maxLength',
        type: 'number',
        label: 'Maximum characters',
        min: 1,
        max: d.cap,
        required: true,
        defaultValue: d.maxLength,
        admin: { width: '33%' },
        validate: (value: unknown, { siblingData }: { siblingData: { minLength?: number | null } }) =>
          !siblingData?.minLength || Number(value) >= siblingData.minLength || 'Must be at least the minimum.',
      },
    ] },
    { name: 'requiredMessage', type: 'text', required: true, defaultValue: d.requiredMessage, label: 'Message when empty', admin: { description: TOKENS } },
    { type: 'row', fields: [
      { name: 'tooShortMessage', type: 'text', required: true, defaultValue: d.tooShortMessage, label: 'Message when too short' },
      { name: 'tooLongMessage', type: 'text', required: true, defaultValue: d.tooLongMessage, label: 'Message when too long' },
    ] },
  ],
})

/** The Business Inquiry Form: every field, message and email setting. The page block only places it. */
export const InquiryForm: GlobalConfig = {
  slug: 'inquiryForm',
  label: 'Business Inquiry Form',
  admin: {
    group: 'Forms',
    description: 'The form on the contact page, and the emails sent when someone uses it.',
  },
  access: { read: () => true, update: isLoggedIn },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { type: 'tabs', tabs: [
      {
        label: 'Fields',
        fields: [
          { name: 'title', type: 'text', required: true, label: 'Form heading', defaultValue: 'Business inquiry' },
          { name: 'intro', type: 'text', label: 'Description', admin: { description: 'One line under the heading.' } },
          textField('name', 'Full name', {
            label: 'Full name',
            minLength: 2,
            maxLength: 120,
            cap: 200,
            requiredMessage: 'Please enter your full name.',
            tooShortMessage: 'Please enter your full name.',
            tooLongMessage: 'Please shorten your name.',
          }),
          {
            name: 'email',
            type: 'group',
            label: 'Email',
            admin: { description: 'Always required: the confirmation email is sent here.' },
            fields: [
              { type: 'row', fields: [
                { name: 'label', type: 'text', required: true, defaultValue: 'Business email' },
                { name: 'placeholder', type: 'text', admin: { description: 'Optional.' } },
              ] },
              { type: 'row', fields: [
                { name: 'requiredMessage', type: 'text', required: true, label: 'Message when empty', defaultValue: 'Please enter your business email.' },
                { name: 'invalidMessage', type: 'text', required: true, label: 'Message when not an email address', defaultValue: "That email address doesn't look complete. Check for typos." },
              ] },
              { name: 'blockFreeMail', type: 'checkbox', label: 'Ask for a work address (refuse free-mail providers)', defaultValue: true },
              {
                name: 'freeMailDomains',
                type: 'textarea',
                label: 'Free-mail domains',
                defaultValue: FREE_MAIL_DEFAULT.join(', '),
                admin: { description: 'Separated by commas.', condition: (_, sibling) => Boolean(sibling?.blockFreeMail) },
              },
              {
                name: 'freeMailMessage',
                type: 'text',
                label: 'Message for a free-mail address',
                defaultValue: "Please use your work email so we know which organization you're with.",
                admin: { condition: (_, sibling) => Boolean(sibling?.blockFreeMail) },
              },
            ],
          },
          textField('company', 'Company', {
            label: 'Company',
            minLength: 2,
            maxLength: 160,
            cap: 300,
            requiredMessage: 'Please enter your company or organization.',
            tooShortMessage: 'Please enter your company or organization.',
            tooLongMessage: 'Please shorten the company name.',
          }),
          {
            name: 'industry',
            type: 'group',
            label: 'Industry',
            fields: [
              { type: 'row', fields: [
                { name: 'label', type: 'text', required: true, defaultValue: 'Industry' },
                { name: 'placeholder', type: 'text', required: true, label: 'First, empty choice', defaultValue: 'Select the closest match' },
              ] },
              { type: 'row', fields: [
                { name: 'required', type: 'checkbox', defaultValue: true },
                { name: 'requiredMessage', type: 'text', required: true, label: 'Message when not chosen', defaultValue: 'Please choose the closest industry.' },
              ] },
              {
                name: 'options',
                type: 'array',
                required: true,
                minRows: 1,
                maxRows: 30,
                label: 'Choices',
                fields: [
                  { type: 'row', fields: [
                    { name: 'label', type: 'text', required: true, maxLength: 120 },
                    {
                      name: 'key',
                      type: 'text',
                      required: true,
                      admin: { description: 'Used in links: /contact?industry=dme' },
                      validate: (v: unknown) => /^[a-z0-9-]+$/.test(String(v ?? '')) || 'Lowercase letters, numbers and hyphens only.',
                    },
                  ] },
                ],
              },
            ],
          },
          textField('message', 'Message', {
            label: 'Your equipment and question',
            minLength: 20,
            maxLength: 1200,
            cap: 4000,
            requiredMessage: 'Please add a sentence or two about your equipment or question ({min}+ characters).',
            tooShortMessage: 'Please add a sentence or two about your equipment or question ({min}+ characters).',
            tooLongMessage: 'Please keep your message under {max} characters.',
            extra: [{ name: 'hint', type: 'text', admin: { description: 'Help text under the field.' } }],
          }),
        ],
      },
      {
        label: 'Buttons and messages',
        fields: [
          { name: 'privacyNote', type: 'text', label: 'Note beside the button' },
          { type: 'row', fields: [
            { name: 'submitLabel', type: 'text', required: true, label: 'Submit button', defaultValue: 'Send inquiry' },
            { name: 'sendingLabel', type: 'text', required: true, label: 'Button while sending', defaultValue: 'Sending…' },
          ] },
          { type: 'row', fields: [
            { name: 'summaryOne', type: 'text', required: true, label: 'Error summary, one field', defaultValue: '1 field needs attention' },
            { name: 'summaryMany', type: 'text', required: true, label: 'Error summary, several fields', defaultValue: '{count} fields need attention', admin: { description: '{count} is replaced by the number.' } },
          ] },
          { name: 'errorMessage', type: 'text', required: true, label: 'Message if sending fails', defaultValue: 'We could not send your inquiry. Please try again in a moment.' },
          { name: 'successHeading', type: 'text', required: true, label: 'Success heading', defaultValue: 'Thank you. Your inquiry has been sent to the Tamtronics team.' },
          { name: 'successBody', type: 'textarea', label: 'Success text' },
          { type: 'row', fields: [
            { name: 'resetLabel', type: 'text', required: true, label: 'Start-over button', defaultValue: 'Start over' },
            { name: 'nextLabel', type: 'text', label: 'Next button' },
            { name: 'nextHref', type: 'text', label: 'Next button link' },
          ] },
        ],
      },
      {
        label: 'Email notifications',
        description: 'Only admins can change these. Sending needs the SMTP settings on the server (see the README).',
        fields: [
          {
            name: 'notifications',
            type: 'group',
            label: false,
            // Receiver addresses are not public, and only admins may redirect where inquiries go.
            access: { read: isLoggedInField, update: isAdminField },
            fields: [
              { type: 'collapsible', label: 'Email to the team', fields: [
                { name: 'adminEnabled', type: 'checkbox', label: 'Email the team about each new inquiry', defaultValue: true },
                {
                  name: 'recipients',
                  type: 'array',
                  label: 'Send to',
                  maxRows: 10,
                  labels: { singular: 'Recipient', plural: 'Recipients' },
                  admin: { description: 'If empty, the INQUIRY_RECEIVER_EMAIL server setting is used.' },
                  fields: [{ name: 'email', type: 'email', required: true }],
                },
                { name: 'adminSubject', type: 'text', required: true, label: 'Subject', defaultValue: 'New business inquiry from {name}, {company}', admin: { description: 'You can use {name}, {email}, {company} and {industry}.' } },
                { name: 'replyToSender', type: 'checkbox', label: 'Replying to the email answers the person who sent the inquiry', defaultValue: true },
              ] },
              { type: 'collapsible', label: 'Confirmation to the sender', fields: [
                { name: 'confirmationEnabled', type: 'checkbox', label: 'Send a confirmation to the person who sent the inquiry', defaultValue: true },
                { name: 'confirmationSubject', type: 'text', required: true, label: 'Subject', defaultValue: 'We received your inquiry', admin: { description: 'You can use {name}, {firstName}, {company} and {industry}.' } },
                { name: 'confirmationHeading', type: 'text', required: true, label: 'Heading', defaultValue: 'Thank you, {firstName}.' },
                {
                  name: 'confirmationBody',
                  type: 'textarea',
                  required: true,
                  label: 'Text',
                  defaultValue: "Your inquiry has reached the Tamtronics team. We'll reply to {email} as soon as we can.\n\nThere's nothing else you need to do. If you'd like to add something, reply to this email.",
                  admin: { description: 'Leave a blank line between paragraphs. Same {tokens} as the subject, plus {email}.' },
                },
                { type: 'row', fields: [
                  { name: 'includeSummary', type: 'checkbox', label: 'Include a copy of what they sent', defaultValue: true },
                  { name: 'summaryTitle', type: 'text', label: 'Heading for that copy', defaultValue: 'What you sent' },
                ] },
                { name: 'contactDetails', type: 'textarea', label: 'Contact details', admin: { description: 'Phone, address or an email people can write to. Optional.' } },
                { name: 'signOff', type: 'textarea', label: 'Sign-off', defaultValue: 'The Tamtronics team' },
                { name: 'buttonLabel', type: 'text', label: 'Website button', defaultValue: 'Visit our website', admin: { description: 'Links to the address in Site Settings. Leave empty for no button.' } },
              ] },
              {
                name: 'timeZone',
                type: 'text',
                label: 'Time zone for dates in emails',
                defaultValue: 'UTC',
                admin: { description: 'For example UTC, America/New_York or Asia/Kolkata.' },
                validate: (v: unknown) => {
                  try {
                    new Intl.DateTimeFormat('en', { timeZone: String(v || 'UTC') })
                    return true
                  } catch {
                    return 'Not a time zone name. Try UTC or America/New_York.'
                  }
                },
              },
            ],
          },
        ],
      },
    ] },
  ],
}
