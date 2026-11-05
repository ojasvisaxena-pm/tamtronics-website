import { type APIRequestContext, expect, type Page, request, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

import { startSink } from './smtp-sink'

type Sink = Awaited<ReturnType<typeof startSink>>
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100'

/**
 * Exercises the real form and CMS, so it writes data. Run only against a throwaway database:
 * it refuses to start unless QA_DATABASE is set, and the QA user comes from the environment.
 */
const EMAIL = process.env.QA_ADMIN_EMAIL
const PASSWORD = process.env.QA_ADMIN_PASSWORD

test.skip(!process.env.QA_DATABASE || !EMAIL || !PASSWORD, 'Needs QA_DATABASE, QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD')
test.describe.configure({ mode: 'serial' })

const api = (page: Page) => page.request

async function login(page: Page) {
  const response = await api(page).post('/api/users/login', { data: { email: EMAIL, password: PASSWORD } })
  expect(response.status()).toBe(200)
  // Payload only trusts session cookies from a browser origin, so API calls here use the token.
  const { token } = await response.json()
  await page.context().setExtraHTTPHeaders({ Authorization: `JWT ${token}` })
}

const unique = Date.now()

test.describe('inquiry form', () => {
  test('shows inline errors and a summary, and blocks sending', async ({ page }) => {
    await page.goto('/contact')
    await page.getByRole('button', { name: 'Send inquiry' }).click()
    await expect(page.locator('.form__summary')).toBeVisible()
    await expect(page.locator('.form__summary strong')).toHaveText('5 fields need attention')
    await expect(page.locator('.form__summary')).toBeFocused()
    await expect(page.locator('#f-name-error')).toHaveText('Please enter your full name.')
    await page.locator('.form__summary a', { hasText: 'Company' }).click()
    await expect(page.locator('#f-company')).toBeFocused()
  })

  test('warns on free-mail addresses and counts characters', async ({ page }) => {
    await page.goto('/contact')
    await page.locator('#f-email').fill('someone@gmail.com')
    await page.locator('#f-email').blur()
    await expect(page.locator('#f-email-error')).toContainText('work email')
    await page.locator('#f-message').fill('hello')
    await expect(page.locator('.field__count')).toHaveText('5 / 1200')
  })

  test('?industry= preselects the dropdown', async ({ page }) => {
    await page.goto('/contact?industry=manufacturer')
    await expect(page.locator('#f-industry')).toHaveValue('Equipment manufacturer')
  })

  test('a valid submission is stored once, and can be reset', async ({ page }) => {
    await page.goto('/contact')
    const email = `qa-${unique}@example-company.com`
    await page.locator('#f-name').fill('QA Person')
    await page.locator('#f-email').fill(email)
    await page.locator('#f-company').fill('Example Company')
    await page.locator('#f-industry').selectOption({ label: 'Other' })
    await page.locator('#f-message').fill('We rent out pumps and would like to see how they are used.')
    await page.getByRole('button', { name: 'Send inquiry' }).click()
    await expect(page.locator('#inquiry-success')).toBeVisible()
    await expect(page.locator('#inquiry-success h2')).toBeFocused()
    await expect(page.locator('.summary-list')).toContainText(email)
    await page.getByRole('button', { name: 'Start over' }).click()
    await expect(page.locator('#inquiry-form')).toBeVisible()
    await expect(page.locator('#f-name')).toHaveValue('')
    await expect(page.locator('#f-name')).toBeFocused()

    await login(page)
    const stored = await (await api(page).get(`/api/form-submissions?where[email][equals]=${encodeURIComponent(email)}`)).json()
    expect(stored.totalDocs).toBe(1)
    expect(stored.docs[0].status).toBe('new')
  })

  test('server rejects bad data, duplicates, bots and other origins', async ({ request }) => {
    const headers = { 'x-forwarded-for': `10.0.0.${unique % 250}` }
    const good = { name: 'Dup Person', email: `dup-${unique}@example-company.com`, company: 'Example', industry: 'Other', message: 'A message that is long enough to pass the check.' }
    const bad = await request.post('/api/inquiry', { data: { ...good, email: 'nope' }, headers })
    expect(bad.status()).toBe(422)
    expect((await bad.json()).fields.email).toBeTruthy()
    expect((await request.post('/api/inquiry', { data: good, headers })).status()).toBe(200)
    expect((await request.post('/api/inquiry', { data: good, headers })).status()).toBe(200)
    expect((await request.post('/api/inquiry', { data: { ...good, website: 'spam', email: `bot-${unique}@example-company.com` }, headers })).status()).toBe(200)
    const foreign = await request.post('/api/inquiry', { data: good, headers: { ...headers, origin: 'https://evil.example' } })
    expect(foreign.status()).toBe(403)
  })

  test('duplicates and bots were not stored; the rate limit applies', async ({ page, request }) => {
    await login(page)
    const count = async (email: string) => (await (await api(page).get(`/api/form-submissions?where[email][equals]=${encodeURIComponent(email)}`)).json()).totalDocs
    expect(await count(`dup-${unique}@example-company.com`)).toBe(1)
    expect(await count(`bot-${unique}@example-company.com`)).toBe(0)
    const headers = { 'x-forwarded-for': `10.9.${unique % 250}.${(unique >> 8) % 250}` }
    const statuses: number[] = []
    for (let i = 0; i < 7; i++) statuses.push((await request.post('/api/inquiry', { data: {}, headers })).status())
    expect(statuses.slice(0, 5).every((s) => s === 422)).toBe(true)
    expect(statuses[6]).toBe(429)
  })
})

test.describe('access control', () => {
  test('visitors cannot read or change protected data', async ({ request }) => {
    expect((await request.get('/api/form-submissions')).status()).toBe(403)
    expect((await request.get('/api/users')).status()).toBe(403)
    expect((await request.post('/api/pages', { data: { title: 'x', slug: 'x' } })).status()).toBe(403)
    expect((await request.post('/api/form-submissions', { data: { name: 'x' } })).status()).toBe(403)
    expect((await request.post('/api/globals/header', { data: { ctaLabel: 'hacked' } })).status()).toBe(403)
    expect((await request.get('/api/pages?draft=true&where[_status][equals]=draft')).status()).toBe(200)
    const drafts = await (await request.get('/api/pages?draft=true&where[_status][equals]=draft')).json()
    expect(drafts.totalDocs).toBe(0)
  })

  test('preview needs a login, and cannot redirect off-site', async ({ page, request }) => {
    expect((await request.get('/preview?path=/about', { maxRedirects: 0 })).status()).toBe(401)
    await login(page)
    expect((await api(page).get('/preview?path=//evil.example', { maxRedirects: 0 })).status()).toBe(400)
  })
})

test.describe('content management', () => {
  const slug = `qa-page-${unique}`
  let id = ''

  test('create, draft, preview, publish, edit, reorder, unpublish, delete a page', async ({ page, browser }) => {
    await login(page)
    const hero = (heading: string) => ({ blockType: 'hero', variant: 'compact', breadcrumb: 'QA', heading })
    const cta = { blockType: 'ctaBand', heading: 'QA call to action', buttons: [{ label: 'Go', href: '/', style: 'ink', arrow: true }] }

    const created = await api(page).post('/api/pages?draft=true', { data: { title: 'QA', slug, _status: 'draft', layout: [hero('Draft heading'), cta] } })
    expect(created.status()).toBe(201)
    id = (await created.json()).doc.id

    const visitor = await browser.newContext()
    const url = `/${slug}`
    expect((await visitor.request.get(url)).status(), 'draft is hidden from visitors').toBe(404)

    await page.goto(`/preview?path=${encodeURIComponent(url)}`)
    await expect(page.locator('h1')).toHaveText('Draft heading')
    await expect(page.getByText('Exit preview')).toBeVisible()
    await page.getByText('Exit preview').click()

    expect((await api(page).patch(`/api/pages/${id}`, { data: { _status: 'published', layout: [hero('Published heading'), cta] } })).status()).toBe(200)
    await expect.poll(async () => (await visitor.request.get(url)).status()).toBe(200)
    expect(await (await visitor.request.get(url)).text()).toContain('Published heading')

    // Editing and reordering appears straight away.
    expect((await api(page).patch(`/api/pages/${id}`, { data: { _status: 'published', layout: [cta, hero('Edited heading')] } })).status()).toBe(200)
    const reordered = await visitor.newPage()
    await reordered.goto(url)
    await expect(reordered.locator('h1')).toHaveText('Edited heading')
    const order = await reordered.$$eval('main > section', (els) => els.map((e) => e.className))
    expect(order[0]).toContain('cta-band')
    expect(order[1]).toContain('hero')

    // An unpublished change stays private.
    expect((await api(page).patch(`/api/pages/${id}?draft=true`, { data: { _status: 'draft', layout: [hero('Unpublished edit'), cta] } })).status()).toBe(200)
    const live = await (await visitor.request.get(url)).text()
    expect(live).not.toContain('Unpublished edit')

    expect((await api(page).delete(`/api/pages/${id}`)).status()).toBe(200)
    await expect.poll(async () => (await visitor.request.get(url)).status()).toBe(404)
    await visitor.close()
  })

  test('slug and JSON-LD validation', async ({ page }) => {
    await login(page)
    expect((await api(page).post('/api/pages', { data: { title: 'Bad', slug: 'Not A Slug', _status: 'published' } })).status()).toBe(400)
    expect((await api(page).post('/api/pages', { data: { title: 'Bad', slug: 'admin', _status: 'published' } })).status()).toBe(400)
    expect((await api(page).post('/api/pages', { data: { title: 'Bad', slug: `qa-bad-${unique}`, _status: 'published', seo: { structuredData: '{oops' } } })).status()).toBe(400)
  })

  test('header and footer edits reach every page, and can be undone', async ({ page, browser }) => {
    await login(page)
    const header = await (await api(page).get('/api/globals/header?depth=0')).json()
    const footer = await (await api(page).get('/api/globals/footer?depth=0')).json()
    const visitor = await browser.newPage()
    try {
      const nav = [...header.navItems, { label: 'QA link', href: '/about' }]
      expect((await api(page).post('/api/globals/header', { data: { navItems: nav } })).status()).toBe(200)
      expect((await api(page).post('/api/globals/footer', { data: { giantWord: 'QAWORD' } })).status()).toBe(200)
      await visitor.goto('/platform')
      await expect(visitor.locator('.nav__links a', { hasText: 'QA link' })).toBeVisible()
      await expect(visitor.locator('.footer__giant')).toHaveText('QAWORD')
    } finally {
      await api(page).post('/api/globals/header', { data: { navItems: header.navItems } })
      await api(page).post('/api/globals/footer', { data: { giantWord: footer.giantWord } })
    }
    await visitor.goto('/platform')
    await expect(visitor.locator('.nav__links a', { hasText: 'QA link' })).toHaveCount(0)
    await visitor.close()
  })

  test('the platform-layers global updates both pages that use it', async ({ page, browser }) => {
    await login(page)
    const data = await (await api(page).get('/api/globals/platformLayers')).json()
    const visitor = await browser.newPage()
    const original = data.layers[0].title
    try {
      const layers = data.layers.map((l: { title: string }, i: number) => (i === 0 ? { ...l, title: 'QA equipment' } : l))
      expect((await api(page).post('/api/globals/platformLayers', { data: { layers } })).status()).toBe(200)
      for (const url of ['/', '/platform']) {
        await visitor.goto(url)
        await expect(visitor.locator('.arch__tab[data-layer="equipment"] .arch__tab-title')).toContainText('QA equipment')
      }
    } finally {
      await api(page).post('/api/globals/platformLayers', { data: { layers: data.layers } })
    }
    await visitor.goto('/')
    await expect(visitor.locator('.arch__tab[data-layer="equipment"] .arch__tab-title')).toContainText(original)
    await visitor.close()
  })

  test('media: upload, serve through the optimizer, require alt text, reject other file types', async ({ page }) => {
    await login(page)
    const file = fs.readFileSync(path.resolve('public/assets/img/logo/tamtronics-logo.png'))
    const png = { name: `qa-${unique}.png`, mimeType: 'image/png', buffer: file }
    const noAlt = await api(page).post('/api/media', { multipart: { file: png } })
    expect(noAlt.status()).toBe(400)
    const upload = await api(page).post('/api/media', { multipart: { file: png, _payload: JSON.stringify({ alt: 'QA' }) } })
    expect(upload.status()).toBe(201)
    const doc = (await upload.json()).doc
    expect(doc.width).toBe(791)
    const optimized = await api(page).get(`/_next/image?url=${encodeURIComponent(doc.url)}&w=640&q=90`, { headers: { Accept: 'image/webp' } })
    expect(optimized.status()).toBe(200)
    expect(optimized.headers()['content-type']).toContain('image/webp')
    const bad = await api(page).post('/api/media', { multipart: { file: { name: 'evil.html', mimeType: 'text/html', buffer: Buffer.from('<script>alert(1)</script>') }, _payload: JSON.stringify({ alt: 'x' }) } })
    expect(bad.status()).toBe(400)
    expect((await api(page).delete(`/api/media/${doc.id}`)).status()).toBe(200)
  })

  test('redirects: editor-made redirects work, with or without .html', async ({ page, request }) => {
    await login(page)
    const ids: string[] = []
    for (const from of [`/old-${unique}`, `/legacy-${unique}.html`]) {
      const created = await api(page).post('/api/redirects', { data: { from, to: { type: 'custom', url: '/about' } } })
      expect(created.status(), from).toBe(201)
      ids.push((await created.json()).doc.id)
    }

    const direct = await request.get(`/old-${unique}`, { maxRedirects: 0 })
    expect(direct.status()).toBe(308)
    // Next repeats the same Location value for redirects issued while rendering; browsers accept that.
    expect(direct.headers().location.split(', ').every((l) => l === '/about')).toBe(true)

    // An old .html address first loses its extension, then follows the editor's redirect.
    for (const from of [`/old-${unique}`, `/legacy-${unique}.html`, `/old-${unique}.html`]) {
      await page.goto(from)
      await expect(page, from).toHaveURL(/\/about$/)
    }
    for (const id of ids) await api(page).delete(`/api/redirects/${id}`)
  })

  test('admin panel opens, with sections and media editable by a person', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('#field-email').fill(EMAIL!)
    await page.locator('#field-password').fill(PASSWORD!)
    await page.getByRole('button', { name: /log ?in/i }).click()
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 })
    for (const name of ['Pages', 'Media', 'Form Submissions', 'Business Inquiry Form', 'Header', 'Footer', 'Platform Layers', 'Site Settings', 'Redirects', 'Users']) {
      await expect(page.locator('.dashboard, nav').getByText(name, { exact: true }).first()).toBeVisible()
    }
    await page.goto('/admin/collections/pages')
    await page.getByRole('link', { name: 'Home', exact: true }).first().click()
    await expect(page.getByText('Page sections').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.blocks-field__rows, .blocks-field').first()).toBeVisible()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/admin/globals/header')
    await expect(page.locator('#field-ctaLabel')).toHaveValue('Start a conversation', { timeout: 30000 })
    expect(errors).toEqual([])
  })
})

