import pytest

from app.models.topology import Link, Node, Topology
from app.services.graph_manager import Graph, GraphError, validate_topology
from tests.helpers import classic_topology, make_topology


def test_valid_topology_has_no_errors():
    assert validate_topology(classic_topology(), "A", "F") == []


def test_self_link_rejected():
    topo = Topology(
        nodes=[Node(id="A", label="A")],
        links=[Link(id="l1", source="A", target="A", cost=1)],
    )
    assert any("itself" in e for e in validate_topology(topo))


def test_duplicate_link_rejected_in_either_direction():
    topo = make_topology([("A", "B", 1)])
    topo.links.append(Link(id="rev", source="B", target="A", cost=3))
    assert any("Duplicate link" in e for e in validate_topology(topo))


@pytest.mark.parametrize("cost", [0, -3])
def test_non_positive_cost_rejected(cost):
    topo = make_topology([("A", "B", cost)])
    assert any("positive cost" in e for e in validate_topology(topo))


def test_link_to_missing_router_rejected():
    topo = make_topology([("A", "B", 1)], nodes=["A"])
    assert any("does not exist" in e for e in validate_topology(topo))


def test_duplicate_router_id_and_label_rejected():
    topo = Topology(
        nodes=[Node(id="A", label="R1"), Node(id="A", label="R1")],
        links=[],
    )
    errors = validate_topology(topo)
    assert any("router id" in e for e in errors)
    assert any("router label" in e for e in errors)


def test_unknown_source_and_destination_rejected():
    errors = validate_topology(classic_topology(), "X", "Y")
    assert len(errors) == 2


def test_from_topology_raises_with_all_errors():
    with pytest.raises(GraphError) as exc:
        Graph.from_topology(make_topology([("A", "B", 0)]), "A", "Z")
    assert len(exc.value.errors) == 2


def test_adjacency_is_symmetric():
    graph = Graph(classic_topology())
    assert ("C", 2, "A-C") in graph.neighbors("A")
    assert ("A", 2, "A-C") in graph.neighbors("C")


def test_disabled_link_excluded_from_adjacency():
    graph = Graph(classic_topology(disabled=("A-C",)))
    assert all(n != "C" for n, _, _ in graph.neighbors("A"))
    assert graph.link_between("A", "C") is None


def test_connectivity():
    assert Graph(classic_topology()).is_connected()
    split = make_topology([("A", "B", 1), ("C", "D", 1)])
    assert not Graph(split).is_connected()
