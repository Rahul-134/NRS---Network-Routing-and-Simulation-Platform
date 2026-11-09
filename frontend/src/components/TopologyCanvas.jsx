import { useEffect, useMemo } from 'react'
import ReactFlow, { Background, MiniMap, Panel, ReactFlowProvider, useReactFlow } from 'reactflow'
import RouterNode from './RouterNode'
import LinkEdge from './LinkEdge'
import { LegendToggle, ZoomControls } from './CanvasControls'
import { useFitNetwork } from '../hooks/useFitNetwork'

const nodeTypes = { router: RouterNode }
const edgeTypes = { link: LinkEdge }
const NODE_SIZE = 56

const miniMapStates = { current: '#f59e0b', path: '#10b981', visited: '#0d9488', candidate: '#06b6d4' }

function miniMapColor(node) {
  const { role, state } = node.data
  if (role === 'both') return '#a78bfa'
  if (role === 'source') return '#22c55e'
  if (role === 'destination') return '#f43f5e'
  return miniMapStates[state] ?? '#60a5fa'
}

const miniMapStyle = {
  width: 170,
  height: 110,
  marginBottom: 28,
  background: 'var(--color-neutral-950)',
  border: '1px solid var(--color-neutral-800)',
  borderRadius: 12,
}

function hint(tool, pendingLabel) {
  if (tool === 'router') return 'Click empty canvas to place a router'
  if (tool === 'delete') return 'Click a router or a link to delete it'
  if (tool === 'link') {
    return pendingLabel ? `Select the second router to link with ${pendingLabel}` : 'Select two routers to link them'
  }
  return null
}

function Canvas({
  topology,
  view,
  selection,
  tool,
  pendingLink,
  sourceId,
  destinationId,
  fitSignal,
  theme,
  onMoveNode,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  editingLink,
  onEdgeEdit,
  onCostCommit,
  onEditCancel,
}) {
  const { screenToFlowPosition } = useReactFlow()
  const fit = useFitNetwork()

  const nodes = useMemo(
    () =>
      topology.nodes.map((n) => {
        let role = null
        if (n.id === sourceId && n.id === destinationId) role = 'both'
        else if (n.id === sourceId) role = 'source'
        else if (n.id === destinationId) role = 'destination'
        return {
          id: n.id,
          type: 'router',
          position: { x: n.x, y: n.y },
          width: NODE_SIZE,
          height: NODE_SIZE,
          data: {
            label: n.label,
            state: view.nodes[n.id]?.state ?? 'idle',
            caption: view.nodes[n.id]?.caption,
            role,
            selected: selection?.type === 'node' && selection.id === n.id,
            pending: pendingLink === n.id,
            dim: view.spotlight && view.nodes[n.id]?.state !== 'path',
          },
        }
      }),
    [topology.nodes, view, selection, pendingLink, sourceId, destinationId],
  )

  const edges = useMemo(
    () =>
      topology.links.map((l) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        type: 'link',
        data: {
          cost: l.cost,
          state: view.links[l.id] ?? 'normal',
          flow: view.flow[l.id],
          dim: view.spotlight && !view.flow[l.id] && view.links[l.id] !== 'disabled',
          selected: selection?.type === 'link' && selection.id === l.id,
          editing: editingLink === l.id,
          onSelect: onEdgeClick,
          onEdit: onEdgeEdit,
          onCommit: onCostCommit,
          onCancel: onEditCancel,
        },
      })),
    [topology.links, view, selection, editingLink, onEdgeClick, onEdgeEdit, onCostCommit, onEditCancel],
  )

  useEffect(() => {
    const timer = setTimeout(() => fit(), 60)
    return () => clearTimeout(timer)
  }, [fitSignal, fit])

  const handleNodesChange = (changes) => {
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        onMoveNode(change.id, change.position.x, change.position.y)
      }
    }
  }

  const handlePaneClick = (event) => {
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    onPaneClick({ x: point.x - NODE_SIZE / 2, y: point.y - NODE_SIZE / 2 })
  }

  const pendingLabel = topology.nodes.find((n) => n.id === pendingLink)?.label
  const toolHint = hint(tool, pendingLabel)

  return (
    <div className={`relative h-full w-full ${tool === 'router' ? 'tool-router' : ''}`}>
      {topology.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-neutral-500">
          The canvas is empty. Choose Add Router and click here, or load an example topology.
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        onEdgeClick={(_, edge) => onEdgeClick(edge.id)}
        onEdgeDoubleClick={(_, edge) => onEdgeEdit(edge.id)}
        onPaneClick={handlePaneClick}
        zoomOnDoubleClick={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        deleteKeyCode={null}
        minZoom={0.15}
        maxZoom={2}
      >
        <Background color={theme === 'light' ? '#e5e5e5' : '#1c1c1c'} gap={24} />
        <ZoomControls />
        <LegendToggle />
        <MiniMap
          className="hidden xl:block"
          style={miniMapStyle}
          nodeColor={miniMapColor}
          nodeStrokeWidth={0}
          nodeBorderRadius={50}
          maskColor={theme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'}
          maskStrokeColor={theme === 'light' ? '#404040' : '#d4d4d4'}
          maskStrokeWidth={1.5}
          pannable
          zoomable
          ariaLabel="Network mini map"
        />
        {toolHint && (
          <Panel position="top-center" className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100">
            {toolHint}
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}

export default function TopologyCanvas(props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}
