import { useState } from 'react'
import ExplanationModal from './ExplanationModal'
import PanelHeader from './PanelHeader'
import ToolIcon from './ToolIcons'
import { btn } from '../utils/ui'

export default function ExplanationPanel({ sim, algorithm, algorithmName, nodes }) {
  const [open, setOpen] = useState(false)

  return (
    <section className="bg-black py-3.5 lg:sticky lg:bottom-0">
      <PanelHeader title="Explanation" subtitle="Why the algorithm made each step" />
      <button className={`${btn} w-full py-2.5 text-sm`} disabled={!sim.result} onClick={() => setOpen(true)}>
        <ToolIcon name="spark" size={16} />
        Generate Explanation
      </button>
      {!sim.result && (
        <p className="mt-2 text-xs text-neutral-500">Start the simulation to generate an explanation.</p>
      )}
      {open && sim.result && (
        <ExplanationModal
          sim={sim}
          algorithm={algorithm}
          algorithmName={algorithmName}
          nodes={nodes}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  )
}
