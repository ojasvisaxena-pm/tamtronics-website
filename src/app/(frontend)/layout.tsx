import './styles/main.css'

import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { draftMode } from 'next/headers'
import Script from 'next/script'
import type { ReactNode } from 'react'

import { SiteEffects } from '@/components/SiteEffects'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { getFooter, getHeader, getSettings } from '@/lib/cms'
import type { Media } from '@/payload-types'

const geist = Geist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono' })
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-instrument-serif' })

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSettings()
  return { themeColor: settings.themeColor || '#090d16' }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const favicon = settings.favicon as Media | null | undefined
  return {
    metadataBase: new URL(settings.siteUrl),
    icons: { icon: favicon?.url || '/assets/img/favicon.svg' },
  }
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const [header, footer, settings, draft] = await Promise.all([getHeader(), getFooter(), getSettings(), draftMode()])

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint: the reveal-on-scroll styles only apply when JS is available. */}
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.classList.add("js");' }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader header={header} />
        <main id="main">{children}</main>
        <SiteFooter footer={footer} />
        <SiteEffects />
        {draft.isEnabled && (
          // A plain link on purpose: prefetching a <Link> would turn preview off by itself.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/preview/exit" className="chip" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 100, background: '#fff', color: '#10141d' }}>
            Viewing draft. Exit preview
          </a>
        )}
        {settings.gtmId && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtmId}');`}
          </Script>
        )}
      </body>
    </html>
  )
}
