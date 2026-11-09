import heapq

from app.models.topology import Link, Node, Topology


def make_topology(edges, nodes=None, disabled=()):
    if nodes is None:
        nodes = []
        for a, b, _ in edges:
            for n in (a, b):
                if n not in nodes:
                    nodes.append(n)
    links = [
        Link(id=f"{a}-{b}", source=a, target=b, cost=cost, enabled=f"{a}-{b}" not in disabled)
        for a, b, cost in edges
    ]
    return Topology(nodes=[Node(id=n, label=n) for n in nodes], links=links)


CLASSIC_EDGES = [
    ("A", "B", 4),
    ("A", "C", 2),
    ("B", "C", 1),
    ("B", "D", 5),
    ("C", "D", 8),
    ("C", "E", 10),
    ("D", "E", 2),
    ("D", "F", 6),
    ("E", "F", 3),
]


def classic_topology(disabled=()):
    return make_topology(CLASSIC_EDGES, disabled=disabled)


def reference_distances(topology, source):
    adjacency = {n.id: [] for n in topology.nodes}
    for link in topology.links:
        if link.enabled:
            adjacency[link.source].append((link.target, link.cost))
            adjacency[link.target].append((link.source, link.cost))
    best = {source: 0}
    heap = [(0, source)]
    while heap:
        dist, node = heapq.heappop(heap)
        if dist > best.get(node, float("inf")):
            continue
        for neighbor, cost in adjacency[node]:
            if dist + cost < best.get(neighbor, float("inf")):
                best[neighbor] = dist + cost
                heapq.heappush(heap, (dist + cost, neighbor))
    return best


def random_topology(rng, min_size=2, max_size=9, density=0.4):
    size = rng.randint(min_size, max_size)
    names = [f"N{i}" for i in range(size)]
    edges = [
        (names[i], names[j], rng.randint(1, 12))
        for i in range(size)
        for j in range(i + 1, size)
        if rng.random() < density
    ]
    return make_topology(edges, nodes=names)
