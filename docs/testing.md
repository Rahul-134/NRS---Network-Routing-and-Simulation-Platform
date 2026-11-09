# Testing

## Automated tests

Backend:

```bash
cd backend
.venv/Scripts/python -m pytest
```

| File | What it covers |
| --- | --- |
| `test_graph_manager.py` | Validation rules, adjacency, disabled links, connectivity |
| `test_dijkstra.py` | Direct path, multiple paths, equal-cost paths, disconnected graph, source equals destination, single router, disabled link, step contents, comparison with a reference implementation on random graphs |
| `test_distance_vector.py` | Neighbors learned first, multi-hop routes in later rounds, cheaper routes replacing old ones, convergence, next-hop consistency, random graphs against a reference |
| `test_link_state.py` | One LSA per router at the start, flooding rounds equal the diameter, identical databases, tables, disconnected networks, random graphs against a reference |
| `test_topology_generator.py` | Generated networks (up to 50 routers) are valid and connected, links never cross or pass through other routers, seeds are repeatable, range checks, all three algorithms run on a 50-router network |
| `test_compare.py` | Metrics for each algorithm, agreement on cost, unreachable destinations |
| `test_api.py` | Every endpoint, invalid input returns 422 instead of crashing |

Frontend:

```bash
cd frontend
npm test        # topology file helper tests
npm run lint
npm run build
```

## Manual UI checklist

Start both servers (see the README), open http://localhost:5173 and work through the list. The expected values use the Simple example, routing from A to F.

### Top bar

| Action | Expected |
| --- | --- |
| Look at the top bar on a wide window | The logo is at the left, the three algorithm tabs (Dijkstra, Distance Vector, Link State) are centered with an icon each, and the API status, Compare and Load Example are at the right |
| Click each algorithm tab | The selected tab turns white and the Simulation subtitle shows its name. The simulation is cleared |
| Click **Compare** | The comparison window opens |
| Click **Load Example** | The Simple network is loaded |
| Stop the backend and reload | The status pill reads "API offline" in red |
| Narrow the window below 1024 pixels | The tabs move to their own full-width row under the logo and actions. Below 640 pixels the API status is hidden and Load Example shows only its icon |

### Theme

| Action | Expected |
| --- | --- |
| Open the app for the first time | It starts in dark mode and the toggle at the right end of the top bar shows a sun |
| Click the toggle | The whole interface turns light: white background, dark text, the dark logo version and a moon on the toggle. The canvas, mini map and every window follow |
| Run a simulation, open Compare, Generate Explanation and the expanded routing table in light mode | Text stays readable and the colours for current, visited, candidate and final path are still easy to tell apart |
| Reload the page | The chosen theme is kept, with no flash of the other theme |
| Click the toggle again | Back to dark mode |

### Topology building

| Action | Expected |
| --- | --- |
| Choose **Add Router**, click the empty canvas | A router appears with the next free letter |
| Drag a router | It moves and its links follow |
| Select a router, rename it | The new name shows. An empty name or a name already used is rejected with a message |
| Choose **Add Link**, click two routers | A link with cost 1 is created and selected |
| Add a link between two routers that are already linked | "These routers are already linked" |
| Click the same router twice in Add Link mode | Nothing is created |
| Double-click the cost on a link | The cost turns into an input with its text selected. Typing a number and pressing Enter saves it, Escape cancels |
| Double-click the link line itself | The same editor opens on the cost |
| Select a link, set its cost to 0, 1.5 or -2 (in the editor or the side panel) | Rejected, the old cost is restored |
| Select a link, set a valid cost | The label on the canvas updates |
| Delete a link | It disappears |
| Choose the **Delete** tool, then click a link or a router | It is removed (a router with links asks for confirmation first) |
| Delete a router that has links | A confirmation appears, then the router and its links are removed |
| Press Delete with a router or link selected | Same as the delete button |
| **Clear canvas** (next to the Network Tools heading) | The canvas is empty and shows a hint. Play and Compare are disabled |

### Canvas controls

