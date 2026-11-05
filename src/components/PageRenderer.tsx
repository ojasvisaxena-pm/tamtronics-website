import Link from 'next/link'
import { Fragment } from 'react'

import { type Element, Elements } from '@/components/Elements'
import { InquiryForm } from '@/components/InquiryForm'
import { SectionNav } from '@/components/interactive'
import { Accented, Button, Chip, CmsImage, css, cx, delayStyle, Diagram, layerVar, revealAttr } from '@/components/ui'
import { getInquiryForm } from '@/lib/cms'
import { publicFormConfig } from '@/lib/inquiry'
import type { HeroBlock, Page, SectionBlock, SplitBlock } from '@/payload-types'

type LayoutBlock = NonNullable<Page['layout']>[number]

const backgroundClass = (background?: string | null) => {
  if (background === 'dark-lit') return 'section--dark lit'
  return `section--${background ?? 'paper'}`
}

const sectionProps = (block: SectionBlock | SplitBlock, key: string, labelled: boolean) => ({
  className: cx('section', backgroundClass(block.background), block.tight && 'section--tight'),
  id: block.anchorId ?? undefined,
  'aria-labelledby': labelled ? `${key}-title` : undefined,
  style: block.noTopPadding ? { paddingTop: 0 } : undefined,
})

const HERO_CLASS: Record<HeroBlock['variant'], string> = {
  home: 'hero hero--home lit',
  page: 'hero hero--page lit',
  compact: 'hero hero--page hero--compact lit',
  feature: 'hero lit',
}

function Hero({ block, prefix }: { block: HeroBlock; prefix: string }) {
  const pillars = block.pillars ?? []
  return (
    <section className={HERO_CLASS[block.variant]} aria-labelledby="hero-title">
      {pillars.length > 0 && (
        <div className="container">
          <p className="pillars">
            {pillars.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && <span className="pillar__sep" aria-hidden="true"><i></i></span>}
                <span className={`pillar pillar--${i + 1}`}>{p.word}</span>
              </Fragment>
            ))}
          </p>
        </div>
      )}
      <div className="container hero__grid">
        <div className="hero__copy">
          {block.breadcrumb && (
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{block.breadcrumb}</span>
            </nav>
          )}
          {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
          <h1 id="hero-title"><Accented text={block.heading} /></h1>
          {block.lede && <p className="lede">{block.lede}</p>}
          {block.buttons && block.buttons.length > 0 && (
            <div className="btn-row">{block.buttons.map((b) => <Button key={b.id} button={b} />)}</div>
          )}
          {block.chips && block.chips.length > 0 && (
            <div className="hero__meta">
              {block.chips.map((chip) => (
                <span className="chip chip--dot" style={css({ '--chip-dot': layerVar[chip.color] })} key={chip.id}>{chip.label}</span>
              ))}
            </div>
          )}
        </div>
        <Elements items={block.aside as Element[]} prefix={prefix} />
      </div>
    </section>
  )
}

function SectionHead({ head, titleId }: { head: SectionBlock['head']; titleId: string }) {
  const heading = (
    <h2 id={titleId} className={head.statement ? 'statement' : undefined}><Accented text={head.heading} /></h2>
  )
  if (head.layout === 'none') return null
  if (head.layout === 'hidden') return <h2 id={titleId} className="visually-hidden">{head.heading}</h2>
  if (head.layout === 'split') {
    const lede = <p className="lede" data-reveal={head.chipLabel ? undefined : ''} style={head.chipLabel ? undefined : delayStyle(head.ledeDelay)}>{head.lede}</p>
    return (
      <div className="section-head section-head--split">
        <div className="stack stack--sm" data-reveal="">
          {head.eyebrow && <span className="eyebrow">{head.eyebrow}</span>}
          {heading}
        </div>
        {head.chipLabel ? (
          <div className="stack stack--sm" data-reveal="" style={delayStyle(head.ledeDelay)}>
            {lede}
            <span className="chip chip--dot" style={css({ justifySelf: 'start', '--chip-dot': layerVar[head.chipKind ?? ''] })}>{head.chipLabel}</span>
          </div>
        ) : lede}
      </div>
    )
  }
  return (
    <div className="section-head" data-reveal="">
      {head.eyebrow && <span className="eyebrow">{head.eyebrow}</span>}
      {heading}
      {head.lede && <p className="lede">{head.lede}</p>}
    </div>
  )
}

function Section({ block, sectionKey }: { block: SectionBlock; sectionKey: string }) {
  const titleId = `${sectionKey}-title`
  const labelled = block.head.layout !== 'none' && Boolean(block.head.heading)
  return (
    <section {...sectionProps(block, sectionKey, labelled)}>
      <div className="container">
        <SectionHead head={block.head} titleId={titleId} />
        <Elements items={block.content as Element[]} prefix={sectionKey} />
      </div>
    </section>
  )
}

