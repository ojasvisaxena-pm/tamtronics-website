import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

import { mainText, ORIGINAL, PAGES, settle, VIEWPORTS } from './helpers'

const OUT = path.resolve('test-results/visual')
fs.mkdirSync(OUT, { recursive: true })

// The only wording allowed to differ: the form used to be a demo, and now really sends.
const DEMO_COPY = [
  'Preview site: this form is a demonstration. It checks your entries but does not send or store anything yet.',
  'Your inquiry is complete and ready to send.',
  'Demonstration only. Nothing has been sent or saved. On the live site, this is where your inquiry would be submitted to the Tamtronics team.',
  'Review inquiry',
  'Some fields need attention',
]
const NEW_COPY = ['Send inquiry', 'Thank you. Your inquiry has been sent to the Tamtronics team.', 'Website', '0 fields need attention', 'We could not send your inquiry. Please try again in a moment.']

// Whitespace between tags differs between hand-written HTML and React output; the words must not.
const normalise = (text: string, strip: string[]) => strip.reduce((t, s) => t.split(s).join(' '), text).replace(/\s+/g, '')

for (const p of PAGES) {
  test(`text matches the original: ${p.name}`, async ({ page, browser }) => {
    await page.goto(p.migrated)
    const migrated = normalise(await mainText(page), NEW_COPY)
    const originalPage = await browser.newPage()
    await originalPage.goto(ORIGINAL + p.original)
    const original = normalise(await mainText(originalPage), DEMO_COPY)
    await originalPage.close()
    expect(migrated).toBe(original)
  })

  test(`metadata matches the original: ${p.name}`, async ({ page, browser }) => {
    const grab = async (pg: typeof page) =>
      pg.evaluate(() => {
        const content = (sel: string) => document.querySelector(sel)?.getAttribute('content') ?? null
        return {
          title: document.title,
          description: content('meta[name="description"]'),
          ogTitle: content('meta[property="og:title"]'),
          ogDescription: content('meta[property="og:description"]'),
          ogType: content('meta[property="og:type"]'),
          ogSite: content('meta[property="og:site_name"]'),
          twitter: content('meta[name="twitter:card"]'),
          theme: content('meta[name="theme-color"]'),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href')?.replace(/\/$/, '') ?? null,
          ogUrl: content('meta[property="og:url"]')?.replace(/\/$/, ''),
          h1: document.querySelector('h1')?.textContent?.trim(),
          headings: Array.from(document.querySelectorAll('main h1, main h2, main h3')).map((h) => `${h.tagName}:${h.textContent?.trim()}`),
        }
      })
    await page.goto(p.migrated)
    const migrated = await grab(page)
    const originalPage = await browser.newPage()
    await originalPage.goto(ORIGINAL + p.original)
    const originalRaw = await grab(originalPage)
    const clean = (u?: string | null) => u?.replace(/\.html$/, '') ?? null
    const original = { ...originalRaw, canonical: clean(originalRaw.canonical), ogUrl: clean(originalRaw.ogUrl) }
    await originalPage.close()

    // The site moved from /about.html to /about, so compare the original's addresses without .html.
    const stripCopy = (list: string[]) => list.filter((h) => !DEMO_COPY.some((d) => h.includes(d)) && !NEW_COPY.some((d) => h.includes(d)))
    expect({ ...migrated, headings: stripCopy(migrated.headings) }).toEqual({ ...original, headings: stripCopy(original.headings) })
  })

  for (const vp of VIEWPORTS) {
    test(`pixels match the original: ${p.name} @${vp.label}`, async ({ browser }) => {
      const shot = async (url: string, tag: string) => {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 })
        const pg = await ctx.newPage()
        await pg.goto(url, { waitUntil: 'load' })
        await settle(pg)
        const file = path.join(OUT, `${p.name}-${vp.label}-${tag}.png`)
        const buffer = await pg.screenshot({ fullPage: true, path: file })
        await ctx.close()
        return PNG.sync.read(buffer)
      }
      const a = await shot(ORIGINAL + p.original, 'original')
      const b = await shot(process.env.BASE_URL ? process.env.BASE_URL + p.migrated : `http://localhost:3100${p.migrated}`, 'migrated')

      const heightDelta = Math.abs(a.height - b.height)
      const width = Math.min(a.width, b.width)
      const height = Math.min(a.height, b.height)
      const crop = (img: PNG) => {
        const out = new PNG({ width, height })
        PNG.bitblt(img, out, 0, 0, width, height, 0, 0)
        return out
      }
      const diff = new PNG({ width, height })
      const changed = pixelmatch(crop(a).data, crop(b).data, diff.data, width, height, { threshold: 0.2 })
      fs.writeFileSync(path.join(OUT, `${p.name}-${vp.label}-diff.png`), PNG.sync.write(diff))
      const ratio = changed / (width * height)
      test.info().annotations.push({ type: 'visual', description: `${(ratio * 100).toFixed(3)}% pixels differ, height delta ${heightDelta}px` })
      console.log(`[visual] ${p.name} @${vp.label}: ${(ratio * 100).toFixed(3)}% differ, height ${a.height} vs ${b.height}`)

      // The contact form's demo notice was removed on purpose, so that page may be slightly shorter.
      const heightAllowance = p.name === 'contact' ? 160 : 2
      expect(heightDelta).toBeLessThanOrEqual(heightAllowance)
      if (p.name !== 'contact') expect(ratio).toBeLessThan(0.01)
    })
  }
}
