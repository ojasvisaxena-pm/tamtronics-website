/**
 * Email settings, read from the environment only. Shared by payload.config.ts (the transport)
 * and the inquiry emails (to know whether anything will really be sent).
 */
const port = Number(process.env.SMTP_PORT) || 587

export const smtp = {
  host: process.env.SMTP_HOST || '',
  port,
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'no-reply@localhost',
  fromName: process.env.EMAIL_FROM_NAME || 'Tamtronics',
}

export const smtpConfigured = Boolean(smtp.host)

/**
 * Microsoft 365 (Microsoft Graph sendMail, app-only sign-in). When all four are set, every site email
 * (password resets and inquiry emails) is sent from the MS_GRAPH_SENDER_EMAIL mailbox through Graph,
 * and the SMTP settings are ignored. MS_GRAPH_CLIENT_SECRET is a secret: server-side only.
 */
export const graph = {
  tenantId: process.env.MS_GRAPH_TENANT_ID || '',
  clientId: process.env.MS_GRAPH_CLIENT_ID || '',
  clientSecret: process.env.MS_GRAPH_CLIENT_SECRET || '',
  sender: process.env.MS_GRAPH_SENDER_EMAIL || '',
}

export const graphConfigured = Boolean(graph.tenantId && graph.clientId && graph.clientSecret && graph.sender)

/** Microsoft 365 first, then SMTP. With neither, Payload only prints emails to the server log. */
export const emailConfigured = graphConfigured || smtpConfigured

/** Fallback receivers when the CMS lists none. Comma-separated. */
export const envReceivers = () =>
  (process.env.INQUIRY_RECEIVER_EMAIL || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