function Column({ column, titleId, prefix }: { column: NonNullable<SplitBlock['left']>; titleId?: string; prefix: string }) {
  const content = <Elements items={column.content as Element[]} titleId={titleId} prefix={prefix} />
  if (column.stacked === false) return content
  return (
    <div className={cx(column.prose && 'prose', 'stack')} {...revealAttr(column.reveal)} style={delayStyle(column.delay)}>
      {content}
    </div>
  )
}

function Split({ block, sectionKey }: { block: SplitBlock; sectionKey: string }) {
  const titleId = `${sectionKey}-title`
  const left = block.left ?? {}
  const right = block.right ?? {}
  const hasHeading = (items?: unknown[] | null) => (items as Element[] | undefined)?.some((el) => el.blockType === 'copy' && el.heading)
  const leftTitled = hasHeading(left.content)
  const labelled = leftTitled || Boolean(hasHeading(right.content))
  return (
    <section {...sectionProps(block, sectionKey, labelled)}>
      <div className={cx('container split', block.widths !== 'equal' && `split--${block.widths}`, block.alignTop && 'split--top')}>
        <Column column={left} titleId={leftTitled ? titleId : undefined} prefix={`${sectionKey}-l`} />
        <Column column={right} titleId={leftTitled ? undefined : titleId} prefix={`${sectionKey}-r`} />
      </div>
    </section>
  )
}

async function Block({ block, index }: { block: LayoutBlock; index: number }) {
  const key = `s${index}`
  switch (block.blockType) {
    case 'hero':
      return <Hero block={block} prefix={key} />
    case 'section':
      return <Section block={block} sectionKey={block.anchorId || key} />
    case 'split':
      return <Split block={block} sectionKey={block.anchorId || key} />
    case 'ctaBand':
      return (
        <section className="section section--tight cta-band" aria-labelledby={`${key}-title`}>
          <div className="container cta-band__inner">
            <div>
              <h2 id={`${key}-title`}>{block.heading}</h2>
              {block.body && <p>{block.body}</p>}
            </div>
            <div className="btn-row">{block.buttons?.map((b) => <Button key={b.id} button={b} />)}</div>
          </div>
        </section>
      )
    case 'industryNav':
      return <SectionNav ariaLabel={block.ariaLabel ?? 'Sections on this page'} items={block.items.map(({ label, anchorId }) => ({ label, anchorId }))} />
    case 'industry':
      return (
        <section className={`section section--${block.background}`} id={block.anchorId} aria-labelledby={`${block.anchorId}-title`}>
          <div className={cx('container industry', block.flip && 'industry--flip')}>
            <div className={cx('industry__art', block.image && 'industry__art--photo')} data-reveal="">
              {block.image ? <CmsImage media={block.image} alt={block.imageAlt} /> : <Diagram name={block.diagram} />}
              <Chip label={block.chipLabel} kind={block.chipKind} />
            </div>
            <div className="industry__copy">
              <div className="stack stack--sm" data-reveal="">
                {block.eyebrow && <span className="eyebrow">{block.eyebrow}</span>}
                <h2 id={`${block.anchorId}-title`}>{block.heading}</h2>
              </div>
              {block.blocks?.map((item) => (
                <div className="industry__block" data-reveal="" key={item.id}>
                  <h3>{item.title}</h3>
                  {item.body && <p>{item.body}</p>}
                  {item.questions && item.questions.length > 0 && (
                    <ul className="questions">{item.questions.map((q) => <li key={q.id}>{q.text}</li>)}</ul>
                  )}
                </div>
              ))}
              <Button button={{ label: block.ctaLabel, href: block.ctaHref, style: 'ink', arrow: true }} style={{ justifySelf: 'start' }} reveal />
            </div>
          </div>
        </section>
      )
    case 'contactForm':
      return (
        <section className="section section--paper" aria-labelledby="form-title">
          <div className="container form-shell">
            <InquiryForm form={publicFormConfig(await getInquiryForm())} />
            <aside className="stack" aria-labelledby={`${key}-aside-title`}>
              <Elements items={block.aside as Element[]} titleId={`${key}-aside-title`} prefix={`${key}-aside`} />
            </aside>
          </div>
        </section>
      )
    default:
      return null
  }
}

export function PageRenderer({ page }: { page: Page }) {
  const structuredData = page.seo?.structuredData
  return (
    <>
      {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData.replace(/</g, '\\u003c') }} />}
      {page.layout?.map((block, i) => <Block block={block} index={i} key={block.id ?? i} />)}
    </>
  )
}
