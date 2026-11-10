import { useEffect, useRef } from 'react'

const repo = 'https://github.com/Rahul-134/NRS---Network-Routing-and-Simulation-Platform'

const columns = [
  {
    title: 'Explore',
    links: [
      ['Algorithms', '#algorithms'],
      ['How it works', '#how-it-works'],
      ['Features', '#features'],
      ['Under the hood', '#stack'],
      ['Open simulator', '/app'],
    ],
  },
  {
    title: 'Docs',
    links: [
      ['Algorithms guide', `${repo}/blob/main/docs/algorithms.md`],
      ['API reference', `${repo}/blob/main/docs/api.md`],
      ['Testing', `${repo}/blob/main/docs/testing.md`],
      ['README', `${repo}#readme`],
    ],
  },
  {
    title: 'Project',
    links: [
      ['GitHub', repo],
      ['Report an issue', `${repo}/issues`],
      ['Contributing', `${repo}/blob/main/CONTRIBUTING.md`],
      ['MIT License', `${repo}/blob/main/LICENSE`],
    ],
  },
]

const githubPath =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.921.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const spot = (radius) => {
  const mask = `radial-gradient(circle ${radius}px at var(--x) var(--y), #000 0%, transparent 100%)`
  return { maskImage: mask, WebkitMaskImage: mask, opacity: 'var(--o)' }
}

function Gradient({ id, from, to }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="900" y2="0">
      <stop offset="0" style={{ stopColor: from }} />
      <stop offset="1" style={{ stopColor: to }} />
    </linearGradient>
  )
}

function Letters({ className, style, defs }) {
  return (
    <svg viewBox="0 0 900 330" aria-hidden="true" className={`absolute inset-x-0 top-0 h-auto w-full ${className ?? ''}`} style={style}>
      {defs && (
        <defs>
          <Gradient id="nrs-edge" from="var(--color-emerald-300)" to="var(--color-cyan-300)" />
          <Gradient id="nrs-glow" from="var(--color-emerald-400)" to="var(--color-cyan-400)" />
        </defs>
      )}
      <text
        x="450"
        y="300"
        textAnchor="middle"
        textLength="880"
        lengthAdjust="spacingAndGlyphs"
        fontSize="330"
        fontWeight="800"
        fill="currentColor"
        style={{ fill: 'var(--fill, currentColor)', stroke: 'var(--stroke, none)', strokeWidth: 'var(--stroke-width, 0)' }}
      >
        NRS
      </text>
    </svg>
  )
}

function Wordmark() {
  const ref = useRef(null)

  const place = (x, y) => {
    const el = ref.current
    el.style.setProperty('--x', `${x}px`)
    el.style.setProperty('--y', `${y}px`)
    el.style.setProperty('--o', '1')
  }

  const onMove = (e) => {
    if (e.pointerType === 'touch') return
    const rect = ref.current.getBoundingClientRect()
    place(e.clientX - rect.left, e.clientY - rect.top)
  }

  useEffect(() => {
    const el = ref.current
    const touch = window.matchMedia('(hover: none)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!touch || reduced) return undefined

    let visible = false
    let frame
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(el)
    const tick = (t) => {
      if (visible) {
        const { width, height } = el.getBoundingClientRect()
        place(width * (0.1 + 0.8 * ((Math.sin(t / 1800) + 1) / 2)), height * 0.5)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={(e) => e.pointerType !== 'touch' && ref.current.style.setProperty('--o', '0')}
      style={{ '--x': '50%', '--y': '50%', '--o': 0 }}
      className="relative mx-auto w-full max-w-6xl select-none overflow-hidden aspect-[900/250]"
    >
      <Letters className="text-neutral-900" defs />
      <Letters className="transition-opacity duration-500" style={{ ...spot(260), '--fill': 'url(#nrs-glow)', fillOpacity: 0.16 }} />
      <Letters
        className="text-transparent transition-opacity duration-500"
        style={{ ...spot(170), '--stroke': 'url(#nrs-edge)', '--stroke-width': '2' }}
      />
    </div>
  )
}

function FooterLink({ href, children }) {
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="cursor-target text-sm text-neutral-400 transition-colors hover:text-emerald-300"
    >
      {children}
    </a>
  )
}

export default function Footer({ logo, container }) {
  return (
    <footer className="relative overflow-hidden border-t border-neutral-800">
      <div className="px-5 pt-10 sm:px-8 sm:pt-14">
        <Wordmark />
      </div>
      <div aria-hidden="true" className="relative h-px">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-emerald-400/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--color-emerald-400)_14%,transparent),transparent)]" />
      </div>

      <div className={`${container} relative grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.4fr_2fr]`}>
        <div className="flex flex-col items-start gap-5">
          <img src={logo} alt="NRS - Network Routing & Simulation" className="h-11 w-auto" />
          <p className="max-w-xs text-sm leading-relaxed text-neutral-400">
            See how routers find the cheapest path, one step at a time.
          </p>
          <a
            href={repo}
            target="_blank"
            rel="noreferrer"
            aria-label="NRS on GitHub"
            className="cursor-target flex h-10 w-10 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-current">
              <path d={githubPath} />
            </svg>
          </a>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-5 space-y-3.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-neutral-800 py-6">
        <div className={`${container} flex flex-col items-center justify-between gap-3 text-sm text-neutral-500 sm:flex-row`}>
          <span>&copy; 2026 NRS &middot; Network Routing &amp; Simulation</span>
          <span>Dijkstra &middot; Distance Vector &middot; Link State</span>
        </div>
      </div>
    </footer>
  )
}
