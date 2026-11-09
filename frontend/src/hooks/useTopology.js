import { useState } from 'react'
import { getPreset } from '../utils/presets'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function freshId(prefix, existing) {
  let n = existing.length + 1
  while (existing.includes(`${prefix}${n}`)) n += 1
  return `${prefix}${n}`
}

function freshLabel(nodes) {
  const used = new Set(nodes.map((n) => n.label))
  for (const letter of LETTERS) if (!used.has(letter)) return letter
  let n = 1
  while (used.has(`R${n}`)) n += 1
  return `R${n}`
}

function freePosition(nodes) {
  for (let y = 60; y < 700; y += 110) {
    for (let x = 60; x < 900; x += 110) {
      if (nodes.every((n) => Math.hypot(n.x - x, n.y - y) > 80)) return { x, y }
    }
  }
  return { x: 60, y: 60 }
}

const connects = (l, a, b) =>
  (l.source === a && l.target === b) || (l.source === b && l.target === a)

export function useTopology() {
  const [topology, setTopology] = useState(() => getPreset('simple').topology)
  const { nodes, links } = topology

  const addNode = (position) => {
    const { x, y } = position ?? freePosition(nodes)
    const node = { id: freshId('n', nodes.map((n) => n.id)), label: freshLabel(nodes), x, y }
    setTopology((t) => ({ ...t, nodes: [...t.nodes, node] }))
    return node.id
  }

  const moveNode = (id, x, y) =>
    setTopology((t) => ({ ...t, nodes: t.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }))

  const renameNode = (id, label) => {
    const text = label.trim()
    if (!text) return 'Router name cannot be empty'
    if (nodes.some((n) => n.id !== id && n.label === text)) return `Another router is already named ${text}`
    setTopology((t) => ({ ...t, nodes: t.nodes.map((n) => (n.id === id ? { ...n, label: text } : n)) }))
    return null
  }

  const removeNode = (id) =>
    setTopology((t) => ({
      nodes: t.nodes.filter((n) => n.id !== id),
      links: t.links.filter((l) => l.source !== id && l.target !== id),
    }))

  const addLink = (source, target) => {
    if (source === target) return { error: 'A router cannot be linked to itself' }
    if (links.some((l) => connects(l, source, target))) return { error: 'These routers are already linked' }
    const link = { id: freshId('l', links.map((l) => l.id)), source, target, cost: 1, enabled: true }
    setTopology((t) => ({ ...t, links: [...t.links, link] }))
    return { id: link.id }
  }

  const updateLink = (id, changes) =>
    setTopology((t) => ({ ...t, links: t.links.map((l) => (l.id === id ? { ...l, ...changes } : l)) }))

  const setCost = (id, cost) => {
    if (!Number.isInteger(cost) || cost <= 0) return 'Link cost must be a positive whole number'
    updateLink(id, { cost })
    return null
  }

  const toggleLink = (id) => {
    const link = links.find((l) => l.id === id)
    if (link) updateLink(id, { enabled: !link.enabled })
  }

  const removeLink = (id) => setTopology((t) => ({ ...t, links: t.links.filter((l) => l.id !== id) }))

  const load = (next) => setTopology(next)
  const clear = () => setTopology({ nodes: [], links: [] })

  return {
    topology,
    addNode,
    moveNode,
    renameNode,
    removeNode,
    addLink,
    setCost,
    toggleLink,
    removeLink,
    load,
    clear,
  }
}
