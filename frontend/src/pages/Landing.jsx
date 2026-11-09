import { useEffect, useRef, useState } from 'react'
import logoDark from '../assets/nrs-logo.png'
import logoLight from '../assets/nrs-logo-light.png'
import posterDark from '../assets/landing/poster-dark.jpg'
import posterLight from '../assets/landing/poster-light.jpg'
import posterLightDemo from '../assets/landing/poster-light-demo.jpg'
import linkFailureDark from '../assets/landing/link-failure-dark.mp4'
import linkFailureLight from '../assets/landing/link-failure-light.mp4'
import comparisonDark from '../assets/landing/comparison-dark.mp4'
import comparisonLight from '../assets/landing/comparison-light.mp4'
import overviewDark from '../assets/landing/overview-dark.mp4'
import overviewLight from '../assets/landing/overview-light.mp4'
import LiquidNavbar from '../components/LiquidNavbar'
import ToolIcon from '../components/ToolIcons'
import GradientASCII from '../components/landing/GradientASCII'
import HeroNetwork from '../components/landing/HeroNetwork'
import { techLogos } from '../components/landing/techLogos'
import { useTheme } from '../hooks/useTheme'

const navItems = [
  { id: 'algorithms', label: 'Algorithms', icon: 'dijkstra', fx: 'spin' },
  { id: 'how-it-works', label: 'How it works', icon: 'pointer', fx: 'pop' },
  { id: 'features', label: 'Features', icon: 'spark', fx: 'glow' },
  { id: 'stack', label: 'Under the hood', icon: 'layers', fx: 'wave' },
]

const liquidItems = navItems.map(({ id, label, icon, fx }) => ({
  label,
  href: `#${id}`,
  icon: <ToolIcon name={icon} size={18} />,
  fx,
}))

const stats = [
  { value: '3', label: 'routing modes' },
  { value: '4', label: 'preset networks' },
  { value: '50', label: 'routers, at most' },
  { value: '2', label: 'themes, dark and light' },
]

const modes = [
  {
    key: 'dijkstra',
    name: 'Dijkstra',
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    hover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    line: 'Finds the cheapest path from one router by finalizing the closest unvisited router each step.',
    sees: ['Tentative distances and previous hops', 'Visited, current and candidate routers', 'The final path, cost and hop count'],
  },
  {
    key: 'distance-vector',
    name: 'Distance Vector',
    accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    hover: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
    line: 'Every router learns only from its neighbors, round after round, until no table changes.',
    sees: ['Each router’s table, round by round', 'Which entries changed and why', 'The round where the network converges'],
  },
  {
    key: 'link-state',
    name: 'Link State',
    accent: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
    hover: 'hover:border-violet-500/50 hover:shadow-violet-500/10',
    line: 'Routers flood their links to everyone, then each one computes routes from the same map.',
    sees: ['The link-state database each router holds', 'Advertisements spreading across the network', 'Routes computed from the shared map'],
  },
]

const steps = [
  { title: 'Build a network', text: 'Start from a preset, generate a random connected network, or place routers and links yourself.' },
  { title: 'Pick a route', text: 'Choose a source and a destination, then choose Dijkstra, Distance Vector or Link State.' },
  { title: 'Step through it', text: 'Play, pause, step forward and back. Ask for a plain-language explanation of any step.' },
  { title: 'Break something', text: 'Change a cost or disable a link, re-run, and watch the route and the tables adapt.' },
]

const features = [
  { icon: 'dijkstra', title: 'Step-by-step playback', text: 'Play, pause, next, back, run to end and a speed control. Every step is recorded, so you can always go back.' },
  { icon: 'spark', title: 'Plain-language explanations', text: 'One click explains the current step, or every step so far, in words instead of formulas.' },
  { icon: 'link', title: 'Failure simulation', text: 'Disable a link or edit its cost, re-run, and see exactly how routing changes around the failure.' },
  { icon: 'compare', title: 'Side-by-side comparison', text: 'Run all three algorithms on the same network and compare paths, costs and work done.' },
  { icon: 'layers', title: 'Routing tables and state', text: 'Open any router to see its routing table or link-state database, with a full-size view when you need it.' },
  { icon: 'mesh', title: 'Presets and random networks', text: 'Simple, Ring, Mesh and Campus presets, plus a generator for connected networks of up to 50 routers.' },
]

