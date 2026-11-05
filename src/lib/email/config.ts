/**
 * SMTP settings, read from the environment only. Shared by payload.config.ts (the transport)
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

/** Without SMTP_HOST, Payload only prints emails to the server log. */
export const emailConfigured = Boolean(smtp.host)

/** Fallback receivers when the CMS lists none. Comma-separated. */
export const envReceivers = () =>
  (process.env.INQUIRY_RECEIVER_EMAIL || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
