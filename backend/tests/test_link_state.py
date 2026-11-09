import random
from collections import deque

from app.algorithms.link_state import run_link_state
from app.services.graph_manager import Graph
from tests.helpers import classic_topology, make_topology, random_topology, reference_distances


def run(topology, source, destination):
    return run_link_state(Graph(topology), source, destination)


def hop_eccentricity(graph, start):
    seen = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor, _, _ in graph.neighbors(node):
            if neighbor not in seen:
                seen[neighbor] = seen[node] + 1
                queue.append(neighbor)
    return max(seen.values())


def test_each_router_starts_with_only_its_own_lsa():
    result = run(classic_topology(), "A", "F")
    start = result["steps"][0]
    assert start["type"] == "init"
    assert all(known == [router] for router, known in start["lsdb"].items())


def test_lsas_describe_enabled_links_only():
    result = run(classic_topology(disabled=("A-C",)), "A", "F")
    assert result["lsas"]["A"] == [{"neighbor": "B", "cost": 4}]
    assert {"neighbor": "A", "cost": 4} in result["lsas"]["B"]
    assert all(entry["neighbor"] != "A" for entry in result["lsas"]["C"])


def test_flooding_spreads_one_hop_per_round():
    result = run(make_topology([("A", "B", 1), ("B", "C", 1), ("C", "D", 1)]), "A", "D")
    flood = [s for s in result["steps"] if s["type"] == "flood"]
    assert len(flood) == 3
    assert flood[0]["lsdb"]["A"] == ["A", "B"]
    assert flood[1]["lsdb"]["A"] == ["A", "B", "C"]
    assert flood[2]["lsdb"]["A"] == ["A", "B", "C", "D"]
    assert result["iterations"] == 3


def test_flooding_rounds_equal_network_diameter():
    topo = classic_topology()
    graph = Graph(topo)
    diameter = max(hop_eccentricity(graph, n) for n in graph.node_ids)
    assert run(topo, "A", "F")["iterations"] == diameter


def test_all_routers_end_with_identical_database():
    result = run(classic_topology(), "A", "F")
    spf = next(s for s in result["steps"] if s["type"] == "spf")
    everyone = ["A", "B", "C", "D", "E", "F"]
    assert all(known == everyone for known in spf["lsdb"].values())
    assert "same link-state database" in spf["explanation"]


def test_received_records_sender_and_origin():
    result = run(classic_topology(), "A", "F")
    first = next(s for s in result["steps"] if s["type"] == "flood")
    assert {"router": "B", "origin": "A", "from": "A"} in first["received"]
    assert "A-B" in first["active_links"]


def test_routing_tables_computed_after_flooding():
    result = run(classic_topology(), "A", "F")
    kinds = [s["type"] for s in result["steps"]]
    assert kinds[0] == "init"
    assert kinds[-2:] == ["spf", "complete"]
    assert all("tables" not in s for s in result["steps"] if s["type"] in ("init", "flood"))
    table = result["steps"][-2]["tables"]["A"]
    assert table["F"] == {"cost": 13, "next_hop": "C"}
    assert table["B"] == {"cost": 3, "next_hop": "C"}


def test_final_route_and_tree():
    result = run(classic_topology(), "A", "F")
    assert result["final_path"] == ["A", "C", "B", "D", "E", "F"]
    assert result["total_cost"] == 13
    assert result["hop_count"] == 5
    spf = result["steps"][-2]
    assert sorted(spf["tree_links"]) == sorted(["A-C", "B-C", "B-D", "D-E", "E-F"])


def test_direct_path():
    result = run(make_topology([("A", "B", 7)]), "A", "B")
    assert result["final_path"] == ["A", "B"]
    assert result["total_cost"] == 7


def test_disconnected_graph_only_learns_its_own_part():
    result = run(make_topology([("A", "B", 1), ("C", "D", 1)]), "A", "D")
    spf = next(s for s in result["steps"] if s["type"] == "spf")
    assert spf["lsdb"]["A"] == ["A", "B"]
    assert spf["lsdb"]["C"] == ["C", "D"]
    assert result["final_path"] is None
    assert result["total_cost"] is None
    assert spf["tables"]["A"]["D"]["cost"] is None


def test_source_equals_destination():
    result = run(classic_topology(), "C", "C")
    assert result["final_path"] == ["C"]
    assert result["total_cost"] == 0


def test_single_router():
    result = run(make_topology([], nodes=["A"]), "A", "A")
    assert result["final_path"] == ["A"]
    assert result["iterations"] == 0


def test_disabled_link_is_ignored():
    result = run(classic_topology(disabled=("B-C",)), "A", "B")
    assert result["final_path"] == ["A", "B"]
    assert result["total_cost"] == 4
    for step in result["steps"]:
        assert "B-C" not in step["active_links"]


def test_tables_match_reference_on_random_graphs():
    rng = random.Random(21)
    for _ in range(60):
        topo = random_topology(rng)
        names = [n.id for n in topo.nodes]
        source, destination = rng.sample(names, 2)
        tables = run(topo, source, destination)["steps"][-1]["tables"]
        for router in names:
            expected = reference_distances(topo, router)
            for dest in names:
                assert tables[router][dest]["cost"] == expected.get(dest)
