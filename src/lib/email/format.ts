/** Helpers for building emails from visitor input without letting it break out of its place. */

export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** One line, no control characters: safe for a subject or display name (no header injection). */
export const headerSafe = (value: unknown, max = 200) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

/** A single address with nothing around it, so it can't carry extra headers or recipients. */
export const isPlainEmail = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/.test(value)

/** Replaces {name}, {company} and so on. Unknown tokens are left as typed. */
export const fillTokens = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? values[key] : match))

/** Escaped text with line breaks kept, for paragraphs editors type in a textarea. */
export const paragraphs = (text: string, style: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
