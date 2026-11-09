from fastapi.testclient import TestClient

from app.config import MAX_BODY_BYTES, cors_origins
from app.main import app
from app.models.topology import MAX_LINKS, MAX_NODES

client = TestClient(app)


def body(nodes, links):
    return {"topology": {"nodes": nodes, "links": links}, "source": "n0", "destination": "n1"}


def test_rejects_too_many_nodes():
    nodes = [{"id": f"n{i}", "label": f"n{i}"} for i in range(MAX_NODES + 1)]
    assert client.post("/api/simulations/validate", json=body(nodes, [])).status_code == 422


def test_rejects_too_many_links():
    nodes = [{"id": "n0", "label": "n0"}, {"id": "n1", "label": "n1"}]
    links = [
        {"id": f"l{i}", "source": "n0", "target": "n1", "cost": 1} for i in range(MAX_LINKS + 1)
    ]
    assert client.post("/api/simulations/validate", json=body(nodes, links)).status_code == 422


def test_rejects_oversized_names_and_costs():
    long_name = "x" * 65
    nodes = [{"id": long_name, "label": "a"}, {"id": "n1", "label": "b"}]
    assert client.post("/api/simulations/validate", json=body(nodes, [])).status_code == 422
    nodes = [{"id": "n0", "label": "a"}, {"id": "n1", "label": "b"}]
    links = [{"id": "l", "source": "n0", "target": "n1", "cost": 10**12}]
    assert client.post("/api/simulations/validate", json=body(nodes, links)).status_code == 422


def test_rejects_oversized_body():
    response = client.post(
        "/api/simulations/validate",
        content=b"x" * (MAX_BODY_BYTES + 1),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413


def test_security_headers_present():
    response = client.get("/api/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["cache-control"] == "no-store"


def test_cors_origins_come_from_environment(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://nrs.vercel.app/, https://example.com")
    assert cors_origins() == ["https://nrs.vercel.app", "https://example.com"]
