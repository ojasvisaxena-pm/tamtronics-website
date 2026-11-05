'use client'

import { useAuth } from '@payloadcms/ui'
import { useState } from 'react'

/** Visible "Log out" entry for the admin sidebar. Payload's own icon-only logout stays in place. */
export default function LogoutButton() {
  const { logOut } = useAuth()
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    setBusy(true)
    try {
      await logOut()
    } finally {
      // Hard navigation so the next screen starts without the old session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- /admin is outside the frontend router
      window.location.assign('/admin/login')
    }
  }

  return (
    <div style={{ padding: 'calc(var(--base) * 0.5) 0 var(--base)' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          color: 'var(--theme-text)',
          cursor: busy ? 'default' : 'pointer',
          font: 'inherit',
          textAlign: 'left',
        }}
      >
        {busy ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  )
}
