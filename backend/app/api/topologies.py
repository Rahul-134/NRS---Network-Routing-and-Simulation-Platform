from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.topology import Topology
from app.services.topology_generator import generate_topology

router = APIRouter(prefix="/api/topologies")


class RandomTopologyRequest(BaseModel):
    nodes: int = Field(6, ge=2, le=50)
    extra_link_chance: float = Field(0.3, ge=0, le=1)
    max_cost: int = Field(10, ge=1, le=99)
    seed: int | None = None


@router.post("/random", response_model=Topology)
def random_topology(request: RandomTopologyRequest):
    return generate_topology(request.nodes, request.extra_link_chance, request.max_cost, request.seed)
