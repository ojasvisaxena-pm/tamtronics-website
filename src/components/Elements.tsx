import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { Fragment, type ReactNode } from 'react'

import { ArchExplorerClient, type WalkStep, WalkthroughClient } from '@/components/interactive'
import {
  Accented,
  ArrowIcon,
  Button,
  Chip,
  CmsImage,
  css,
  cx,
  delayStyle,
  Diagram,
  InfoIcon,
  layerVar,
  revealAttr,
  spaceClass,
} from '@/components/ui'
import { UsageChart } from '@/components/UsageChart'
import { getLayers } from '@/lib/cms'
import type {
  ArchExplorerElement,
  CollageElement,
  CopyElement,
  LayerDetailElement,
  Page,
  PhotoElement,
  WalkthroughElement,
} from '@/payload-types'

type Sections = Extract<NonNullable<Page['layout']>[number], { blockType: 'section' }>
export type Element = NonNullable<Sections['content']>[number]

const PIPELINE_COLORS = ['equipment', 'connectivity', 'application', 'data']
const PHONE_SIZES = '(max-width: 560px) 50vw, 25vw'

function Copy({ el, titleId }: { el: CopyElement; titleId?: string }) {
  return (
    <>
      {el.eyebrow && <span className="eyebrow">{el.eyebrow}</span>}
      {el.heading && (
        <h2 id={titleId} className={el.statement ? 'statement' : undefined} style={el.smallHeading ? { fontSize: 'var(--fs-h3)' } : undefined}>
          <Accented text={el.heading} />
        </h2>
      )}
      {el.lede && <p className="lede" style={el.ledeStrong ? { color: 'var(--text)' } : undefined}>{el.lede}</p>}
      {el.paragraphs?.map((p) => <p className="muted" key={p.id}>{p.text}</p>)}
      {el.linkLabel && el.linkHref && <Link className="text-link" href={el.linkHref}>{el.linkLabel} <ArrowIcon /></Link>}
    </>
  )
}

function Photo({ el }: { el: PhotoElement }) {
  return (
    <figure
      className={cx('photo', el.contain && 'photo--contain', spaceClass(el.spaceAbove))}
      style={{ aspectRatio: el.aspectRatio ?? undefined, maxWidth: el.maxWidth ?? undefined }}
    >
      <CmsImage media={el.image} alt={el.imageAlt} />
      {el.caption && <figcaption className="chip">{el.caption}</figcaption>}
    </figure>
  )
}

function Collage({ el }: { el: CollageElement }) {
  return (
    <div data-reveal="">
      <div className="collage">
        <figure className="photo photo--contain collage__device">
          <CmsImage media={el.device} alt={el.deviceAlt} priority={el.priority ?? false} />
          <Chip as="figcaption" label={el.deviceCaption} kind="equipment" />
        </figure>
        <figure className="photo collage__plug collage__signal">
          <Diagram name="signal-tile" />
          {el.signalCaption && <figcaption className="chip chip--dot" style={css({ '--chip-dot': '#5c8a00' })}>{el.signalCaption}</figcaption>}
        </figure>
        <figure className="collage__phone phone-shot">
          <CmsImage media={el.phone} alt={el.phoneAlt} priority={el.priority ?? false} sizes="(max-width: 960px) 40vw, 20vw" />
          <Chip as="figcaption" label={el.phoneCaption} kind="application" />
        </figure>
      </div>
    </div>
  )
}

async function ArchExplorer({ el, idPrefix }: { el: ArchExplorerElement; idPrefix: string }) {
  const data = await getLayers()
  const layers = (data.layers ?? []).map((layer) => ({
    key: layer.key,
    color: layerVar[layer.key],
    title: layer.title,
    subtitle: layer.subtitle,
    body: layer.body,
    points: layer.points?.map((p) => p.text) ?? [],
  }))
  return (
    <div data-reveal="">
      <ArchExplorerClient idPrefix={idPrefix} layers={layers} glanceTitle={data.glanceTitle} autoCycle={el.autoCycle !== false} stage={<Diagram name="architecture" role="group" />} />
    </div>
  )
}

