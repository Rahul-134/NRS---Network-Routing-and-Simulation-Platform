# Algorithms

All three modes work on the same model: an undirected graph where nodes are routers and links have a positive integer cost. Disabled links are left out before any algorithm runs, so a failed link is never used.

The implementations are plain Python in `backend/app/algorithms/`. Each function takes a `Graph` (from `services/graph_manager.py`), a source and a destination, and returns the full list of simulation steps plus the final result. The frontend replays the steps.

Ties are broken by router order (the order routers were added), so the same input always produces the same output.

The examples below use the **Simple** preset, routing from A to F.

```
A-B 4   A-C 2   B-C 1   B-D 5   C-D 8
C-E 10  D-E 2   D-F 6   E-F 3
```

## Dijkstra (`dijkstra.py`)

**Idea.** Grow a set of routers whose shortest distance from the source is final. Always finalize the unvisited router with the smallest tentative distance, then check whether going through it gives each neighbor a shorter route (relaxation).

**Algorithm.**

1. Distance to the source is 0, every other distance is infinity, and no predecessors are set.
2. Pick the unvisited router with the smallest finite distance and mark it visited.
3. For every unvisited neighbor, compare `distance[current] + link cost` with the neighbor's distance. If it is smaller, update the distance and set the predecessor to the current router.
4. Stop when the destination has been visited or no reachable router is left.
5. Rebuild the path by following predecessors back from the destination.

**Steps recorded.** One `init` step, one `select` step per router that is finalized, and one `complete` step. Each step has the visited set, candidate routers, distances, predecessors, which distances changed, the links examined and an explanation.

**Worked example (A to F).**

| Step | Selected | Result |
| --- | --- | --- |
| 1 | A (0) | B = 4, C = 2 |
| 2 | C (2) | B = 3 via C, D = 10, E = 12 |
| 3 | B (3) | D = 8 via B |
| 4 | D (8) | E = 10 via D, F = 14 |
| 5 | E (10) | F = 13 via E |
| 6 | F (13) | destination finalized |

Path A, C, B, D, E, F with cost 13. Six routers were processed.

**Why costs must be positive.** Once a router is finalized its distance can never improve, because every other route to it would have to pass through a router with an equal or larger distance and add a positive cost. A negative cost would break that argument, so the API rejects zero and negative costs.

**Complexity.** This version scans for the minimum each time, so it is O(V squared). A priority queue would give O(E log V), but the plain scan is easier to explain.

## Distance Vector (`distance_vector.py`)

**Idea.** Every router keeps a table of destination, cost and next hop. Routers learn only from their direct neighbors: each round, every router looks at the tables its neighbors had at the end of the previous round and keeps whichever route is cheaper (Bellman-Ford, distributed).

**Algorithm.**

1. Round 0: each router knows itself at cost 0 and each direct neighbor at the link cost, with that neighbor as next hop.
2. Round n: for every router R and destination D, compute `link cost to neighbor N + N's cost to D` (using N's table from round n-1) for every neighbor N. If the best value is lower than R's current cost, replace the entry and record the new next hop.
3. All routers update at the same time from the previous round's tables (a synchronous round).
4. Stop when a round changes nothing (converged). A safety limit of `routers + 1` rounds is in place.
5. The route from the source to the destination is found by following next hops through each router's table.

**Steps recorded.** One `init` step (round 0), one `round` step per round including the last round with no changes, and a `complete` step. Each step has every router's full table, the list of changes (old and new cost and next hop), the routers that changed and the links that supplied new information.

**Worked example (A to F).**

- Round 0: A knows B (4) and C (2) only.
- Round 1: A learns D at 9 via B (4 + 5). A improves B from 4 to 3 via C (2 + 1).
- Round 2: A improves D from 9 to 8 via C, because C found a cheaper way to D in round 1.
- It converges after 4 rounds with updates. Round 5 changes nothing, which is how convergence is detected.

A's table at the end gives F at cost 13 with next hop C, and following the next hops gives A, C, B, D, E, F.

**What is simplified.** Rounds are synchronous and the network is static, so there are no timers, triggered updates or split horizon. Editing a link and re-running starts again from round 0 on the new topology, so the count-to-infinity problem real protocols face after a failure is not shown.

**Complexity.** Each round does work proportional to V times E, and there are at most V rounds.

## Link State (`link_state.py`)

**Idea.** Every router describes its own links in a link-state advertisement (LSA) and floods it to the whole network. Once every router holds the same link-state database (LSDB), each one runs the shortest-path-first (Dijkstra) computation on its own copy.

**Algorithm.**

1. Each router creates its LSA: its enabled neighbors and the cost of each link. At the start it holds only its own LSA.
2. Flooding, in rounds: every router forwards the LSAs it learned in the previous round to its neighbors. A router that already holds an LSA ignores the copy, and these ignored copies are counted as duplicates.
3. Flooding stops when a round delivers nothing new. The number of rounds equals the network diameter in hops.
4. Each router runs SPF on the LSAs it holds and builds its routing table (destination, cost, next hop).
5. The route is found by following next hops, as in Distance Vector.

In a connected network every router ends with the same LSDB. If the network is split by failures, each router only learns about its own part, so routes to the other part are reported as unreachable.

**Steps recorded.** One `init` step (each router holds one LSA), one `flood` step per round (who received which LSA from whom, and the links used), an `spf` step with every router's table and the source's shortest-path tree, and a `complete` step. The node caption during flooding shows how many LSAs each router holds.

**Worked example (A to F).** The Simple topology has a diameter of 3 hops, so flooding takes 3 rounds. After the third round every router holds all 6 LSAs, then the SPF step produces the same route as Dijkstra: cost 13.

**What is simplified.** LSAs have no sequence numbers, ages or acknowledgements, and there is no neighbor discovery or area structure. It demonstrates the idea behind OSPF, not the full protocol.

**Complexity.** Flooding sends each LSA over each link a bounded number of times, and each router runs one Dijkstra, so the total SPF work is V times O(V squared).

## Comparing the three

| | Dijkstra | Distance Vector | Link State |
| --- | --- | --- | --- |
| Knowledge needed | Whole topology at one place | Only direct neighbors | Whole topology at every router |
| Who computes | One router | Every router, jointly | Every router, independently |
| Information exchanged | None (centralized) | Routing tables | Link-state advertisements |
| Convergence measure | Routers processed | Update rounds | Flooding rounds |
| Real protocols | The core of OSPF and IS-IS | RIP | OSPF, IS-IS |

All three always agree on the total cost for the same network. They can pick different paths when two paths have equal cost; the comparison panel points this out.
