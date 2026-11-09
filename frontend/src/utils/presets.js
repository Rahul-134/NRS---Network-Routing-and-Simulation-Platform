const link = (a, b, cost) => ({ id: `${a}-${b}`, source: a, target: b, cost, enabled: true })

const routers = (rows) => rows.map(([id, x, y]) => ({ id, label: id, x, y }))

export const presets = {
  simple: {
    name: 'Simple Network',
    source: 'A',
    destination: 'F',
    topology: {
      nodes: routers([
        ['A', 60, 190],
        ['B', 230, 60],
        ['C', 230, 320],
        ['D', 430, 130],
        ['E', 430, 330],
        ['F', 620, 230],
      ]),
      links: [
        link('A', 'B', 4),
        link('A', 'C', 2),
        link('B', 'C', 1),
        link('B', 'D', 5),
        link('C', 'D', 8),
        link('C', 'E', 10),
        link('D', 'E', 2),
        link('D', 'F', 6),
        link('E', 'F', 3),
      ],
    },
  },

  ring: {
    name: 'Ring Topology',
    source: 'A',
    destination: 'D',
    topology: {
      nodes: routers([
        ['A', 300, 50],
        ['B', 447, 135],
        ['C', 447, 305],
        ['D', 300, 390],
        ['E', 153, 305],
        ['F', 153, 135],
      ]),
      links: [
        link('A', 'B', 2),
        link('B', 'C', 3),
        link('C', 'D', 2),
        link('D', 'E', 4),
        link('E', 'F', 1),
        link('A', 'F', 3),
      ],
    },
  },

  mesh: {
    name: 'Mesh Network',
    source: 'A',
    destination: 'C',
    topology: {
      nodes: routers([
        ['A', 300, 50],
        ['B', 462, 167],
        ['C', 400, 357],
        ['D', 200, 357],
        ['E', 138, 167],
      ]),
      links: [
        link('A', 'B', 2),
        link('B', 'C', 3),
        link('C', 'D', 2),
        link('D', 'E', 3),
        link('A', 'E', 4),
        link('A', 'C', 6),
        link('A', 'D', 5),
        link('B', 'D', 7),
        link('B', 'E', 6),
        link('C', 'E', 5),
      ],
    },
  },

  campus: {
    name: 'Campus Network',
    source: 'Gate',
    destination: 'Dorm',
    topology: {
      nodes: routers([
        ['Gate', 60, 220],
        ['Core1', 230, 110],
        ['Core2', 230, 330],
        ['DistA', 420, 50],
        ['DistB', 420, 220],
        ['DistC', 420, 390],
        ['Admin', 620, 40],
        ['Lab', 620, 170],
        ['Lib', 620, 300],
        ['Dorm', 620, 460],
      ]),
      links: [
        link('Gate', 'Core1', 2),
        link('Gate', 'Core2', 3),
        link('Core1', 'Core2', 1),
        link('Core1', 'DistA', 2),
        link('Core1', 'DistB', 4),
        link('Core2', 'DistB', 3),
        link('Core2', 'DistC', 2),
        link('DistA', 'DistB', 5),
        link('DistB', 'DistC', 4),
        link('DistA', 'Admin', 3),
        link('DistA', 'Lab', 6),
        link('DistB', 'Lab', 2),
        link('DistB', 'Lib', 5),
        link('DistC', 'Lib', 3),
        link('DistC', 'Dorm', 4),
        link('Lib', 'Dorm', 6),
      ],
    },
  },
}

export const presetKeys = Object.keys(presets)

export const getPreset = (key) => {
  const { name, source, destination, topology } = presets[key]
  return { name, source, destination, topology: structuredClone(topology) }
}
