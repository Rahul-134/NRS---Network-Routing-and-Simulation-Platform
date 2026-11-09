const isText = (value) => typeof value === 'string' && value.length > 0
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

export function serializeTopology(topology, source, destination) {
  return JSON.stringify({ version: 1, source, destination, topology }, null, 2)
}

export function parseTopologyFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('the file is not valid JSON')
  }

  const topology = data?.topology ?? data
  if (!Array.isArray(topology?.nodes) || !Array.isArray(topology?.links)) {
    throw new Error('expected "nodes" and "links" lists')
  }
  if (topology.nodes.length === 0) throw new Error('the network has no routers')

  const nodes = topology.nodes.map((n, i) => {
    if (!isText(n?.id)) throw new Error(`router ${i + 1} has no id`)
    return {
      id: n.id,
      label: isText(n.label) ? n.label : n.id,
      x: isNumber(n.x) ? n.x : 60 + (i % 5) * 140,
      y: isNumber(n.y) ? n.y : 60 + Math.floor(i / 5) * 140,
    }
  })

  const links = topology.links.map((l, i) => {
    if (!isText(l?.source) || !isText(l?.target)) throw new Error(`link ${i + 1} needs a source and a target`)
    if (!isNumber(l.cost)) throw new Error(`link ${i + 1} needs a numeric cost`)
    return {
      id: isText(l.id) ? l.id : `${l.source}-${l.target}`,
      source: l.source,
      target: l.target,
      cost: l.cost,
      enabled: l.enabled !== false,
    }
  })

  return {
    topology: { nodes, links },
    source: isText(data.source) ? data.source : undefined,
    destination: isText(data.destination) ? data.destination : undefined,
  }
}