function Walkthrough({ el, idPrefix }: { el: WalkthroughElement; idPrefix: string }) {
  const steps: WalkStep[] = el.steps.map((step) => {
    const images = step.images ?? []
    let scene: ReactNode
    let sceneClass = 'walk__scene-item'
    if (step.visual === 'photo') {
      sceneClass += ' walk__scene-item--photo'
      scene = <CmsImage media={images[0]?.image} alt={images[0]?.imageAlt} />
    } else if (step.visual === 'phones') {
      sceneClass += ' walk__scene-item--phones'
      scene = images.map((img) => (
        <span className="phone-shot" key={img.id}><CmsImage media={img.image} alt={img.imageAlt} sizes="25vw" /></span>
      ))
    } else {
      scene = <Diagram name={step.diagram} />
    }
    return {
      color: layerVar[step.color],
      stageLabel: step.stageLabel,
      tabTitle: step.tabTitle,
      sceneClass,
      scene: <>{scene}<Chip label={step.chipLabel} kind={step.chipKind} /></>,
      heading: step.heading,
      body: step.body,
      factLabel: step.factLabel,
      factText: step.factText,
    }
  })
  return <WalkthroughClient idPrefix={idPrefix} steps={steps} interval={el.intervalMs ?? 7000} />
}

function LayerDetail({ el }: { el: LayerDetailElement }) {
  const border = el.closeSection ? { borderBlock: '1px solid var(--line)' } : { borderTop: '1px solid var(--line)' }
  return (
    <article className="split split--top" style={{ paddingBlock: 'var(--s-7)', ...border }} id={el.anchorId ?? undefined} data-reveal="">
      <div className="stack stack--sm">
        <Diagram name={el.icon} />
        <span className="mono muted">{el.label}</span>
        <h3 style={{ fontSize: 'var(--fs-h2)' }}>{el.title}</h3>
        {el.visual === 'photo' && (
          <figure className="photo photo--contain layer-photo">
            <CmsImage media={el.image} alt={el.imageAlt} sizes="360px" />
            {el.visualCaption && <figcaption className="chip">{el.visualCaption}</figcaption>}
          </figure>
        )}
        {el.visual === 'signal' && (
          <figure className="photo layer-photo collage__signal">
            <Diagram name="signal-tile" />
            {el.visualCaption && <figcaption className="chip">{el.visualCaption}</figcaption>}
          </figure>
        )}
        {el.visual === 'phone' && (
          <figure className="layer-phone phone-shot">
            <CmsImage media={el.image} alt={el.imageAlt} sizes="220px" />
            {el.visualCaption && <figcaption className="chip">{el.visualCaption}</figcaption>}
          </figure>
        )}
      </div>
      <div className="stack">
        <p className="lede" style={{ color: 'var(--text)' }}>{el.lede}</p>
        <div className="grid grid--2">
          {el.facts?.map((fact) => (
            <div key={fact.id}><h4>{fact.title}</h4><p className="muted mt-2">{fact.body}</p></div>
          ))}
        </div>
        {el.note && <div className="note"><InfoIcon /><span>{el.note}</span></div>}
      </div>
    </article>
  )
}

