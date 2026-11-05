'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="hero hero--page hero--compact lit" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <h1 id="hero-title">Something went wrong.</h1>
          <p className="lede">This page could not be loaded. Please try again in a moment.</p>
          <div className="btn-row">
            <button className="btn btn--signal" type="button" onClick={reset}>Try again</button>
          </div>
        </div>
      </div>
    </section>
  )
}
