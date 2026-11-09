import { useEffect, useState } from 'react'
import ToolIcon from './ToolIcons'
import { compareAlgorithms } from '../services/api'

const approach = {
  dijkstra: 'Centralized. One router computes every path from a full map of the network.',
  'distance-vector': 'Distributed. Routers share tables with direct neighbors until nothing changes.',
  'link-state': 'Distributed. Routers flood link-state advertisements, then each runs Dijkstra.',
}

const metrics = [
  ['cost', 'Total cost', (r) => r.total_cost, 'Lowest cost'],
  ['hops', 'Hops', (r) => r.hop_count, 'Fewest hops'],
  ['steps', 'Simulation steps', (r) => r.steps, 'Fewest simulation steps'],
]

function winners(results, pick) {
  const known = results.map(pick).filter((v) => v !== null && v !== undefined)
  if (known.length === 0) return new Set()
  const min = Math.min(...known)
  if (known.every((v) => v === min)) return new Set()
  return new Set(results.filter((r) => pick(r) === min).map((r) => r.algorithm))
}

function analyse(report) {
  const wins = Object.fromEntries(metrics.map(([key, , pick]) => [key, winners(report.results, pick)]))
  const best = new Set(report.best)
  const costDecides = report.best.length > 0 && wins.cost.size > 0
  return { wins, best, costDecides }
}

function Banner({ tone, children }) {
  const styles = {
    ok: 'border-emerald-800 bg-emerald-950/40 text-emerald-100',
    warn: 'border-amber-800 bg-amber-950/40 text-amber-100',
    error: 'border-rose-800 bg-rose-950/40 text-rose-100',
  }
  return <p className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>{children}</p>
}

function Summary({ report, analysis }) {
  const cost = report.results[0].total_cost
  if (!report.costs_agree) {
    return <Banner tone="error">The algorithms disagree on the total cost. This should not happen.</Banner>
  }
  if (cost === null) {
    return <Banner tone="warn">No algorithm found a route between the selected routers.</Banner>
  }
  const common = `All three algorithms found a route of total cost ${cost}.`
  const note = report.paths_agree ? '' : ' They chose different paths of equal cost.'
  if (report.best.length === 0) {
    return (
      <Banner tone="ok">
        {common} They also took the same number of steps, so none stands out.{note}
      </Banner>
    )
  }
  const names = report.results.filter((r) => analysis.best.has(r.algorithm)).map((r) => r.name)
  const reason = analysis.costDecides ? 'the lowest cost' : 'the fewest simulation steps'
  return (
    <Banner tone="ok">
      {common} <strong className="font-semibold text-emerald-300">{names.join(' and ')}</strong>{' '}
      {names.length > 1 ? 'were' : 'was'} the most efficient, with {reason}.{note}
    </Banner>
  )
}

function Route({ path, labelOf }) {
  if (!path) return <span className="text-sm text-rose-300">No route</span>
  return (
    <div className="flex flex-wrap items-center gap-1">
      {path.map((id, i) => (
        <span key={id} className="flex items-center gap-1">
          {i > 0 && <span className="text-neutral-500">&rarr;</span>}
          <span className="flex h-7 min-w-7 items-center justify-center rounded-md border border-emerald-700 bg-emerald-950 px-1.5 text-[13px] font-semibold text-emerald-100">
            {labelOf(id)}
          </span>
        </span>
      ))}
    </div>
  )
}

function highlights(result, analysis) {
  const lines = metrics.filter(([key]) => analysis.wins[key].has(result.algorithm)).map(([, , , text]) => text)
  return lines.length ? lines : ['Matches the others']
}

