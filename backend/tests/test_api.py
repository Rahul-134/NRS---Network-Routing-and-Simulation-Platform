from fastapi.testclient import TestClient

from app.main import app
from tests.helpers import classic_topology

client = TestClient(app)


def payload(topology=None, source="A", destination="F"):
    topology = topology or classic_topology()
    return {"topology": topology.model_dump(), "source": source, "destination": destination}


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_dijkstra_returns_steps_and_result():
    response = client.post("/api/simulations/dijkstra", json=payload())
    assert response.status_code == 200
    body = response.json()
    assert body["algorithm"] == "dijkstra"
    assert body["final_path"] == ["A", "C", "B", "D", "E", "F"]
    assert body["total_cost"] == 13
    assert body["steps"][0]["distances"]["B"] is None


def test_dijkstra_respects_disabled_link():
    response = client.post(
        "/api/simulations/dijkstra", json=payload(classic_topology(disabled=("B-C",)), "A", "B")
    )
    assert response.json()["final_path"] == ["A", "B"]


def test_dijkstra_rejects_invalid_topology():
    bad = payload()
    bad["topology"]["links"][0]["cost"] = 0
    response = client.post("/api/simulations/dijkstra", json=bad)
    assert response.status_code == 422
    assert any("positive cost" in e for e in response.json()["detail"])


def test_dijkstra_rejects_unknown_source():
    response = client.post("/api/simulations/dijkstra", json=payload(source="Z"))
    assert response.status_code == 422


def test_malformed_body_does_not_crash():
    response = client.post("/api/simulations/dijkstra", json={"source": "A"})
    assert response.status_code == 422


def test_validate_endpoint_reports_connectivity():
    ok = client.post("/api/simulations/validate", json=payload()).json()
    assert ok == {"valid": True, "errors": [], "connected": True}

    bad = payload()
    bad["topology"]["links"] = bad["topology"]["links"][:1]
    report = client.post("/api/simulations/validate", json=bad).json()
    assert report["valid"] is True
    assert report["connected"] is False


def test_distance_vector_endpoint():
    response = client.post("/api/simulations/distance-vector", json=payload())
    assert response.status_code == 200
    body = response.json()
    assert body["algorithm"] == "distance_vector"
    assert body["final_path"] == ["A", "C", "B", "D", "E", "F"]
    assert body["total_cost"] == 13
    assert body["converged"] is True
    assert body["steps"][0]["tables"]["A"]["D"] == {"cost": None, "next_hop": None}


def test_link_state_endpoint():
    response = client.post("/api/simulations/link-state", json=payload())
    assert response.status_code == 200
    body = response.json()
    assert body["algorithm"] == "link_state"
    assert body["final_path"] == ["A", "C", "B", "D", "E", "F"]
    assert body["total_cost"] == 13
    assert {"neighbor": "C", "cost": 2} in body["lsas"]["A"]


def test_all_algorithms_agree_on_cost():
    costs = {
        name: client.post(f"/api/simulations/{name}", json=payload(source="B", destination="E")).json()["total_cost"]
        for name in ("dijkstra", "distance-vector", "link-state")
    }
    assert len(set(costs.values())) == 1


def test_disabled_link_respected_by_every_algorithm():
    body = payload(classic_topology(disabled=("B-C",)), "A", "B")
    for name in ("dijkstra", "distance-vector", "link-state"):
        result = client.post(f"/api/simulations/{name}", json=body).json()
        assert result["final_path"] == ["A", "B"]


def test_new_endpoints_reject_invalid_topology():
    bad = payload()
    bad["topology"]["links"][0]["cost"] = -1
    for name in ("distance-vector", "link-state"):
        response = client.post(f"/api/simulations/{name}", json=bad)
        assert response.status_code == 422