function useActiveSection(ids) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    const visible = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        setActive(ids.find((id) => visible.has(id)) ?? null)
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}

const navIds = navItems.map((item) => item.id)

const heroColors = ['#047857', '#ecfdf5', '#6ee7b7', '#22d3ee']

const container = 'mx-auto w-full max-w-6xl px-5 sm:px-8'
const primary =
  'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-neutral-100 px-5 text-sm font-semibold text-black transition-colors hover:bg-white'
const secondary =
  'inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-neutral-700 px-5 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-900 hover:text-white'

function Heading({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-base leading-relaxed text-neutral-400">{text}</p>}
    </div>
  )
}

function Demo({ src, poster, label }) {
  const ref = useRef(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const video = ref.current
    if (reduced || !video) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [reduced])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="auto"
      controls={reduced}
      className="block w-full"
    />
  )
}

function Frame({ src, video, alt, caption, className = '' }) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-1.5 border-b border-neutral-800 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        </div>
        {video ? (
          <Demo key={video} src={video} poster={src} label={alt} />
        ) : (
          <img src={src} alt={alt} loading="lazy" className="block w-full" />
        )}
      </div>
      {caption && <figcaption className="mt-3 text-center text-sm text-neutral-500">{caption}</figcaption>}
    </figure>
  )
}

