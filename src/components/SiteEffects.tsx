'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Scroll reveal and SVG animation control. Re-applied after each client-side page change. */
export function SiteEffects() {
  const pathname = usePathname()

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const items = document.querySelectorAll('[data-reveal]:not(.is-in)')
    let revealObserver: IntersectionObserver | undefined
    if (!('IntersectionObserver' in window) || reduced.matches) {
      items.forEach((el) => el.classList.add('is-in'))
    } else {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in')
              revealObserver?.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
      )
      items.forEach((el) => revealObserver?.observe(el))
    }

    const animated = Array.from(document.querySelectorAll<SVGSVGElement>('svg[data-animated]')).filter(
      (svg) => typeof svg.pauseAnimations === 'function',
    )
    const applyPreference = () => {
      animated.forEach((svg) => (reduced.matches ? svg.pauseAnimations() : svg.unpauseAnimations()))
    }
    applyPreference()
    reduced.addEventListener('change', applyPreference)

    // Save CPU: only run looping animations while visible.
    const motionObserver = new IntersectionObserver((entries) => {
      if (reduced.matches) return
      entries.forEach((entry) => {
        const svg = entry.target as SVGSVGElement
        if (entry.isIntersecting) svg.unpauseAnimations()
        else svg.pauseAnimations()
      })
    })
    animated.forEach((svg) => motionObserver.observe(svg))

    return () => {
      revealObserver?.disconnect()
      motionObserver.disconnect()
      reduced.removeEventListener('change', applyPreference)
    }
  }, [pathname])

  return null
}
