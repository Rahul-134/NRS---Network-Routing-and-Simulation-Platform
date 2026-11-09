export const th = 'sticky top-0 bg-neutral-900 px-3 py-2 text-xs font-semibold whitespace-nowrap text-neutral-400'
export const td = 'px-3 py-1.5'

const chipTones = {
  idle: 'border-neutral-700 text-neutral-200',
  candidate: 'border-cyan-600 text-cyan-100',
  visited: 'border-teal-700 text-teal-100',
  current: 'border-amber-500 bg-amber-950 text-amber-100',
  path: 'border-emerald-600 bg-emerald-950 text-emerald-100',
  updated: 'border-amber-600 bg-amber-950 text-amber-100',
}

const pillTones = {
  idle: 'border-neutral-800 text-neutral-500',
  candidate: 'border-cyan-900 bg-cyan-950/50 text-cyan-300',
  visited: 'border-teal-900 bg-teal-950/50 text-teal-300',
  current: 'border-amber-700 bg-amber-950/60 text-amber-200',
  path: 'border-emerald-800 bg-emerald-950/60 text-emerald-300',
}

const pillText = {
  idle: 'Unvisited',
  candidate: 'Candidate',
  visited: 'Visited',
  current: 'Current',
  path: 'On path',
}

export function TableCard({ children }) {
  return (
    <div className="max-h-[420px] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900">
      {children}
    </div>
  )
}

export function RouterChip({ label, tone = 'idle' }) {
  return (
    <span
      className={`inline-flex min-w-8 items-center justify-center rounded-lg border px-2 py-1 text-xs font-semibold ${chipTones[tone]}`}
    >
      {label}
    </span>
  )
}

export function StatePill({ state }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap ${pillTones[state]}`}>
      {pillText[state]}
    </span>
  )
}

export function CountPill({ count }) {
  return count ? (
    <span className="inline-block rounded-full border border-amber-700 bg-amber-950/60 px-2 py-0.5 text-[11px] font-medium text-amber-200">
      {count}
    </span>
  ) : (
    <span className="text-neutral-500">–</span>
  )
}
