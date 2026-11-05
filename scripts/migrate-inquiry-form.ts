/**
 * One-off: moves an existing database to the Business Inquiry Form setup.
 *  1. Copies the form wording saved on the contact page's Inquiry form block into the new
 *     Business Inquiry Form global (only if that global has never been saved).
 *  2. Copies submissions from the old `inquiries` collection into `form-submissions`, keeping their
 *     ids and dates. "Closed" becomes "Completed", and both emails show as not sent. The old
 *     collection is left as it was, as a backup.
 * Shows what it would do by default; pass --apply to save. Safe to run more than once.
 *   npx tsx scripts/migrate-inquiry-form.ts
 *   npx tsx scripts/migrate-inquiry-form.ts --apply
 */
import 'dotenv/config'

const apply = process.argv.includes('--apply')

type OldBlock = Record<string, unknown> & { blockType: string; industries?: { label: string; key: string }[] }

async function run() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })
  const db = (payload.db as unknown as { connection: { db: import('mongodb').Db } }).connection.db

  // 1. Form wording
  const form = await payload.findGlobal({ slug: 'inquiryForm', depth: 0 })
  if (form.updatedAt) {
    console.log('Business Inquiry Form: already set up, left alone')
  } else {
    // Read the raw document: the old block fields are no longer in the schema, so Payload would drop them.
    const page = await db.collection('pages').findOne({ slug: 'contact' })
    const old = (page?.layout as OldBlock[] | undefined)?.find((b) => b.blockType === 'contactForm' && b.nameLabel)
    if (!old) {
      console.log('Business Inquiry Form: no saved form wording found; run `npm run seed` to add the defaults')
    } else {
      const str = (key: string) => (typeof old[key] === 'string' && old[key] ? (old[key] as string) : undefined)
      const data = {
        title: str('title'),
        intro: str('intro'),
        name: { label: str('nameLabel') },
        email: { label: str('emailLabel') },
        company: { label: str('companyLabel') },
        industry: {
          label: str('industryLabel'),
          placeholder: str('industryPlaceholder'),
          options: (old.industries ?? []).map(({ label, key }) => ({ label, key })),
        },
        message: { label: str('messageLabel'), hint: str('messageHint') },
        privacyNote: str('privacyNote'),
        submitLabel: str('submitLabel'),
        sendingLabel: str('sendingLabel'),
        successHeading: str('successHeading'),
        successBody: str('successBody'),
        resetLabel: str('resetLabel'),
        nextLabel: str('nextLabel'),
        nextHref: str('nextHref'),
        errorMessage: str('errorMessage'),
      }
      console.log('Business Inquiry Form: will copy from the contact page:')
      console.log(JSON.stringify(data, null, 2))
      if (apply) {
        await payload.updateGlobal({ slug: 'inquiryForm', data: data as never })
        console.log('  saved')
      }
    }
  }

  // 2. Submissions
  const oldItems = await db.collection('inquiries').find({}).toArray()
  const target = db.collection('form-submissions')
  let moved = 0
  for (const item of oldItems) {
    if (await target.findOne({ _id: item._id })) continue
    const { status, ...rest } = item
    console.log(`Submission ${item._id} (${item.email}, ${item.createdAt?.toISOString?.() ?? item.createdAt}): will copy`)
    moved++
    // These arrived before the site sent email, so no email went out for them.
    if (apply) {
      await target.insertOne({
        ...rest,
        status: status === 'closed' ? 'completed' : status || 'new',
        teamEmail: 'not-configured',
        confirmationEmail: 'not-configured',
      })
    }
  }
  console.log(`Submissions: ${moved} to copy, ${oldItems.length - moved} already copied`)

  console.log(apply ? 'Done.' : 'Nothing saved. Run again with --apply to save.')
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
