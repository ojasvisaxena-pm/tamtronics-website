import type { Page } from '@playwright/test'

export const ORIGINAL = process.env.ORIGINAL_URL || 'http://localhost:8099'

export const PAGES = [
  { name: 'home', original: '/index.html', migrated: '/' },
  { name: 'platform', original: '/platform.html', migrated: '/platform' },
  { name: 'first-implementation', original: '/first-implementation.html', migrated: '/first-implementation' },
  { name: 'industries', original: '/industries.html', migrated: '/industries' },
  { name: 'about', original: '/about.html', migrated: '/about' },
  { name: 'contact', original: '/contact.html', migrated: '/contact' },
]

export const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'tablet', width: 820, height: 1100 },
  { label: 'mobile', width: 390, height: 844 },
]

/** Brings a page to a stable, fully revealed state so two renders can be compared. */
export async function settle(page: Page) {
  await page.addStyleTag({
    content: `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
      .site-header{position:absolute!important}`,
  })
  await page.evaluate(async () => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'))
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager'
    })
    document.querySelectorAll<SVGSVGElement>('svg[data-animated]').forEach((svg) => {
      svg.pauseAnimations?.()
      svg.setCurrentTime?.(0)
    })
    await document.fonts.ready
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 40))
    }
    window.scrollTo(0, 0)
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? img.decode().catch(() => null) : new Promise((r) => { img.onload = img.onerror = r }).then(() => img.decode().catch(() => null)),
      ),
    )
  })
  await page.waitForTimeout(200)
}

/** All text in <main>, including hidden tab panels, with whitespace normalised. */
export const mainText = (page: Page) =>
  page.evaluate(() => {
    const main = document.querySelector('main')!.cloneNode(true) as HTMLElement
    main.querySelectorAll('script,style').forEach((n) => n.remove())
    return (main.textContent || '').replace(/\s+/g, ' ').trim()
  })
