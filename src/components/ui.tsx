import Image from 'next/image'
import Link from 'next/link'
import { createElement, type CSSProperties, Fragment } from 'react'

import { diagramData } from '@/diagrams/data'
import { mediaSrc } from '@/lib/mediaSrc'
import type { Media } from '@/payload-types'

export const css = (vars: Record<string, string | number | undefined | null>) => vars as CSSProperties

export const layerVar: Record<string, string> = {
  equipment: 'var(--l-equipment)',
  connectivity: 'var(--l-connect)',
  application: 'var(--l-app)',
  data: 'var(--l-data)',
  signalDeep: 'var(--signal-deep)',
}

export const delayStyle = (delay?: number | null) => (delay ? css({ '--d': `${delay}ms` }) : undefined)
export const revealAttr = (on?: boolean | null) => (on === false ? {} : { 'data-reveal': '' })
export const spaceClass = (step?: string | null) => (step ? `mt-${step}` : '')
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export function ArrowIcon() {
  return (
    <svg className="btn__arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

/** "*word*" becomes the italic serif accent used in the site's headlines. */
export function Accented({ text }: { text?: string | null }) {
  if (!text) return null
  return (
    <>
      {text.split(/\*([^*]+)\*/).map((part, i) => (
        i % 2 ? <span className="serif" key={i}>{part}</span> : <Fragment key={i}>{part}</Fragment>
      ))}
    </>
  )
}

type ButtonData = { label: string; href: string; style: string; arrow?: boolean | null }

export function Button({ button, style, reveal }: { button: ButtonData; style?: CSSProperties; reveal?: boolean }) {
  const ghostInk = button.style === 'ghostInk'
  const variant = ghostInk ? 'ghost' : button.style
  const inkVars = ghostInk ? css({ '--btn-fg': 'var(--ink)', '--btn-bd': 'rgba(9,13,22,.3)' }) : undefined
  return (
    <Link className={`btn btn--${variant}`} href={button.href} style={{ ...inkVars, ...style }} {...(reveal ? { 'data-reveal': '' } : {})}>
      {button.label}
      {button.arrow && <> <ArrowIcon /></>}
    </Link>
  )
}

export function Chip({ label, kind, as = 'span' }: { label?: string | null; kind?: string | null; as?: 'span' | 'figcaption' }) {
  if (!label) return null
  const Tag = as
  if (kind === 'concept') return <Tag className="chip chip--concept">{label}</Tag>
  if (kind && layerVar[kind]) return <Tag className="chip chip--dot" style={css({ '--chip-dot': layerVar[kind] })}>{label}</Tag>
  return <Tag className="chip">{label}</Tag>
}

type ImageProps = {
  media?: string | Media | null
  alt?: string | null
  sizes?: string
  priority?: boolean
  className?: string
}

export function CmsImage({ media, alt, sizes = '(max-width: 860px) 100vw, 50vw', priority, className }: ImageProps) {
  if (!media || typeof media === 'string' || !media.url) return null
  return (
    <Image
      className={className}
      src={mediaSrc(media.url)}
      alt={alt || media.alt}
      width={media.width ?? 800}
      height={media.height ?? 600}
      sizes={sizes}
      quality={90}
      priority={priority}
      unoptimized={media.mimeType === 'image/svg+xml'}
    />
  )
}

/** Renders the original SVG source unchanged, keeping its SMIL animation and internal ids intact. */
export function Diagram({ name, role }: { name?: string | null; role?: string }) {
  const diagram = name ? diagramData[name] : undefined
  if (!diagram) return null
  return createElement('svg', { ...diagram.attrs, ...(role ? { role } : {}), dangerouslySetInnerHTML: { __html: diagram.inner } })
}
