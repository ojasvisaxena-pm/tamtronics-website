'use client'

import { type CSSProperties, type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const animateIn = (el?: Element | null) => {
  if (!el || reducedMotion()) return
  el.classList.remove('is-entering')
  void (el as HTMLElement).offsetWidth // restart animation
  el.classList.add('is-entering')
}

const tabKeyTarget = (e: KeyboardEvent, i: number, count: number) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return (i + 1) % count
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return (i - 1 + count) % count
  if (e.key === 'Home') return 0
  if (e.key === 'End') return count - 1
  return null
}

const styleVars = (vars: Record<string, string>) => vars as CSSProperties

/* ---------- Four-layer architecture ---------- */

export type ArchLayer = { key: string; color: string; title: string; subtitle: string; body: string; points: string[] }

export function ArchExplorerClient(props: { idPrefix: string; layers: ArchLayer[]; glanceTitle: string; autoCycle: boolean; stage: ReactNode }) {
  const { idPrefix, layers, glanceTitle, autoCycle, stage } = props
  const [current, setCurrent] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const touched = useRef(false)
  const panels = useRef<Array<HTMLDivElement | null>>([])

  const stopCycle = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  const selectByUser = useCallback(
    (i: number) => {
      touched.current = true
      stopCycle()
      setCurrent(i)
    },
    [stopCycle],
  )

  // The plates live in the static SVG, so they are wired up directly.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const plates = Array.from(el.querySelectorAll<SVGGElement>('.arch-plate'))
    const onClick = (e: Event) => {
      const plate = (e.target as Element).closest<SVGGElement>('.arch-plate')
      if (!plate) return
      const idx = layers.findIndex((l) => l.key === plate.dataset.layer)
      if (idx >= 0) selectByUser(idx)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick(e)
      }
    }
    plates.forEach((p) => {
      p.addEventListener('click', onClick)
      p.addEventListener('keydown', onKey)
    })
    return () => {
      plates.forEach((p) => {
        p.removeEventListener('click', onClick)
        p.removeEventListener('keydown', onKey)
      })
    }
  }, [layers, selectByUser])

  useEffect(() => {
    const layer = layers[current]?.key
    root.current?.querySelectorAll<SVGGElement>('.arch-plate').forEach((p) => p.classList.toggle('is-active', p.dataset.layer === layer))
    animateIn(panels.current[current])
  }, [current, layers])

  // Gentle auto-cycle while in view, until the visitor interacts.
  useEffect(() => {
    const el = root.current
    if (!el || !autoCycle) return
    const start = () => {
      if (timer.current || touched.current || reducedMotion()) return
      timer.current = setInterval(() => setCurrent((c) => (c + 1) % layers.length), 5200)
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stopCycle())),
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      stopCycle()
    }
  }, [autoCycle, layers.length, stopCycle])

  return (
    <div
      ref={root}
      className="arch"
      data-arch=""
      data-active={layers[current]?.key}
      onPointerEnter={stopCycle}
      onFocus={() => {
        touched.current = true
        stopCycle()
      }}
    >
      <div className="arch__stage">{stage}</div>
      <div className="arch__tabs">
        {layers.map((layer, i) => (
          <ArchTab key={layer.key} {...{ layer, i, idPrefix, glanceTitle }} on={i === current} count={layers.length} select={selectByUser} panelRef={(el) => { panels.current[i] = el }} />
        ))}
      </div>
    </div>
  )
}

