import Link from 'next/link'

export const metadata = { title: 'Page not found | Tamtronics', robots: { index: false } }

export default function NotFound() {
  return (
    <section className="hero hero--page hero--compact lit" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <span className="eyebrow">404</span>
          <h1 id="hero-title">This page could not be found.</h1>
          <p className="lede">The address may have changed. The home page is a good place to start again.</p>
          <div className="btn-row">
            <Link className="btn btn--signal" href="/">Back to home</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
