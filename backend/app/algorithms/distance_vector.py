from app.algorithms.common import INF, export_table, path_links, route_from_tables


def run_distance_vector(graph, source, destination):
    ids = graph.node_ids
    label = graph.labels
    max_rounds = len(ids) + 1

    tables = {r: {d: [INF, None] for d in ids} for r in ids}
    for r in ids:
        tables[r][r] = [0, None]
        for neighbor, cost, _ in graph.neighbors(r):
            tables[r][neighbor] = [cost, neighbor]

    steps = []

    def snapshot(step_type, round_no, changes, active_links, explanation):
        changed_routers = []
        for change in changes:
            if change["router"] not in changed_routers:
                changed_routers.append(change["router"])
        return {
            "step": len(steps),
            "type": step_type,
            "round": round_no,
            "tables": {r: export_table(tables[r]) for r in ids},
            "changes": changes,
            "changed_routers": changed_routers,
            "active_links": active_links,
            "explanation": explanation,
        }

    steps.append(snapshot(
        "init", 0, [], [],
        "Round 0: each router knows only itself (cost 0) and its directly connected neighbors.",
    ))

    rounds_with_changes = 0
    converged = False

    for round_no in range(1, max_rounds + 1):
        vectors = {r: {d: tables[r][d][0] for d in ids} for r in ids}
        changes = []
        active_links = []
        notes = []

        for r in ids:
            for d in ids:
                if d == r:
                    continue
                best_cost, best_hop, best_link, best_parts = tables[r][d][0], None, None, None
                for neighbor, link_cost, link_id in graph.neighbors(r):
                    advertised = vectors[neighbor][d]
                    if advertised == INF:
                        continue
                    candidate = link_cost + advertised
                    if candidate < best_cost:
                        best_cost, best_hop, best_link = candidate, neighbor, link_id
                        best_parts = (link_cost, advertised)

                if best_hop is None:
                    continue

                old_cost, old_hop = tables[r][d]
                tables[r][d] = [best_cost, best_hop]
                if best_link not in active_links:
                    active_links.append(best_link)
                changes.append({
                    "router": r,
                    "destination": d,
                    "old_cost": None if old_cost == INF else old_cost,
                    "new_cost": best_cost,
                    "old_next_hop": old_hop,
                    "next_hop": best_hop,
                })
                was = "unreachable" if old_cost == INF else f"{old_cost} via {label[old_hop]}"
                notes.append(
                    f"{label[r]} to {label[d]}: {best_cost} via {label[best_hop]} "
                    f"({best_parts[0]} + {best_parts[1]}), was {was}."
                )

        if not changes:
            converged = True
            steps.append(snapshot(
                "round", round_no, [], [],
                f"Round {round_no}: no router changed its table, so the network has converged.",
            ))
            break

        rounds_with_changes += 1
        steps.append(snapshot(
            "round", round_no, changes, active_links,
            f"Round {round_no}: routers compared their neighbors' round {round_no - 1} vectors. "
            + " ".join(notes[:12])
            + (f" ...and {len(notes) - 12} more updates." if len(notes) > 12 else ""),
        ))

    final_tables = {r: export_table(tables[r]) for r in ids}
    path = route_from_tables(final_tables, source, destination)
    total_cost = final_tables[source][destination]["cost"] if path else None

    if not converged:
        summary = f"Stopped after {max_rounds} rounds without converging."
    elif path:
        names = " -> ".join(label[n] for n in path)
        summary = (
            f"Converged after {rounds_with_changes} round(s) of updates. "
            f"Following the next hops from {label[source]} gives {names} (cost {total_cost})."
        )
    else:
        summary = (
            f"Converged after {rounds_with_changes} round(s) of updates. "
            f"{label[source]} has no route to {label[destination]}."
        )
    steps.append(snapshot("complete", steps[-1]["round"], [], path_links(graph, path), summary))

    return {
        "algorithm": "distance_vector",
        "source": source,
        "destination": destination,
        "steps": steps,
        "final_path": path,
        "total_cost": total_cost,
        "hop_count": len(path) - 1 if path else None,
        "iterations": rounds_with_changes,
        "converged": converged,
    }