function ElementView({ el, titleId, idPrefix }: { el: Element; titleId?: string; idPrefix: string }) {
  switch (el.blockType) {
    case 'copy':
      return <Copy el={el} titleId={titleId} />
    case 'richText':
      return <div className="prose stack"><RichText data={el.content} /></div>
    case 'photo':
      return <Photo el={el} />
    case 'cards':
      return (
        <div className={cx('grid', `grid--${Math.min(el.items.length, 4)}`, spaceClass(el.spaceAbove))}>
          {el.items.map((item, i) => (
            <div className="card" data-reveal="" style={delayStyle(i * 80)} key={item.id}>
              {item.label && <span className="card__num">{item.label}</span>}
              <h3>{item.title}</h3>
              {item.body && <p>{item.body}</p>}
            </div>
          ))}
        </div>
      )
    case 'ruledList':
      return (
        <ol className="ruled" {...revealAttr(el.reveal)} style={delayStyle(el.delay)}>
          {el.items.map((item, i) => (
            <li key={item.id}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}</div>
            </li>
          ))}
        </ol>
      )
    case 'buttons': {
      const buttons = el.buttons ?? []
      if (el.layout === 'single') {
        return <>{buttons.map((b) => <Button key={b.id} button={b} style={{ justifySelf: 'start' }} />)}</>
      }
      return (
        <div className={cx(el.layout === 'stack' ? 'stack stack--sm' : 'btn-row', spaceClass(el.spaceAbove))}>
          {buttons.map((b) => <Button key={b.id} button={b} />)}
        </div>
      )
    }
    case 'note':
      return <div className={cx('note', spaceClass(el.spaceAbove))} {...revealAttr(el.reveal)}><InfoIcon /><span>{el.text}</span></div>
    case 'smallPrint':
      return <p className={cx('mono', spaceClass(el.spaceAbove))} style={{ color: 'var(--text-inv-muted)' }}>{el.text}</p>
    case 'diagramFigure': {
      const diagram = <Diagram name={el.diagram} />
      const card = el.variant === 'card'
      return (
        <figure
          className={cx('figure', el.variant === 'hero' && 'hero-visual', card && 'relation card')}
          {...revealAttr(el.reveal)}
          style={{ ...delayStyle(el.delay), ...(card ? { padding: 'clamp(1rem,.5rem + 2vw,2.5rem)' } : {}) }}
        >
          {el.variant === 'scene' ? <div className="walk__scene">{diagram}</div> : diagram}
          {(el.tag || el.caption) && (
            <figcaption className="figure__caption">
              {el.tag && <span className="chip chip--concept">{el.tag}</span>}
              {el.caption && <span>{el.caption}</span>}
            </figcaption>
          )}
        </figure>
      )
    }
    case 'collage':
      return <Collage el={el} />
    case 'usageChart':
      return <div data-reveal="" id="usage"><UsageChart block={el} /></div>
    case 'tiles':
      return (
        <div className={cx('grid', `grid--${Math.min(el.items.length, 4)}`)}>
          {el.items.map((tile, i) => (
            <Link className="card tile" href={tile.href} data-reveal="" style={delayStyle(i * 80)} key={tile.id}>
              <div className={cx('tile__art', tile.image && 'tile__art--photo')}>
                {tile.image ? <CmsImage media={tile.image} alt={tile.imageAlt} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" /> : <Diagram name={tile.diagram} />}
              </div>
              <div className="tile__body"><h3>{tile.title}</h3>{tile.body && <p>{tile.body}</p>}</div>
            </Link>
          ))}
        </div>
      )
    case 'pipeline':
      return (
        <ol className="pipeline" style={css({ '--n': el.items.length })} data-reveal="">
          {el.items.map((item, i) => (
            <li key={item.id}>
              <span className="pipeline__dot" style={css({ '--c': layerVar[PIPELINE_COLORS[i]] })}>{String(i + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              {item.body && <p>{item.body}</p>}
            </li>
          ))}
        </ol>
      )
    case 'compare':
      return (
        <div className="compare" data-reveal="">
          {el.columns.map((col) => (
            <div key={col.id}>
              {col.label && <span className="mono muted">{col.label}</span>}
              <h3>{col.title}</h3>
              <ul className={cx('checks', col.negative && 'checks--x')}>
                {col.items.map((item) => <li key={item.id}>{item.text}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )
    case 'signals':
      return (
        <div className="signals" data-reveal="">
          {el.items.map((item) => (
            <div key={item.id}><Diagram name={item.diagram} /><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}</div>
          ))}
        </div>
      )
    case 'screens':
      return (
        <div className="screens screens--real">
          {el.items.map((item, i) => (
            <figure className="screen" data-reveal="" style={delayStyle((i + 1) * 60)} key={item.id}>
              <span className="phone-shot"><CmsImage media={item.image} alt={item.imageAlt} sizes={PHONE_SIZES} /></span>
              <figcaption><span>{String(i + 1).padStart(2, '0')}</span>{item.caption}</figcaption>
            </figure>
          ))}
        </div>
      )
    case 'layerDetail':
      return <LayerDetail el={el} />
    case 'archExplorer':
      return <ArchExplorer el={el} idPrefix={idPrefix} />
    case 'walkthrough':
      return <Walkthrough el={el} idPrefix={idPrefix} />
    default:
      return null
  }
}

/** The first text element with a heading takes titleId, which labels the surrounding section. */
export function Elements({ items, titleId, prefix }: { items?: Element[] | null; titleId?: string; prefix: string }) {
  if (!items?.length) return null
  const titled = items.findIndex((el) => el.blockType === 'copy' && el.heading)
  return (
    <>
      {items.map((el, i) => (
        <Fragment key={el.id ?? i}>
          <ElementView el={el} titleId={i === titled ? titleId : undefined} idPrefix={`${prefix}-${i}`} />
        </Fragment>
      ))}
    </>
  )
}
