import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type { ERDResponse, TableInfo } from '../types'
import { colors } from '../lib/theme'

/** Column height (px) within a table node */
const COL_HEIGHT = 28
const HEADER_HEIGHT = 40
const NODE_WIDTH = 280
const PADDING = 12

export interface TableNodeData {
  table: TableInfo
  compact: boolean
  showTypes: boolean
  [key: string]: unknown
}

/**
 * Transform ERDResponse into React Flow nodes and edges.
 */
export function useERDData(
  data: ERDResponse | null,
  options: { compact: boolean; showTypes: boolean; showOrphans: boolean }
) {
  return useMemo(() => {
    if (!data) return { nodes: [], edges: [] }

    const { compact, showTypes, showOrphans } = options

    // Filter tables
    const tables = showOrphans
      ? data.tables
      : data.tables.filter((t) => t.has_constraints)

    // Build nodes
    const nodes: Node[] = tables.map((table, i) => {
      const colCount = compact ? 0 : table.columns.length
      const height = HEADER_HEIGHT + colCount * COL_HEIGHT + PADDING

      return {
        id: table.name,
        type: 'tableNode',
        position: { x: 0, y: 0 }, // dagre will set this
        width: NODE_WIDTH,
        height,
        data: {
          table,
          compact,
          showTypes,
        } satisfies TableNodeData,
      }
    })

    // Build edges from relationships
    const edges: Edge[] = data.relationships.map((rel) => ({
      id: rel.name,
      source: rel.pk_table,
      target: rel.fk_table,
      sourceHandle: compact ? `${rel.pk_table}-compact-source` : `${rel.pk_table}-${rel.pk_columns[0]}-source`,
      targetHandle: compact ? `${rel.fk_table}-compact-target` : `${rel.fk_table}-${rel.fk_columns[0]}-target`,
      type: 'default',
      animated: true,
      style: { stroke: colors.edgeColor, strokeWidth: 2 },
      label: rel.name,
      labelStyle: { fill: colors.textMuted, fontSize: 10 },
      labelBgStyle: { fill: colors.bg, fillOpacity: 0.8 },
      labelBgPadding: [4, 2] as [number, number],
    }))

    return { nodes, edges }
  }, [data, options.compact, options.showTypes, options.showOrphans])
}