| Action | Expected |
| --- | --- |
| Press the minus and plus buttons at the bottom left | The canvas zooms out and in, and the percentage between them updates |
| Click the percentage | The zoom returns to 100% |
| Press the fit button next to the zoom control | The whole network is framed in view, with room left at the bottom so no router or cost label sits under the zoom controls, the Legend button or the mini map. The same framing is used when a network is loaded or generated |
| Scroll the mouse wheel over the canvas | The canvas zooms and the percentage follows |
| Press **Legend** at the bottom right (wide windows only) | The colour legend opens above the button and the chevron flips. Press again to close it. It starts closed |
| Look at the mini map in the bottom-right corner (wide windows only) | It shows one dot per router: green for the source, pink for the destination, blue for the others, and amber, teal, cyan or emerald while a simulation runs. A white frame shows the part of the network currently in view |
| Drag inside the mini map | The main canvas pans to follow |
| Scroll over the mini map | The main canvas zooms |

### Simulation controls

| Action | Expected |
| --- | --- |
| **Next Step** repeatedly in Dijkstra mode | Step 1 shows A at 0. Then A, C, B, D, E, F are selected in turn |
| Check the right panel | The Algorithm state table updates: router chips change color, distances and previous routers change, and a state pill shows Visited, Current, Candidate or Unvisited |
| Press **Generate Explanation** (disabled until the simulation starts) | A window opens with the current step explained, with a title such as "Select router B" and the individual calculations listed underneath. **All steps so far** shows every step up to the current one. The X button, Escape and clicking outside all close it |
| **Back** | Goes to the previous step |
| **Play** | Steps advance automatically and stop at the end |
| **Pause** while playing | Stops where it is |
| Change the speed | Slow, Normal and Fast change the delay between steps |
| **Run to End** | Jumps to the final step |
| **Reset** | Returns to the unsimulated network |
| Final result | The Route result card shows the path A, C, B, D, E, F with total cost 13 (in green), 5 hops and 6 routers processed. Before the run ends it shows a dashed placeholder and dashes instead of numbers |
| Change source or destination | The simulation is cleared |
| Source equals destination | Cost 0, 0 hops |

### Modes

| Action | Expected |
| --- | --- |
| Switch to **Distance Vector** and press Next Step | Round 0 shows direct neighbors only. Later rounds highlight updated routers and links |
| Click a router in the right panel | The bottom routing table shows that router's table |
| Press the expand icon on the Routing table card | A large table opens with the same rows. The X button in the corner, Escape and clicking outside all close it. In Distance Vector and Link State the router picker also works inside it |
| Run to End | Same path and cost 13, 4 update rounds |
| Switch to **Link State** and press Next Step | Each router holds 1 of 6 LSAs. Flooding takes 3 rounds |
| Run to End | The link-state database card is complete, the shortest-path tree is shown in blue, the result is cost 13 |
| **Compare** | A window opens with a banner and three cards (Dijkstra, Distance Vector, Link State), each with its total cost and route, then a detailed table. On the Simple example Link State gets a green border and a Best badge (fewest simulation steps: 8, 7 and 6). The best values in the table are green with a check |
| **Compare** on a network where two algorithms tie for fewest steps (Campus Network) | Both get the Best badge and the banner says "were the most efficient" |
| **Compare** with a single router, or with a source cut off from the destination | No Best badge. The banner explains the tie or says no route was found |

### Failures

| Action | Expected |
| --- | --- |
| Run to End, then select link B-C and press **Disable link** | The link turns red and dashed. A re-run prompt appears |
| Press **Re-run** | New route A, B, D, E, F with cost 14 |
| Press **Later** instead | The prompt closes and the simulation stays cleared |
| **Restore link** | The link is normal again and the prompt appears again |
| Load the Ring example, disable two links that cut off the source | Every mode reports that no route exists |

### Examples, random networks and files

| Action | Expected |
| --- | --- |
| Load Simple Network, Ring Topology, Mesh Network, Campus Network | Each loads with its own source and destination and can be simulated in all modes |
| **Generate Random** with the Routers slider from 2 to 50 | A connected network with random costs, no links crossing and no overlapping cost labels |
| **Generate Random** with Link Density 0 and then 1 | Density 0 gives exactly routers minus one links (a tree), density 1 gives many more |
| **Save to JSON** | Downloads `nrs-topology.json` |
| **Load from JSON** with that file | The same network returns |
| Load a file with a cost of 0 | Rejected with the validation message |
| Load a file that is not JSON | "the file is not valid JSON" |

### Robustness

| Action | Expected |
| --- | --- |
| Stop the backend and press Play | The top bar shows "API offline", a message says the backend is not responding, and the page keeps working |
| Narrow the browser window below 1024 pixels | Panels stack vertically and stay usable |