/**
 * Email and form settings. The server under test must send through the sink started here:
 * start it with SMTP_HOST=127.0.0.1 SMTP_PORT=$QA_SMTP_PORT SMTP_SECURE=false.
 */
const SMTP_PORT = Number(process.env.QA_SMTP_PORT)
type Admin = APIRequestContext
type Doc = Record<string, string>

test.describe('inquiry emails and form settings', () => {
  test.skip(!SMTP_PORT, 'Needs QA_SMTP_PORT, matching the server SMTP_PORT')
  let sink: Sink
  let original: Record<string, unknown>
  const TEAM = `team-${unique}@qa-receiver.test`
  let ip = 0
  const headers = () => ({ 'x-forwarded-for': `10.77.${unique % 250}.${ip++ % 250}` })
  const good = (tag: string, extra: object = {}) => ({
    name: `Mail Person ${tag}`,
    email: `mail-${tag}-${unique}@example-company.com`,
    company: `Company ${tag}`,
    industry: 'Equipment manufacturer',
    message: `Message ${tag}: we would like to know how our pumps are used in the field.`,
    ...extra,
  })

  const asAdmin = async (): Promise<Admin> => {
    const anon = await request.newContext({ baseURL: BASE_URL })
    const { token } = await (await anon.post('/api/users/login', { data: { email: EMAIL, password: PASSWORD } })).json()
    await anon.dispose()
    return request.newContext({ baseURL: BASE_URL, extraHTTPHeaders: { Authorization: `JWT ${token}` } })
  }

  const submission = async (admin: Admin, email: string): Promise<Doc[]> =>
    (await (await admin.get(`/api/form-submissions?where[email][equals]=${encodeURIComponent(email)}&depth=0`)).json()).docs

  /** Waits until both emails for this address have a final outcome. */
  const settled = async (admin: Admin, email: string) => {
    let docs: Doc[] = []
    const done = (s: string) => !['pending', 'sending'].includes(s)
    await expect
      .poll(async () => {
        docs = await submission(admin, email)
        return docs.length === 1 && done(docs[0].teamEmail) && done(docs[0].confirmationEmail)
      }, { timeout: 30000 })
      .toBe(true)
    return docs[0]
  }

  const setForm = async (admin: Admin, data: object) => {
    const response = await admin.post('/api/globals/inquiryForm', { data })
    expect(response.status(), await response.text()).toBe(200)
  }

  const strip = (doc: Record<string, unknown>, ...keys: string[]) =>
    Object.fromEntries(Object.entries(doc).filter(([k]) => !['id', 'createdAt', 'updatedAt', 'globalType', ...keys].includes(k)))

  test.beforeAll(async () => {
    sink = await startSink(SMTP_PORT)
    const admin = await asAdmin()
    original = await (await admin.get('/api/globals/inquiryForm?depth=0')).json()
    const n = original.notifications as Record<string, unknown>
    await setForm(admin, { notifications: { ...n, recipients: [{ email: TEAM }], adminEnabled: true, confirmationEnabled: true, contactDetails: 'Call us on 555-0100.' } })
  })

  test.afterAll(async () => {
    await setForm(await asAdmin(), strip(original))
    await sink?.close()
  })

  test('a submission from the page emails the team and the sender, once each', async ({ page }) => {
    const v = good('page')
    await page.setExtraHTTPHeaders(headers())
    await page.goto('/contact')
    await page.locator('#f-name').fill(v.name)
    await page.locator('#f-email').fill(v.email)
    await page.locator('#f-company').fill(v.company)
    await page.locator('#f-industry').selectOption({ label: v.industry })
    await page.locator('#f-message').fill(v.message)
    let posts = 0
    page.on('request', (r) => {
      if (r.url().endsWith('/api/inquiry')) posts++
    })
    // Two quick clicks: the button locks while sending, so only one request goes out.
    const button = page.locator('#inquiry-form button[type=submit]')
    await button.evaluate((b: HTMLButtonElement) => {
      b.click()
      b.click()
    })
    await expect(page.locator('#inquiry-success')).toBeVisible()
    expect(posts).toBe(1)

    const admin = await asAdmin()
    const doc = await settled(admin, v.email)
    expect(doc.teamEmail).toBe('sent')
    expect(doc.confirmationEmail).toBe('sent')
    expect(doc.status).toBe('new')

    const team = sink.mails.filter((m) => m.to.includes(TEAM) && m.html.includes(v.email))
    const confirm = sink.mails.filter((m) => m.to.includes(v.email))
    expect(team).toHaveLength(1)
    expect(confirm).toHaveLength(1)
    expect(team[0].subject).toBe(`New business inquiry from ${v.name}, ${v.company}`)
    expect(team[0].headers).toMatch(new RegExp(`^Reply-To: .*<${v.email}>`, 'm'))
    for (const value of [v.name, v.company, v.industry, v.message, 'New business inquiry', 'Submitted']) expect(team[0].html).toContain(value)
    expect(team[0].html).toContain(`/admin/collections/form-submissions/${doc.id}`)
    expect(team[0].text).toContain(v.message)
    expect(confirm[0].subject).toBe('We received your inquiry')
    expect(confirm[0].html).toContain('Thank you, Mail.')
    expect(confirm[0].html).toContain(v.message)
    expect(confirm[0].html).toContain('Call us on 555-0100.')
    expect(confirm[0].html).toContain('#c8f25c')

    // Sending the same inquiry again stores nothing new and sends nothing new.
    const before = sink.mails.length
    expect((await admin.post('/api/inquiry', { data: v, headers: headers() })).status()).toBe(200)
    await page.waitForTimeout(2000)
    expect(await submission(admin, v.email)).toHaveLength(1)
    expect(sink.mails.length).toBe(before)
  })

  test('visitor input cannot add email headers or HTML', async ({ request: visitor }) => {
    const v = good('inject', { name: 'Eve\r\nBcc: victim@example.org', company: '<script>alert(1)</script> & Co' })
    expect((await visitor.post('/api/inquiry', { data: v, headers: headers() })).status()).toBe(200)
    const doc = await settled(await asAdmin(), v.email)
    expect(doc.name).toBe('Eve Bcc: victim@example.org')
    const mails = sink.mails.filter((m) => m.to.includes(v.email) || m.html.includes(v.email))
    expect(mails).toHaveLength(2)
    for (const m of mails) {
      expect(m.headers).not.toMatch(/^Bcc:/im)
      expect(m.to).not.toContain('victim@example.org')
      expect(m.html).not.toContain('<script>alert(1)</script>')
    }
    expect(mails.find((m) => m.to.includes(TEAM))!.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; Co')
  })

  test('a mail server failure keeps the submission and records the problem', async ({ request: visitor }) => {
    const v = good('outage')
    sink.state.failing = true
    try {
      expect((await visitor.post('/api/inquiry', { data: v, headers: headers() })).status()).toBe(200)
      const doc = await settled(await asAdmin(), v.email)
      expect(doc.teamEmail).toBe('failed')
      expect(doc.confirmationEmail).toBe('failed')
      expect(doc.emailError).toContain('451')
      expect(doc.message).toBe(v.message)
    } finally {
      sink.state.failing = false
    }
  })

  test('notifications can be turned off', async ({ request: visitor }) => {
    const admin = await asAdmin()
    const current = await (await admin.get('/api/globals/inquiryForm?depth=0')).json()
    await setForm(admin, { notifications: { ...current.notifications, adminEnabled: false, confirmationEnabled: false } })
    try {
      const v = good('off')
      expect((await visitor.post('/api/inquiry', { data: v, headers: headers() })).status()).toBe(200)
      const doc = await settled(admin, v.email)
      expect(doc.teamEmail).toBe('disabled')
      expect(doc.confirmationEmail).toBe('disabled')
      expect(sink.mails.some((m) => m.to.includes(v.email) || m.html.includes(v.email))).toBe(false)
    } finally {
      await setForm(admin, { notifications: current.notifications })
    }
  })

  test('labels, placeholders, required fields and limits come from the CMS, on both sides', async ({ page, request: visitor }) => {
    const admin = await asAdmin()
    const current = await (await admin.get('/api/globals/inquiryForm?depth=0')).json()
    await setForm(admin, {
      title: 'Tell us about your fleet',
      submitLabel: 'Send it',
      name: { ...current.name, label: 'Your name', placeholder: 'Jane Smith' },
      company: { ...current.company, required: false },
      message: { ...current.message, maxLength: 300, tooLongMessage: 'Under {max}, please.' },
      successHeading: 'Got it, thanks.',
    })
    try {
      await page.setExtraHTTPHeaders(headers())
      await page.goto('/contact')
      await expect(page.locator('#form-title')).toHaveText('Tell us about your fleet')
      await expect(page.locator('label[for="f-name"]')).toHaveText('Your name')
      await expect(page.locator('#f-name')).toHaveAttribute('placeholder', 'Jane Smith')
      expect(await page.locator('#f-company').getAttribute('required')).toBeNull()
      await expect(page.locator('#f-message')).toHaveAttribute('maxlength', '300')
      await expect(page.locator('.field__count')).toHaveText('0 / 300')

      // The server follows the same rules: company is optional, the message limit is 300.
      const long = await visitor.post('/api/inquiry', { data: good('limits', { message: 'x'.repeat(301) }), headers: headers() })
      expect(long.status()).toBe(422)
      expect((await long.json()).fields.message).toBe('Under 300, please.')
      const unknown = await visitor.post('/api/inquiry', { data: good('limits', { industry: 'Made up' }), headers: headers() })
      expect((await unknown.json()).fields.industry).toBe('Please choose the closest industry.')

      const v = good('optional', { company: '' })
      await page.locator('#f-name').fill(v.name)
      await page.locator('#f-email').fill(v.email)
      await page.locator('#f-industry').selectOption({ label: v.industry })
      await page.locator('#f-message').fill(v.message)
      await page.getByRole('button', { name: 'Send it' }).click()
      await expect(page.locator('#inquiry-success h2')).toHaveText('Got it, thanks.')
      expect((await settled(admin, v.email)).company ?? '').toBe('')
    } finally {
      await setForm(admin, strip(current, 'notifications'))
    }
    await page.goto('/contact')
    await expect(page.locator('#form-title')).toHaveText('Business inquiry')
  })

  test('submissions and email settings stay private; admins manage status', async ({ request: visitor }) => {
    expect((await visitor.get('/api/form-submissions')).status()).toBe(403)
    expect((await visitor.post('/api/form-submissions', { data: { name: 'x', email: 'x@example-company.com' } })).status()).toBe(403)
    const publicForm = await (await visitor.get('/api/globals/inquiryForm')).json()
    expect(publicForm.title).toBeTruthy()
    expect(publicForm.notifications).toBeUndefined()
    expect(JSON.stringify(publicForm)).not.toContain(TEAM)
    expect((await visitor.post('/api/globals/inquiryForm', { data: { title: 'hacked' } })).status()).toBe(403)

    const admin = await asAdmin()
    const list = await (await admin.get('/api/form-submissions?sort=-createdAt&limit=5&depth=0')).json()
    expect(list.totalDocs).toBeGreaterThan(0)
    const times = list.docs.map((d: Doc) => d.createdAt)
    expect([...times].sort().reverse()).toEqual(times)
    const doc = list.docs[0]
    expect((await admin.patch(`/api/form-submissions/${doc.id}`, { data: { status: 'in-progress', teamEmail: 'pending' } })).status()).toBe(200)
    const changed = await (await admin.get(`/api/form-submissions/${doc.id}?depth=0`)).json()
    expect(changed.status).toBe('in-progress')
    // Delivery records belong to the server: an admin can't reset them to trigger a resend.
    expect(changed.teamEmail).toBe(doc.teamEmail)
    await admin.patch(`/api/form-submissions/${doc.id}`, { data: { status: 'completed' } })
    const completed = await (await admin.get('/api/form-submissions?where[status][equals]=completed&depth=0&limit=100')).json()
    expect(completed.docs.some((d: Doc) => d.id === doc.id)).toBe(true)
    const searched = await (await admin.get(`/api/form-submissions?where[email][like]=${encodeURIComponent(`mail-page-${unique}`)}&depth=0`)).json()
    expect(searched.totalDocs).toBe(1)
  })

  test('the Form Submissions screens open in the admin', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/admin/login')
    await page.locator('#field-email').fill(EMAIL!)
    await page.locator('#field-password').fill(PASSWORD!)
    await page.getByRole('button', { name: /log ?in/i }).click()
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 })
    await page.goto('/admin/collections/form-submissions')
    for (const column of ['ID', 'Sender name', 'Sender email', 'Company', 'Status', 'Created At']) {
      await expect(page.locator('table thead').getByText(column, { exact: true })).toBeVisible({ timeout: 30000 })
    }
    await page.locator('table tbody tr').first().locator('a').first().click()
    await expect(page.locator('#field-message')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('#field-status')).toBeVisible()
    await expect(page.getByText('Email delivery').first()).toBeVisible()
    await page.goto('/admin/globals/inquiryForm')
    // Payload reopens the tab each person used last, so pick it explicitly.
    await page.getByRole('button', { name: 'Fields', exact: true }).click({ timeout: 30000 })
    await expect(page.locator('#field-title')).toHaveValue('Business inquiry', { timeout: 30000 })
    await page.getByRole('button', { name: 'Email notifications', exact: true }).click()
    await expect(page.getByText('Email to the team').first()).toBeVisible()
    expect(errors).toEqual([])
  })
})
