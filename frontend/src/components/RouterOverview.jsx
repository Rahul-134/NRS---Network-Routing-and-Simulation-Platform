import PanelHeader from './PanelHeader'
import { CountPill, RouterChip, TableCard, td, th } from './StateTable'

const columns = {
  'distance-vector': ['Router', 'Routes known', 'Updated'],
  'link-state': ['Router', 'LSAs held', 'New', 'Routes'],
}

const subtitles = {
  'distance-vector': 'How much of the network each router has learned',
  'link-state': 'Advertisements held by each router',
}

const hints = {
  'distance-vector': 'Click a router to inspect its routing table.',
  'link-state': 'Click a router to inspect its link-state database.',
}

const mono = 'font-mono text-sm tabular-nums'

function Cells({ algorithm, row }) {
  if (algorithm === 'distance-vector') {
    return (
      <>
        <td className={`${td} ${mono} text-neutral-100`}>
          {row.known} / {row.total}
        </td>
        <td className={td}>
          <CountPill count={row.updated} />
        </td>
      </>
    )
  }
  return (
    <>
      <td className={`${td} ${mono} text-neutral-100`}>
        {row.lsas} / {row.total}
      </td>
      <td className={td}>
        <CountPill count={row.received} />
      </td>
      <td className={`${td} ${mono} text-neutral-300`}>{row.routes === null ? '–' : row.routes}</td>
    </>
  )
}

export default function RouterOverview({ algorithm, rows, viewId, onView }) {
  return (
    <section className="py-3.5">
      <PanelHeader title="Router state" subtitle={subtitles[algorithm]} />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 px-3 py-4 text-center text-xs text-neutral-500">
          Press Play or Next Step to start the simulation.
        </p>
      ) : (
        <>
          <TableCard>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  {columns[algorithm].map((name) => (
                    <th key={name} className={th}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onView(row.id)}
                    className={[
                      'cursor-pointer border-t border-neutral-800 transition-colors hover:bg-neutral-800/60',
                      row.id === viewId ? 'bg-neutral-800' : '',
                    ].join(' ')}
                  >
                    <td className={td}>
                      <RouterChip label={row.label} tone={row.id === viewId ? 'path' : 'idle'} />
                    </td>
                    <Cells algorithm={algorithm} row={row} />
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
          <p className="mt-2 text-xs text-neutral-500">{hints[algorithm]}</p>
        </>
      )}
    </section>
  )
}
