const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

async function request(path, options) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, options)
  } catch {
    throw new Error('Cannot reach the backend. It may still be waking up, try again in a few seconds.')
  }
  const body = await response.json().catch(() => null)
  if (body === null) {
    throw new Error(`The backend is not responding (status ${response.status}).`)
  }
  if (!response.ok) {
    const detail = Array.isArray(body.detail) ? body.detail : [String(body.detail)]
    throw new Error(detail.map((d) => (typeof d === 'string' ? d : d.msg)).join('; '))
  }
  return body
}

const simulationRequest = (action, topology, source, destination) =>
  request(`/api/simulations/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topology, source, destination }),
  })

export const checkHealth = () => request('/api/health')

export const generateTopology = (nodes, extraLinkChance) =>
  request('/api/topologies/random', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes, extra_link_chance: extraLinkChance }),
  })

export const runSimulation = (algorithm, topology, source, destination) =>
  simulationRequest(algorithm, topology, source, destination)

export const compareAlgorithms = (topology, source, destination) =>
  simulationRequest('compare', topology, source, destination)

export const validateTopology = (topology, source, destination) =>
  simulationRequest('validate', topology, source, destination)
