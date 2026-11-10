import { useState } from 'react'
import Icon from './icons'
import Select from './Select'
import ToolIcon from './ToolIcons'
import { algorithms } from '../utils/algorithms'
import { speeds } from '../utils/speeds'

const tools = [
  ['select', 'Select', 'pointer'],
  ['router', 'Router', 'plus'],
  ['link', 'Link', 'link'],
  ['delete', 'Delete', 'trash'],
]

const statusTone = {
  idle: 'text-neutral-400',
  running: 'text-cyan-300',
  paused: 'text-amber-300',
  complete: 'text-emerald-300',
}

const key =
  'flex h-11 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-200 transition-colors active:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40'

function Segmented({ label, options, value, onChange, columns }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-neutral-400">{label}</div>
      <div className={`grid gap-1 rounded-xl bg-neutral-950 p-1 ${columns}`}>
        {options.map(([id, text]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={value === id}
            className={`min-h-9 rounded-lg px-1.5 text-xs font-medium transition-colors ${
              value === id ? 'bg-neutral-700 text-white' : 'text-neutral-400 active:text-white'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function RouterSelect({ label, value, nodes, onChange }) {
  return (
    <div className="text-xs text-neutral-400">
      {label}
      <div className="mt-1.5">
        <Select
          ariaLabel={label}
          value={value}
          options={nodes.map((n) => ({ value: n.id, label: n.label }))}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

export default function MobileDock({
  algorithm,
  onAlgorithm,
  nodes,
  sourceId,
  destinationId,
  onSource,
  onDestination,
  sim,
  tool,
  onTool,
}) {
  const [open, setOpen] = useState(false)
  const ready = nodes.length > 0 && sourceId && destinationId && !sim.loading
  const name = algorithms.find((a) => a.key === algorithm)?.name ?? ''
  const progress = sim.result ? ((sim.index + 1) / sim.total) * 100 : 0

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex max-w-md flex-col gap-2">
        {open && (
          <section
            aria-label="Settings"
            className="pointer-events-auto max-h-[55vh] space-y-4 overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-900/95 p-4 shadow-2xl shadow-black/50 backdrop-blur"
          >
            <Segmented
              label="Algorithm"
              columns="grid-cols-3"
              value={algorithm}
              onChange={onAlgorithm}
              options={algorithms.map((a) => [a.key, a.name])}
            />
            <div className="grid grid-cols-2 gap-3">
              <RouterSelect label="Source" value={sourceId} nodes={nodes} onChange={onSource} />
              <RouterSelect label="Destination" value={destinationId} nodes={nodes} onChange={onDestination} />
            </div>
            <Segmented
              label="Speed"
              columns="grid-cols-3"
              value={sim.speed}
              onChange={sim.setSpeed}
              options={speeds.map(([text, ms]) => [ms, text])}
            />
            <div>
              <div className="mb-1.5 text-xs text-neutral-400">Canvas tool</div>
              <div className="grid grid-cols-4 gap-1.5">
                {tools.map(([id, text, icon]) => (
                  <button
                    key={id}
                    onClick={() => onTool(id)}
                    aria-pressed={tool === id}
                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-[11px] font-medium transition-colors ${
                      tool === id
                        ? 'border-cyan-600 bg-cyan-950/60 text-cyan-200'
                        : 'border-neutral-700 bg-neutral-950 text-neutral-300 active:bg-neutral-800'
                    }`}
                  >
                    <ToolIcon name={icon} size={18} />
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="pointer-events-auto rounded-2xl border border-neutral-700 bg-neutral-900/95 p-2.5 shadow-2xl shadow-black/50 backdrop-blur">
          <div className="mb-2 flex items-center gap-2.5 px-1 text-[11px]">
            <span className="truncate font-medium text-neutral-200">{name}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${sim.status === 'complete' ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={`whitespace-nowrap tabular-nums ${statusTone[sim.status]}`}>
              {sim.result ? `Step ${sim.index + 1} / ${sim.total}` : 'Not started'}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_2.2fr_1fr_1fr_1fr_1fr] gap-1.5">
            <button className={key} disabled={!sim.result || sim.index === 0} onClick={sim.back} aria-label="Previous step">
              <Icon name="back" size={16} />
            </button>
            {sim.playing ? (
              <button
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-neutral-100 text-sm font-semibold text-black active:bg-white"
                onClick={sim.pause}
              >
                <Icon name="pause" size={16} /> Pause
              </button>
            ) : (
              <button
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-neutral-100 text-sm font-semibold text-black active:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!ready}
                onClick={sim.play}
              >
                <Icon name="play" size={16} /> Play
              </button>
            )}
            <button
              className={key}
              disabled={!ready || sim.status === 'complete'}
              onClick={sim.next}
              aria-label="Advance one step"
            >
              <Icon name="next" size={16} />
            </button>
            <button
              className={key}
              disabled={!ready || sim.status === 'complete'}
              onClick={sim.runToEnd}
              aria-label="Run to end"
            >
              <Icon name="end" size={16} />
            </button>
            <button className={key} disabled={!sim.result} onClick={sim.reset} aria-label="Reset">
              <Icon name="reset" size={16} />
            </button>
            <button
              className={`${key} ${open ? 'border-cyan-600 bg-cyan-950/60 text-cyan-200' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Settings"
            >
              <ToolIcon name={open ? 'close' : 'sliders'} size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
