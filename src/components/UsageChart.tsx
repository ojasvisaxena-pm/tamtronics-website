import { css } from '@/components/ui'
import type { UsageChartElement } from '@/payload-types'

const DAY_START = 6 * 60
const DAY_MINUTES = 18 * 60 // 6 AM to midnight
const WIDTH = 600
const TICKS = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM']

const toMinutes = (time: string) => {
  const [, h, m, ap] = time.match(/^(\d+):(\d+) (AM|PM)$/) ?? []
  return ((Number(h) % 12) + (ap === 'PM' ? 12 : 0)) * 60 + Number(m)
}

const toClock = (minutes: number) => {
  const h24 = Math.floor(minutes / 60) % 24
  return `${h24 % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

const WarningIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5l7 12.5H1z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 6v3.5M8 11.6v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export function UsageChart({ block }: { block: UsageChartElement }) {
  const units = block.units.map((unit) => {
    const sessions = unit.sessions ?? []
    const total = sessions.reduce((sum, s) => sum + s.minutes, 0)
    return { ...unit, sessions, total, average: sessions.length ? Math.round(total / sessions.length) : 0 }
  })
  const busiest = Math.max(1, ...units.map((u) => u.total))
  const sessionCount = units.reduce((sum, u) => sum + u.sessions.length, 0)
  const activeCount = units.filter((u) => u.sessions.length).length
  const idleCount = units.length - activeCount

  return (
    <figure className="usage" aria-labelledby="usage-cap">
      <div className="usage__head">
        <div>
          <p className="usage__title" id="usage-cap">{block.title}</p>
          {block.subtitle && <p className="usage__sub">{block.subtitle}</p>}
        </div>
        {block.tag && <span className="chip chip--concept">{block.tag}</span>}
      </div>
      <div className="usage__grid">
        <div className="usage__axis" aria-hidden="true">
          <div></div>
          <div className="usage__ticks">
            {TICKS.map((tick, i) => <span key={tick} style={{ left: `${((i / (TICKS.length - 1)) * 100).toFixed(3)}%` }}>{tick}</span>)}
          </div>
          <span className="usage__k">Sessions / day</span>
          <span className="usage__k">Avg. session</span>
          <span className="usage__k">Daily use</span>
        </div>
        {units.map((unit) => {
          const idle = unit.sessions.length === 0
          return (
            <div className={`usage__row${idle ? ' usage__row--idle' : ''}`} key={unit.id ?? unit.name}>
              <div className="usage__unit"><strong>{unit.name}</strong><span>{unit.location}</span></div>
              <div className="usage__timeline">
                <svg className="usage__track" viewBox="0 0 600 32" preserveAspectRatio="none">
                  <rect width="600" height="32" rx="6" fill="#10141d" fillOpacity=".035" />
                  {[100, 200, 300, 400, 500].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="32" stroke="#10141d" strokeOpacity=".08" />)}
                  {unit.sessions.map((session, i) => {
                    const start = toMinutes(session.start)
                    const x = ((start - DAY_START) / DAY_MINUTES) * WIDTH
                    const width = (session.minutes / DAY_MINUTES) * WIDTH
                    const label = `${unit.name} · session ${i + 1}: ${session.start} – ${toClock(start + session.minutes)} (${session.minutes} min)`
                    return (
                      <g className="usage__sess" role="img" tabIndex={0} aria-label={label} key={session.id ?? i}>
                        <title>{label}</title>
                        <rect x={(x - 4).toFixed(1)} y="0" width={(width + 8).toFixed(1)} height="32" fill="transparent" />
                        <rect className="usage__block" x={x.toFixed(1)} y="5" width={width.toFixed(1)} height="22" rx="4" />
                      </g>
                    )
                  })}
                  {idle && <rect x="0" y="5" width="600" height="22" rx="4" fill="none" stroke="#b7791f" strokeOpacity=".55" strokeDasharray="4 4" />}
                </svg>
                {idle && unit.idleNote && <span className="usage__flag"><WarningIcon />{unit.idleNote}</span>}
              </div>
              <div className="usage__stat" aria-hidden="true"><span className="usage__k">Sessions / day</span><span className="usage__v">{unit.sessions.length}</span></div>
              <div className="usage__stat" aria-hidden="true"><span className="usage__k">Avg. session</span><span className="usage__v">{idle ? '—' : `${unit.average} min`}</span></div>
              <div className="usage__stat usage__stat--total" aria-hidden="true">
                <span className="usage__k">Daily use</span>
                <span className="usage__v">{idle ? 'None' : duration(unit.total)}</span>
                <span className="usage__bar"><span style={css({ width: `${((unit.total / busiest) * 100).toFixed(1)}%` })}></span></span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="visually-hidden">
        <table>
          {block.tableCaption && <caption>{block.tableCaption}</caption>}
          <thead><tr><th scope="col">Unit</th><th scope="col">Sessions per day</th><th scope="col">Average session</th><th scope="col">Daily use</th></tr></thead>
          <tbody>
            {units.map((unit) => {
              const idle = unit.sessions.length === 0
              return (
                <tr key={unit.id ?? unit.name}>
                  <th scope="row">{unit.name} ({unit.location})</th>
                  <td>{unit.sessions.length}</td>
                  <td>{idle ? '—' : `${unit.average} min`}</td>
                  <td>{idle ? `None${unit.idleNote ? ` — ${unit.idleNote}` : ''}` : duration(unit.total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <figcaption className="usage__foot">
        <span><strong>{sessionCount}</strong> sessions today across <strong>{activeCount}</strong> active units</span>
        {idleCount > 0 && (
          <span className="usage__flag usage__flag--inline">
            <WarningIcon /><strong>{idleCount}</strong> {idleCount === 1 ? 'unit' : 'units'} idle and worth a follow-up
          </span>
        )}
      </figcaption>
    </figure>
  )
}
