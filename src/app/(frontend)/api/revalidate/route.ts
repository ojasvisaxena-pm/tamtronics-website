import { createHash, timingSafeEqual } from 'node:crypto'

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getCms } from '@/lib/cms'
import { revalidateAll } from '@/lib/revalidate'

/**
 * Clears the website's page cache on demand. CMS edits do this automatically (src/lib/revalidate.ts);
 * this is for changes made outside the admin, such as seed or migration scripts, or a database
 * restore, run against a deployed database.
 *
 * Accepted from a signed-in CMS user, or with `Authorization: Bearer <REVALIDATE_SECRET>` when that
 * secret is set. POST only.
 *
 *   curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" https://<site>/api/revalidate
 */
export const dynamic = 'force-dynamic'

const digest = (value: string) => createHash('sha256').update(value).digest()

// Hashing first gives equal-length buffers, so the comparison takes the same time whatever is sent.
const hasValidSecret = (authorization: string | null) => {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || !authorization?.startsWith('Bearer ')) return false
  return timingSafeEqual(digest(authorization.slice('Bearer '.length)), digest(secret))
}

export async function POST() {
  try {
    const requestHeaders = await headers()
    const payload = await getCms()

    let by = hasValidSecret(requestHeaders.get('authorization')) ? 'secret' : ''
    if (!by) {
      // Cookie sign-in only counts from this site's own origin (Payload's csrf setting).
      const { user } = await payload.auth({ headers: requestHeaders })
      if (user) by = `user ${user.id}`
    }
    if (!by) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    if (!revalidateAll({ payload }, `manual request by ${by}`)) {
      return NextResponse.json({ ok: false, error: 'Cache could not be cleared. See the server log.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, revalidated: '/', at: new Date().toISOString() })
  } catch (err) {
    console.error('POST /api/revalidate failed', err)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
