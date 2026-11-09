export function linkCost(links, a, b) {
  let best = null
  for (const l of links) {
    if (!l.enabled) continue
    const joins = (l.source === a && l.target === b) || (l.source === b && l.target === a)
    if (joins && (best === null || l.cost < best)) best = l.cost
  }
  return best
}

export function findRoute(nodes, links, from, to) {
  const ids = new Set(nodes.map((n) => n.id))
  if (!ids.has(from) || !ids.has(to)) return null

  const adjacent = new Map(nodes.map((n) => [n.id, []]))
  for (const l of links) {
    if (!l.enabled || !ids.has(l.source) || !ids.has(l.target)) continue
    adjacent.get(l.source).push([l.target, l.cost])
    adjacent.get(l.target).push([l.source, l.cost])
  }

  const dist = new Map([[from, 0]])
  const prev = new Map()
  const done = new Set()

  for (;;) {
    let u = null
    for (const [id, d] of dist) {
      if (!done.has(id) && (u === null || d < dist.get(u))) u = id
    }
    if (u === null || u === to) break
    done.add(u)
    for (const [v, cost] of adjacent.get(u)) {
      const next = dist.get(u) + cost
      if (!dist.has(v) || next < dist.get(v)) {
        dist.set(v, next)
        prev.set(v, u)
      }
    }
  }

  if (!dist.has(to)) return null
  const path = [to]
  while (path[0] !== from) path.unshift(prev.get(path[0]))
  const hops = path.slice(1).map((id, i) => ({ from: path[i], to: id, cost: dist.get(id) - dist.get(path[i]) }))
  return { path, hops, cost: dist.get(to) }
}
