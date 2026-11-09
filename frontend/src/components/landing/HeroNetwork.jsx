import { presets } from '../../utils/presets'

const { nodes, links } = presets.simple.topology
const route = ['A', 'C', 'B', 'D', 'E', 'F']
const cycle = 10
const drawEnd = 62

const pad = 40
const xs = nodes.map((n) => n.x)
const ys = nodes.map((n) => n.y)
const minX = Math.min(...xs)
const minY = Math.min(...ys)
const width = Math.max(...xs) - minX + pad * 2
const height = Math.max(...ys) - minY + pad * 2

const point = Object.fromEntries(nodes.map((n) => [n.id, { x: n.x - minX + pad, y: n.y - minY + pad }]))

const segments = route.slice(1).map((id, i) => {
  const a = point[route[i]]
  const b = point[id]
  return Math.hypot(b.x - a.x, b.y - a.y)
})
const total = segments.reduce((sum, s) => sum + s, 0)
const arrival = route.map((_, i) => (segments.slice(0, i).reduce((sum, s) => sum + s, 0) / total) * drawEnd)

const onRoute = (a, b) => route.some((id, i) => i > 0 && ((route[i - 1] === a && id === b) || (route[i - 1] === b && id === a)))

const routePath = route.map((id, i) => `${i ? 'L' : 'M'}${point[id].x} ${point[id].y}`).join(' ')

const keyframes = route
  .map((id, i) => {
    const on = arrival[i]
    return `@keyframes hero-node-${id} { 0%, ${on}% { opacity: 0; transform: scale(.6) } ${on + 2.5}%, 90% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1) } }`
  })
  .join('\n')

export default function HeroNetwork() {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="A six-router network where the cheapest route from A to F is traced step by step"
      className="h-auto w-full"
    >
      <style>{keyframes}</style>

      {links.map((l) => {
        const a = point[l.source]
        const b = point[l.target]
        return (
          <line
            key={l.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            className={onRoute(l.source, l.target) ? 'stroke-neutral-600' : 'stroke-neutral-700'}
            strokeWidth="2"
          />
        )
      })}

      <path
        d={routePath}
        pathLength="1"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hero-route stroke-emerald-400"
        style={{ animationDuration: `${cycle}s` }}
      />

      {links.map((l) => {
        const a = point[l.source]
        const b = point[l.target]
        const x = (a.x + b.x) / 2
        const y = (a.y + b.y) / 2
        return (
          <g key={`${l.id}-cost`}>
            <circle cx={x} cy={y} r="14" className="fill-black stroke-neutral-700" strokeWidth="1.5" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-neutral-300 text-[13px] font-semibold">
              {l.cost}
            </text>
          </g>
        )
      })}

      {nodes.map((n) => {
        const { x, y } = point[n.id]
        const index = route.indexOf(n.id)
        const isSource = n.id === route[0]
        const isDestination = n.id === route[route.length - 1]
        return (
          <g key={n.id}>
            {index >= 0 && (
              <circle
                cx={x}
                cy={y}
                r="28"
                fill="none"
                strokeWidth="2.5"
                className={`hero-node ${isDestination ? 'stroke-rose-400' : 'stroke-emerald-400'}`}
                style={{
                  animationName: `hero-node-${n.id}`,
                  animationDuration: `${cycle}s`,
                  transformOrigin: `${x}px ${y}px`,
                }}
              />
            )}
            <circle cx={x} cy={y} r="22" className="fill-neutral-900 stroke-neutral-600" strokeWidth="2" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-white text-[15px] font-semibold">
              {n.label}
            </text>
            {(isSource || isDestination) && (
              <text
                x={x}
                y={y - 40}
                textAnchor="middle"
                className={`text-[11px] font-bold tracking-widest ${isSource ? 'fill-emerald-400' : 'fill-rose-400'}`}
              >
                {isSource ? 'SRC' : 'DST'}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
