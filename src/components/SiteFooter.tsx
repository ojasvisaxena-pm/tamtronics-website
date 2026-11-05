import Link from 'next/link'

import { ArrowIcon, CmsImage } from '@/components/ui'
import type { Footer } from '@/payload-types'

export function SiteFooter({ footer }: { footer: Footer }) {
  const copyright = footer.copyright?.replace('{year}', String(new Date().getFullYear()))
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link className="wordmark" href="/" aria-label="Tamtronics home">
              <CmsImage className="wordmark__img" media={footer.logo} sizes="240px" />
            </Link>
            {footer.description && <p>{footer.description}</p>}
            <Link className="btn btn--signal" href={footer.ctaHref}>{footer.ctaLabel} <ArrowIcon /></Link>
          </div>
          {footer.columns?.map((column) => (
            <div className="footer__col" key={column.id}>
              <h2>{column.title}</h2>
              <ul>
                {column.links?.map((link) => <li key={link.id}><Link href={link.href}>{link.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer__bottom">
          {copyright && <p>{copyright}</p>}
          {footer.disclaimer && <p>{footer.disclaimer}</p>}
        </div>
        {footer.giantWord && <div className="footer__giant" aria-hidden="true">{footer.giantWord}</div>}
      </div>
    </footer>
  )
}
