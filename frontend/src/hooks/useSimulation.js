import { useEffect, useRef, useState } from 'react'
import { runSimulation } from '../services/api'

export function useSimulation({ algorithm, topology, source, destination }) {
  const [run, setRun] = useState(null)
  const [index, setIndex] = useState(0)
  const [playingFlag, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(800)
  const [pendingKey, setPendingKey] = useState(null)
  const [failure, setFailure] = useState(null)
  const latestRequest = useRef(0)

  const inputKey = JSON.stringify([
    algorithm,
    source,
    destination,
    topology.nodes.map((n) => [n.id, n.label]),
    topology.links,
  ])

  const result = run && run.key === inputKey ? run.result : null
  const error = failure && failure.key === inputKey ? failure.message : null
  const loading = pendingKey === inputKey
  const lastIndex = result ? result.steps.length - 1 : 0
  const playing = playingFlag && result !== null && index < lastIndex

  const load = async () => {
    const requestId = ++latestRequest.current
    setPendingKey(inputKey)
    setFailure(null)
    try {
      const data = await runSimulation(algorithm, topology, source, destination)
      if (requestId !== latestRequest.current) return null
      setRun({ key: inputKey, result: data })
      setIndex(0)
      return data
    } catch (err) {
      if (requestId === latestRequest.current) setFailure({ key: inputKey, message: err.message })
      return null
    } finally {
      if (requestId === latestRequest.current) setPendingKey(null)
    }
  }

  useEffect(() => {
    if (!playing) return undefined
    const timer = setTimeout(() => {
      setIndex(index + 1)
      if (index + 1 >= lastIndex) setPlaying(false)
    }, speed)
    return () => clearTimeout(timer)
  }, [playing, index, lastIndex, speed])

  const play = async () => {
    if (!result) {
      if (await load()) setPlaying(true)
      return
    }
    if (index >= lastIndex) setIndex(0)
    setPlaying(true)
  }

  const pause = () => setPlaying(false)

  const next = async () => {
    setPlaying(false)
    if (!result) await load()
    else setIndex((i) => Math.min(i + 1, lastIndex))
  }

  const back = () => {
    setPlaying(false)
    setIndex((i) => Math.max(i - 1, 0))
  }

  const runToEnd = async () => {
    setPlaying(false)
    const data = result ?? (await load())
    if (data) setIndex(data.steps.length - 1)
  }

  const reset = () => {
    latestRequest.current += 1
    setRun(null)
    setIndex(0)
    setPlaying(false)
    setPendingKey(null)
    setFailure(null)
  }

  let status = 'idle'
  if (result) {
    if (index >= lastIndex) status = 'complete'
    else status = playing ? 'running' : 'paused'
  }

  return {
    result,
    step: result ? result.steps[Math.min(index, lastIndex)] : null,
    index,
    total: result ? result.steps.length : 0,
    status,
    playing,
    speed,
    setSpeed,
    loading,
    error,
    play,
    pause,
    next,
    back,
    reset,
    runToEnd,
  }
}
