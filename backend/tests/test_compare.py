import random

from fastapi.testclient import TestClient

from app.main import app
from app.models.topology import SimulationRequest
from app.services.simulation_service import compare, pick_best
from tests.helpers import classic_topology, make_topology, random_topology

client = TestClient(app)


def request_for(topology, source, destination):
    return SimulationRequest(topology=topology, source=source, destination=destination)


def by_name(report):
    return {r["algorithm"]: r for r in report["results"]}


def test_reports_all_three_algorithms():
    report = compare(request_for(classic_topology(), "A", "F"))
    assert [r["algorithm"] for r in report["results"]] == ["dijkstra", "distance-vector", "link-state"]
    assert report["source"] == "A"
    assert report["destination"] == "F"


def test_classic_topology_metrics():
    results = by_name(compare(request_for(classic_topology(), "A", "F")))
    for result in results.values():
        assert result["final_path"] == ["A", "C", "B", "D", "E", "F"]
        assert result["total_cost"] == 13
        assert result["hop_count"] == 5
        assert result["converged"] is True
    assert results["dijkstra"]["iterations"] == 6
    assert results["distance-vector"]["iterations"] == 4
    assert results["link-state"]["iterations"] == 3
    assert results["dijkstra"]["iteration_unit"] == "nodes processed"
    assert results["distance-vector"]["iteration_unit"] == "update rounds"
    assert results["link-state"]["iteration_unit"] == "flooding rounds"


def test_agreement_flags():
    report = compare(request_for(classic_topology(), "A", "F"))
    assert report["costs_agree"] is True
    assert report["paths_agree"] is True


def test_disabled_link_changes_every_algorithm():
    report = compare(request_for(classic_topology(disabled=("B-C",)), "A", "B"))
    assert all(r["final_path"] == ["A", "B"] and r["total_cost"] == 4 for r in report["results"])


def test_unreachable_destination():
    topo = make_topology([("A", "B", 1), ("C", "D", 1)])
    report = compare(request_for(topo, "A", "D"))
    assert all(r["final_path"] is None and r["total_cost"] is None for r in report["results"])
    assert report["costs_agree"] is True


def test_source_equals_destination():
    report = compare(request_for(classic_topology(), "C", "C"))
    assert all(r["total_cost"] == 0 and r["hop_count"] == 0 for r in report["results"])


def test_all_algorithms_agree_on_cost_for_random_graphs():
    rng = random.Random(33)
    for _ in range(60):
        topo = random_topology(rng)
        names = [n.id for n in topo.nodes]
        source, destination = rng.sample(names, 2)
        report = compare(request_for(topo, source, destination))
        assert report["costs_agree"] is True
        assert all(r["converged"] for r in report["results"])


def test_compare_endpoint():
    body = {"topology": classic_topology().model_dump(), "source": "A", "destination": "F"}
    response = client.post("/api/simulations/compare", json=body)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 3
    assert data["costs_agree"] is True


def test_compare_endpoint_rejects_invalid_input():
    body = {"topology": classic_topology().model_dump(), "source": "Z", "destination": "F"}
    assert client.post("/api/simulations/compare", json=body).status_code == 422
    body["source"] = "A"
    body["topology"]["links"][0]["cost"] = 0
    assert client.post("/api/simulations/compare", json=body).status_code == 422


def test_best_is_lowest_cost_then_fewest_steps():
    report = compare(request_for(classic_topology(), "A", "F"))
    steps = {r["algorithm"]: r["steps"] for r in report["results"]}
    assert steps == {"dijkstra": 8, "distance-vector": 7, "link-state": 6}
    assert report["best"] == ["link-state"]
    assert report["tie"] is False


def test_lower_cost_beats_fewer_steps():
    results = [
        {"algorithm": "a", "total_cost": 5, "steps": 3},
        {"algorithm": "b", "total_cost": 4, "steps": 9},
        {"algorithm": "c", "total_cost": 4, "steps": 7},
    ]
    assert pick_best(results) == ["c"]


def test_equal_winners_are_all_reported():
    results = [
        {"algorithm": "a", "total_cost": 4, "steps": 5},
        {"algorithm": "b", "total_cost": 4, "steps": 5},
        {"algorithm": "c", "total_cost": 4, "steps": 8},
    ]
    assert pick_best(results) == ["a", "b"]


def test_full_tie_has_no_single_best():
    report = compare(request_for(make_topology([], nodes=["A"]), "A", "A"))
    assert report["tie"] is True
    assert report["best"] == []


def test_unreachable_destination_has_no_best():
    topo = make_topology([("A", "B", 1), ("C", "D", 1)])
    report = compare(request_for(topo, "A", "D"))
    assert report["best"] == []
