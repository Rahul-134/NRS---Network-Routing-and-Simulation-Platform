from pydantic import BaseModel, Field

MAX_NODES = 100
MAX_LINKS = 500
Name = Field(max_length=64)


class Node(BaseModel):
    id: str = Name
    label: str = Name
    x: float = Field(0, allow_inf_nan=False)
    y: float = Field(0, allow_inf_nan=False)


class Link(BaseModel):
    id: str = Name
    source: str = Name
    target: str = Name
    cost: int = Field(le=1_000_000)
    enabled: bool = True


class Topology(BaseModel):
    nodes: list[Node] = Field(max_length=MAX_NODES)
    links: list[Link] = Field(max_length=MAX_LINKS)


class SimulationRequest(BaseModel):
    topology: Topology
    source: str = Name
    destination: str = Name
