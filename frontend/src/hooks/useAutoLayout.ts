import { useCallback } from 'react'
import type { Node, Edge, useReactFlow } from '@xyflow/react'
import { getLayoutedElements } from '../lib/layoutEngine'

/**
 * Hook that provides a layout function for React Flow nodes.
 * Call `applyLayout` after nodes are measured to position them.
 */
export function useAutoLayout(rfInstance: ReturnType<typeof useReactFlow> | null) {
  const applyLayout = useCallback(
    (nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'LR') => {
      if (!rfInstance || nodes.length === 0) return

      const layouted = getLayoutedElements(nodes, edges, direction)
      rfInstance.setNodes(layouted)

      // Fit view after layout
      window.requestAnimationFrame(() => {
        rfInstance.fitView({ padding: 0.1 })
      })
    },
    [rfInstance]
  )

  return { applyLayout }
}
