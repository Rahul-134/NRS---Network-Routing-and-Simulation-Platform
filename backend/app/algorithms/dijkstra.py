from app.algorithms.common import INF, path_links


def run_dijkstra(graph, source, destination):
    distances = {n: INF for n in graph.node_ids}
    predecessors = {n: None for n in graph.node_ids}
    distances[source] = 0
    visited = []
    label = graph.labels

    def snapshot(step_type, current, changed, active_links, explanation):
        return {
            "step": len(steps),
            "type": step_type,
            "current": current,
            "visited": list(visited),
            "candidates": [n for n in graph.node_ids if n not in visited and distances[n] < INF],
            "distances": {n: (None if d == INF else d) for n, d in distances.items()},
            "predecessors": dict(predecessors),
            "changed": changed,
            "active_links": active_links,
            "explanation": explanation,
        }

    steps = []
    steps.append(snapshot(
        "init", None, [], [],
        f"Distance to {label[source]} is 0, every other router is unreachable (infinity) for now.",
    ))

    while True:
        pending = [n for n in graph.node_ids if n not in visited and distances[n] < INF]
        if not pending:
            break

        current = min(pending, key=lambda n: (distances[n], graph.order[n]))
        visited.append(current)

        changed = []
        active_links = []
        notes = [
            f"Selected {label[current]} with the smallest tentative distance ({distances[current]})."
        ]

        for neighbor, cost, link_id in graph.neighbors(current):
            if neighbor in visited:
                continue
            active_links.append(link_id)
            candidate = distances[current] + cost
            old = distances[neighbor]
            old_text = "infinity" if old == INF else str(old)
            if candidate < old:
                distances[neighbor] = candidate
                predecessors[neighbor] = current
                changed.append(neighbor)
                notes.append(
                    f"{label[current]}-{label[neighbor]}: {distances[current]} + {cost} = {candidate} "
                    f"< {old_text}, so {label[neighbor]} is updated."
                )
            else:
                notes.append(
                    f"{label[current]}-{label[neighbor]}: {distances[current]} + {cost} = {candidate} "
                    f"is not less than {old_text}, no change."
                )

        steps.append(snapshot("select", current, changed, active_links, " ".join(notes)))

        if current == destination:
            break

    path = reconstruct_path(predecessors, source, destination) if destination in visited else None
    total_cost = distances[destination] if path else None

    if path:
        names = " -> ".join(label[n] for n in path)
        summary = f"Destination {label[destination]} finalized. Shortest path: {names} (cost {total_cost})."
    else:
        summary = f"No route exists from {label[source]} to {label[destination]}."
    steps.append(snapshot("complete", None, [], path_links(graph, path), summary))

    return {
        "algorithm": "dijkstra",
        "source": source,
        "destination": destination,
        "steps": steps,
        "final_path": path,
        "total_cost": total_cost,
        "hop_count": len(path) - 1 if path else None,
        "iterations": len(visited),
    }


def reconstruct_path(predecessors, source, destination):
    path = [destination]
    while path[-1] != source:
        previous = predecessors[path[-1]]
        if previous is None:
            return None
        path.append(previous)
    path.reverse()
    return path
