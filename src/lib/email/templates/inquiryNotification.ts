import { escapeHtml } from '../format'
import { button, detailsTable, layout, quote, text } from './layout'

export type EmailRow = { label: string; value: string }

type Props = {
  siteName: string
  siteUrl?: string
  submittedAt: string
  rows: EmailRow[]
  message: EmailRow
  senderName: string
  senderEmail: string
  adminUrl?: string
}

/** Email 1: tells the team a new inquiry arrived, with everything that was sent. */
export function inquiryNotification(p: Props) {
  const body = `
    <p style="${text.eyebrow}">&#9679; New business inquiry</p>
    <h1 style="${text.h1}">${escapeHtml(p.senderName)} sent an inquiry</h1>
    ${detailsTable([...p.rows, { label: 'Submitted', value: p.submittedAt }])}
    <p style="${text.eyebrow}">${escapeHtml(p.message.label)}</p>
    ${quote(p.message.value)}
    ${button(`mailto:${p.senderEmail}`, `Reply to ${p.senderName}`)}
    ${p.adminUrl ? `<p style="${text.muted}"><a href="${escapeHtml(p.adminUrl)}" style="color:#3d5700;">Open this submission in the admin</a> to update its status.</p>` : ''}`

  const plain = [
    'New business inquiry',
    '',
    ...p.rows.map((r) => `${r.label}: ${r.value || '-'}`),
    `Submitted: ${p.submittedAt}`,
    '',
    `${p.message.label}:`,
    p.message.value,
    '',
    p.adminUrl ? `Open in the admin: ${p.adminUrl}` : '',
  ].join('\n')

  return {
    html: layout({
      title: 'New business inquiry',
      preheader: `${p.senderName}: ${p.message.value.slice(0, 90)}`,
      siteName: p.siteName,
      siteUrl: p.siteUrl,
      body,
    }),
    text: plain.trim(),
  }
}
