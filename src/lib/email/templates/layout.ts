import { escapeHtml } from '../format'

/** The site's palette (main.css), inlined because email clients ignore stylesheets. */
export const theme = {
  ink: '#090d16',
  paper: '#f4f2ed',
  white: '#ffffff',
  text: '#10141d',
  muted: '#525a68',
  line: '#e2dfd7',
  signal: '#c8f25c',
  signalDeep: '#3d5700',
  font: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
}

export const text = {
  p: `margin:0 0 16px;font-family:${theme.font};font-size:16px;line-height:1.6;color:${theme.text};`,
  muted: `margin:0 0 16px;font-family:${theme.font};font-size:14px;line-height:1.6;color:${theme.muted};`,
  eyebrow: `margin:0 0 12px;font-family:${theme.mono};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${theme.signalDeep};`,
  h1: `margin:0 0 16px;font-family:${theme.font};font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:${theme.text};`,
}

/** A label/value table. Values are escaped here; pass plain text. */
export const detailsTable = (rows: { label: string; value: string }[]) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px;">
    ${rows
      .map(
        (r) => `<tr>
      <td class="stack" valign="top" style="padding:12px 16px 12px 0;border-top:1px solid ${theme.line};width:34%;font-family:${theme.mono};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${theme.muted};">${escapeHtml(r.label)}</td>
      <td class="stack" valign="top" style="padding:12px 0;border-top:1px solid ${theme.line};font-family:${theme.font};font-size:15px;line-height:1.55;color:${theme.text};word-break:break-word;">${escapeHtml(r.value || '—').replace(/\n/g, '<br>')}</td>
    </tr>`,
      )
      .join('')}
  </table>`

/** A quoted block for longer text such as the visitor's message. */
export const quote = (value: string) =>
  `<div style="margin:0 0 24px;padding:16px 18px;border-left:3px solid ${theme.signal};background:${theme.paper};border-radius:0 8px 8px 0;font-family:${theme.font};font-size:15px;line-height:1.6;color:${theme.text};word-break:break-word;">${escapeHtml(value).replace(/\n/g, '<br>')}</div>`

export const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr>
    <td style="border-radius:999px;background:${theme.ink};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 24px;font-family:${theme.font};font-size:15px;font-weight:600;color:${theme.white};text-decoration:none;border-radius:999px;">${escapeHtml(label)} &rarr;</a>
    </td>
  </tr></table>`

type Layout = {
  title: string
  preheader: string
  siteName: string
  siteUrl?: string
  body: string
}

/** Header bar with the wordmark, a white card on paper, and a small footer. */
export function layout({ title, preheader, siteName, siteUrl, body }: Layout) {
  const name = escapeHtml(siteName)
  const site = siteUrl
    ? ` · <a href="${escapeHtml(siteUrl)}" style="color:${theme.muted};text-decoration:underline;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
<style>
  @media only screen and (max-width: 620px) {
    .card { padding: 28px 22px !important; }
    .outer { padding: 0 12px !important; }
    .stack { display: block !important; width: 100% !important; padding-right: 0 !important; }
    .stack + .stack { border-top: 0 !important; padding-top: 0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${theme.paper};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.paper};">
    <tr><td class="outer" align="center" style="padding:0 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:32px 0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.ink};border-radius:14px 14px 0 0;">
            <tr><td style="padding:22px 32px;font-family:${theme.font};font-size:20px;font-weight:600;letter-spacing:-0.01em;color:${theme.white};">
              <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${theme.signal};margin-right:10px;vertical-align:middle;"></span>${name}
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.white};border-radius:0 0 14px 14px;border:1px solid ${theme.line};border-top:0;">
            <tr><td class="card" style="padding:36px 32px;">${body}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 4px 40px;font-family:${theme.font};font-size:12px;line-height:1.6;color:${theme.muted};">${name}${site}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
