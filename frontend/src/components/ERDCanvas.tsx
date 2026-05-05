import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { TableNode } from './TableNode'
import { Toolbar } from './Toolbar'
import { useERDData } from '../hooks/useERDData'
import { useAutoLayout } from '../hooks/useAutoLayout'
import { exportPNG, exportSVG, exportPDF, exportHTML, exportDBML } from '../lib/exporters'
import { colors } from '../lib/theme'
import type { ERDResponse } from '../types'

const nodeTypes: NodeTypes = {
  tableNode: TableNode as any,
}

interface ERDCanvasProps {
  data: ERDResponse | null
  compact: boolean
  showTypes: boolean
  showOrphans: boolean
  onSelectTable: (tableName: string) => void
}

function ERDCanvasInner({ data, compact, showTypes, showOrphans, onSelectTable }: ERDCanvasProps) {
  const rfInstance = useReactFlow()
  const { applyLayout } = useAutoLayout(rfInstance)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const layoutApplied = useRef(false)
  const prevDataRef = useRef<ERDResponse | null>(null)

  const { nodes: erdNodes, edges: erdEdges } = useERDData(data, { compact, showTypes, showOrphans })

  // When ERD data changes, set nodes/edges and schedule layout
  useEffect(() => {
    if (erdNodes.length === 0) {
      setNodes([])
      setEdges([])
      return
    }
    setNodes(erdNodes)
    setEdges(erdEdges)
    layoutApplied.current = false
  }, [erdNodes, erdEdges])

  // Apply layout once nodes are rendered and measured
  useEffect(() => {
    if (layoutApplied.current || nodes.length === 0) return

    // Wait a tick for nodes to be measured
    const timer = setTimeout(() => {
      applyLayout(nodes, edges, 'LR')
      layoutApplied.current = true
    }, 100)
    return () => clearTimeout(timer)
  }, [nodes, edges, applyLayout])

  const handleAutoLayout = useCallback(
    (dir: 'LR' | 'TB') => {
      applyLayout(nodes, edges, dir)
    },
    [nodes, edges, applyLayout]
  )

  const handleExport = useCallback(
    async (format: 'png' | 'svg' | 'pdf' | 'html' | 'dbml') => {
      if (!data) return
      switch (format) {
        case 'png': await exportPNG(data.catalog, data.schema_name); break
        case 'svg': await exportSVG(data.catalog, data.schema_name); break
        case 'pdf': await exportPDF(data.catalog, data.schema_name); break
        case 'html': await exportHTML(data.catalog, data.schema_name); break
        case 'dbml': exportDBML(data); break
      }
    },
    [data]
  )

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      onSelectTable(node.id)
    },
    [onSelectTable]
  )

  return (
    <div style={{ flex: 1, position: 'relative', background: colors.bg }}>
      {data && nodes.length > 0 && (
        <Toolbar
          onAutoLayout={handleAutoLayout}
          onExport={handleExport}
          tableCount={data.tables.length}
          relationshipCount={data.relationships.length}
          queryTimeMs={data.query_time_ms}
        />
      )}

      {!data && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: colors.textMuted,
            fontSize: 14,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>&#8942;</span>
          Select a catalog and schema, then click Generate ERD
        </div>
      )}

      {data && data.tables.length === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: colors.textMuted,
            fontSize: 14,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          No tables found in {data.catalog}.{data.schema_name}
        </div>
      )}

      {data && nodes.length === 0 && data.tables.length > 0 && !showOrphans && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: colors.textMuted,
            fontSize: 14,
            flexDirection: 'column',
            gap: 12,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 24 }}>No PK/FK constraints found</span>
          <span>
            {data.tables.length} tables exist in {data.catalog}.{data.schema_name} but none have
            PK/FK constraints defined. Enable "Show orphan tables" to see all tables, or add
            constraints with ALTER TABLE ... ADD CONSTRAINT.
          </span>
        </div>
      )}

      {nodes.length > 0 && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: colors.bg }}
        >
          <Background variant={BackgroundVariant.Dots} color={colors.border} gap={20} size={1} />
          <Controls
            style={{ background: colors.bgCard, borderColor: colors.border }}
          />
          <MiniMap
            style={{ background: colors.bgCard, borderColor: colors.border }}
            nodeColor={colors.bgCardHeader}
            maskColor="rgba(15, 17, 23, 0.7)"
          />
        </ReactFlow>
      )}
    </div>
  )
}

export function ERDCanvas(props: ERDCanvasProps) {
  return <ERDCanvasInner {...props} />
}