function ArchTab(props: { layer: ArchLayer; i: number; idPrefix: string; glanceTitle: string; on: boolean; count: number; select: (i: number) => void; panelRef: (el: HTMLDivElement | null) => void }) {
  const { layer, i, idPrefix, glanceTitle, on, count, select, panelRef } = props
  const tabId = `${idPrefix}-tab-${layer.key}`
  const panelId = `${idPrefix}-panel-${layer.key}`
  const color = styleVars({ '--c': layer.color })
  return (
    <>
      <button
        className="arch__tab"
        id={tabId}
        aria-controls={panelId}
        aria-expanded={on}
        tabIndex={on ? 0 : -1}
        data-layer={layer.key}
        style={color}
        onClick={() => select(i)}
        onKeyDown={(e) => {
          const next = tabKeyTarget(e, i, count)
          if (next === null) return
          e.preventDefault()
          select(next)
          const sibling = e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('.arch__tab')[next]
          sibling?.focus()
        }}
      >
        <span className="arch__tab-num">{String(i + 1).padStart(2, '0')}</span>
        <span className="arch__tab-title">{layer.title}<span className="arch__tab-sub">{layer.subtitle}</span></span>
        <svg className="arch__tab-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      <div ref={panelRef} className="arch__panel" role="region" id={panelId} aria-labelledby={tabId} style={color} hidden={!on}>
        <p>{layer.body}</p>
        <h4>{glanceTitle}</h4>
        <ul>{layer.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
    </>
  )
}

/* ---------- First implementation walkthrough ---------- */

export type WalkStep = {
  color: string
  stageLabel: string
  tabTitle: string
  sceneClass: string
  scene: ReactNode
  heading: string
  body: string
  factLabel?: string | null
  factText?: string | null
}

export function WalkthroughClient({ idPrefix, steps, interval }: { idPrefix: string; steps: WalkStep[]; interval: number }) {
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hidePlay, setHidePlay] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const panels = useRef<Array<HTMLDivElement | null>>([])
  const scenes = useRef<Array<HTMLDivElement | null>>([])
  const started = useRef(false)

  const selectByUser = (i: number) => {
    setPlaying(false)
    setCurrent(i)
  }

  useEffect(() => {
    animateIn(panels.current[current])
    const scene = scenes.current[current]
    animateIn(scene)
    // restart the animation inside the newly shown scene
    const svg = scene?.querySelector('svg')
    if (svg?.setCurrentTime && !reducedMotion()) svg.setCurrentTime(0)
  }, [current])

  useEffect(() => {
    if (!playing) return
    const el = root.current
    // re-trigger the progress bar animation
    el?.classList.remove('is-playing')
    void el?.offsetWidth
    el?.classList.add('is-playing')
    const timer = setTimeout(() => setCurrent((c) => (c < steps.length - 1 ? c + 1 : 0)), interval)
    return () => {
      clearTimeout(timer)
      el?.classList.remove('is-playing')
    }
  }, [playing, current, steps.length, interval])

  // Autoplay once when the walkthrough first scrolls into view.
  useEffect(() => {
    const el = root.current
    if (!el) return
    if (reducedMotion()) {
      // The motion preference is only known in the browser.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidePlay(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started.current) {
          started.current = true
          setPlaying(true)
          observer.disconnect()
        }
      },
      { threshold: 0.45 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={root} className="walk" data-walk="" data-reveal="" style={styleVars({ '--walk-ms': `${interval}ms` })}>
      <div className="walk__steps" role="tablist" aria-label="Implementation stages">
        {steps.map((step, i) => (
          <button
            key={step.stageLabel}
            className="walk__step"
            role="tab"
            id={`${idPrefix}-t-${i}`}
            aria-controls={`${idPrefix}-p-${i}`}
            aria-selected={i === current}
            tabIndex={i === current ? 0 : -1}
            style={styleVars({ '--c': step.color })}
            onClick={() => selectByUser(i)}
            onKeyDown={(e) => {
              const next = tabKeyTarget(e, i, steps.length)
              if (next === null) return
              e.preventDefault()
              selectByUser(next)
              e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
            }}
          >
            <span className="mono">{step.stageLabel}</span>
            <strong>{step.tabTitle}</strong>
            <span className="walk__bar"></span>
          </button>
        ))}
      </div>

      <div className="walk__body">
        <div className="walk__scene">
          {steps.map((step, i) => (
            <div key={step.stageLabel} ref={(el) => { scenes.current[i] = el }} className={step.sceneClass} hidden={i !== current}>
              {step.scene}
            </div>
          ))}
        </div>
        <div>
          {steps.map((step, i) => (
            <div
              key={step.stageLabel}
              ref={(el) => { panels.current[i] = el }}
              className="walk__panel"
              role="tabpanel"
              id={`${idPrefix}-p-${i}`}
              aria-labelledby={`${idPrefix}-t-${i}`}
              style={styleVars({ '--c': step.color })}
              hidden={i !== current}
            >
              <h3>{step.heading}</h3>
              <p>{step.body}</p>
              {step.factLabel && <dl><div><dt>{step.factLabel}</dt><dd>{step.factText}</dd></div></dl>}
            </div>
          ))}
        </div>
      </div>

      <div className="walk__controls">
        <span className="mono" aria-live="polite" style={{ color: 'var(--text-inv-muted)' }}>Stage {current + 1} of {steps.length}</span>
        <div className="btn-row">
          <button className="icon-btn" type="button" hidden={hidePlay} aria-pressed={playing} aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'} onClick={() => setPlaying((p) => !p)}>
            {!playing && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5l8 5-8 5z" fill="currentColor" /></svg>}
            {playing && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 5h3v10H6zM11 5h3v10h-3z" fill="currentColor" /></svg>}
          </button>
          <button className="icon-btn" type="button" aria-label="Previous stage" disabled={current === 0} onClick={() => selectByUser(current - 1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </button>
          <button className="icon-btn" type="button" aria-label="Next stage" disabled={current === steps.length - 1} onClick={() => selectByUser(current + 1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Sticky section menu: highlight the current section ---------- */

export function SectionNav({ ariaLabel, items }: { ariaLabel: string; items: Array<{ label: string; anchorId: string }> }) {
  const [active, setActive] = useState<string | null>(null)
  const nav = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          setActive(entry.target.id)
          nav.current?.querySelector(`a[href="#${entry.target.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    items.forEach((item) => {
      const section = document.getElementById(item.anchorId)
      if (section) observer.observe(section)
    })
    return () => observer.disconnect()
  }, [items])

  return (
    <nav ref={nav} className="ind-nav" aria-label={ariaLabel} data-subnav="">
      <div className="container">
        <ul>
          {items.map((item) => (
            <li key={item.anchorId}>
              <a href={`#${item.anchorId}`} className={active === item.anchorId ? 'is-active' : undefined} aria-current={active === item.anchorId ? 'true' : undefined}>{item.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
