import logoDark from '../assets/nrs-logo.png'
import logoLight from '../assets/nrs-logo-light.png'
import LiquidNavbar from './LiquidNavbar'
import ToolIcon from './ToolIcons'
import { algorithms } from '../utils/algorithms'

const status = {
  online: { dot: 'bg-emerald-500', text: 'text-neutral-300' },
  offline: { dot: 'bg-rose-500', text: 'text-rose-300' },
  checking: { dot: 'bg-amber-500', text: 'text-neutral-400' },
}

const navFx = { dijkstra: 'pop', 'distance-vector': 'spin', 'link-state': 'wave' }

const navItems = algorithms.map((a) => ({
  label: a.name,
  icon: <ToolIcon name={a.key} size={18} />,
  fx: navFx[a.key],
}))

const action =
  'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export default function TopBar({
  algorithm,
  onAlgorithm,
  backend,
  onLoadExample,
  onCompare,
  canCompare,
  theme,
  onToggleTheme,
}) {
  const current = status[backend]

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-neutral-800 bg-black px-5 py-2.5 lg:grid lg:grid-cols-[1fr_auto_1fr]">
      <div className="order-1 flex items-center">
        <a href="/" title="Back to the home page">
          <img src={theme === 'light' ? logoLight : logoDark} alt="NRS - Network Routing & Simulation" className="h-12 w-auto" />
        </a>
      </div>

      <div className="order-3 flex w-full justify-center lg:order-2 lg:w-auto">
        <LiquidNavbar
          size="sm"
          label="Routing algorithm"
          tone={theme === 'light' ? 'light' : 'dark'}
          items={navItems}
          active={algorithms.findIndex((a) => a.key === algorithm)}
          onChange={(i) => onAlgorithm(algorithms[i].key)}
        />
      </div>

      <div className="order-2 ml-auto flex items-center justify-end gap-3 lg:order-3">
        <span
          className={`hidden items-center gap-2 rounded-full border border-neutral-800 px-3 py-1 text-xs sm:inline-flex ${current.text}`}
        >
          <span className={`h-2 w-2 rounded-full ${current.dot}`} />
          API {backend}
        </span>
        <span className="hidden h-6 w-px bg-neutral-800 sm:block" />
        <button
          className={`${action} border border-neutral-600 bg-neutral-900 text-white hover:bg-neutral-800`}
          disabled={!canCompare}
          onClick={onCompare}
        >
          <ToolIcon name="compare" size={16} />
          Compare
        </button>
        <button
          className={`${action} text-neutral-300 hover:bg-neutral-900 hover:text-white`}
          onClick={onLoadExample}
          aria-label="Load Example"
          title="Load the Simple example"
        >
          <ToolIcon name="layers" size={16} />
          <span className="hidden sm:inline">Load Example</span>
        </button>
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          <ToolIcon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>
      </div>
    </header>
  )
}
