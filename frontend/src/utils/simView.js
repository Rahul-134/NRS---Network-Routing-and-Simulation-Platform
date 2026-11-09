const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)

const formatCost = (cost) => (cost === null || cost === undefined ? '∞' : String(cost))

function treeLinkSet(algorithm, topology, step) {
  const tree = new Set()
  if (!step) return tree
  if (algorithm === 'link-state') {
    step.tree_links.forEach((id) => tree.add(id))
    return tree
  }
  if (algorithm === 'dijkstra') {
    const byPair = new Map(
      topology.links.filter((l) => l.enabled).map((l) => [pairKey(l.source, l.target), l.id]),
    )
    for (const [id, pred] of Object.entries(step.predecessors)) {
      const linkId = pred && byPair.get(pairKey(id, pred))
      if (linkId) tree.add(linkId)
    }
  }
  return tree
}

function nodeState(algorithm, step, pathNodes, id) {
  if (!step) return 'idle'
  if (algorithm === 'dijkstra') {
    if (step.current === id) return 'current'
    if (pathNodes.includes(id)) return 'path'
    if (step.visited.includes(id)) return 'visited'
    if (step.candidates.includes(id)) return 'candidate'
    return 'idle'
  }
  if (step.changed_routers.includes(id)) return 'current'
  if (pathNodes.includes(id)) return 'path'
  return 'idle'
}

function caption(algorithm, step, topology, sourceId, id) {
  if (!step) return undefined
  if (algorithm === 'dijkstra') return formatCost(step.distances[id])
  if (step.tables) return formatCost(step.tables[sourceId]?.[id]?.cost)
  return `${step.lsdb[id]?.length ?? 0}/${topology.nodes.length}`
}

export function buildView({ algorithm, topology, step, result, sourceId }) {
  const pathNodes = step?.type === 'complete' ? (result.final_path ?? []) : []
  const activeLinks = new Set(step?.active_links ?? [])
  const treeLinks = treeLinkSet(algorithm, topology, step)

  const nodes = {}
  for (const n of topology.nodes) {
    nodes[n.id] = {
      state: nodeState(algorithm, step, pathNodes, n.id),
      caption: caption(algorithm, step, topology, sourceId, n.id),
    }
  }

  const links = {}
  for (const l of topology.links) {
    let state = 'normal'
    if (!l.enabled) state = 'disabled'
    else if (activeLinks.has(l.id)) state = step.type === 'complete' ? 'path' : 'active'
    else if (treeLinks.has(l.id)) state = 'tree'
    links[l.id] = state
  }

  const spotlight = pathNodes.length > 1
  const flow = {}
  if (spotlight) {
    const byPair = new Map(topology.links.map((l) => [pairKey(l.source, l.target), l]))
    pathNodes.slice(1).forEach((id, i) => {
      const link = byPair.get(pairKey(pathNodes[i], id))
      if (link && links[link.id] === 'path') flow[link.id] = link.source === pathNodes[i] ? 'forward' : 'reverse'
    })
  }

  return { nodes, links, spotlight, flow }
}

function nextHop(predecessors, source, id) {
  let current = id
  for (let guard = 0; guard < 1000; guard++) {
    const pred = predecessors[current]
    if (pred === source) return current
    if (!pred) return null
    current = pred
  }
  return null
}

export function routingTableRows({ algorithm, topology, step, sourceId, viewId }) {
  if (!step) return null

  if (algorithm === 'dijkstra') {
    return topology.nodes.map((n) => {
      const cost = step.distances[n.id] ?? null
      const isSelf = n.id === sourceId
      return {
        id: n.id,
        label: n.label,
        cost,
        nextHop: isSelf || cost === null ? null : nextHop(step.predecessors, sourceId, n.id),
        isSelf,
        changed: step.changed.includes(n.id),
      }
    })
  }

  const table = step.tables?.[viewId]
  if (!table) return null
  const changed = new Set(
    (step.changes ?? []).filter((c) => c.router === viewId).map((c) => c.destination),
  )
  return topology.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    cost: table[n.id]?.cost ?? null,
    nextHop: table[n.id]?.next_hop ?? null,
    isSelf: n.id === viewId,
    changed: changed.has(n.id),
  }))
}

export function overviewRows({ algorithm, topology, step }) {
  if (!step || algorithm === 'dijkstra') return []
  const total = topology.nodes.length

  return topology.nodes.map((n) => {
    if (algorithm === 'distance-vector') {
      const table = step.tables[n.id] ?? {}
      return {
        id: n.id,
        label: n.label,
        known: Object.entries(table).filter(([dest, e]) => dest !== n.id && e.cost !== null).length,
        updated: (step.changes ?? []).filter((c) => c.router === n.id).length,
        total: total - 1,
      }
    }
    const table = step.tables?.[n.id]
    return {
      id: n.id,
      label: n.label,
      lsas: step.lsdb[n.id]?.length ?? 0,
      received: (step.received ?? []).filter((r) => r.router === n.id).length,
      routes: table
        ? Object.entries(table).filter(([dest, e]) => dest !== n.id && e.cost !== null).length
        : null,
      total,
    }
  })
}
