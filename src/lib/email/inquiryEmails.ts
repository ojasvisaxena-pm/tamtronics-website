import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import type { FormSubmission, InquiryForm } from '@/payload-types'

import { emailConfigured, envReceivers } from './config'
import { fillTokens, headerSafe, isPlainEmail } from './format'
import { inquiryConfirmation } from './templates/inquiryConfirmation'
import { type EmailRow, inquiryNotification } from './templates/inquiryNotification'

type Channel = 'teamEmail' | 'confirmationEmail'
type Outcome = 'sent' | 'failed' | 'disabled' | 'not-configured'

/** A short reason without credentials or stack traces, for the server log and the admin sidebar. */
const reason = (error: unknown) => {
  const e = error as { code?: string; responseCode?: number; message?: string }
  const first = (e?.message ?? String(error)).split('\n')[0]
  return headerSafe([e?.code, e?.responseCode, first].filter(Boolean).join(' '), 200)
}

const formatDate = (iso: string, timeZone: string) => {
  try {
    return `${new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone }).format(new Date(iso))} (${timeZone})`
  } catch {
    return `${new Date(iso).toISOString().replace('T', ' ').slice(0, 16)} (UTC)`
  }
}

/**
 * Takes the channel from "pending" to "sending" in one database step. Only one caller can win, so
 * a submission processed twice never sends the same email twice.
 */
const claim = async (payload: Payload, id: string, channel: Channel) => {
  const model = (payload.db as MongooseAdapter).collections['form-submissions']
  const claimed = await model.findOneAndUpdate({ _id: id, [channel]: 'pending' }, { $set: { [channel]: 'sending' } })
  return Boolean(claimed)
}

const record = (payload: Payload, id: string, data: Partial<Pick<FormSubmission, Channel | 'emailError'>>) =>
  payload.update({ collection: 'form-submissions', id, data, depth: 0 })

/**
 * Sends the team notification and the sender's confirmation for one stored submission.
 * Never throws: the submission is already saved, and each outcome is written back to it.
 */
export async function sendInquiryEmails(payload: Payload, id: string) {
  const doc = await payload.findByID({ collection: 'form-submissions', id, depth: 0 })
  const form = (await payload.findGlobal({ slug: 'inquiryForm', depth: 0 })) as InquiryForm
  const settings = await payload.findGlobal({ slug: 'siteSettings', depth: 0 })
  const n = form.notifications ?? {}
  const siteName = settings.siteName || 'Tamtronics'
  const siteUrl = settings.siteUrl || undefined
  const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/$/, '')

  const firstName = doc.name.split(/\s+/)[0] || doc.name
  const tokens = { name: doc.name, firstName, email: doc.email, company: doc.company ?? '', industry: doc.industry ?? '' }
  const rows: EmailRow[] = [
    { label: form.name.label, value: doc.name },
    { label: form.email.label, value: doc.email },
    { label: form.company.label, value: doc.company ?? '' },
    { label: form.industry.label, value: doc.industry ?? '' },
  ]
  const message = { label: form.message.label, value: doc.message ?? '' }
  const problems: string[] = []

  const deliver = async (channel: Channel, enabled: boolean | null | undefined, to: string[], build: () => Parameters<Payload['sendEmail']>[0]) => {
    let outcome: Outcome
    if (!enabled) outcome = 'disabled'
    else if (!emailConfigured || to.length === 0) {
      outcome = 'not-configured'
      if (emailConfigured) problems.push(channel === 'teamEmail' ? 'No team recipient is set.' : 'No sender address to reply to.')
    } else {
      if (!(await claim(payload, id, channel))) return
      try {
        await payload.sendEmail({ ...build(), to })
        outcome = 'sent'
      } catch (error) {
        outcome = 'failed'
        problems.push(`${channel === 'teamEmail' ? 'Team email' : 'Confirmation'}: ${reason(error)}`)
        payload.logger.error(`Inquiry ${id}: ${channel} failed: ${reason(error)}`)
      }
    }
    await record(payload, id, { [channel]: outcome })
  }

  try {
    const teamTo = (n.recipients?.map((r) => r.email) ?? []).filter(isPlainEmail)
    await deliver('teamEmail', n.adminEnabled, teamTo.length ? teamTo : envReceivers().filter(isPlainEmail), () => {
      const email = inquiryNotification({
        siteName,
        siteUrl,
        submittedAt: formatDate(doc.createdAt, n.timeZone || 'UTC'),
        rows,
        message,
        senderName: doc.name,
        senderEmail: doc.email,
        adminUrl: serverUrl ? `${serverUrl}/admin/collections/form-submissions/${id}` : undefined,
      })
      return {
        subject: headerSafe(fillTokens(n.adminSubject || 'New business inquiry from {name}', tokens)),
        html: email.html,
        text: email.text,
        // An object, not a string: the name is encoded by the mailer and can't add headers.
        replyTo: n.replyToSender !== false ? { name: headerSafe(doc.name, 100), address: doc.email } : undefined,
      }
    })

    await deliver('confirmationEmail', n.confirmationEnabled, isPlainEmail(doc.email) ? [doc.email] : [], () => {
      const email = inquiryConfirmation({
        siteName,
        siteUrl,
        heading: headerSafe(fillTokens(n.confirmationHeading || 'Thank you.', tokens)),
        body: fillTokens(n.confirmationBody || '', tokens),
        summaryTitle: n.summaryTitle || undefined,
        rows: n.includeSummary !== false ? rows.filter((r) => r.label !== form.email.label) : undefined,
        message: n.includeSummary !== false ? message : undefined,
        contactDetails: n.contactDetails || undefined,
        signOff: n.signOff || undefined,
        buttonLabel: n.buttonLabel || undefined,
      })
      return {
        subject: headerSafe(fillTokens(n.confirmationSubject || 'We received your inquiry', tokens)),
        html: email.html,
        text: email.text,
      }
    })

    if (problems.length) await record(payload, id, { emailError: problems.join(' ') })
  } catch (error) {
    payload.logger.error(`Inquiry ${id}: could not process emails: ${reason(error)}`)
  }
}
