import { useEffect, useMemo, useRef, useState } from 'react'
import TopBar from '../components/TopBar'
import ToolPanel from '../components/ToolPanel'
import TopologyCanvas from '../components/TopologyCanvas'
import ControlPanel from '../components/ControlPanel'
import AlgorithmState from '../components/AlgorithmState'
import RouterOverview from '../components/RouterOverview'
import ExplanationPanel from '../components/ExplanationPanel'
import BottomPanels from '../components/BottomPanels'
import ComparisonPanel from '../components/ComparisonPanel'
import { useTopology } from '../hooks/useTopology'
import { useSimulation } from '../hooks/useSimulation'
import { useBackendStatus } from '../hooks/useBackendStatus'
import { useTheme } from '../hooks/useTheme'
import { buildView, overviewRows, routingTableRows } from '../utils/simView'
import { networkStats } from '../utils/graphStats'
import { getPreset } from '../utils/presets'
import { generateTopology, validateTopology } from '../services/api'
import { algorithms } from '../utils/algorithms'
import { parseTopologyFile, serializeTopology } from '../utils/topologyFile'
import RerunPrompt from '../components/RerunPrompt'

export default function Workspace() {
  const topo = useTopology()
  const { topology } = topo
  const backend = useBackendStatus()
  const { theme, toggle: toggleTheme } = useTheme()

  const [algorithm, setAlgorithm] = useState('dijkstra')
  const [source, setSource] = useState('A')
  const [destination, setDestination] = useState('F')
  const [tool, setTool] = useState('select')
  const [selection, setSelection] = useState(null)
  const [pendingLink, setPendingLink] = useState(null)
  const [viewRouter, setViewRouter] = useState(null)
  const [notice, setNotice] = useState(null)
  const [fitSignal, setFitSignal] = useState(0)
  const [randomBusy, setRandomBusy] = useState(false)
  const [comparing, setComparing] = useState(false)
  const [rerunPrompt, setRerunPrompt] = useState(null)
  const [editingLink, setEditingLink] = useState(null)

  const ids = topology.nodes.map((n) => n.id)
  const sourceId = ids.includes(source) ? source : (ids[0] ?? '')
  const destinationId = ids.includes(destination) ? destination : (ids[ids.length - 1] ?? '')
  const pendingId = ids.includes(pendingLink) ? pendingLink : null
  const viewId = ids.includes(viewRouter) ? viewRouter : sourceId

  const selectedNode = selection?.type === 'node' ? topology.nodes.find((n) => n.id === selection.id) : null
  const selectedLink = selection?.type === 'link' ? topology.links.find((l) => l.id === selection.id) : null
  const activeSelection = selectedNode || selectedLink ? selection : null

  const sim = useSimulation({ algorithm, topology, source: sourceId, destination: destinationId })
  const view = useMemo(
    () => buildView({ algorithm, topology, step: sim.step, result: sim.result, sourceId }),
    [algorithm, topology, sim.step, sim.result, sourceId],
  )
  const rows = useMemo(
    () => routingTableRows({ algorithm, topology, step: sim.step, sourceId, viewId }),
    [algorithm, topology, sim.step, sourceId, viewId],
  )
  const overview = useMemo(
    () => overviewRows({ algorithm, topology, step: sim.step }),
    [algorithm, topology, sim.step],
  )
  const stats = useMemo(() => networkStats(topology), [topology])
  const sourceLabel = topology.nodes.find((n) => n.id === sourceId)?.label ?? ''
  const algorithmName = algorithms.find((a) => a.key === algorithm).name

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  const say = (text) => setNotice({ text })

  if (rerunPrompt && sim.result) setRerunPrompt(null)

  const noteEdit = (text) => {
    if (sim.result) setRerunPrompt({ text })
    else if (rerunPrompt) setRerunPrompt({ text: 'Several changes made to the network' })
  }

  const linkName = (link) => {
    const label = (id) => topology.nodes.find((n) => n.id === id)?.label ?? id
    return `${label(link.source)}–${label(link.target)}`
  }

  const selectTool = (next) => {
    setTool(next)
    setPendingLink(null)
  }

  const removeRouter = (node) => {
    const degree = topology.links.filter((l) => l.source === node.id || l.target === node.id).length
    if (degree && !window.confirm(`Delete router ${node.label} and its ${degree} link(s)?`)) return
    topo.removeNode(node.id)
    noteEdit(`Router ${node.label} deleted`)
    setSelection(null)
  }

  const removeLink = (link) => {
    topo.removeLink(link.id)
    noteEdit(`Link ${linkName(link)} deleted`)
    setSelection(null)
  }

  const deleteSelection = () => {
    if (selectedNode) removeRouter(selectedNode)
    else if (selectedLink) removeLink(selectedLink)
  }

  const handleNodeClick = (id) => {
    if (tool === 'delete') {
      const node = topology.nodes.find((n) => n.id === id)
      if (node) removeRouter(node)
      return
    }
    if (tool !== 'link') {
      setSelection({ type: 'node', id })
      setViewRouter(id)
      return
    }
    if (!pendingId) {
      setPendingLink(id)
      return
    }
    if (pendingId === id) {
      setPendingLink(null)
      return
    }
    const outcome = topo.addLink(pendingId, id)
    setPendingLink(null)
    if (outcome.error) {
      say(outcome.error)
      return
    }
    setSelection({ type: 'link', id: outcome.id })
    noteEdit('Link added')
  }

  const handleEdgeClick = (id) => {
    if (tool === 'delete') {
      const link = topology.links.find((l) => l.id === id)
      if (link) removeLink(link)
      return
    }
    setSelection({ type: 'link', id })
  }

  const handlePaneClick = (position) => {
    if (tool === 'router') {
      setSelection({ type: 'node', id: topo.addNode(position) })
      return
    }
    setSelection(null)
    setPendingLink(null)
  }

  const showTopology = (topology, from, to) => {
    topo.load(topology)
    setSource(from)
    setDestination(to)
    setSelection(null)
    setPendingLink(null)
    setViewRouter(null)
    setRerunPrompt(null)
    setFitSignal((n) => n + 1)
  }

  const loadPreset = (key) => {
    const preset = getPreset(key)
    showTopology(preset.topology, preset.source, preset.destination)
  }

  const loadRandom = async (count, density) => {
    setRandomBusy(true)
    try {
      const generated = await generateTopology(count, density)
      const last = generated.nodes.length - 1
      showTopology(generated, generated.nodes[0].id, generated.nodes[last].id)
    } catch (err) {
      say(`Could not generate a network: ${err.message}`)
    } finally {
      setRandomBusy(false)
    }
  }

  const changeSource = (id) => {
    setSource(id)
    setViewRouter(null)
  }

  const clearCanvas = () => {
    if (topology.nodes.length && !window.confirm('Remove every router and link?')) return
    topo.clear()
    setSelection(null)
    setRerunPrompt(null)
    setFitSignal((n) => n + 1)
  }

  const saveFile = () => {
    const text = serializeTopology(topology, sourceId, destinationId)
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'nrs-topology.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadFile = async (file) => {
    try {
      const parsed = parseTopologyFile(await file.text())
      const fileIds = parsed.topology.nodes.map((n) => n.id)
      const from = fileIds.includes(parsed.source) ? parsed.source : fileIds[0]
      const to = fileIds.includes(parsed.destination) ? parsed.destination : fileIds[fileIds.length - 1]
      const report = await validateTopology(parsed.topology, from, to)
      if (!report.valid) {
        say(`Invalid topology file: ${report.errors.slice(0, 2).join('; ')}`)
        return
      }
      showTopology(parsed.topology, from, to)
      if (!report.connected) say('Loaded, but the network is not fully connected.')
    } catch (err) {
      say(`Could not load the file: ${err.message}`)
    }
  }

  const rerun = () => {
    setRerunPrompt(null)
    sim.runToEnd()
  }

  const latest = useRef({})
  useEffect(() => {
    latest.current = { deleteSelection, activeSelection }
  })

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (e.key === 'Escape') {
        setPendingLink(null)
        setSelection(null)
        setTool('select')
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && latest.current.activeSelection) {
        latest.current.deleteSelection()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const actions = {
    rename: (id, label) => {
      const error = topo.renameNode(id, label)
      if (error) say(error)
      return error
    },
    setCost: (id, cost) => {
      const link = topology.links.find((l) => l.id === id)
      if (link && link.cost === cost) return null
      const error = topo.setCost(id, cost)
      if (error) say(error)
      else if (link) noteEdit(`Cost of ${linkName(link)} changed to ${cost}`)
      return error
    },
    toggle: (id) => {
      const link = topology.links.find((l) => l.id === id)
      topo.toggleLink(id)
      if (link) noteEdit(`Link ${linkName(link)} ${link.enabled ? 'disabled' : 'restored'}`)
    },
    remove: deleteSelection,
    setSource: changeSource,
    setDestination,
  }

  const startCostEdit = (id) => {
    setSelection({ type: 'link', id })
    setEditingLink(id)
  }

  const commitCost = (id, value) => {
    setEditingLink(null)
    actions.setCost(id, Number(value))
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar
        algorithm={algorithm}
        onAlgorithm={setAlgorithm}
        backend={backend}
        onLoadExample={() => loadPreset('simple')}
        onCompare={() => setComparing(true)}
        canCompare={Boolean(sourceId && destinationId)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {comparing && (
        <ComparisonPanel
          topology={topology}
          source={sourceId}
          destination={destinationId}
          onClose={() => setComparing(false)}
        />
      )}
      {rerunPrompt && !sim.result && (
        <RerunPrompt
          text={rerunPrompt.text}
          algorithmName={algorithmName}
          disabled={!sourceId || !destinationId || sim.loading}
          onRerun={rerun}
          onLater={() => setRerunPrompt(null)}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[260px_minmax(0,1fr)_350px] lg:grid-rows-[minmax(0,1fr)_250px] lg:overflow-hidden">
        <aside className="lg:row-span-2 border-b border-neutral-800 bg-black lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <ToolPanel
            tool={tool}
            onTool={selectTool}
            nodes={topology.nodes}
            links={topology.links}
            selectedNode={selectedNode}
            selectedLink={selectedLink}
            sourceId={sourceId}
            destinationId={destinationId}
            actions={actions}
            notice={notice?.text}
            onPreset={loadPreset}
            onRandom={loadRandom}
            randomBusy={randomBusy}
            canSave={topology.nodes.length > 0}
            onSave={saveFile}
            onLoadFile={loadFile}
            onClear={clearCanvas}
          />
        </aside>

        <main className="h-[60vh] min-h-[360px] lg:h-auto">
          <TopologyCanvas
            topology={topology}
            view={view}
            selection={activeSelection}
            tool={tool}
            pendingLink={pendingId}
            sourceId={sourceId}
            destinationId={destinationId}
            fitSignal={fitSignal}
            theme={theme}
            onMoveNode={topo.moveNode}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            editingLink={editingLink}
            onEdgeEdit={startCostEdit}
            onCostCommit={commitCost}
            onEditCancel={() => setEditingLink(null)}
          />
        </main>

        <aside className="divide-y divide-neutral-800 border-t border-neutral-800 bg-black px-4 lg:min-h-0 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <ControlPanel
            nodes={topology.nodes}
            sourceId={sourceId}
            destinationId={destinationId}
            onSource={changeSource}
            onDestination={setDestination}
            sim={sim}
            algorithmName={algorithmName}
          />
          {algorithm === 'dijkstra' ? (
            <AlgorithmState nodes={topology.nodes} step={sim.step} view={view} />
          ) : (
            <RouterOverview algorithm={algorithm} rows={overview} viewId={viewId} onView={setViewRouter} />
          )}
          <ExplanationPanel sim={sim} algorithm={algorithm} algorithmName={algorithmName} nodes={topology.nodes} />
        </aside>

        <section className="border-t border-neutral-800 bg-black lg:col-span-2 lg:col-start-2">
          <BottomPanels
            algorithm={algorithm}
            sim={sim}
            nodes={topology.nodes}
            links={topology.links}
            rows={rows}
            viewId={viewId}
            onView={setViewRouter}
            sourceId={sourceId}
            destinationId={destinationId}
            sourceLabel={sourceLabel}
            stats={stats}
          />
        </section>
      </div>
    </div>
  )
}
