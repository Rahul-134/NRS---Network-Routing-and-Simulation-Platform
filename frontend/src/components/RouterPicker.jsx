import Select from './Select'

export default function RouterPicker({ nodes, viewId, onView }) {
  return (
    <div className="w-24">
      <Select
        size="sm"
        ariaLabel="Router to inspect"
        value={viewId}
        options={nodes.map((n) => ({ value: n.id, label: n.label }))}
        onChange={onView}
      />
    </div>
  )
}
