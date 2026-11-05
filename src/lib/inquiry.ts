import { z } from 'zod'

import type { InquiryForm } from '@/payload-types'

/**
 * Rules for the Business Inquiry Form, built from its CMS settings. The form uses them for instant
 * feedback and /api/inquiry uses the same ones for the check that counts.
 */
export const FREE_MAIL_DEFAULT = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'live.com', 'msn.com', 'proton.me', 'protonmail.com']

export const INQUIRY_FIELDS = ['name', 'email', 'company', 'industry', 'message'] as const
export type InquiryField = (typeof INQUIRY_FIELDS)[number]
export type InquiryValues = Record<InquiryField, string>

/** What the browser may see: everything except the email settings. */
export type InquiryFormConfig = Omit<InquiryForm, 'notifications' | 'id' | 'updatedAt' | 'createdAt' | 'globalType'>

const PRIVATE_KEYS = new Set(['notifications', 'id', 'updatedAt', 'createdAt', 'globalType'])

export const publicFormConfig = (form: InquiryForm): InquiryFormConfig =>
  Object.fromEntries(Object.entries(form).filter(([key]) => !PRIVATE_KEYS.has(key))) as InquiryFormConfig

type TextRule = {
  required?: boolean | null
  minLength?: number | null
  maxLength: number
  requiredMessage: string
  tooShortMessage: string
  tooLongMessage: string
}

const say = (message: string, rule: { minLength?: number | null; maxLength?: number | null }) =>
  message.replace(/\{min\}/g, String(rule.minLength ?? 0)).replace(/\{max\}/g, String(rule.maxLength ?? ''))

// Control characters never belong in a form value; single-line fields also lose line breaks.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
const clean = (multiline: boolean) => (v: string) => {
  const stripped = v.replace(CONTROL, '')
  return (multiline ? stripped.replace(/\r\n?/g, '\n') : stripped.replace(/[\r\n\t]+/g, ' ')).trim()
}

const text = (rule: TextRule, multiline = false) =>
  z
    .string({ error: say(rule.requiredMessage, rule) })
    .max(20000, say(rule.tooLongMessage, rule))
    .transform(clean(multiline))
    .superRefine((v, ctx) => {
      if (!v) {
        if (rule.required) ctx.addIssue({ code: 'custom', message: say(rule.requiredMessage, rule) })
      } else if (rule.minLength && v.length < rule.minLength) {
        ctx.addIssue({ code: 'custom', message: say(rule.tooShortMessage, rule) })
      } else if (v.length > rule.maxLength) {
        ctx.addIssue({ code: 'custom', message: say(rule.tooLongMessage, rule) })
      }
    })

const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/

export const freeMailDomains = (form: InquiryFormConfig) =>
  (form.email.freeMailDomains ?? '')
    .split(/[\s,]+/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

export const buildInquirySchema = (form: InquiryFormConfig) => {
  const blocked = form.email.blockFreeMail ? freeMailDomains(form) : []
  const industries = (form.industry.options ?? []).map((o) => o.label)
  return z.object({
    name: text(form.name),
    email: z
      .string({ error: form.email.requiredMessage })
      .max(1000, form.email.invalidMessage)
      .transform(clean(false))
      .superRefine((v, ctx) => {
        if (!v) ctx.addIssue({ code: 'custom', message: form.email.requiredMessage })
        else if (v.length > 254 || !EMAIL.test(v)) ctx.addIssue({ code: 'custom', message: form.email.invalidMessage })
        else if (blocked.includes(v.split('@')[1].toLowerCase())) ctx.addIssue({ code: 'custom', message: form.email.freeMailMessage || form.email.invalidMessage })
      }),
    company: text(form.company),
    industry: z
      .string({ error: form.industry.requiredMessage })
      .max(500, form.industry.requiredMessage)
      .transform(clean(false))
      .superRefine((v, ctx) => {
        // Only the listed choices are accepted, so nothing else can be posted in their place.
        if (v ? !industries.includes(v) : form.industry.required) ctx.addIssue({ code: 'custom', message: form.industry.requiredMessage })
      }),
    message: text(form.message, true),
  })
}

export type InquirySchema = ReturnType<typeof buildInquirySchema>

export const validateField = (schema: InquirySchema, field: InquiryField, value: string): string => {
  const result = schema.shape[field].safeParse(value)
  return result.success ? '' : (result.error.issues[0]?.message ?? 'Please check this field.')
}

/** Whether a field is required, for the `required` attribute. Email always is. */
export const isRequired = (form: InquiryFormConfig, field: InquiryField) => (field === 'email' ? true : Boolean(form[field].required))
