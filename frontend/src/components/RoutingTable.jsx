const sizes = {
  compact: {
    head: 'px-3 py-1.5 text-xs whitespace-nowrap',
    cell: 'px-3 py-1.5',
    avatar: 'h-7 w-7 text-[10px]',
    name: 'text-sm',
    sub: 'text-[10px] leading-tight',
    body: 'text-sm',
    pill: 'px-2 py-0.5 text-[11px]',
    gap: 'gap-2',
  },
  large: {
    head: 'px-6 py-4 text-base whitespace-nowrap',
    cell: 'px-6 py-4',
    avatar: 'h-11 w-11 text-sm',
    name: 'text-lg',
    sub: 'text-sm',
    body: 'text-lg',
    pill: 'px-3 py-0.5 text-sm',
    gap: 'gap-4',
  },
}

const pillTones = {
  reachable: 'border-neutral-700 bg-neutral-800/70 text-neutral-200',
  updated: 'border-amber-700 bg-amber-950/60 text-amber-200',
  unreachable: 'border-rose-900 bg-rose-950/50 text-rose-300',
  pending: 'border-neutral-800 bg-transparent text-neutral-500',
  local: 'border-neutral-700 bg-transparent text-neutral-400',
}

function statusOf(row, settled) {
  if (row.isSelf) return 'local'
  if (row.cost === null) return settled ? 'unreachable' : 'pending'
  return row.changed ? 'updated' : 'reachable'
}

const statusText = { pending: 'not reached' }

function Avatar({ row, role, className }) {
  const ring =
    role === 'destination'
      ? 'border-rose-500'
      : role === 'source'
        ? 'border-emerald-500'
        : row.changed
          ? 'border-amber-500'
          : 'border-neutral-600'
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border-2 bg-neutral-800 font-semibold text-neutral-100 ${ring} ${className}`}
    >
      {row.label.slice(0, 2)}
    </span>
  )
}

function subtitle(row, role) {
  if (row.isSelf) return 'This router'
  if (role === 'destination') return 'Destination'
  if (role === 'source') return 'Source'
  return 'Router'
}

export default function RoutingTable({ rows, sourceId, destinationId, settled, size = 'compact', emptyText }) {
  if (!rows) return <p className="text-xs text-neutral-500">{emptyText}</p>

  const s = sizes[size]
  const labelOf = (id) => rows.find((r) => r.id === id)?.label ?? '–'

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className={`${s.head} font-semibold text-neutral-400`}>
          <th className={`${s.head} font-semibold`}>Destination</th>
          <th className={`${s.head} font-semibold`}>Next hop</th>
          <th className={`${s.head} font-semibold`}>Status</th>
          <th className={`${s.head} text-right font-semibold`}>Cost</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const role = row.id === destinationId ? 'destination' : row.id === sourceId ? 'source' : null
          const status = statusOf(row, settled)
          return (
            <tr key={row.id} className={`border-t border-neutral-800 ${row.changed ? 'bg-amber-500/5' : ''}`}>
              <td className={s.cell}>
                <div className={`flex items-center ${s.gap}`}>
                  <Avatar row={row} role={role} className={s.avatar} />
                  <div className="min-w-0">
                    <div className={`truncate font-medium text-white ${s.name}`}>{row.label}</div>
                    <div className={`text-neutral-500 ${s.sub}`}>{subtitle(row, role)}</div>
                  </div>
                </div>
              </td>
              <td className={`${s.cell} ${s.body} text-neutral-300`}>{row.nextHop ? labelOf(row.nextHop) : '–'}</td>
              <td className={s.cell}>
                <span className={`inline-block whitespace-nowrap rounded-full border ${s.pill} ${pillTones[status]}`}>
                  {statusText[status] ?? status}
                </span>
              </td>
              <td className={`${s.cell} text-right font-mono tabular-nums ${s.body} ${row.changed ? 'text-amber-300' : 'text-neutral-200'}`}>
                {row.isSelf ? 0 : (row.cost ?? '∞')}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
