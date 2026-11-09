import { useEffect, useRef, useState } from 'react'
import { linkCost } from '../utils/shortestPath'

const sizes = {
  compact: { cell: 'px-2.5 py-1.5 text-sm', head: 'px-2.5 py-1.5 text-xs', ring: 'h-7 min-w-7 px-1', text: 'text-sm', tick: 'h-4' },
  large: { cell: 'px-5 py-3.5 text-lg', head: 'px-5 py-3.5 text-base', ring: 'h-10 min-w-10 px-1.5', text: 'text-lg', tick: 'h-5' },
}

const show = (d) => (d === null ? '∞' : d)

export default function DijkstraTable({
  result,
  index,
  nodes,
  links = [],
  sourceId,
  destinationId,
  size = 'compact',
  emptyText,
  interactive = false,
  route = [],
  onPickColumn,
}) {
  const lastRow = useRef(null)
  const answer = useRef(null)
  const [hover, setHover] = useState(null)
  const [pin, setPin] = useState(null)
  const picks = result ? result.steps.slice(0, index + 1).filter((s) => s.type === 'select') : []

  const complete = !!result && index >= result.steps.length - 1

  useEffect(() => {
    if (!interactive) (complete ? answer.current : lastRow.current)?.scrollIntoView({ block: 'nearest' })
  }, [picks.length, complete, interactive])

  if (!result || picks.length === 0) return <p className="text-xs text-neutral-500">{emptyText}</p>

  const s = sizes[size]
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? id
  const routeText = `${labelOf(result.source)} → ${labelOf(result.destination)}`
  const onRoute = new Set(route)

  const pinned = pin && pin.r < picks.length ? pin : null
  const focus = hover && hover.r !== null && hover.c !== null ? hover : pinned

  const explain = ({ r, c }) => {
    const p = picks[r]
    const name = labelOf(c)
    const from = labelOf(p.current)
    const now = p.distances[c]
    const done = p.visited.indexOf(c)
    if (done !== -1 && done < p.visited.indexOf(p.current)) {
      return `${name} was finalized in an earlier row, so it is not touched again.`
    }
    if (c === p.current) {
      return `${name} has the smallest tentative distance (${show(now)}) of the routers not yet finalized, so it is picked and finalized here.`
    }
    const cost = linkCost(links, p.current, c)
    const via = p.distances[p.current]
    if (p.changed.includes(c)) {
      const before = r > 0 ? picks[r - 1].distances[c] : null
      if (cost === null) return `d(${name}) improved from ${show(before)} to ${now} through ${from}.`
      return `Through ${from}: d(${from}) + c(${from},${name}) = ${via} + ${cost} = ${now}, which beats ${show(before)}. So d(${name}) = ${now}.`
    }
    if (cost === null) return `${name} has no direct link to ${from}, so d(${name}) stays ${show(now)}.`
    return `Through ${from}: ${via} + ${cost} = ${via + cost}, which does not beat ${show(now)}. No change.`
  }

  const toggle = (r, c) => setPin((p) => (p && p.r === r && p.c === c ? null : { r, c }))

  const tint = (r, id) => {
    if (!interactive || !hover) return ''
    if (hover.r === r && hover.c === id) return 'bg-white/10'
    return hover.r === r || hover.c === id ? 'bg-white/[0.04]' : ''
  }

  const cellProps = (r, id) =>
    interactive
      ? {
          tabIndex: 0,
          onMouseEnter: () => setHover({ r, c: id }),
          onFocus: () => setHover({ r, c: id }),
          onBlur: () => setHover(null),
          onClick: () => toggle(r, id),
          onKeyDown: (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggle(r, id)
            }
          },
        }
      : {}

  const cellClass = (r, id) =>
    `${s.cell} ${tint(r, id)} ${
      interactive
        ? `cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
            pinned && pinned.r === r && pinned.c === id ? 'ring-1 ring-inset ring-sky-400/70' : ''
          }`
        : ''
    }`

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-center tabular-nums">
          <thead onMouseLeave={() => setHover(null)}>
            <tr>
              <th className={`${s.head} border-b-2 border-r-2 border-neutral-600 text-left font-semibold text-neutral-400`}>Pick</th>
              {nodes.map((n) => {
                const tone =
                  n.id === sourceId ? 'text-emerald-400' : n.id === destinationId ? 'text-rose-400' : 'text-neutral-300'
                const lit = interactive && hover?.c === n.id && hover.r === null
                return (
                  <th
                    key={n.id}
                    onMouseEnter={interactive ? () => setHover({ r: null, c: n.id }) : undefined}
                    className={`border-b-2 p-0 font-semibold transition-colors ${
                      onRoute.has(n.id) ? 'border-emerald-500' : 'border-neutral-600'
                    } ${lit ? 'bg-white/[0.06]' : ''} ${tone}`}
                  >
                    {interactive && onPickColumn ? (
                      <button
                        type="button"
                        onClick={() => onPickColumn(n.id)}
                        onFocus={() => setHover({ r: null, c: n.id })}
                        onBlur={() => setHover(null)}
                        title={`Set ${n.label} as the destination`}
                        className={`${s.head} w-full cursor-pointer font-semibold outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-500/50`}
                      >
                        {n.label}
                      </button>
                    ) : (
                      <span className={`${s.head} block`}>{n.label}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody onMouseLeave={() => setHover(null)}>
            {picks.map((p, r) => {
              const at = p.visited.indexOf(p.current)
              const latest = r === picks.length - 1
              return (
                <tr key={p.step} ref={latest ? lastRow : undefined} className={latest ? 'bg-neutral-800/40' : ''}>
                  <th
                    onMouseEnter={interactive ? () => setHover({ r, c: null }) : undefined}
                    className={`${s.cell} border-r-2 border-neutral-600 text-left font-semibold transition-colors ${
                      onRoute.has(p.current) ? 'text-emerald-300' : 'text-neutral-100'
                    } ${interactive && hover?.r === r && hover.c === null ? 'bg-white/[0.06]' : ''}`}
                  >
                    {labelOf(p.current)}
                  </th>
                  {nodes.map((n) => {
                    const done = p.visited.indexOf(n.id)
                    if (done !== -1 && done < at) {
                      return (
                        <td key={n.id} className={cellClass(r, n.id)} {...cellProps(r, n.id)}>
                          <span className={`mx-auto block w-px bg-neutral-600 ${s.tick}`} />
                        </td>
                      )
                    }
                    if (n.id === p.current) {
                      return (
                        <td key={n.id} className={cellClass(r, n.id)} {...cellProps(r, n.id)}>
                          <span
                            className={`mx-auto flex items-center justify-center rounded-full border-2 border-emerald-400 font-bold text-emerald-300 ${s.ring}`}
                          >
                            {show(p.distances[n.id])}
                          </span>
                        </td>
                      )
                    }
                    const changed = p.changed.includes(n.id)
                    return (
                      <td
                        key={n.id}
                        className={`${cellClass(r, n.id)} ${changed ? 'font-semibold text-amber-300' : 'text-neutral-300'}`}
                        {...cellProps(r, n.id)}
                      >
                        {show(p.distances[n.id])}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {interactive && (
        <p
          aria-live="polite"
          className={`mt-3 flex min-h-14 items-center rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 ${s.text} ${
            focus ? 'text-neutral-200' : 'text-neutral-500'
          }`}
        >
          {focus ? explain(focus) : 'Hover or select a cell to see how it was computed. Select a heading to route there.'}
        </p>
      )}

      {complete && (
        <div ref={answer} className={`mt-3 space-y-1 border-t border-neutral-800 pt-3 ${s.text}`}>
          {result.final_path ? (
            <>
              <p className="text-neutral-300">
                {routeText} <span className="text-neutral-500">&rArr;</span> distance ={' '}
                <span className="font-bold text-emerald-300 underline decoration-2 underline-offset-4">{result.total_cost}</span>
              </p>
              <p className="text-neutral-300">
                Path: <span className="font-semibold text-white">{result.final_path.map(labelOf).join(' → ')}</span>
              </p>
            </>
          ) : (
            <p className="text-rose-300">No route from {routeText.replace(' → ', ' to ')}.</p>
          )}
        </div>
      )}
    </div>
  )
}