export default function Landing() {
  const { theme, toggle } = useTheme()
  const spy = useActiveSection(navIds)
  const [picked, setPicked] = useState(-2)
  const active = picked !== -2 ? picked : navIds.indexOf(spy)

  const onPick = (index) => {
    setPicked(index)
    setTimeout(() => setPicked(-2), 1100)
  }

  return (
    <div className="min-h-full bg-black text-neutral-200">
      <header className="sticky top-0 z-20 bg-linear-to-b from-black/90 via-black/60 to-transparent">
        <div className={`${container} flex h-16 items-center justify-between gap-4`}>
          <a href="/" aria-label="NRS home">
            <img src={theme === 'light' ? logoLight : logoDark} alt="NRS - Network Routing & Simulation" className="h-12 w-auto" />
          </a>
          <div className="hidden md:block">
            <LiquidNavbar
              size="sm"
              label="Sections"
              tone={theme === 'light' ? 'light' : 'dark'}
              items={liquidItems}
              active={active}
              onChange={onPick}
            />
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
            >
              <ToolIcon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
            </button>
            <a href="/app" className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-neutral-100 px-4 text-sm font-semibold text-black transition-colors hover:bg-white">
              Open simulator
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <GradientASCII colors={heroColors} lightMode={theme === 'light'} cellSize={16} dpr={1} />
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-black/35 bg-linear-to-r from-black/85 via-black/60 to-black/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-b from-transparent to-black" />
          <div className={`${container} grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-10`}>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                A teaching simulator for routing algorithms
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                See how a network
                <br />
                <span className="text-emerald-400">chooses its route.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
                Build a small network of routers, pick a source and a destination, and step through Dijkstra, Distance Vector and
                Link State one decision at a time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/app" className={primary}>
                  Open simulator
                  <ToolIcon name="pointer" size={16} />
                </a>
                <a href="#how-it-works" className={secondary}>See how it works</a>
              </div>
              <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="text-2xl font-semibold text-white">{s.value}</dt>
                    <dd className="mt-0.5 text-xs leading-snug text-neutral-500">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-neutral-800 bg-neutral-950/90 p-4 shadow-2xl shadow-black/30 sm:p-6">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-300">Dijkstra &middot; A to F</span>
                  <span className="rounded-full border border-emerald-500/40 px-2.5 py-0.5 font-medium text-emerald-400">cost 13</span>
                </div>
                <HeroNetwork />
              </div>
            </div>
          </div>
        </section>

        <section className={`${container} pb-20 sm:pb-28`}>
          <Frame
            src={theme === 'light' ? posterLight : posterDark}
            video={theme === 'light' ? overviewLight : overviewDark}
            alt="The NRS workspace running Dijkstra, Distance Vector and Link State in turn on the same six-router network"
            caption="One network, three algorithms: step through each one in the same workspace."
          />
        </section>

        <section id="algorithms" className="scroll-mt-20 border-t border-neutral-800 py-20 sm:py-28">
          <div className={container}>
            <Heading
              eyebrow="Three modes"
              title="One network, three ways to route it"
              text="Switch modes without rebuilding anything and see how each algorithm reaches its answer."
            />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {modes.map((m) => (
                <article
                  key={m.key}
                  className={`group flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950 p-6 transition duration-200 hover:bg-neutral-900 hover:shadow-xl motion-safe:hover:-translate-y-1 ${m.hover}`}
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-110 ${m.accent}`}
                  >
                    <ToolIcon name={m.key} size={22} />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-white">{m.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{m.line}</p>
                  <ul className="mt-5 space-y-2.5 border-t border-neutral-800 pt-5 text-sm text-neutral-300">
                    {m.sees.map((item) => (
                      <li key={item} className="flex gap-2.5">
                        <span className={`mt-0.5 ${m.accent.split(' ')[0]}`}>
                          <ToolIcon name="check" size={16} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-t border-neutral-800 bg-neutral-950 py-20 sm:py-28">
          <div className={container}>
            <Heading eyebrow="How it works" title="From a blank canvas to a route in four steps" />
            <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="group rounded-2xl border border-neutral-800 bg-black p-6 transition duration-200 hover:border-emerald-500/40 hover:bg-neutral-900 hover:shadow-xl hover:shadow-emerald-500/10 motion-safe:hover:-translate-y-1"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/40 text-sm font-semibold text-emerald-400 transition-colors duration-200 group-hover:border-emerald-400 group-hover:bg-emerald-500/15">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              <Frame
                src={theme === 'light' ? posterLightDemo : posterDark}
                video={theme === 'light' ? linkFailureLight : linkFailureDark}
                alt="Dijkstra running on the Simple network, then a link being disabled and the route changing from cost 13 to cost 14"
                caption="Disable a link and re-run to see the route change."
              />
              <Frame
                src={theme === 'light' ? posterLightDemo : posterDark}
                video={theme === 'light' ? comparisonLight : comparisonDark}
                alt="The Campus network loaded and the comparison window showing all three algorithms on it"
                caption="Compare all three algorithms on the same network."
              />
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-t border-neutral-800 py-20 sm:py-28">
          <div className={container}>
            <Heading
              eyebrow="Features"
              title="Everything you need to understand the result"
              text="Built so that every number on screen can be traced back to a step you just watched."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="bg-black p-7 transition-colors hover:bg-neutral-950">
                  <span className="text-emerald-400">
                    <ToolIcon name={f.icon} size={22} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="stack" className="scroll-mt-20 border-t border-neutral-800 bg-neutral-950 py-20 sm:py-28">
          <div className={`${container} grid items-center gap-12 lg:grid-cols-2`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Under the hood</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">The algorithms are real code</h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-400">
                A FastAPI backend runs each algorithm as plain Python, with no graph library, and returns the full list of
                simulation steps. The frontend only animates and renders them, so what you see is exactly what the algorithm did.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-500">
                NRS is a learning tool. It does not emulate real routers, capture traffic or implement production OSPF.
              </p>
            </div>
            <ul className="flex flex-wrap gap-3 lg:justify-end">
              {techLogos.map((tech) => (
                <li
                  key={tech.name}
                  style={{ '--brand': tech.color }}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-800 bg-black px-5 py-3 text-sm font-medium text-neutral-200 transition duration-200 hover:border-(--brand) hover:bg-neutral-900 hover:text-white motion-safe:hover:-translate-y-0.5"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-current text-neutral-500 transition-colors duration-200 group-hover:text-(--brand)">
                    <path d={tech.path} />
                  </svg>
                  {tech.name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-neutral-800 py-20 sm:py-28">
          <div className={`${container} text-center`}>
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Watch a route get chosen, one step at a time
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-neutral-400">
              The Simple network is loaded and ready. Press Play and follow Dijkstra from A to F.
            </p>
            <div className="mt-8 flex justify-center">
              <a href="/app" className={primary}>
                Open simulator
                <ToolIcon name="pointer" size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-800 py-8">
        <div className={`${container} flex flex-col items-center justify-between gap-3 text-sm text-neutral-500 sm:flex-row`}>
          <span>NRS &middot; Network Routing &amp; Simulation</span>
          <span>Dijkstra &middot; Distance Vector &middot; Link State</span>
        </div>
      </footer>
    </div>
  )
}
