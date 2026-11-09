import { useCallback } from 'react'
import { getRectOfNodes, getViewportForBounds, useReactFlow, useStoreApi } from 'reactflow'

const PADDING = 0.12
const MIN_ZOOM = 0.15
const MAX_ZOOM = 1

export function useFitNetwork() {
  const { getNodes, setViewport } = useReactFlow()
  const store = useStoreApi()

  return useCallback(
    (duration = 250) => {
      const nodes = getNodes()
      if (nodes.length === 0) return

      const { width, height } = store.getState()
      const wide = window.matchMedia('(min-width: 1280px)').matches
      const inset = { top: 16, left: 16, right: 16, bottom: wide ? 160 : 76 }
      const view = getViewportForBounds(
        getRectOfNodes(nodes),
        Math.max(width - inset.left - inset.right, 120),
        Math.max(height - inset.top - inset.bottom, 120),
        MIN_ZOOM,
        MAX_ZOOM,
        PADDING,
      )
      setViewport({ x: view.x + inset.left, y: view.y + inset.top, zoom: view.zoom }, { duration })
    },
    [getNodes, setViewport, store],
  )
}
