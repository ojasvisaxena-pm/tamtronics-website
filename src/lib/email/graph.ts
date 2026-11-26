import type { Payload } from 'payload'

import { graph, graphConfigured } from './config'

/** What the inquiry emails need; also a valid payload.sendEmail() argument for the SMTP path. */
export type InquiryMail = {
  to: string[]
  subject: string
  html: string
  text: string
  replyTo?: { name: string; address: string }
}

// Errors carry code/responseCode like nodemailer's, so inquiryEmails.ts reports both the same way.
const mailError = (message: string, code: string, responseCode?: number) =>
  Object.assign(new Error(message), { code, responseCode })

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
async function sendWithGraph(mail: InquiryMail) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(graph.sender)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: mail.subject,
        body: { contentType: 'HTML', content: mail.html },
        toRecipients: mail.to.map((address) => ({ emailAddress: { address } })),
        ...(mail.replyTo ? { replyTo: [{ emailAddress: { name: mail.replyTo.name, address: mail.replyTo.address } }] } : {}),
      },
      saveToSentItems: true,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  if (res.status === 202) return
  if (res.status === 401) cachedToken = null
  const data = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } }
  throw mailError(`Microsoft 365 did not send the email: ${data.error?.message || res.statusText}`, data.error?.code || 'GRAPH_SEND', res.status)
}

/** Inquiry emails go through Microsoft 365 when MS_GRAPH_* is set, otherwise through Payload's SMTP transport. */
export const sendInquiryMail = (payload: Payload, mail: InquiryMail) =>
  graphConfigured ? sendWithGraph(mail) : payload.sendEmail(mail)
