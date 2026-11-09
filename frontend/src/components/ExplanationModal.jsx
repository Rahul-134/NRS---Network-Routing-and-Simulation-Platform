import { useEffect, useRef, useState } from 'react'
import ToolIcon from './ToolIcons'

function stepTitle(algorithm, step, labelOf) {
  if (step.type === 'complete') return 'Result'
  if (algorithm === 'dijkstra') {
    return step.type === 'init' ? 'Initialize distances' : `Select router ${labelOf(step.current)}`
  }
  if (algorithm === 'distance-vector') {
    if (step.type === 'init') return 'Round 0: direct neighbors'
    return step.changes.length ? `Round ${step.round}: tables updated` : `Round ${step.round}: no changes`
  }
  if (step.type === 'init') return 'Originate advertisements'
  if (step.type === 'flood') return `Flooding round ${step.round}`
  return 'Compute routes'
}

const splitSentences = (text) => text.split(/(?<=\.)\s+(?=[A-Z])/)

function StepCard({ number, title, text, latest, large }) {
  const [lead, ...rest] = splitSentences(text)
  return (
    <li className={`rounded-xl border p-4 ${latest ? 'border-neutral-600 bg-neutral-900' : 'border-neutral-800'}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-700 text-xs font-semibold tabular-nums text-neutral-200">
          {number}
        </span>
        <span className={`font-semibold text-white ${large ? 'text-base' : 'text-sm'}`}>{title}</span>
        {latest && (
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-black">Current</span>
        )}
      </div>
      <p className={`mt-3 leading-relaxed ${latest ? 'text-neutral-100' : 'text-neutral-300'} ${large ? 'text-base' : 'text-sm'}`}>
        {lead}
      </p>
      {rest.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-l border-neutral-700 pl-4">
          {rest.map((sentence, i) => (
            <li key={i} className={`leading-relaxed text-neutral-400 ${large ? 'text-sm' : 'text-[13px]'}`}>
              {sentence}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function ExplanationModal({ sim, algorithm, algorithmName, nodes, onClose }) {
  const [view, setView] = useState('current')
  const latestRef = useRef(null)
  const labelOf = (id) => nodes.find((n) => n.id === id)?.label ?? id

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    latestRef.current?.scrollIntoView({ block: 'nearest' })
  }, [view, sim.index])

  const steps = sim.result.steps.slice(0, sim.index + 1)
  const visible = view === 'current' ? steps.slice(-1) : steps

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000b3] p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Explanation"
        className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Explanation</h2>
            <p className="mt-0.5 text-sm text-neutral-400">
              {algorithmName} · step {sim.index + 1} of {sim.total}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <ToolIcon name="close" size={18} />
          </button>
        </div>

        <div className="mb-4 inline-flex self-start rounded-lg bg-neutral-900 p-0.5">
          {[
            ['current', 'Current step'],
            ['all', 'All steps so far'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={[
                'rounded-md px-3 py-1.5 text-xs transition-colors',
                view === key ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-neutral-100',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {visible.map((step) => {
            const latest = step.step === steps[steps.length - 1].step
            return (
              <div key={step.step} ref={latest ? latestRef : null}>
                <StepCard
                  number={step.step + 1}
                  title={stepTitle(algorithm, step, labelOf)}
                  text={step.explanation}
                  latest={latest}
                  large={view === 'current'}
                />
              </div>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
