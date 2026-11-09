import { useRef, useState } from 'react'
import ToolIcon from './ToolIcons'
import { presets, presetKeys } from '../utils/presets'
import { btn, btnDanger, field } from '../utils/ui'

const tools = [
  ['select', 'Select / Move', 'pointer'],
  ['router', 'Add Router', 'plus'],
  ['link', 'Add Link', 'link'],
  ['delete', 'Delete', 'trash'],
]

const title = 'mb-2 text-[15px] font-semibold text-white'
const rowBase =
  'flex w-full items-center gap-3 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors'
const rowIdle = 'border-transparent text-neutral-300 hover:bg-neutral-900 hover:text-white'

function ToolRow({ icon, label, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        rowBase,
        active ? 'border-cyan-600 bg-cyan-950/70 text-white' : rowIdle,
        'disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      <ToolIcon name={icon} />
      {label}
    </button>
  )
}

function SliderRow({ label, text, onText, min, max, step, onEnter }) {
  const numeric = Math.min(max, Math.max(min, Number(text) || min))
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-neutral-300">{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter()}
          aria-label={label}
          className="plain-number w-14 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-right text-sm tabular-nums text-neutral-100 outline-none focus:border-neutral-400"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numeric}
        onChange={(e) => onText(e.target.value)}
        aria-label={`${label} slider`}
        className="mt-2.5 h-1 w-full cursor-pointer accent-neutral-300"
      />
    </div>
  )
}

function commitOnBlur(event, commit) {
  const error = commit(event.target.value)
  if (error) event.target.value = event.target.defaultValue
}

function NodeInspector({ node, linkCount, isSource, isDestination, actions }) {
  return (
    <div className="space-y-3">
      <label className="block text-[11px] text-neutral-400">
        Router name
        <input
          key={`${node.id}:${node.label}`}
          className={`${field} mt-1`}
          defaultValue={node.label}
          maxLength={8}
          onBlur={(e) => commitOnBlur(e, (value) => actions.rename(node.id, value))}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      </label>
      <p className="text-[11px] text-neutral-400">{linkCount} connected link(s)</p>
      <div className="flex flex-wrap gap-2">
        <button className={btn} disabled={isSource} onClick={() => actions.setSource(node.id)}>
          Set as source
        </button>
        <button className={btn} disabled={isDestination} onClick={() => actions.setDestination(node.id)}>
          Set as destination
        </button>
      </div>
      <button className={btnDanger} onClick={actions.remove}>
        Delete router
      </button>
    </div>
  )
}

function LinkInspector({ link, nodes, actions }) {
  const label = (id) => nodes.find((n) => n.id === id)?.label ?? id
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-200">
        {label(link.source)} &ndash; {label(link.target)}
        {!link.enabled && <span className="ml-2 text-rose-300">(disabled)</span>}
      </p>
      <label className="block text-[11px] text-neutral-400">
        Link cost
        <input
          key={`${link.id}:${link.cost}`}
          type="number"
          min={1}
          step={1}
          className={`${field} mt-1`}
          defaultValue={link.cost}
          onBlur={(e) => commitOnBlur(e, (value) => actions.setCost(link.id, Number(value)))}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      </label>
      <p className="text-[11px] leading-snug text-neutral-500">Tip: double-click the cost on the canvas to edit it.</p>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => actions.toggle(link.id)}>
          {link.enabled ? 'Disable link' : 'Restore link'}
        </button>
        <button className={btnDanger} onClick={actions.remove}>
          Delete link
        </button>
      </div>
    </div>
  )
}

export default function ToolPanel({
  tool,
  onTool,
  nodes,
  links,
  selectedNode,
  selectedLink,
  sourceId,
  destinationId,
  actions,
  notice,
  onPreset,
  onRandom,
  randomBusy,
  onClear,
  canSave,
  onSave,
  onLoadFile,
}) {
  const [routersText, setRoutersText] = useState('6')
  const [densityText, setDensityText] = useState('0.3')
  const fileInput = useRef(null)

  const submitRandom = () => {
    const count = Math.min(50, Math.max(2, Math.round(Number(routersText)) || 6))
    const density = Math.min(1, Math.max(0, Number(densityText) || 0))
    setRoutersText(String(count))
    setDensityText(String(density))
    onRandom(count, density)
  }

  return (
    <div className="divide-y divide-neutral-800 px-4">
      <section className="py-3.5">
        <div className="flex items-baseline justify-between">
          <h2 className={title}>Network Tools</h2>
          <button className="text-xs text-red-400 hover:text-red-300" onClick={onClear}>
            Clear canvas
          </button>
        </div>
        <div className="space-y-0.5">
          {tools.map(([key, label, icon]) => (
            <ToolRow key={key} icon={icon} label={label} active={tool === key} onClick={() => onTool(key)} />
          ))}
        </div>
        {notice && (
          <p className="mt-3 rounded-md border border-amber-700 bg-amber-950/60 px-3 py-2 text-xs text-amber-100">
            {notice}
          </p>
        )}
      </section>

      {(selectedNode || selectedLink) && (
        <section className="py-3.5">
          <h2 className={title}>Selection</h2>
          {selectedNode && (
            <NodeInspector
              node={selectedNode}
              linkCount={links.filter((l) => l.source === selectedNode.id || l.target === selectedNode.id).length}
              isSource={selectedNode.id === sourceId}
              isDestination={selectedNode.id === destinationId}
              actions={actions}
            />
          )}
          {selectedLink && <LinkInspector link={selectedLink} nodes={nodes} actions={actions} />}
        </section>
      )}

      <section className="py-3.5">
        <h2 className={title}>Examples</h2>
        <div className="space-y-0.5">
          {presetKeys.map((key) => (
            <ToolRow key={key} icon={key} label={presets[key].name} onClick={() => onPreset(key)} />
          ))}
        </div>
      </section>

      <section className="space-y-3 py-3.5">
        <h2 className={`${title} mb-0`}>Random Network</h2>
        <SliderRow
          label="Routers"
          text={routersText}
          onText={setRoutersText}
          min={2}
          max={50}
          step={1}
          onEnter={submitRandom}
        />
        <SliderRow
          label="Link Density"
          text={densityText}
          onText={setDensityText}
          min={0}
          max={1}
          step={0.1}
          onEnter={submitRandom}
        />
        <button
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-800 disabled:opacity-50"
          disabled={randomBusy}
          onClick={submitRandom}
        >
          {randomBusy ? 'Generating…' : 'Generate Random'}
        </button>
      </section>

      <section className="py-3.5">
        <h2 className={title}>Save / Load</h2>
        <div className="space-y-2">
          <button
            className={`${rowBase} border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40`}
            disabled={!canSave}
            onClick={onSave}
          >
            <ToolIcon name="save" />
            Save to JSON
          </button>
          <button
            className={`${rowBase} border-neutral-700 bg-neutral-900 text-neutral-100 hover:bg-neutral-800`}
            onClick={() => fileInput.current?.click()}
          >
            <ToolIcon name="folder" />
            Load from JSON
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onLoadFile(file)
          }}
        />
      </section>
    </div>
  )
}