function AlgorithmCard({ result, analysis, labelOf }) {
  const best = analysis.best.has(result.algorithm)
  const lines = highlights(result, analysis)
  const earned = lines[0] !== 'Matches the others'

  return (
    <div
      className={[
        'relative flex flex-col rounded-2xl border p-5',
        best ? 'border-emerald-500 bg-emerald-950/25' : 'border-neutral-800 bg-neutral-900',
      ].join(' ')}
    >
      {best && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold text-black">
          Best
        </span>
      )}
      <h3 className="text-xl font-semibold text-white">{result.name}</h3>
      <p className="mt-1.5 min-h-12 text-xs leading-relaxed text-neutral-400">{approach[result.algorithm]}</p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className={`text-4xl font-bold tabular-nums ${best ? 'text-emerald-400' : 'text-white'}`}>
          {result.total_cost ?? '–'}
        </span>
        <span className="text-sm text-neutral-500">total cost</span>
      </div>

      <div className="mt-4 min-h-14 rounded-xl border border-neutral-800 bg-black/40 p-3">
        <Route path={result.final_path} labelOf={labelOf} />
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Highlights</p>
      <ul className="mt-2 space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                earned ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              <ToolIcon name="check" size={12} />
            </span>
            <span className={earned ? 'text-neutral-100' : 'text-neutral-400'}>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Cell({ highlighted, tinted, children }) {
  return (
    <td className={`px-4 py-3 text-sm tabular-nums ${tinted ? 'bg-emerald-950/20' : ''}`}>
      <span className={highlighted ? 'inline-flex items-center gap-1.5 font-semibold text-emerald-400' : 'text-neutral-200'}>
        {highlighted && <ToolIcon name="check" size={13} />}
        {children}
      </span>
    </td>
  )
}

function DetailTable({ report, analysis }) {
  const metricRow = (key) => {
    const [, label, pick] = metrics.find(([k]) => k === key)
    return [label, (r) => ({ node: pick(r) ?? '–', highlighted: analysis.wins[key].has(r.algorithm) })]
  }
  const rows = [
    metricRow('cost'),
    metricRow('hops'),
    [
      'Iterations',
      (r) => ({
        node: (
          <>
            {r.iterations} <span className="text-xs font-normal text-neutral-500">{r.iteration_unit}</span>
          </>
        ),
      }),
    ],
    metricRow('steps'),
    ['Converged', (r) => ({ node: r.converged ? 'Yes' : 'No' })],
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-neutral-400">Detailed comparison</th>
            {report.results.map((r) => {
              const best = analysis.best.has(r.algorithm)
              return (
                <th
                  key={r.algorithm}
                  className={`px-4 py-3 text-xs font-semibold ${best ? 'bg-emerald-950/20 text-emerald-400' : 'text-neutral-400'}`}
                >
                  {r.name}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, read]) => (
            <tr key={label} className="border-t border-neutral-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">{label}</th>
              {report.results.map((r) => {
                const { node, highlighted } = read(r)
                return (
                  <Cell key={r.algorithm} highlighted={highlighted} tinted={analysis.best.has(r.algorithm)}>
                    {node}
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ComparisonPanel({ topology, source, destination, onClose }) {
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    compareAlgorithms(topology, source, destination)
      .then((data) => active && setState({ status: 'ready', data }))
      .catch((err) => active && setState({ status: 'error', message: err.message }))
    return () => {
      active = false
    }
  }, [topology, source, destination])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const labelOf = (id) => topology.nodes.find((n) => n.id === id)?.label ?? id
  const analysis = state.status === 'ready' ? analyse(state.data) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000b3] p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Algorithm comparison"
        className="max-h-full w-full max-w-5xl space-y-5 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Algorithm comparison</h2>
            <p className="mt-0.5 text-sm text-neutral-400">
              Route from {labelOf(source)} to {labelOf(destination)} on the current topology (
              {topology.nodes.length} routers, {topology.links.filter((l) => l.enabled).length} active links)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <ToolIcon name="close" size={18} />
          </button>
        </div>

        {state.status === 'loading' && <p className="text-sm text-neutral-400">Running all three algorithms…</p>}
        {state.status === 'error' && <Banner tone="error">{state.message}</Banner>}
        {state.status === 'ready' && (
          <>
            <Summary report={state.data} analysis={analysis} />
            <div className="grid gap-4 md:grid-cols-3">
              {state.data.results.map((r) => (
                <AlgorithmCard key={r.algorithm} result={r} analysis={analysis} labelOf={labelOf} />
              ))}
            </div>
            <DetailTable report={state.data} analysis={analysis} />
            <p className="text-xs text-neutral-500">
              Best is chosen by the lowest total cost, then the fewest simulation steps. Iterations are counted in
              different units for each algorithm, so they are shown but not ranked.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
