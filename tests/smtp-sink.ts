import net from 'node:net'

export type Mail = { from: string; to: string[]; raw: string; headers: string; subject: string; html: string; text: string }

const decodeQP = (s: string) =>
  s.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))

/** Splits a message into its decoded text and HTML parts. Enough for the mails the site sends. */
const parse = (raw: string) => {
  const [headers] = raw.split(/\r?\n\r?\n/)
  const unfolded = headers.replace(/\r?\n[ \t]+/g, ' ')
  const subject = /^Subject: (.*)$/m.exec(unfolded)?.[1] ?? ''
  const part = (type: string) => {
    const match = new RegExp(`Content-Type: ${type}[^]*?\\r?\\n\\r?\\n([^]*?)(?:\\r?\\n--|$)`, 'i').exec(raw)
    if (!match) return ''
    const block = raw.slice(0, match.index + match[0].length)
    const qp = /Content-Transfer-Encoding: quoted-printable/i.test(block.slice(block.lastIndexOf('Content-Type:')))
    const b64 = /Content-Transfer-Encoding: base64/i.test(block.slice(block.lastIndexOf('Content-Type:')))
    if (b64) return Buffer.from(match[1].replace(/\s+/g, ''), 'base64').toString('utf8')
    return qp ? decodeQP(match[1]) : match[1]
  }
  return { headers: unfolded, subject, html: part('text/html'), text: part('text/plain') }
}

/**
 * A minimal SMTP server that keeps what it receives. Set `failing` to make it refuse mail,
 * which is how the tests simulate an outage at the mail provider.
 */
export function startSink(port: number) {
  const mails: Mail[] = []
  const state = { failing: false }
  const server = net.createServer((sock) => {
    let data: string | null = null
    let from = ''
    let to: string[] = []
    let buffer = ''
    sock.on('error', () => {})
    sock.write('220 qa-sink ESMTP\r\n')
    sock.on('data', (chunk) => {
      buffer += chunk.toString('utf8')
      while (true) {
        if (data !== null) {
          const end = buffer.indexOf('\r\n.\r\n')
          if (end === -1) return
          const raw = data + buffer.slice(0, end)
          buffer = buffer.slice(end + 5)
          data = null
          mails.push({ from, to, raw, ...parse(raw.replace(/^\.\./gm, '.')) })
          sock.write('250 2.0.0 queued\r\n')
          continue
        }
        const nl = buffer.indexOf('\r\n')
        if (nl === -1) return
        const line = buffer.slice(0, nl)
        buffer = buffer.slice(nl + 2)
        const cmd = line.slice(0, 4).toUpperCase()
        if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250-qa-sink\r\n250 8BITMIME\r\n')
        else if (cmd === 'MAIL') {
          if (state.failing) sock.write('451 4.3.0 Mail server temporarily unavailable\r\n')
          else {
            from = /<([^>]*)>/.exec(line)?.[1] ?? ''
            to = []
            sock.write('250 OK\r\n')
          }
        } else if (cmd === 'RCPT') {
          to.push(/<([^>]*)>/.exec(line)?.[1] ?? '')
          sock.write('250 OK\r\n')
        } else if (cmd === 'DATA') {
          data = ''
          sock.write('354 End data with <CR><LF>.<CR><LF>\r\n')
        } else if (cmd === 'QUIT') {
          sock.write('221 bye\r\n')
          sock.end()
        } else sock.write('250 OK\r\n')
      }
    })
  })
  return new Promise<{ mails: Mail[]; state: typeof state; close: () => Promise<void> }>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () =>
      resolve({ mails, state, close: () => new Promise((r) => server.close(() => r())) }),
    )
  })
}
