import config from '@payload-config'
import { draftMode, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/** Opened by the Preview button in the admin. Only signed-in users can turn draft viewing on. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return new NextResponse('Sign in to preview drafts.', { status: 401 })

  const path = url.searchParams.get('path') ?? '/'
  // Only ever redirect within this site.
  if (!path.startsWith('/') || path.startsWith('//')) return new NextResponse('Invalid path', { status: 400 })

  ;(await draftMode()).enable()
  return new NextResponse(null, { status: 307, headers: { Location: path } })
}
