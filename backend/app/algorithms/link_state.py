from app.algorithms.common import export_table, path_links, route_from_tables, summarize


def run_link_state(graph, source, destination):
    ids = graph.node_ids
    label = graph.labels
    order = graph.order

    lsas = {r: {n: cost for n, cost, _ in graph.neighbors(r)} for r in ids}
    known = {r: [r] for r in ids}
    steps = []

    def snapshot(step_type, round_no, received, active_links, explanation, tables=None, tree_links=()):
        changed = []
        for item in received:
            if item["router"] not in changed:
                changed.append(item["router"])
        step = {
            "step": len(steps),
            "type": step_type,
            "round": round_no,
            "lsdb": {r: sorted(known[r], key=order.get) for r in ids},
            "received": received,
            "changed_routers": changed,
            "active_links": active_links,
            "tree_links": list(tree_links),
            "explanation": explanation,
        }
        if tables is not None:
            step["tables"] = tables
        return step

    steps.append(snapshot(
        "init", 0, [], [],
        "Each router originates a link-state advertisement (LSA) listing its own links and costs, "
        "and holds only that LSA so far. The number under each router is how many LSAs it holds.",
    ))

    fresh = {r: [r] for r in ids}
    rounds = 0

    while True:
        start = {r: set(known[r]) for r in ids}
        accepted = {}
        duplicates = 0
        for r in ids:
            for origin in fresh[r]:
                for neighbor, _, link_id in graph.neighbors(r):
                    if origin in start[neighbor]:
                        continue
                    if (neighbor, origin) in accepted:
                        duplicates += 1
                        continue
                    accepted[(neighbor, origin)] = (r, link_id)

        if not accepted:
            break

        rounds += 1
        fresh = {r: [] for r in ids}
        received = []
        active_links = []
        for (receiver, origin), (sender, link_id) in accepted.items():
            known[receiver].append(origin)
            fresh[receiver].append(origin)
            received.append({"router": receiver, "origin": origin, "from": sender})
            if link_id not in active_links:
                active_links.append(link_id)

        by_router = {}
        for item in sorted(received, key=lambda i: (order[i["router"]], order[i["origin"]])):
            by_router.setdefault(item["router"], []).append(label[item["origin"]])
        learned = summarize(
            [f"{label[r]} learned {summarize(o, 6, ', ')}" for r, o in by_router.items()], 8
        )
        extra = f" {duplicates} duplicate copy(ies) discarded." if duplicates else ""
        steps.append(snapshot(
            "flood", rounds, received, active_links,
            f"Flooding round {rounds}: routers forward the LSAs they just learned to their neighbors. "
            f"{learned}.{extra}",
        ))

    tables = {}
    trees = {}
    for r in ids:
        database = {origin: lsas[origin] for origin in known[r]}
        distances, predecessors = shortest_path_first(database, order, r)
        trees[r] = predecessors
        table = {d: [distances.get(d, float("inf")), first_hop(predecessors, r, d)] for d in ids}
        table[r] = [0, None]
        tables[r] = export_table(table)

    sizes = {len(known[r]) for r in ids}
    if len(sizes) == 1 and sizes.pop() == len(ids):
        shared = f"Every router now holds the same link-state database of {len(ids)} LSAs."
    else:
        shared = "Routers only hold the LSAs of the part of the network they are connected to."

    source_routes = [
        f"{label[d]} = {tables[source][d]['cost']} via {label[tables[source][d]['next_hop']]}"
        for d in ids
        if d != source and tables[source][d]["cost"] is not None
    ]
    tree = [graph.link_between(n, p) for n, p in trees[source].items()]
    steps.append(snapshot(
        "spf", rounds, [], [],
        f"{shared} Each router runs the shortest-path-first (Dijkstra) computation on its own copy. "
        f"Routes from {label[source]}: {summarize(source_routes, 10) or 'none'}.",
        tables=tables,
        tree_links=tree,
    ))

    path = route_from_tables(tables, source, destination)
    total_cost = tables[source][destination]["cost"] if path else None
    if path:
        names = " -> ".join(label[n] for n in path)
        summary = f"Route from {label[source]} to {label[destination]}: {names} (cost {total_cost})."
    else:
        summary = f"No route exists from {label[source]} to {label[destination]}."
    steps.append(snapshot("complete", rounds, [], path_links(graph, path), summary, tables, tree))

    return {
        "algorithm": "link_state",
        "source": source,
        "destination": destination,
        "steps": steps,
        "final_path": path,
        "total_cost": total_cost,
        "hop_count": len(path) - 1 if path else None,
        "iterations": rounds,
        "lsas": {
            r: [{"neighbor": n, "cost": cost} for n, cost in lsas[r].items()] for r in ids
        },
    }


def shortest_path_first(database, order, root):
    distances = {root: 0}
    predecessors = {}
    done = set()
    while True:
        pending = [n for n in distances if n not in done]
        if not pending:
            break
        current = min(pending, key=lambda n: (distances[n], order[n]))
        done.add(current)
        for neighbor, cost in sorted(database.get(current, {}).items(), key=lambda e: order[e[0]]):
            candidate = distances[current] + cost
            if neighbor not in distances or candidate < distances[neighbor]:
                distances[neighbor] = candidate
                predecessors[neighbor] = current
    return distances, predecessors


def first_hop(predecessors, root, destination):
    if destination == root or destination not in predecessors:
        return None
    current = destination
    while predecessors[current] != root:
        current = predecessors[current]
    return current
