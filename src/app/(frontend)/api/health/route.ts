import { NextResponse } from 'next/server'

import { getCms } from '@/lib/cms'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getCms()
    await payload.count({ collection: 'users', overrideAccess: true })
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503 })
  }
}
