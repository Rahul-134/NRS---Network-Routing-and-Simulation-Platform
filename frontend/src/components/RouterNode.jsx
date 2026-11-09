import { memo } from 'react'
import { Handle, Position } from 'reactflow'

const stateStyles = {
  idle: 'border-neutral-600 bg-neutral-900 text-neutral-50',
  candidate: 'border-cyan-500 bg-cyan-950 text-cyan-50',
  visited: 'border-teal-500 bg-teal-950 text-teal-50',
  current: 'border-amber-500 bg-amber-950 text-amber-50 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]',
  path: 'border-emerald-400 bg-emerald-900 text-emerald-50 shadow-[0_0_0_5px_rgba(16,185,129,0.28),0_0_18px_rgba(16,185,129,0.45)]',
}

const captionStyles = {
  idle: 'bg-neutral-700 text-white',
  candidate: 'bg-cyan-800 text-white',
  visited: 'bg-teal-800 text-white',
  current: 'bg-amber-700 text-white',
  path: 'bg-emerald-700 text-white',
}

const roleStyles = {
  source: { outline: 'outline-emerald-500', text: 'text-emerald-400', tag: 'SRC' },
  destination: { outline: 'outline-rose-500', text: 'text-rose-400', tag: 'DST' },
  both: { outline: 'outline-violet-500', text: 'text-violet-400', tag: 'SRC/DST' },
}

const centerHandle = {
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 0,
  opacity: 0,
  pointerEvents: 'none',
}

const labelSize = (label) => (label.length <= 3 ? 'text-base' : label.length <= 5 ? 'text-sm' : 'text-xs')

function RouterNode({ data }) {
  const { label, caption, state, role, selected, pending, dim } = data
  const roleStyle = role ? roleStyles[role] : null

  return (
    <div className={`relative h-14 w-14 transition-opacity duration-300 ${dim ? 'opacity-50' : ''}`}>
      <Handle type="target" position={Position.Top} isConnectable={false} style={centerHandle} />
      <Handle type="source" position={Position.Top} isConnectable={false} style={centerHandle} />
      <div
        className={[
          'flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-full border-2 transition-colors duration-200',
          stateStyles[state],
          roleStyle ? `outline outline-2 outline-offset-4 ${roleStyle.outline}` : '',
          selected ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-black' : '',
          pending ? 'animate-pulse' : '',
        ].join(' ')}
      >
        <span className={`max-w-12 truncate font-bold leading-none ${labelSize(label)}`}>{label}</span>
        {caption !== undefined && (
          <span
            className={`mt-1 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[13px] font-bold leading-none tabular-nums ${captionStyles[state]}`}
          >
            {caption}
          </span>
        )}
      </div>
      {roleStyle && (
        <span
          className={`pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wider ${roleStyle.text}`}
        >
          {roleStyle.tag}
        </span>
      )}
    </div>
  )
}

export default memo(RouterNode)
