from fastapi import APIRouter, HTTPException

from app.models.topology import SimulationRequest
from app.services.graph_manager import Graph, GraphError, validate_topology
from app.services.simulation_service import compare, simulate

router = APIRouter(prefix="/api/simulations")


def run(action, request):
    try:
        if action == "compare":
            return compare(request)
        return simulate(action, request)
    except GraphError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)


@router.post("/validate")
def validate(request: SimulationRequest):
    errors = validate_topology(request.topology, request.source, request.destination)
    connected = None if errors else Graph(request.topology).is_connected()
    return {"valid": not errors, "errors": errors, "connected": connected}


@router.post("/dijkstra")
def dijkstra(request: SimulationRequest):
    return run("dijkstra", request)


@router.post("/distance-vector")
def distance_vector(request: SimulationRequest):
    return run("distance-vector", request)


@router.post("/link-state")
def link_state(request: SimulationRequest):
    return run("link-state", request)


@router.post("/compare")
def compare_algorithms(request: SimulationRequest):
    return run("compare", request)
