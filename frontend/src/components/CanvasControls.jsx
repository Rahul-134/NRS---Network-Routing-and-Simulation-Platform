import { useState } from 'react'
import { Panel, useReactFlow, useStore } from 'reactflow'
import ToolIcon from './ToolIcons'
import { useFitNetwork } from '../hooks/useFitNetwork'

const legend = [
  ['bg-emerald-500', 'Source'],
  ['bg-rose-500', 'Destination'],
  ['bg-amber-500', 'Current / updated'],
  ['bg-teal-600', 'Visited'],
  ['bg-cyan-500', 'Candidate'],
  ['bg-emerald-500', 'Final path'],
  ['bg-red-500', 'Disabled link'],
]

const group = 'flex items-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950'
const iconButton =
  'flex h-9 w-9 items-center justify-center text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-40'

export function ZoomControls() {
  const { zoomIn, zoomOut, zoomTo } = useReactFlow()
  const fit = useFitNetwork()
  const zoom = useStore((s) => s.transform[2])

  return (
    <Panel position="bottom-left" className="canvas-panel flex items-center gap-2">
      <div className={group}>
        <button className={iconButton} onClick={() => zoomOut({ duration: 150 })} aria-label="Zoom out">
          <ToolIcon name="minus" size={16} />
        </button>
        <button
          onClick={() => zoomTo(1, { duration: 150 })}
          aria-label="Reset zoom to 100%"
          title="Reset to 100%"
          className="h-9 min-w-14 border-x border-neutral-800 px-2 text-sm font-medium tabular-nums text-neutral-100 transition-colors hover:bg-neutral-800"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button className={iconButton} onClick={() => zoomIn({ duration: 150 })} aria-label="Zoom in">
          <ToolIcon name="plus" size={16} />
        </button>
      </div>
      <div className={group}>
        <button className={iconButton} onClick={() => fit()} aria-label="Fit network to view" title="Fit to view">
          <ToolIcon name="fit" size={16} />
        </button>
      </div>
    </Panel>
  )
}

export function LegendToggle() {
  const [open, setOpen] = useState(false)

  return (
    <Panel
      position="bottom-right"
      className="canvas-panel legend-panel hidden flex-col items-end gap-2 text-[11px] text-neutral-300 xl:flex"
    >
      {open && (
        <ul className="space-y-1.5 rounded-xl border border-neutral-800 bg-neutral-950/95 px-3 py-2.5">
          {legend.map(([color, name]) => (
            <li key={name} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
              {name}
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-200 transition-colors hover:bg-neutral-800"
      >
        Legend
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <ToolIcon name="chevron" size={14} />
        </span>
      </button>
    </Panel>
  )
}
