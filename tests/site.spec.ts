import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { PAGES } from './helpers'

test.describe('every page', () => {
  for (const p of PAGES) {
    test(`loads cleanly: ${p.name}`, async ({ page }) => {
      const problems: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error') problems.push(m.text())
      })
      page.on('pageerror', (e) => problems.push(e.message))
      page.on('response', (r) => {
        if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`)
      })
      const response = await page.goto(p.migrated, { waitUntil: 'networkidle' })
      expect(response?.status()).toBe(200)
      const broken = await page.evaluate(async () => {
        document.querySelectorAll('img').forEach((img) => { img.loading = 'eager' })
        await new Promise((r) => setTimeout(r, 1500))
        return Array.from(document.images).filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src)
      })
      expect(broken).toEqual([])
      expect(problems).toEqual([])
    })

    test(`no horizontal overflow: ${p.name}`, async ({ browser }) => {
      for (const width of [1440, 820, 390]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } })
        const pg = await ctx.newPage()
        await pg.goto(p.migrated)
        const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `at ${width}px`).toBeLessThanOrEqual(0)
        await ctx.close()
      }
    })

    test(`no serious accessibility violations: ${p.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(p.migrated, { waitUntil: 'networkidle' })
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(' | ')}`)).toEqual([])
    })
  }

  test('every internal link and anchor resolves', async ({ page, request }) => {
    const seen = new Set<string>()
    for (const p of PAGES) {
      await page.goto(p.migrated)
      const links = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href))
      for (const link of links) {
        const url = new URL(link)
        if (url.origin !== new URL(page.url()).origin) continue
        const key = url.pathname + url.search + url.hash
        if (seen.has(key)) continue
        seen.add(key)
        const response = await request.get(url.pathname + url.search)
        expect(response.status(), key).toBe(200)
        if (url.hash) {
          await page.goto(url.pathname + url.search)
          expect(await page.locator(url.hash).count(), key).toBe(1)
          await page.goto(p.migrated)
        }
      }
    }
    expect(seen.size).toBeGreaterThan(8)
  })
})

test.describe('URLs and search', () => {
  test('original URLs behave', async ({ request }) => {
    const index = await request.get('/index.html', { maxRedirects: 0 })
    expect(index.status()).toBe(308)
    expect(index.headers().location).toBe('/')
    for (const [old, now] of [['/about.html', '/about'], ['/platform.html', '/platform'], ['/contact.html?industry=dme', '/contact?industry=dme'], ['/home', '/']]) {
      const res = await request.get(old, { maxRedirects: 0 })
      expect(res.status(), old).toBe(308)
      expect(res.headers().location, old).toBe(now)
    }
    expect((await request.get('/about')).status()).toBe(200)
    expect((await request.get('/assets/img/og-image.png')).status()).toBe(200)
    expect((await request.get('/does-not-exist')).status()).toBe(404)
    expect((await request.get('/a/b/c')).status()).toBe(404)
  })

  test('sitemap lists every page, robots points to it', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const path of ['https://tamtronics.com/<', 'https://tamtronics.com/platform<', 'https://tamtronics.com/first-implementation<', 'https://tamtronics.com/industries<', 'https://tamtronics.com/about<', 'https://tamtronics.com/contact<']) {
      expect(sitemap).toContain(path)
    }
    expect(sitemap).not.toContain('.html')
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Sitemap: https://tamtronics.com/sitemap.xml')
    expect(robots).toContain('Disallow: /admin')
  })

  test('home has corrected Organization JSON-LD', async ({ page }) => {
    await page.goto('/')
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').first().textContent())!)
    expect(data['@type']).toBe('Organization')
    expect(data.url).toBe('https://tamtronics.com/')
  })
})

test.describe('interactions', () => {
  test('header turns solid on scroll, and navigation links work', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('.site-header')).not.toHaveClass(/is-scrolled/)
    await page.evaluate(() => window.scrollTo(0, 400))
    await expect(page.locator('.site-header')).toHaveClass(/is-scrolled/)
    await page.locator('.nav__links a', { hasText: 'Platform' }).click()
    await expect(page).toHaveURL(/\/platform$/)
    await expect(page.locator('.nav__links a', { hasText: 'Platform' })).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('h1')).toContainText('Four layers')
  })

  test('mobile menu opens, focuses, closes on Escape and on link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.locator('.nav__toggle')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#mobile-menu')).toHaveClass(/is-open/)
    await expect(page.locator('#mobile-menu a').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
    await toggle.click()
    await page.locator('#mobile-menu a', { hasText: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('skip link is the first tab stop', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.locator('.skip-link')).toBeFocused()
  })

  test('scroll reveal works after client-side navigation', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav__links a', { hasText: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    const card = page.locator('.card').first()
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveClass(/is-in/)
  })

  test('architecture tabs: click, arrow keys, diagram plates, Enter', async ({ page }) => {
    await page.goto('/platform')
    const arch = page.locator('[data-arch]')
    await arch.scrollIntoViewIfNeeded()
    await expect(arch).toHaveAttribute('data-active', /.+/)
    await page.locator('.arch__tab[data-layer="application"]').click()
    await expect(arch).toHaveAttribute('data-active', 'application')
    await expect(page.locator('[id$="panel-application"]')).toBeVisible()
    await expect(page.locator('[id$="panel-equipment"]')).toBeHidden()
    await expect(page.locator('.arch-plate[data-layer="application"]')).toHaveClass(/is-active/)
    await page.keyboard.press('ArrowDown')
    await expect(arch).toHaveAttribute('data-active', 'data')
    await expect(page.locator('.arch__tab[data-layer="data"]')).toBeFocused()
    await page.locator('.arch-plate[data-layer="equipment"]').click()
    await expect(arch).toHaveAttribute('data-active', 'equipment')
    await page.locator('.arch-plate[data-layer="connectivity"]').focus()
    await page.keyboard.press('Enter')
    await expect(arch).toHaveAttribute('data-active', 'connectivity')
  })

  test('architecture cycles by itself until touched', async ({ page }) => {
    await page.goto('/platform')
    const arch = page.locator('[data-arch]')
    await arch.scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    const start = await arch.getAttribute('data-active')
    await expect.poll(() => arch.getAttribute('data-active'), { timeout: 8000 }).not.toBe(start)
  })

  test('walkthrough: autoplay, tabs, previous, next, pause, status text', async ({ page }) => {
    await page.goto('/first-implementation')
    const walk = page.locator('[data-walk]')
    await walk.scrollIntoViewIfNeeded()
    await expect(walk).toHaveClass(/is-playing/)
    const play = walk.locator('.icon-btn').first()
    await expect(play).toHaveAttribute('aria-label', 'Pause walkthrough')
    await walk.getByRole('tab', { name: /The app/ }).click()
    await expect(walk).not.toHaveClass(/is-playing/)
    await expect(walk.getByText('Stage 3 of 4')).toBeVisible()
    await expect(walk.getByRole('heading', { name: /Tamtronics Connect app/ })).toBeVisible()
    await walk.getByRole('button', { name: 'Next stage' }).click()
    await expect(walk.getByText('Stage 4 of 4')).toBeVisible()
    await expect(walk.getByRole('button', { name: 'Next stage' })).toBeDisabled()
    await walk.getByRole('button', { name: 'Previous stage' }).click()
    await expect(walk.getByText('Stage 3 of 4')).toBeVisible()
    await play.click()
    await expect(walk).toHaveClass(/is-playing/)
    await expect(walk.getByText('Stage 4 of 4')).toBeVisible({ timeout: 9000 })
  })

  test('industries sub-nav highlights the current section; home tiles deep-link', async ({ page }) => {
    await page.goto('/industries')
    await page.locator('#manufacturers').scrollIntoViewIfNeeded()
    await page.evaluate(() => document.getElementById('manufacturers')!.scrollIntoView({ block: 'center' }))
    await expect(page.locator('.ind-nav a[href="#manufacturers"]')).toHaveClass(/is-active/)
    await page.goto('/')
    await page.locator('a.tile[href="/industries#rental"]').click()
    await expect(page).toHaveURL(/\/industries#rental$/)
  })

  test('reduced motion: everything visible, no autoplay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/first-implementation')
    await expect(page.locator('[data-walk]')).not.toHaveClass(/is-playing/)
    await expect(page.locator('[data-walk] [aria-label*="walkthrough"]')).toBeHidden()
    const hidden = await page.$$eval('[data-reveal]', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length)
    expect(hidden).toBe(0)
  })

  test('usage chart output is correct', async ({ page }) => {
    await page.goto('/')
    const session = page.locator('.usage__sess').first()
    await expect(session).toHaveAttribute('aria-label', 'Unit 1 · session 1: 8:10 AM – 8:35 AM (25 min)')
    await expect(session.locator('.usage__block')).toHaveAttribute('x', '72.2')
    await expect(session.locator('.usage__block')).toHaveAttribute('width', '13.9')
    await expect(page.locator('.usage__foot')).toContainText('16 sessions today across 3 active units')
    await expect(page.locator('.usage__row--idle')).toHaveCount(1)
  })
})
