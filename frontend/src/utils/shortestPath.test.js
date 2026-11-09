import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findRoute, linkCost } from './shortestPath.js'

const nodes = ['A', 'B', 'C', 'D', 'E', 'F'].map((id) => ({ id, label: id }))
const link = (a, b, cost, enabled = true) => ({ id: `${a}-${b}`, source: a, target: b, cost, enabled })
const links = [
  link('A', 'B', 4),
  link('A', 'C', 2),
  link('B', 'C', 1),
  link('B', 'D', 5),
  link('C', 'D', 8),
  link('C', 'E', 10),
  link('D', 'E', 2),
  link('D', 'F', 6),
  link('E', 'F', 3),
]

test('finds the cheapest route and its hop costs', () => {
  const route = findRoute(nodes, links, 'A', 'F')
  assert.deepEqual(route.path, ['A', 'C', 'B', 'D', 'E', 'F'])
  assert.equal(route.cost, 13)
  assert.deepEqual(
    route.hops.map((h) => h.cost),
    [2, 1, 5, 2, 3],
  )
})

test('works in either direction', () => {
  const route = findRoute(nodes, links, 'F', 'A')
  assert.equal(route.cost, 13)
  assert.deepEqual(route.path, ['F', 'E', 'D', 'B', 'C', 'A'])
})

test('a router reaches itself at no cost', () => {
  assert.deepEqual(findRoute(nodes, links, 'C', 'C'), { path: ['C'], hops: [], cost: 0 })
})

test('ignores disabled links and reports no route when cut off', () => {
  const cut = links.map((l) => (l.id === 'D-F' || l.id === 'E-F' ? { ...l, enabled: false } : l))
  assert.equal(findRoute(nodes, cut, 'A', 'F'), null)
  const detour = links.map((l) => (l.id === 'D-E' ? { ...l, enabled: false } : l))
  assert.equal(findRoute(nodes, detour, 'A', 'F').cost, 14)
})

test('linkCost uses only enabled links', () => {
  assert.equal(linkCost(links, 'B', 'A'), 4)
  assert.equal(linkCost(links, 'A', 'F'), null)
  assert.equal(linkCost([link('A', 'B', 4, false)], 'A', 'B'), null)
})
