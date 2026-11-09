import { BaseEdge, EdgeLabelRenderer, getStraightPath } from 'reactflow'

const strokes = {
  normal: { stroke: '#525252', strokeWidth: 2 },
  tree: { stroke: '#0891b2', strokeWidth: 3 },
  active: { stroke: '#f59e0b', strokeWidth: 4 },
  path: { stroke: '#10b981', strokeWidth: 5 },
  disabled: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '7 6' },
}

const pills = {
  normal: 'border-neutral-500 text-neutral-100',
  tree: 'border-cyan-600 text-cyan-100',
  active: 'border-amber-500 text-amber-100',
  path: 'border-emerald-400 text-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  disabled: 'border-rose-500 text-rose-300 line-through',
}

export default function LinkEdge({ id, sourceX, sourceY, targetX, targetY, data }) {
  const [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const { cost, state, flow, dim, selected, editing, onSelect, onEdit, onCommit, onCancel } = data

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      e.currentTarget.dataset.cancelled = 'true'
      onCancel()
    }
  }

  const handleBlur = (e) => {
    if (e.currentTarget.dataset.cancelled) return
    onCommit(id, e.currentTarget.value)
  }

  return (
    <>
      {selected && <path d={path} fill="none" style={{ stroke: 'var(--color-neutral-200)' }} strokeWidth={12} strokeOpacity={0.2} />}
      {flow && <path d={path} fill="none" stroke="#10b981" strokeWidth={14} strokeOpacity={0.22} strokeLinecap="round" />}
      <BaseEdge
        id={id}
        path={path}
        style={{ ...strokes[state], opacity: dim ? 0.25 : 1, transition: 'opacity 300ms' }}
        interactionWidth={20}
      />
      {flow && (
        <path
          d={path}
          fill="none"
          stroke="#ecfdf5"
          strokeWidth={2.5}
          className={`route-flow ${flow === 'reverse' ? 'route-flow-reverse' : ''}`}
          pointerEvents="none"
        />
      )}
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan absolute transition-opacity duration-300 ${dim ? 'opacity-30' : ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {editing ? (
            <input
              autoFocus
              type="number"
              min={1}
              step={1}
              defaultValue={cost}
              aria-label="Link cost"
              className="plain-number w-16 rounded-full border-2 border-cyan-500 bg-black px-2 py-1 text-center text-lg font-bold tabular-nums text-white outline-none"
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              onClick={() => onSelect(id)}
              onDoubleClick={() => onEdit(id)}
              title="Double-click to edit the cost"
              className={`min-w-10 cursor-pointer select-none rounded-full border-2 bg-black px-2.5 py-0.5 text-center text-lg font-bold tabular-nums transition-colors hover:border-white ${pills[state]}`}
            >
              {cost}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
