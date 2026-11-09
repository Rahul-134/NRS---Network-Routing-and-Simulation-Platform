from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.distance_vector import run_distance_vector
from app.algorithms.link_state import run_link_state
from app.models.topology import SimulationRequest
from app.services.graph_manager import Graph

ALGORITHMS = {
    "dijkstra": run_dijkstra,
    "distance-vector": run_distance_vector,
    "link-state": run_link_state,
}


ALGORITHM_INFO = {
    "dijkstra": ("Dijkstra", "nodes processed"),
    "distance-vector": ("Distance Vector", "update rounds"),
    "link-state": ("Link State", "flooding rounds"),
}


def simulate(algorithm, request: SimulationRequest):
    graph = Graph.from_topology(request.topology, request.source, request.destination)
    return ALGORITHMS[algorithm](graph, request.source, request.destination)


def compare(request: SimulationRequest):
    graph = Graph.from_topology(request.topology, request.source, request.destination)
    results = []
    for key, run in ALGORITHMS.items():
        outcome = run(graph, request.source, request.destination)
        name, unit = ALGORITHM_INFO[key]
        results.append({
            "algorithm": key,
            "name": name,
            "final_path": outcome["final_path"],
            "total_cost": outcome["total_cost"],
            "hop_count": outcome["hop_count"],
            "iterations": outcome["iterations"],
            "iteration_unit": unit,
            "steps": len(outcome["steps"]),
            "converged": outcome.get("converged", True),
        })

    best = pick_best(results)
    return {
        "source": request.source,
        "destination": request.destination,
        "results": results,
        "costs_agree": len({r["total_cost"] for r in results}) == 1,
        "paths_agree": len({tuple(r["final_path"] or ()) for r in results}) == 1,
        "best": best,
        "tie": len({(r["total_cost"], r["steps"]) for r in results}) == 1,
    }


def pick_best(results):
    reachable = [r for r in results if r["total_cost"] is not None]
    if not reachable:
        return []
    lowest_cost = min(r["total_cost"] for r in reachable)
    cheapest = [r for r in reachable if r["total_cost"] == lowest_cost]
    fewest_steps = min(r["steps"] for r in cheapest)
    winners = [r["algorithm"] for r in cheapest if r["steps"] == fewest_steps]
    return [] if len(winners) == len(results) else winners
