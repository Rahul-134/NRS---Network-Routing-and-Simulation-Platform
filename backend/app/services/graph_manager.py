from app.models.topology import Topology


class GraphError(ValueError):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("; ".join(errors))


def validate_topology(topology: Topology, source=None, destination=None):
    errors = []
    node_ids = set()
    labels = set()

    for node in topology.nodes:
        if node.id in node_ids:
            errors.append(f"Duplicate router id '{node.id}'")
        node_ids.add(node.id)
        if node.label in labels:
            errors.append(f"Duplicate router label '{node.label}'")
        labels.add(node.label)

    link_ids = set()
    pairs = set()
    for link in topology.links:
        if link.id in link_ids:
            errors.append(f"Duplicate link id '{link.id}'")
        link_ids.add(link.id)

        if link.source not in node_ids or link.target not in node_ids:
            errors.append(f"Link '{link.id}' refers to a router that does not exist")
            continue
        if link.source == link.target:
            errors.append(f"Link '{link.id}' connects a router to itself")
            continue
        if link.cost <= 0:
            errors.append(f"Link '{link.id}' must have a positive cost")

        pair = frozenset((link.source, link.target))
        if pair in pairs:
            errors.append(f"Duplicate link between '{link.source}' and '{link.target}'")
        pairs.add(pair)

    if source is not None and source not in node_ids:
        errors.append(f"Source router '{source}' does not exist")
    if destination is not None and destination not in node_ids:
        errors.append(f"Destination router '{destination}' does not exist")

    return errors


class Graph:
    def __init__(self, topology: Topology):
        self.node_ids = [n.id for n in topology.nodes]
        self.labels = {n.id: n.label for n in topology.nodes}
        self.order = {nid: i for i, nid in enumerate(self.node_ids)}
        self.links = {l.id: l for l in topology.links}
        self.adjacency = {nid: [] for nid in self.node_ids}
        for link in topology.links:
            if not link.enabled:
                continue
            self.adjacency[link.source].append((link.target, link.cost, link.id))
            self.adjacency[link.target].append((link.source, link.cost, link.id))
        for neighbors in self.adjacency.values():
            neighbors.sort(key=lambda entry: self.order[entry[0]])

    @classmethod
    def from_topology(cls, topology: Topology, source=None, destination=None):
        errors = validate_topology(topology, source, destination)
        if errors:
            raise GraphError(errors)
        return cls(topology)

    def neighbors(self, node_id):
        return self.adjacency[node_id]

    def link_between(self, a, b):
        for neighbor, _, link_id in self.adjacency[a]:
            if neighbor == b:
                return link_id
        return None

    def is_connected(self):
        if not self.node_ids:
            return True
        seen = {self.node_ids[0]}
        stack = [self.node_ids[0]]
        while stack:
            current = stack.pop()
            for neighbor, _, _ in self.adjacency[current]:
                if neighbor not in seen:
                    seen.add(neighbor)
                    stack.append(neighbor)
        return len(seen) == len(self.node_ids)
