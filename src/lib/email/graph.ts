import type { EmailAdapter, SendEmailOptions } from 'payload'

import { graph, smtp } from './config'

/**
 * Payload email adapter that sends through Microsoft 365 (Microsoft Graph sendMail, app-only sign-in).
 * payload.config.ts uses it instead of SMTP when MS_GRAPH_* is set, so every site email (password
 * resets and Business Inquiry Form emails) is sent from the MS_GRAPH_SENDER_EMAIL mailbox. The From
 * shown to recipients is that mailbox and its Microsoft 365 display name.
 */

type Address = { name?: string; address: string }
type GraphRecipient = { emailAddress: { name?: string; address: string } }

// Errors carry code/responseCode like nodemailer's, so inquiryEmails.ts reports both the same way.
const mailError = (message: string, code: string, responseCode?: number) =>
  Object.assign(new Error(message), { code, responseCode })

/** Accepts what nodemailer accepts for to/cc/bcc/replyTo: "a@b", "Name <a@b>", "a@b, c@d", objects, or a list. */
const recipients = (value: SendEmailOptions['to']): GraphRecipient[] => {
  if (!value) return []
  const items = (Array.isArray(value) ? value : [value]) as Array<string | Address>
  return items.flatMap((item) => {
    if (typeof item !== 'string') return item?.address ? [{ emailAddress: { name: item.name || undefined, address: item.address } }] : []
    return item
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const named = /^"?([^"<]*?)"?\s*<([^>]+)>$/.exec(part)
        return { emailAddress: named ? { name: named[1].trim() || undefined, address: named[2].trim() } : { address: part } }
      })
  })
}

const asText = (value: SendEmailOptions['html']) =>
  typeof value === 'string' ? value : Buffer.isBuffer(value) ? value.toString('utf8') : undefined

// App-only tokens last about an hour. Kept per server instance and renewed a minute before expiry.
let cachedToken: { value: string; expiresAt: number } | null = null

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(graph.tenantId)}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: graph.clientId,
      client_secret: graph.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
  if (!res.ok || !data.access_token) {
    // error_description names the problem (e.g. AADSTS7000215 invalid client secret), never the secret.
    throw mailError(`Microsoft 365 sign-in failed: ${(data.error_description || res.statusText).split('\n')[0]}`, data.error || 'GRAPH_AUTH', res.status)
  }
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cachedToken.value
}

/** Sends one email from the MS_GRAPH_SENDER_EMAIL mailbox. A copy is kept in its Sent Items. */
async function sendWithGraph(message: SendEmailOptions) {
  const to = recipients(message.to)
  const cc = recipients(message.cc)
  const bcc = recipients(message.bcc)
  const replyTo = recipients(message.replyTo)
  if (to.length + cc.length + bcc.length === 0) throw mailError('No recipients', 'EENVELOPE')
  if (message.attachments?.length) throw mailError('Attachments are not supported by the Microsoft 365 sender', 'EUNSUPPORTED')

  const html = asText(message.html)
  const text = asText(message.text)
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(graph.sender)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: message.subject ?? '',
        body: html !== undefined ? { contentType: 'HTML', content: html } : { contentType: 'Text', content: text ?? '' },
        toRecipients: to,
        ...(cc.length ? { ccRecipients: cc } : {}),
        ...(bcc.length ? { bccRecipients: bcc } : {}),
        ...(replyTo.length ? { replyTo } : {}),
      },
      saveToSentItems: true,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (res.status === 202) return { accepted: true }
  if (res.status === 401) cachedToken = null
  const data = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } }
  throw mailError(`Microsoft 365 did not send the email: ${data.error?.message || res.statusText}`, data.error?.code || 'GRAPH_SEND', res.status)
}

export const graphEmailAdapter: EmailAdapter = () => ({
  name: 'microsoft-graph',
  defaultFromAddress: graph.sender,
  defaultFromName: smtp.fromName,
  sendEmail: sendWithGraph,
})
