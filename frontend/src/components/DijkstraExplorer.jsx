import { useMemo, useState } from 'react'
import DijkstraTable from './DijkstraTable'
import Select from './Select'
import { findRoute } from '../utils/shortestPath'

function Field({ label, children }) {
  return (
    <div className="w-28">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</div>
      {children}
    </div>
  )
}

function PathFinder({ nodes, from, to, onFrom, onTo, route, tableSource }) {
  const options = nodes.map((n) => ({ value: n.id, label: n.label }))
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? id

  return (
    <div>
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From">
            <Select value={from} options={options} onChange={onFrom} ariaLabel="Route source" />
          </Field>
          <button
            type="button"
            onClick={() => {
              onFrom(to)
              onTo(from)
            }}
            aria-label="Swap source and destination"
            title="Swap"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-700 text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
          >
            &#8644;
          </button>
          <Field label="To">
            <Select value={to} options={options} onChange={onTo} ariaLabel="Route destination" />
          </Field>

          <div className="ml-auto flex gap-6 pr-1">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Cost</div>
              <div className={`text-3xl font-semibold leading-tight tabular-nums ${route ? 'text-emerald-300' : 'text-neutral-600'}`}>
                {route ? route.cost : '–'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-500">Hops</div>
              <div className={`text-3xl font-semibold leading-tight tabular-nums ${route ? 'text-white' : 'text-neutral-600'}`}>
                {route ? route.hops.length : '–'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-12 flex-wrap items-center gap-x-1.5 gap-y-2">
          {route ? (
            route.path.map((id, i) => (
              <span key={`${id}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="flex flex-col items-center text-xs leading-none text-neutral-400">
                    <span className="mb-0.5 font-semibold tabular-nums text-amber-300">{route.hops[i - 1].cost}</span>
                    <span>&rarr;</span>
                  </span>
                )}
                <span className="flex h-9 min-w-9 items-center justify-center rounded-md border border-emerald-700 bg-emerald-950 px-2 text-base font-semibold text-emerald-100">
                  {labelOf(id)}
                </span>
              </span>
            ))
          ) : (
            <span className="rounded-md border border-dashed border-rose-900 px-3 py-2 text-sm text-rose-300">
              No route from {labelOf(from)} to {labelOf(to)} with the current links.
            </span>
          )}
        </div>

        {from !== tableSource && (
          <p className="mt-3 text-sm text-neutral-500">
            The table below was built from {labelOf(tableSource)}. This route is worked out from {labelOf(from)}.
          </p>
        )}
      </div>
    </div>
  )
}

export default function DijkstraExplorer({ result, index, nodes, links }) {
  const [from, setFrom] = useState(result.source)
  const [to, setTo] = useState(result.destination)
  const route = useMemo(() => findRoute(nodes, links, from, to), [nodes, links, from, to])

  return (
    <div className="space-y-4 p-4">
      <PathFinder
        nodes={nodes}
        from={from}
        to={to}
        onFrom={setFrom}
        onTo={setTo}
        route={route}
        tableSource={result.source}
      />
      <DijkstraTable
        result={result}
        index={index}
        nodes={nodes}
        links={links}
        sourceId={result.source}
        destinationId={to}
        size="large"
        interactive
        route={route?.path}
        onPickColumn={setTo}
      />
    </div>
  )
}
