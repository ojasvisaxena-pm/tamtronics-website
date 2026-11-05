import { escapeHtml, paragraphs } from '../format'
import type { EmailRow } from './inquiryNotification'
import { button, detailsTable, layout, quote, text } from './layout'

type Props = {
  siteName: string
  siteUrl?: string
  heading: string
  body: string
  summaryTitle?: string
  rows?: EmailRow[]
  message?: EmailRow
  contactDetails?: string
  signOff?: string
  buttonLabel?: string
}

/** Email 2: thanks the visitor and confirms what they sent. All wording comes from the CMS. */
export function inquiryConfirmation(p: Props) {
  const summary = p.rows?.length
    ? `<p style="${text.eyebrow}margin-top:28px;">${escapeHtml(p.summaryTitle || 'What you sent')}</p>
       ${detailsTable(p.rows)}
       ${p.message ? `<p style="${text.eyebrow}">${escapeHtml(p.message.label)}</p>${quote(p.message.value)}` : ''}`
    : ''

  const body = `
    <p style="${text.eyebrow}">&#9679; Inquiry received</p>
    <h1 style="${text.h1}">${escapeHtml(p.heading)}</h1>
    ${paragraphs(p.body, text.p)}
    ${summary}
    ${p.contactDetails ? paragraphs(p.contactDetails, text.muted) : ''}
    ${p.signOff ? paragraphs(p.signOff, text.p) : ''}
    ${p.siteUrl && p.buttonLabel ? button(p.siteUrl, p.buttonLabel) : ''}`

  const plain = [
    p.heading,
    '',
    p.body,
    '',
    ...(p.rows?.length ? [p.summaryTitle || 'What you sent', ...p.rows.map((r) => `${r.label}: ${r.value || '-'}`), ''] : []),
    ...(p.rows?.length && p.message ? [`${p.message.label}:`, p.message.value, ''] : []),
    p.contactDetails ?? '',
    '',
    p.signOff ?? '',
    '',
    p.siteUrl ?? '',
  ].join('\n')

  return {
    html: layout({ title: p.heading, preheader: p.body.slice(0, 110), siteName: p.siteName, siteUrl: p.siteUrl, body }),
    text: plain.replace(/\n{3,}/g, '\n\n').trim(),
  }
}
