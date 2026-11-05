/**
 * One-off: rewrites internal links saved in the CMS from /platform.html to /platform.
 * Shows what it would change by default; pass --apply to save. Only link values change.
 *   npx tsx scripts/clean-urls.ts           (preview)
 *   npx tsx scripts/clean-urls.ts --apply
 * A page with unpublished draft edits is skipped and listed, so those edits are never published by accident.
 */
import 'dotenv/config'

const apply = process.argv.includes('--apply')

// Site-relative page links only: /platform.html, /industries.html#dme, /contact.html?industry=dme
const OLD_LINK = /^\/([a-z0-9-]+)\.html(?=$|[#?])/

const rewrite = (value: string) => {
  if (/^\/(index|home)\.html(?=$|[#?])/.test(value)) return value.replace(/^\/(index|home)\.html/, '/')
  return value.replace(OLD_LINK, '/$1')
}

type Change = { path: string; from: string; to: string }

/** Returns a copy with links rewritten, recording each change. Leaves ids and everything else as they are. */
function transform(node: unknown, path: string, changes: Change[]): unknown {
  if (typeof node === 'string') {
    const next = rewrite(node)
    if (next !== node) changes.push({ path, from: node, to: next })
    return next
  }
  if (Array.isArray(node)) return node.map((item, i) => transform(item, `${path}[${i}]`, changes))
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, transform(v, path ? `${path}.${k}` : k, changes)]))
  }
  return node
}

const report = (label: string, changes: Change[]) => {
  if (!changes.length) return console.log(`${label}: nothing to change`)
  console.log(`${label}: ${changes.length} link(s)`)
  for (const c of changes) console.log(`    ${c.path}: ${c.from} -> ${c.to}`)
}

async function run() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })
  let total = 0
  const skipped: string[] = []

  const { docs: pages } = await payload.find({ collection: 'pages', depth: 0, limit: 500, pagination: false })
  for (const page of pages) {
    const latest = await payload.findByID({ collection: 'pages', id: page.id, depth: 0, draft: true })
    if (latest._status === 'draft') {
      skipped.push(page.slug)
      continue
    }
    const changes: Change[] = []
    const layout = transform(page.layout, 'layout', changes)
    const seo = transform(page.seo, 'seo', changes)
    report(`page ${page.slug}`, changes)
    total += changes.length
    if (apply && changes.length) {
      await payload.update({ collection: 'pages', id: page.id, depth: 0, draft: false, data: { layout, seo, _status: 'published' } as never })
    }
  }

  for (const slug of ['header', 'footer', 'platformLayers', 'siteSettings'] as const) {
    const global = await payload.findGlobal({ slug, depth: 0 })
    const changes: Change[] = []
    const data = Object.fromEntries(
      Object.entries(global).filter(([key]) => !['id', 'createdAt', 'updatedAt', 'globalType'].includes(key)),
    )
    const next = transform(data, '', changes) as Record<string, unknown>
    report(`global ${slug}`, changes)
    total += changes.length
    if (apply && changes.length) await payload.updateGlobal({ slug, depth: 0, data: next as never })
  }

  const { docs: redirects } = await payload.find({ collection: 'redirects', depth: 0, limit: 500, pagination: false })
  for (const r of redirects) {
    const changes: Change[] = []
    const to = transform(r.to, 'to', changes)
    report(`redirect from ${r.from}`, changes)
    total += changes.length
    if (apply && changes.length) await payload.update({ collection: 'redirects', id: r.id, depth: 0, data: { to } as never })
  }

  if (skipped.length) console.log(`\nSkipped, has unpublished draft edits (update its links by hand): ${skipped.join(', ')}`)
  console.log(`\n${total} link(s) ${apply ? 'updated' : 'would be updated. Run again with --apply to save'}.`)
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
