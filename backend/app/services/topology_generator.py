import math
import random
import string

from app.models.topology import Link, Node, Topology

MIN_CLEARANCE = 50
JITTER_RATIO = 0.12


def layout_spacing(node_count):
    if node_count <= 12:
        return 190
    if node_count >= 30:
        return 150
    return round(190 - (node_count - 12) * 40 / 18)


def router_label(index):
    letters = string.ascii_uppercase
    return letters[index] if index < len(letters) else f"R{index + 1}"


def place_nodes(rng, node_count):
    spacing = layout_spacing(node_count)
    jitter = spacing * JITTER_RATIO
    columns = math.ceil(math.sqrt(node_count * 1.5))
    rows = math.ceil(node_count / columns)
    cells = rng.sample([(r, c) for r in range(rows) for c in range(columns)], node_count)
    cells.sort()
    return [
        (
            round(60 + c * spacing + rng.uniform(-jitter, jitter)),
            round(60 + r * spacing + rng.uniform(-jitter, jitter)),
        )
        for r, c in cells
    ]


def spanning_tree(points):
    in_tree = {0}
    tree = []
    while len(in_tree) < len(points):
        best = min(
            ((i, j) for i in in_tree for j in range(len(points)) if j not in in_tree),
            key=lambda pair: math.dist(points[pair[0]], points[pair[1]]),
        )
        tree.append(best)
        in_tree.add(best[1])
    return tree


def orientation(a, b, c):
    value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return (value > 0) - (value < 0)


def segments_cross(p1, p2, p3, p4):
    return (
        orientation(p1, p2, p3) != orientation(p1, p2, p4)
        and orientation(p3, p4, p1) != orientation(p3, p4, p2)
    )


def distance_to_segment(point, start, end):
    dx, dy = end[0] - start[0], end[1] - start[1]
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return math.dist(point, start)
    t = max(0, min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length_sq))
    return math.dist(point, (start[0] + t * dx, start[1] + t * dy))


def can_add_link(points, accepted, i, j):
    for k, point in enumerate(points):
        if k not in (i, j) and distance_to_segment(point, points[i], points[j]) < MIN_CLEARANCE:
            return False
    for a, b in accepted:
        if len({a, b, i, j}) == 4 and segments_cross(points[i], points[j], points[a], points[b]):
            return False
    return True


def generate_topology(node_count, extra_link_chance=0.3, max_cost=10, seed=None):
    rng = random.Random(seed)
    labels = [router_label(i) for i in range(node_count)]
    points = place_nodes(rng, node_count)
    local_reach = 1.75 * layout_spacing(node_count)

    links_between = spanning_tree(points)
    in_tree = {frozenset(pair) for pair in links_between}

    candidates = [
        (i, j)
        for i in range(node_count)
        for j in range(i + 1, node_count)
        if frozenset((i, j)) not in in_tree and math.dist(points[i], points[j]) <= local_reach
    ]
    rng.shuffle(candidates)
    for i, j in candidates:
        if rng.random() < extra_link_chance and can_add_link(points, links_between, i, j):
            links_between.append((i, j))

    nodes = [Node(id=label, label=label, x=x, y=y) for label, (x, y) in zip(labels, points)]
    links = []
    for i, j in sorted((min(pair), max(pair)) for pair in links_between):
        links.append(Link(
            id=f"{labels[i]}-{labels[j]}",
            source=labels[i],
            target=labels[j],
            cost=rng.randint(1, max_cost),
        ))

    return Topology(nodes=nodes, links=links)
