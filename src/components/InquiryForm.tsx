'use client'

import Link from 'next/link'
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { buildInquirySchema, INQUIRY_FIELDS as FIELDS, type InquiryField, type InquiryFormConfig, isRequired, validateField } from '@/lib/inquiry'

const Arrow = () => (
  <svg className="btn__arrow" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const empty = { name: '', email: '', company: '', industry: '', message: '' }

/** The Business Inquiry Form. Every label, rule and message comes from the CMS global of that name. */
export function InquiryForm({ form }: { form: InquiryFormConfig }) {
  const schema = useMemo(() => buildInquirySchema(form), [form])
  const industries = useMemo(() => form.industry.options ?? [], [form])
  const messageMax = form.message.maxLength
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState<Partial<Record<InquiryField, string>>>({})
  const [valid, setValid] = useState<Partial<Record<InquiryField, boolean>>>({})
  const [touched, setTouched] = useState<Partial<Record<InquiryField, boolean>>>({})
  const [summary, setSummary] = useState<InquiryField[]>([])
  const [sendError, setSendError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [website, setWebsite] = useState('')

  const summaryRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const focusName = useRef(false)
  // State updates land after the event, so a second click in the same instant still sees sending=false.
  const inFlight = useRef(false)

  const labels: Record<InquiryField, string> = {
    name: form.name.label,
    email: form.email.label,
    company: form.company.label,
    industry: form.industry.label,
    message: form.message.label,
  }

  // Pre-select industry from links like /contact?industry=dme
  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('industry')
    const match = industries.find((i) => i.key === key)
    // The query string is only readable in the browser; reading it here keeps the page cacheable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (match) setValues((v) => ({ ...v, industry: match.label }))
  }, [industries])

  useEffect(() => {
    if (sent) successRef.current?.focus()
    else if (focusName.current) {
      focusName.current = false
      nameRef.current?.focus()
    }
  }, [sent])

  const check = (field: InquiryField, value: string) => {
    const error = validateField(schema, field, value)
    setErrors((e) => ({ ...e, [field]: error }))
    setValid((v) => ({ ...v, [field]: !error && value.trim() !== '' }))
    return !error
  }

  const fieldProps = (field: InquiryField) => ({
    id: `f-${field}`,
    name: field,
    value: values[field],
    required: isRequired(form, field),
    placeholder: field === 'industry' ? undefined : form[field].placeholder || undefined,
    'aria-invalid': Boolean(errors[field]),
    onBlur: () => {
      if (values[field].trim() !== '' || touched[field]) check(field, values[field])
      setTouched((t) => ({ ...t, [field]: true }))
    },
    onChange: (e: { target: { value: string; tagName: string } }) => {
      const { value, tagName } = e.target
      setValues((v) => ({ ...v, [field]: value }))
      if (errors[field] || tagName === 'SELECT') check(field, value)
    },
  })

  const fieldClass = (field: InquiryField) => `field${errors[field] ? ' is-invalid' : ''}${valid[field] ? ' is-valid' : ''}`

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (inFlight.current) return
    setSendError(false)
    const invalid = FIELDS.filter((f) => !check(f, values[f]))
    setSummary(invalid)
    if (invalid.length) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    inFlight.current = true
    setSending(true)
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website }),
      })
      const result = await response.json().catch(() => null)
      if (response.ok && result?.ok) {
        setSent(true)
      } else if (response.status === 422 && result?.fields) {
        setErrors(result.fields)
        setSummary(Object.keys(result.fields) as InquiryField[])
        requestAnimationFrame(() => summaryRef.current?.focus())
      } else {
        setSendError(true)
        requestAnimationFrame(() => summaryRef.current?.focus())
      }
    } catch {
      setSendError(true)
      requestAnimationFrame(() => summaryRef.current?.focus())
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  const reset = () => {
    setValues(empty)
    setErrors({})
    setValid({})
    setTouched({})
    setSummary([])
    focusName.current = true
    setSent(false)
  }

  const error = (field: InquiryField): ReactNode => <p className="field__error" id={`f-${field}-error`}>{errors[field]}</p>
  const showSummary = summary.length > 0 || sendError

  return (
    <div className="form-card">
      <form id="inquiry-form" className="form" noValidate aria-labelledby="form-title" onSubmit={submit} hidden={sent}>
        <div className="stack stack--sm">
          <h2 id="form-title" style={{ fontSize: 'var(--fs-h3)' }}>{form.title}</h2>
          {form.intro && <p className="muted">{form.intro}</p>}
        </div>

        <div ref={summaryRef} className="form__summary" role="alert" tabIndex={-1} hidden={!showSummary}>
          {sendError ? <strong>{form.errorMessage}</strong> : (
            <>
              <strong>{summary.length === 1 ? form.summaryOne : form.summaryMany.replace('{count}', String(summary.length))}</strong>
              <ul>
                {summary.map((field) => (
                  <li key={field}>
                    <a href={`#f-${field}`} onClick={(ev) => { ev.preventDefault(); document.getElementById(`f-${field}`)?.focus() }}>{labels[field]}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="form__row">
          <div className={fieldClass('name')}>
            <label htmlFor="f-name">{labels.name}</label>
            <input ref={nameRef} {...fieldProps('name')} type="text" autoComplete="name" aria-describedby="f-name-error" />
            {error('name')}
          </div>
          <div className={fieldClass('email')}>
            <label htmlFor="f-email">{labels.email}</label>
            <input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" aria-describedby="f-email-error" />
            {error('email')}
          </div>
        </div>

        <div className="form__row">
          <div className={fieldClass('company')}>
            <label htmlFor="f-company">{labels.company}</label>
            <input {...fieldProps('company')} type="text" autoComplete="organization" aria-describedby="f-company-error" />
            {error('company')}
          </div>
          <div className={fieldClass('industry')}>
            <label htmlFor="f-industry">{labels.industry}</label>
            <select {...fieldProps('industry')} aria-describedby="f-industry-error">
              <option value="">{form.industry.placeholder}</option>
              {industries.map((option) => <option key={option.key} value={option.label}>{option.label}</option>)}
            </select>
            {error('industry')}
          </div>
        </div>

        <div className={fieldClass('message')}>
          <label htmlFor="f-message">{labels.message}</label>
          <textarea {...fieldProps('message')} maxLength={messageMax} aria-describedby="f-message-hint f-message-error" />
          {form.message.hint && <p className="field__hint" id="f-message-hint">{form.message.hint}</p>}
          <span className="field__count" aria-hidden="true">{values.message.length} / {messageMax}</span>
          {error('message')}
        </div>

        {/* Left empty by people; bots tend to fill it in. */}
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="f-website">Website</label>
          <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="form__footer">
          {form.privacyNote && <p className="field__hint" style={{ maxWidth: '36ch' }}>{form.privacyNote}</p>}
          <button className={`btn btn--signal${sending ? ' is-loading' : ''}`} type="submit" disabled={sending}>
            <span className="btn__label">{sending ? form.sendingLabel : form.submitLabel}</span>
            <span className="spinner" aria-hidden="true"></span>
            <Arrow />
          </button>
        </div>
      </form>

      <div id="inquiry-success" className="form-success" hidden={!sent}>
        <div className="form-success__icon">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#c8f25c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 ref={successRef} tabIndex={-1} style={{ fontSize: 'var(--fs-h3)' }}>{form.successHeading}</h2>
        {form.successBody && <p className="muted">{form.successBody}</p>}
        {sent && <dl className="summary-list">
          {FIELDS.filter((f) => f !== 'message').map((f) => (
            <FragmentRow key={f} label={labels[f]} value={values[f]} />
          ))}
        </dl>}
        <div className="btn-row">
          <button className="btn btn--ghost" type="button" onClick={reset}>{form.resetLabel}</button>
          {form.nextLabel && form.nextHref && <Link className="btn btn--ink" href={form.nextHref}>{form.nextLabel} <Arrow /></Link>}
        </div>
      </div>
    </div>
  )
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </>
  )
}
