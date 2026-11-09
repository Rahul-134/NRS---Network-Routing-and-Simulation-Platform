import PanelHeader from './PanelHeader'
import { RouterChip, StatePill, TableCard, td, th } from './StateTable'

export default function AlgorithmState({ nodes, step, view }) {
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? '–'

  return (
    <section className="py-3.5">
      <PanelHeader title="Algorithm state" subtitle="Tentative distance and previous router for each router" />
      {!step ? (
        <p className="rounded-xl border border-dashed border-neutral-800 px-3 py-4 text-center text-xs text-neutral-500">
          Press Play or Next Step to start the simulation.
        </p>
      ) : (
        <TableCard>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className={th}>Router</th>
                <th className={th}>Distance</th>
                <th className={th}>Previous</th>
                <th className={th}>State</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((n) => {
                const state = view.nodes[n.id]?.state ?? 'idle'
                const distance = step.distances[n.id] ?? null
                const pred = step.predecessors[n.id]
                const changed = step.changed.includes(n.id)
                return (
                  <tr key={n.id} className={`border-t border-neutral-800 ${state === 'current' ? 'bg-amber-500/5' : ''}`}>
                    <td className={td}>
                      <RouterChip label={n.label} tone={state} />
                    </td>
                    <td
                      className={`${td} font-mono text-sm tabular-nums ${changed ? 'font-semibold text-amber-300' : 'text-neutral-100'}`}
                    >
                      {distance === null ? '∞' : distance}
                    </td>
                    <td className={`${td} text-sm text-neutral-300`}>{pred ? labelOf(pred) : '–'}</td>
                    <td className={td}>
                      <StatePill state={state} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableCard>
      )}
    </section>
  )
}
