export default function PanelHeader({ title, subtitle, right }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold leading-tight text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-neutral-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
