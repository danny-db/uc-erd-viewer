import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'

/**
 * Compute auto-layout positions for nodes using dagre.
 * Returns new nodes array with updated positions.
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR',
): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 50,
    edgesep: 30,
    marginx: 40,
    marginy: 40,
  })

  // Add nodes with measured dimensions
  for (const node of nodes) {
    const width = node.measured?.width ?? node.width ?? 280
    const height = node.measured?.height ?? node.height ?? 200
    g.setNode(node.id, { width, height })
  }

  // Add edges
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    const width = node.measured?.width ?? node.width ?? 280
    const height = node.measured?.height ?? node.height ?? 200
    return {
      ...node,
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    }
  })
}
