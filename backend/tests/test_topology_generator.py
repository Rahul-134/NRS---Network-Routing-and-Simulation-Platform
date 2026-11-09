import math

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.graph_manager import Graph, validate_topology
from app.services.topology_generator import (
    MIN_CLEARANCE,
    JITTER_RATIO,
    distance_to_segment,
    generate_topology,
    layout_spacing,
    segments_cross,
)

client = TestClient(app)


def coordinates(topo):
    return {n.id: (n.x, n.y) for n in topo.nodes}


@pytest.mark.parametrize("size", [2, 3, 6, 10, 15, 30, 50])
def test_generated_topology_is_valid_and_connected(size):
    for seed in range(15):
        topo = generate_topology(size, seed=seed)
        assert len(topo.nodes) == size
        assert validate_topology(topo) == []
        assert Graph(topo).is_connected()


def test_costs_stay_within_range():
    topo = generate_topology(12, extra_link_chance=0.6, max_cost=7, seed=3)
    assert all(1 <= link.cost <= 7 for link in topo.links)
    assert all(link.enabled for link in topo.links)


def test_zero_extra_chance_gives_a_spanning_tree():
    topo = generate_topology(8, extra_link_chance=0, seed=1)
    assert len(topo.links) == 7
    assert Graph(topo).is_connected()


def test_more_chance_gives_more_links_without_crossing_them():
    sparse = generate_topology(20, extra_link_chance=0.1, seed=4)
    dense = generate_topology(20, extra_link_chance=1, seed=4)
    assert len(dense.links) > len(sparse.links) >= 19
    assert len(dense.links) <= 3 * 20 - 6


def test_same_seed_gives_same_topology():
    assert generate_topology(7, seed=42) == generate_topology(7, seed=42)


def test_different_seeds_usually_differ():
    results = {generate_topology(8, seed=s).model_dump_json() for s in range(10)}
    assert len(results) > 1


def test_routers_are_laid_out_apart_from_each_other():
    for size in (9, 30, 50):
        topo = generate_topology(size, seed=0)
        points = list(coordinates(topo).values())
        assert all(x > 0 and y > 0 for x, y in points)
        closest = min(math.dist(a, b) for i, a in enumerate(points) for b in points[i + 1:])
        spacing = layout_spacing(size)
        assert closest > spacing - 2 * spacing * JITTER_RATIO - 5


@pytest.mark.parametrize("size", [6, 12, 25, 50])
def test_links_never_cross(size):
    for seed in range(10):
        topo = generate_topology(size, extra_link_chance=0.6, seed=seed)
        points = coordinates(topo)
        links = topo.links
        for i, first in enumerate(links):
            for second in links[i + 1:]:
                if len({first.source, first.target, second.source, second.target}) < 4:
                    continue
                assert not segments_cross(
                    points[first.source], points[first.target],
                    points[second.source], points[second.target],
                ), (size, seed, first.id, second.id)


@pytest.mark.parametrize("size", [6, 12, 25, 50])
def test_links_keep_clear_of_other_routers(size):
    for seed in range(10):
        topo = generate_topology(size, extra_link_chance=0.6, seed=seed)
        points = coordinates(topo)
        for link in topo.links:
            for node_id, point in points.items():
                if node_id in (link.source, link.target):
                    continue
                gap = distance_to_segment(point, points[link.source], points[link.target])
                assert gap >= MIN_CLEARANCE, (size, seed, link.id, node_id)


def test_large_networks_stay_sparse_enough_to_read():
    topo = generate_topology(50, seed=2)
    assert len(topo.links) < 3 * 50


def test_random_endpoint_returns_usable_topology():
    response = client.post("/api/topologies/random", json={"nodes": 6, "seed": 9})
    assert response.status_code == 200
    body = response.json()
    assert len(body["nodes"]) == 6
    assert body["links"]

    nodes = [n["id"] for n in body["nodes"]]
    for algorithm in ("dijkstra", "distance-vector", "link-state"):
        sim = client.post(
            f"/api/simulations/{algorithm}",
            json={"topology": body, "source": nodes[0], "destination": nodes[-1]},
        )
        assert sim.status_code == 200
        assert sim.json()["final_path"] is not None


def test_all_algorithms_handle_fifty_routers():
    body = client.post("/api/topologies/random", json={"nodes": 50, "seed": 5}).json()
    assert len(body["nodes"]) == 50
    request = {"topology": body, "source": "A", "destination": "R50"}
    report = client.post("/api/simulations/compare", json=request).json()
    assert report["costs_agree"] is True
    assert all(r["converged"] for r in report["results"])
    for algorithm in ("distance-vector", "link-state"):
        steps = client.post(f"/api/simulations/{algorithm}", json=request).json()["steps"]
        assert all(len(s["explanation"]) < 3000 for s in steps)


def test_random_endpoint_uses_defaults():
    response = client.post("/api/topologies/random", json={})
    assert response.status_code == 200
    assert len(response.json()["nodes"]) == 6


@pytest.mark.parametrize(
    "body",
    [
        {"nodes": 1},
        {"nodes": 51},
        {"nodes": 5, "max_cost": 0},
        {"nodes": 5, "extra_link_chance": 1.5},
    ],
)
def test_random_endpoint_rejects_out_of_range_values(body):
    assert client.post("/api/topologies/random", json=body).status_code == 422
