import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseTopologyFile, serializeTopology } from './topologyFile.js'

const sample = {
  nodes: [
    { id: 'A', label: 'A', x: 10, y: 20 },
    { id: 'B', label: 'B', x: 30, y: 40 },
  ],
  links: [{ id: 'A-B', source: 'A', target: 'B', cost: 4, enabled: false }],
}

test('saved topology loads back unchanged', () => {
  const loaded = parseTopologyFile(serializeTopology(sample, 'A', 'B'))
  assert.deepEqual(loaded.topology, sample)
  assert.equal(loaded.source, 'A')
  assert.equal(loaded.destination, 'B')
})

test('a bare topology without source and destination is accepted', () => {
  const loaded = parseTopologyFile(JSON.stringify(sample))
  assert.deepEqual(loaded.topology, sample)
  assert.equal(loaded.source, undefined)
})

test('missing optional fields get defaults', () => {
  const loaded = parseTopologyFile(
    JSON.stringify({
      nodes: [{ id: 'A' }, { id: 'B' }],
      links: [{ source: 'A', target: 'B', cost: 2 }],
    }),
  )
  assert.equal(loaded.topology.nodes[0].label, 'A')
  assert.equal(typeof loaded.topology.nodes[1].x, 'number')
  assert.equal(loaded.topology.links[0].id, 'A-B')
  assert.equal(loaded.topology.links[0].enabled, true)
})

test('malformed files are rejected with a reason', () => {
  assert.throws(() => parseTopologyFile('not json'), /not valid JSON/)
  assert.throws(() => parseTopologyFile('{"nodes": []}'), /"nodes" and "links"/)
  assert.throws(() => parseTopologyFile('{"nodes": [], "links": []}'), /no routers/)
  assert.throws(() => parseTopologyFile('{"nodes": [{"label": "A"}], "links": []}'), /no id/)
  assert.throws(
    () => parseTopologyFile('{"nodes": [{"id": "A"}], "links": [{"source": "A", "target": "A", "cost": "x"}]}'),
    /numeric cost/,
  )
})
