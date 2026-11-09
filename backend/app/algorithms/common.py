INF = float("inf")


def path_links(graph, path):
    if not path:
        return []
    return [graph.link_between(a, b) for a, b in zip(path, path[1:])]


def summarize(items, limit, separator="; "):
    if len(items) <= limit:
        return separator.join(items)
    return f"{separator.join(items[:limit])}{separator}and {len(items) - limit} more"


def route_from_tables(tables, source, destination):
    path = [source]
    while path[-1] != destination:
        next_hop = tables[path[-1]][destination]["next_hop"]
        if next_hop is None or len(path) > len(tables):
            return None
        path.append(next_hop)
    return path


def export_table(table):
    return {
        dest: {"cost": None if cost == INF else cost, "next_hop": hop}
        for dest, (cost, hop) in table.items()
    }
