import { btn, btnPrimary } from '../utils/ui'

export default function RerunPrompt({ text, algorithmName, disabled, onRerun, onLater }) {
  return (
    <div
      role="alertdialog"
      aria-label="Re-run simulation"
      className="fixed bottom-6 left-1/2 z-40 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-neutral-600 bg-neutral-900 p-4 shadow-2xl shadow-black/50"
    >
      <p className="text-sm font-semibold text-neutral-100">{text}</p>
      <p className="mt-1 text-xs text-neutral-400">
        The previous {algorithmName} run no longer matches the network. Re-run it to see the new result?
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button className={btn} onClick={onLater}>
          Later
        </button>
        <button className={btnPrimary} disabled={disabled} onClick={onRerun}>
          Re-run
        </button>
      </div>
    </div>
  )
}
