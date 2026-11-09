import { useEffect } from 'react'
import RoutingTable from './RoutingTable'
import RouterPicker from './RouterPicker'
import ToolIcon from './ToolIcons'

export default function RoutingTableModal({
  title,
  subtitle,
  rows,
  nodes,
  viewId,
  onView,
  showPicker,
  sourceId,
  destinationId,
  settled,
  children,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000b3] p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label={title}
        className="flex max-h-full w-full max-w-4xl flex-col rounded-2xl border border-neutral-800 bg-neutral-950 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-neutral-400">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {showPicker && <RouterPicker nodes={nodes} viewId={viewId} onView={onView} />}
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
            >
              <ToolIcon name="close" size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900">
          {children ?? (
            <RoutingTable
              rows={rows}
              sourceId={sourceId}
              destinationId={destinationId}
              settled={settled}
              size="large"
              emptyText="No routing table to show yet."
            />
          )}
        </div>
      </div>
    </div>
  )
}
