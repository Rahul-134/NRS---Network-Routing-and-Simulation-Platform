import random

from app.algorithms.dijkstra import run_dijkstra
from app.services.graph_manager import Graph
from tests.helpers import classic_topology, make_topology, reference_distances


def run(topology, source, destination):
    return run_dijkstra(Graph(topology), source, destination)


def test_direct_path():
    result = run(make_topology([("A", "B", 7)]), "A", "B")
    assert result["final_path"] == ["A", "B"]
    assert result["total_cost"] == 7
    assert result["hop_count"] == 1


def test_multiple_paths_picks_lowest_cost():
    result = run(classic_topology(), "A", "F")
    assert result["final_path"] == ["A", "C", "B", "D", "E", "F"]
    assert result["total_cost"] == 13
    assert result["hop_count"] == 5


def test_indirect_route_beats_direct_link():
    result = run(classic_topology(), "A", "B")
    assert result["final_path"] == ["A", "C", "B"]
    assert result["total_cost"] == 3


def test_equal_cost_paths_return_a_valid_shortest_path():
    topo = make_topology([("A", "B", 1), ("A", "C", 1), ("B", "D", 1), ("C", "D", 1)])
    result = run(topo, "A", "D")
    assert result["total_cost"] == 2
    assert result["final_path"] in (["A", "B", "D"], ["A", "C", "D"])


def test_disconnected_graph_reports_no_route():
    topo = make_topology([("A", "B", 1), ("C", "D", 1)])
    result = run(topo, "A", "D")
    assert result["final_path"] is None
    assert result["total_cost"] is None
    assert "No route" in result["steps"][-1]["explanation"]


def test_source_equals_destination():
    result = run(classic_topology(), "C", "C")
    assert result["final_path"] == ["C"]
    assert result["total_cost"] == 0
    assert result["hop_count"] == 0


def test_single_node_graph():
    result = run(make_topology([], nodes=["A"]), "A", "A")
    assert result["final_path"] == ["A"]
    assert result["total_cost"] == 0


def test_disabled_link_is_ignored():
    result = run(classic_topology(disabled=("B-C",)), "A", "B")
    assert result["final_path"] == ["A", "B"]
    assert result["total_cost"] == 4


def test_disabling_every_route_makes_destination_unreachable():
    topo = make_topology([("A", "B", 1), ("B", "C", 1)], disabled=("B-C",))
    assert run(topo, "A", "C")["final_path"] is None


def test_steps_show_the_algorithm_state():
    result = run(classic_topology(), "A", "F")
    steps = result["steps"]

    init = steps[0]
    assert init["type"] == "init"
    assert init["distances"]["A"] == 0
    assert init["distances"]["B"] is None
    assert init["visited"] == []

    first = steps[1]
    assert first["current"] == "A"
    assert first["visited"] == ["A"]
    assert first["distances"]["B"] == 4
    assert first["distances"]["C"] == 2
    assert first["predecessors"]["C"] == "A"
    assert set(first["changed"]) == {"B", "C"}

    second = steps[2]
    assert second["current"] == "C"
    assert second["distances"]["B"] == 3
    assert second["predecessors"]["B"] == "C"
    assert "B" in second["changed"]

    final = steps[-1]
    assert final["type"] == "complete"
    assert final["active_links"] == ["A-C", "B-C", "B-D", "D-E", "E-F"]


def test_stops_once_destination_is_finalized():
    result = run(classic_topology(), "A", "C")
    assert result["iterations"] == 2
    assert result["steps"][-2]["current"] == "C"


def test_visited_nodes_are_never_relaxed_again():
    result = run(classic_topology(), "A", "F")
    seen = set()
    for step in result["steps"]:
        for node in step["changed"]:
            assert node not in seen
        seen.update(step["visited"])


def test_matches_reference_on_random_graphs():
    rng = random.Random(7)
    for _ in range(60):
        size = rng.randint(2, 9)
        names = [f"N{i}" for i in range(size)]
        edges = []
        for i in range(size):
            for j in range(i + 1, size):
                if rng.random() < 0.4:
                    edges.append((names[i], names[j], rng.randint(1, 12)))
        topo = make_topology(edges, nodes=names)
        source, destination = rng.sample(names, 2)
        expected = reference_distances(topo, source).get(destination)
        result = run(topo, source, destination)
        assert result["total_cost"] == expected
        if expected is not None:
            path = result["final_path"]
            assert path[0] == source and path[-1] == destination
            graph = Graph(topo)
            cost = sum(
                next(c for n, c, _ in graph.neighbors(a) if n == b) for a, b in zip(path, path[1:])
            )
            assert cost == expected
