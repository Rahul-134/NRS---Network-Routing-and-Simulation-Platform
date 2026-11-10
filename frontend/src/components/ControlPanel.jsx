import Icon from './icons'
import PanelHeader from './PanelHeader'
import Select from './Select'
import { speeds } from '../utils/speeds'
import { btn } from '../utils/ui'

const statusStyles = {
  idle: 'border-neutral-700 text-neutral-300',
  running: 'border-cyan-600 text-cyan-300',
  paused: 'border-amber-600 text-amber-300',
  complete: 'border-emerald-600 text-emerald-300',
}

const primary =
  'inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-100'

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

export default function ControlPanel({
  nodes,
  sourceId,
  destinationId,
  onSource,
  onDestination,
  sim,
  algorithmName,
}) {
  const ready = nodes.length > 0 && sourceId && destinationId && !sim.loading
  const subtitle = `${algorithmName} · ${sim.result ? `step ${sim.index + 1} of ${sim.total}` : 'not started'}`
  const progress = sim.result ? ((sim.index + 1) / sim.total) * 100 : 0

  return (
    <section className="py-3.5">
      <PanelHeader
        title="Simulation"
        subtitle={subtitle}
        right={
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[sim.status]}`}
          >
            {sim.status}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <RouterSelect label="Source" value={sourceId} nodes={nodes} onChange={onSource} />
        <RouterSelect label="Destination" value={destinationId} nodes={nodes} onChange={onDestination} />
      </div>

      <div className="mt-3.5 space-y-2">
        <div className="grid grid-cols-[1fr_1.2fr_1.15fr] gap-2">
          <button className={btn} disabled={!sim.result || sim.index === 0} onClick={sim.back} title="Previous step">
            <Icon name="back" /> Back
          </button>
          {sim.playing ? (
            <button className={primary} onClick={sim.pause}>
              <Icon name="pause" size={14} /> Pause
            </button>
          ) : (
            <button className={primary} disabled={!ready} onClick={sim.play}>
              <Icon name="play" size={14} /> Play
            </button>
          )}
          <button
            className={btn}
            disabled={!ready || sim.status === 'complete'}
            onClick={sim.next}
            title="Advance one step"
          >
            <Icon name="next" /> Next Step
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className={btn} disabled={!ready || sim.status === 'complete'} onClick={sim.runToEnd}>
            <Icon name="end" /> Run to End
          </button>
          <button className={btn} disabled={!sim.result} onClick={sim.reset}>
            <Icon name="reset" /> Reset
          </button>
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-400">
        <span>Speed</span>
        <div className="inline-flex rounded-lg bg-neutral-900 p-0.5">
          {speeds.map(([name, ms]) => (
            <button
              key={name}
              onClick={() => sim.setSpeed(ms)}
              className={[
                'rounded-md px-3 py-1 text-xs transition-colors',
                sim.speed === ms ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-100',
              ].join(' ')}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${sim.status === 'complete' ? 'bg-emerald-500' : 'bg-neutral-300'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-neutral-400">
          {sim.result ? `Step ${sim.index + 1} / ${sim.total}` : 'Not started'}
        </span>
      </div>

      {sim.error && (
        <p className="mt-3 rounded-md border border-rose-800 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">
          {sim.error}
        </p>
      )}
    </section>
  )
}
