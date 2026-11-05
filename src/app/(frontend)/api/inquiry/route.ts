import { after, NextResponse } from 'next/server'

import { sendInquiryEmails } from '@/lib/email/inquiryEmails'
import { getCms } from '@/lib/cms'
import { buildInquirySchema, publicFormConfig } from '@/lib/inquiry'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

// Per-process, so it resets on restart and is per-instance when scaled. Enough for form abuse on one server.
const isRateLimited = (ip: string) => {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

const fail = (error: string, status: number, extra?: object) => NextResponse.json({ ok: false, error, ...extra }, { status })

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (origin && host && new URL(origin).host !== host) return fail('Forbidden', 403)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) return fail('Too many requests', 429)

  const raw = await request.text()
  if (raw.length > 16000) return fail('Too large', 413)

  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return fail('Invalid request', 400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Invalid request', 400)

  // Bots fill the hidden field; let them believe it worked.
  if (body.website) return NextResponse.json({ ok: true })

  try {
    const payload = await getCms()
    const form = await payload.findGlobal({ slug: 'inquiryForm', depth: 0 })
    const parsed = buildInquirySchema(publicFormConfig(form)).safeParse(body)
    if (!parsed.success) {
      const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]))
      return fail('Invalid fields', 422, { fields })
    }

    const email = parsed.data.email.toLowerCase()
    // The same message from the same address within the window is a resend: keep one, email once.
    const duplicate = await payload.count({
      collection: 'form-submissions',
      where: {
        and: [
          { email: { equals: email } },
          { message: { equals: parsed.data.message } },
          { createdAt: { greater_than: new Date(Date.now() - WINDOW_MS).toISOString() } },
        ],
      },
    })
    if (duplicate.totalDocs === 0) {
      const doc = await payload.create({
        collection: 'form-submissions',
        data: { ...parsed.data, email, status: 'new', teamEmail: 'pending', confirmationEmail: 'pending' },
      })
      // The submission is saved; email runs after the reply, so a slow or failing mail server never loses it.
      after(() => sendInquiryEmails(payload, String(doc.id)))
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Could not store inquiry:', error instanceof Error ? error.message : error)
    return fail('Could not send', 500)
  }
}
