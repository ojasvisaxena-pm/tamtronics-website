'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { Header, Media } from '@/payload-types'

const Arrow = () => (
  <svg className="btn__arrow" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function SiteHeader({ header }: { header: Header }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const logo = header.logo as Media
  const items = header.navItems ?? []
  const current = (href: string) => (href === pathname ? ('page' as const) : undefined)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    if (open) menuRef.current?.querySelector('a')?.focus()
    return () => document.body.classList.remove('menu-open')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onResize = () => {
      if (window.innerWidth > 960) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  return (
    <>
      <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' menu-active' : ''}`}>
        <div className="container nav">
          <Link className="wordmark" href="/" aria-label="Tamtronics home">
            <Image className="wordmark__img" src={logo.url!} alt={logo.alt} width={logo.width ?? 791} height={logo.height ?? 186} quality={90} priority sizes="240px" />
          </Link>
          <nav aria-label="Primary">
            <ul className="nav__links">
              {items.filter((i) => !i.mobileOnly).map((item) => (
                <li key={item.id}><Link href={item.href} aria-current={current(item.href)}>{item.label}</Link></li>
              ))}
            </ul>
          </nav>
          <Link className="btn btn--signal nav__cta" href={header.ctaHref} aria-current={current(header.ctaHref)}>{header.ctaLabel}</Link>
          <button
            ref={toggleRef}
            className="nav__toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span></span>
          </button>
        </div>
      </header>
      <div
        ref={menuRef}
        className={`mobile-menu${open ? ' is-open' : ''}`}
        id="mobile-menu"
        inert={!open}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setOpen(false)
        }}
      >
        <nav aria-label="Mobile">
          <ul>
            {items.map((item, i) => (
              <li key={item.id}>
                <Link href={item.href} aria-current={current(item.href)}>
                  {item.label}<span>{String(i + 1).padStart(2, '0')}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className="btn btn--signal" href={header.ctaHref}>{header.ctaLabel} <Arrow /></Link>
      </div>
    </>
  )
}
