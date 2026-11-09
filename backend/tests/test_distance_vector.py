import random

from app.algorithms.distance_vector import run_distance_vector
from app.services.graph_manager import Graph
from tests.helpers import classic_topology, make_topology, random_topology, reference_distances


def run(topology, source, destination):
    return run_distance_vector(Graph(topology), source, destination)


def entry(step, router, destination):
    return step["tables"][router][destination]


def test_round_zero_contains_only_direct_neighbors():
    steps = run(classic_topology(), "A", "F")["steps"]
    start = steps[0]
    assert start["type"] == "init"
    assert entry(start, "A", "A") == {"cost": 0, "next_hop": None}
    assert entry(start, "A", "B") == {"cost": 4, "next_hop": "B"}
    assert entry(start, "A", "C") == {"cost": 2, "next_hop": "C"}
    assert entry(start, "A", "D")["cost"] is None
    assert entry(start, "A", "F")["cost"] is None


def test_multi_hop_routes_appear_in_later_rounds():
    steps = run(classic_topology(), "A", "F")["steps"]
    assert entry(steps[0], "A", "D")["cost"] is None
    assert entry(steps[1], "A", "D") == {"cost": 9, "next_hop": "B"}
    assert entry(steps[1], "A", "E")["cost"] == 12


def test_lower_cost_route_replaces_previous_entry():
    steps = run(classic_topology(), "A", "F")["steps"]
    assert entry(steps[0], "A", "B") == {"cost": 4, "next_hop": "B"}
    assert entry(steps[1], "A", "B") == {"cost": 3, "next_hop": "C"}
    assert entry(steps[1], "A", "D") == {"cost": 9, "next_hop": "B"}
    assert entry(steps[2], "A", "D") == {"cost": 8, "next_hop": "C"}


def test_changes_report_old_and_new_entry():
    steps = run(classic_topology(), "A", "F")["steps"]
    change = next(c for c in steps[1]["changes"] if c["router"] == "A" and c["destination"] == "B")
    assert change["old_cost"] == 4
    assert change["new_cost"] == 3
    assert change["old_next_hop"] == "B"
    assert change["next_hop"] == "C"
    assert "A-C" in steps[1]["active_links"]


def test_convergence_stops_when_no_table_changes():
    result = run(classic_topology(), "A", "F")
    assert result["converged"] is True
    steps = result["steps"]
    last_round = steps[-2]
    assert last_round["type"] == "round"
    assert last_round["changes"] == []
    assert steps[-1]["type"] == "complete"
    assert result["iterations"] == last_round["round"] - 1
    assert steps[-1]["tables"] == last_round["tables"]


def test_final_route_follows_next_hops():
    result = run(classic_topology(), "A", "F")
    assert result["final_path"] == ["A", "C", "B", "D", "E", "F"]
    assert result["total_cost"] == 13
    assert result["hop_count"] == 5
    assert result["steps"][-1]["active_links"] == ["A-C", "B-C", "B-D", "D-E", "E-F"]


def test_direct_path():
    result = run(make_topology([("A", "B", 7)]), "A", "B")
    assert result["final_path"] == ["A", "B"]
    assert result["total_cost"] == 7


def test_disconnected_graph_reports_no_route():
    result = run(make_topology([("A", "B", 1), ("C", "D", 1)]), "A", "D")
    assert result["final_path"] is None
    assert result["total_cost"] is None
    assert entry(result["steps"][-1], "A", "D")["cost"] is None
    assert "no route" in result["steps"][-1]["explanation"]


def test_source_equals_destination():
    result = run(classic_topology(), "C", "C")
    assert result["final_path"] == ["C"]
    assert result["total_cost"] == 0
    assert result["hop_count"] == 0


def test_single_router():
    result = run(make_topology([], nodes=["A"]), "A", "A")
    assert result["final_path"] == ["A"]
    assert result["converged"] is True


def test_disabled_link_is_ignored():
    result = run(classic_topology(disabled=("B-C",)), "A", "B")
    assert result["final_path"] == ["A", "B"]
    assert result["total_cost"] == 4
    for step in result["steps"]:
        assert "B-C" not in step["active_links"]


def test_tables_match_reference_on_random_graphs():
    rng = random.Random(11)
    for _ in range(60):
        topo = random_topology(rng)
        names = [n.id for n in topo.nodes]
        source, destination = rng.sample(names, 2)
        result = run(topo, source, destination)
        final = result["steps"][-1]["tables"]
        assert result["converged"] is True
        assert result["iterations"] <= len(names)
        for router in names:
            expected = reference_distances(topo, router)
            for dest in names:
                assert final[router][dest]["cost"] == expected.get(dest)


def test_next_hops_are_consistent_with_neighbor_tables():
    rng = random.Random(5)
    for _ in range(40):
        topo = random_topology(rng)
        graph = Graph(topo)
        final = run_distance_vector(graph, topo.nodes[0].id, topo.nodes[-1].id)["steps"][-1]["tables"]
        for router in graph.node_ids:
            for dest in graph.node_ids:
                cost = final[router][dest]["cost"]
                hop = final[router][dest]["next_hop"]
                if router == dest or cost is None:
                    continue
                link_cost = next(c for n, c, _ in graph.neighbors(router) if n == hop)
                assert cost == link_cost + final[hop][dest]["cost"]
