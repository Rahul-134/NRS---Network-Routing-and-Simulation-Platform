import { useState } from 'react'
import DijkstraExplorer from './DijkstraExplorer'
import DijkstraTable from './DijkstraTable'
import RouterPicker from './RouterPicker'
import RoutingTable from './RoutingTable'
import RoutingTableModal from './RoutingTableModal'
import ToolIcon from './ToolIcons'
import { algorithms } from '../utils/algorithms'

function Card({ title, subtitle, action, children }) {
  return (
    <div data-panel className="min-h-0 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold leading-tight text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const tableViews = [
  ['steps', 'Steps'],
  ['routes', 'Routes'],
]

function TableToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-neutral-800 p-0.5">
      {tableViews.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
            value === key ? 'bg-neutral-100 text-black' : 'text-neutral-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const valueTones = {
  default: 'text-white',
  good: 'text-emerald-400',
  warn: 'text-amber-400',
  bad: 'text-rose-400',
  muted: 'text-neutral-500',
}

function Stat({ label, value, tone = 'default', featured = false, title }) {
  return (
    <div
      title={title}
      className={[
        'rounded-xl border px-3 py-2',
        featured ? 'border-emerald-900 bg-emerald-950/30' : 'border-neutral-800 bg-black',
      ].join(' ')}
    >
      <div className="truncate text-xs text-neutral-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold leading-none tabular-nums ${valueTones[tone]}`}>{value}</div>
    </div>
  )
}

const emptyTableText = {
  dijkstra: 'Routes from the source appear as the simulation runs.',
  'distance-vector': 'Start the simulation to see each router build its table.',
  'link-state': 'Start the simulation to follow LSA flooding.',
}

const iterationLabel = {
  dijkstra: ['Processed', 'Nodes processed'],
  'distance-vector': ['Update rounds', 'Update rounds until the tables stopped changing'],
  'link-state': ['Flood rounds', 'Flooding rounds until every router held every LSA'],
}

function RouteResult({ algorithm, sim, nodes }) {
  const done = sim.status === 'complete'
  const result = done ? sim.result : null
  const path = result?.final_path ?? null
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? id
  const [shortLabel, longLabel] = iterationLabel[algorithm]

  return (
    <div className="space-y-3">
      {path ? (
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
      ) : (
        <div
          className={`flex h-7 items-center rounded-md border border-dashed px-3 text-xs ${
            done ? 'border-rose-900 text-rose-300' : 'border-neutral-700 text-neutral-500'
          }`}
        >
          {done ? 'No route exists between the selected routers' : 'The final path appears here'}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total cost" value={path ? result.total_cost : '–'} tone={path ? 'good' : 'muted'} featured={Boolean(path)} />
        <Stat label="Hops" value={path ? result.hop_count : '–'} tone={path ? 'default' : 'muted'} />
        <Stat
          label={shortLabel}
          title={longLabel}
          value={done ? result.iterations : '–'}
          tone={done ? 'default' : 'muted'}
        />
      </div>
    </div>
  )
}

function LinkStateDatabase({ step, result, nodes, viewId }) {
  if (!step) return <p className="text-xs text-neutral-500">Each router builds this database from flooded LSAs.</p>
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? id
  const known = step.lsdb[viewId] ?? []
  const fresh = new Set((step.received ?? []).filter((r) => r.router === viewId).map((r) => r.origin))

  return (
    <>
      <p className="mb-1 text-[11px] text-neutral-400">
        {labelOf(viewId)} holds {known.length} of {nodes.length} LSAs
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-neutral-500">
            <th className="pb-1 font-medium">Origin</th>
            <th className="pb-1 font-medium">Advertised links</th>
          </tr>
        </thead>
        <tbody>
          {known.map((origin) => (
            <tr key={origin} className={`border-t border-neutral-800 ${fresh.has(origin) ? 'bg-amber-500/10' : ''}`}>
              <td className={`py-1 font-semibold ${fresh.has(origin) ? 'text-amber-300' : 'text-neutral-100'}`}>
                {labelOf(origin)}
              </td>
              <td className="py-1 text-neutral-300">
                {(result.lsas[origin] ?? []).map((l) => `${labelOf(l.neighbor)} (${l.cost})`).join(', ') || '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default function BottomPanels({
  algorithm,
  sim,
  nodes,
  links,
  rows,
  viewId,
  onView,
  sourceId,
  destinationId,
  sourceLabel,
  stats,
}) {
  const [expanded, setExpanded] = useState(false)
  const [tableView, setTableView] = useState('steps')
  const stepsView = algorithm === 'dijkstra' && tableView === 'steps'
  const showPicker = algorithm !== 'dijkstra' && nodes.length > 0
  const routingTitle = showPicker || !sourceLabel ? 'Routing table of' : `Routing table of ${sourceLabel}`
  const ownerLabel = nodes.find((n) => n.id === viewId)?.label ?? ''
  const settled = algorithm !== 'dijkstra' || sim.status === 'complete'
  const algorithmName = algorithms.find((a) => a.key === algorithm)?.name ?? ''
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? ''
  let routeSubtitle = 'Waiting for the simulation to finish'
  if (sim.status === 'complete') {
    const route = `${labelOf(sim.result.source)} to ${labelOf(sim.result.destination)}`
    routeSubtitle = sim.result.final_path ? `Shortest path from ${route}` : `No route from ${route}`
  }
  const emptyText =
    sim.step && algorithm === 'link-state'
      ? 'Routing tables are computed once flooding finishes and each router runs shortest-path-first.'
      : emptyTableText[algorithm]

  return (
    <div className={`grid h-full gap-3 p-3 md:grid-cols-[1.4fr_1fr_1fr] ${algorithm === 'link-state' ? 'xl:grid-cols-[1.3fr_1fr_1fr_1fr]' : ''}`}>
      <Card
        title={stepsView ? 'Dijkstra table' : routingTitle}
        subtitle={stepsView ? 'If d(u) + c(u,v) < d(v), then d(v) = d(u) + c(u,v)' : 'Cost and next hop to every router'}
        action={
          <div className="flex items-center gap-2">
            {algorithm === 'dijkstra' && <TableToggle value={tableView} onChange={setTableView} />}
            {showPicker && <RouterPicker nodes={nodes} viewId={viewId} onView={onView} />}
            <button
              onClick={() => setExpanded(true)}
              disabled={stepsView ? !sim.result : !rows}
              aria-label="Expand routing table"
              title="Expand table"
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ToolIcon name="expand" size={16} />
            </button>
          </div>
        }
      >
        {stepsView ? (
          <DijkstraTable
            result={sim.result}
            index={sim.index}
            nodes={nodes}
            sourceId={sourceId}
            destinationId={destinationId}
            emptyText="Press Play or Next Step to build the table."
          />
        ) : (
          <RoutingTable
            rows={rows}
            sourceId={sourceId}
            destinationId={destinationId}
            settled={settled}
            emptyText={emptyText}
          />
        )}
      </Card>
      {expanded && stepsView && sim.result && (
        <RoutingTableModal
          title="Dijkstra table"
          subtitle={`Dijkstra · step ${sim.index + 1} of ${sim.total}`}
          nodes={nodes}
          viewId={viewId}
          onView={onView}
          onClose={() => setExpanded(false)}
        >
          <DijkstraExplorer result={sim.result} index={sim.index} nodes={nodes} links={links} />
        </RoutingTableModal>
      )}
      {expanded && !stepsView && rows && (
        <RoutingTableModal
          title={`Routing table of ${showPicker ? ownerLabel : sourceLabel}`}
          subtitle={`${algorithmName}${sim.result ? ` · step ${sim.index + 1} of ${sim.total}` : ''}`}
          rows={rows}
          nodes={nodes}
          viewId={viewId}
          onView={onView}
          showPicker={showPicker}
          sourceId={sourceId}
          destinationId={destinationId}
          settled={settled}
          onClose={() => setExpanded(false)}
        />
      )}
      {algorithm === 'link-state' && (
        <Card title="Link-state database">
          <LinkStateDatabase step={sim.step} result={sim.result} nodes={nodes} viewId={viewId} />
        </Card>
      )}
      <Card title="Route result" subtitle={routeSubtitle}>
        <RouteResult algorithm={algorithm} sim={sim} nodes={nodes} />
      </Card>
      <Card title="Network statistics" subtitle={`${stats.routers} routers · ${stats.links} links`}>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Routers" value={stats.routers} />
          <Stat label="Links" value={stats.links} />
          <Stat label="Disabled" value={stats.disabled} tone={stats.disabled > 0 ? 'warn' : 'default'} />
          <Stat label="Avg degree" value={stats.avgDegree.toFixed(1)} />
          <Stat label="Avg cost" value={stats.avgCost.toFixed(1)} />
          <Stat label="Connected" value={stats.connected ? 'Yes' : 'No'} tone={stats.connected ? 'good' : 'bad'} />
        </div>
      </Card>
    </div>
  )
}
