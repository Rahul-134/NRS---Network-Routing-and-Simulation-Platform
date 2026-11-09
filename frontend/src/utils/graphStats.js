export function networkStats(topology) {
  const { nodes, links } = topology
  const enabled = links.filter((l) => l.enabled)

  const adjacency = new Map(nodes.map((n) => [n.id, []]))
  for (const l of enabled) {
    adjacency.get(l.source)?.push(l.target)
    adjacency.get(l.target)?.push(l.source)
  }

  let connected = true
  if (nodes.length > 1) {
    const seen = new Set([nodes[0].id])
    const stack = [nodes[0].id]
    while (stack.length) {
      for (const next of adjacency.get(stack.pop()) ?? []) {
        if (!seen.has(next)) {
          seen.add(next)
          stack.push(next)
        }
      }
    }
    connected = seen.size === nodes.length
  }

  const totalCost = enabled.reduce((sum, l) => sum + l.cost, 0)
  return {
    routers: nodes.length,
    links: links.length,
    disabled: links.length - enabled.length,
    avgDegree: nodes.length ? (2 * enabled.length) / nodes.length : 0,
    avgCost: enabled.length ? totalCost / enabled.length : 0,
    connected,
  }
}
