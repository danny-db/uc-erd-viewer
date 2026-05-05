import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { TableNodeData } from '../hooks/useERDData'
import { colors, getTypeColor } from '../lib/theme'

function TableNodeComponent({ data }: { data: TableNodeData }) {
  const { table, compact, showTypes } = data

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        minWidth: 240,
        fontSize: 12,
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: colors.bgCardHeader,
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 13 }}>
          {table.name}
        </span>
        <span
          style={{
            color: colors.textMuted,
            fontSize: 10,
            padding: '1px 6px',
            background: colors.bg,
            borderRadius: 4,
          }}
        >
          {table.table_type}
        </span>
      </div>

      {/* Compact mode: table-level handles so edges still render */}
      {compact && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id={`${table.name}-compact-source`}
            style={{ background: colors.pkColor, width: 8, height: 8, right: -4, top: '50%' }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id={`${table.name}-compact-target`}
            style={{ background: colors.fkColor, width: 8, height: 8, left: -4, top: '50%' }}
          />
        </>
      )}

      {/* Columns */}
      {!compact && (
        <div style={{ padding: '4px 0' }}>
          {table.columns.map((col) => (
            <div
              key={col.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '3px 12px',
                gap: 6,
                position: 'relative',
              }}
              title={col.comment || undefined}
            >
              {/* PK/FK badge */}
              {col.is_pk && (
                <span
                  style={{
                    color: colors.pkColor,
                    fontWeight: 700,
                    fontSize: 9,
                    minWidth: 18,
                  }}
                >
                  PK
                </span>
              )}
              {col.is_fk && !col.is_pk && (
                <span
                  style={{
                    color: colors.fkColor,
                    fontWeight: 700,
                    fontSize: 9,
                    minWidth: 18,
                  }}
                >
                  FK
                </span>
              )}
              {!col.is_pk && !col.is_fk && <span style={{ minWidth: 18 }} />}

              {/* Column name */}
              <span
                style={{
                  color: col.is_pk ? colors.pkColor : col.is_fk ? colors.fkColor : colors.textPrimary,
                  flex: 1,
                  fontWeight: col.is_pk ? 600 : 400,
                }}
              >
                {col.name}
              </span>

              {/* Data type */}
              {showTypes && (
                <span
                  style={{
                    color: getTypeColor(col.data_type),
                    fontSize: 10,
                    opacity: 0.8,
                  }}
                >
                  {col.data_type}
                </span>
              )}

              {/* Handles for edges — PK columns get source handles, FK columns get target handles */}
              {col.is_pk && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${table.name}-${col.name}-source`}
                  style={{
                    background: colors.pkColor,
                    width: 8,
                    height: 8,
                    right: -4,
                  }}
                />
              )}
              {col.is_fk && (
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${table.name}-${col.name}-target`}
                  style={{
                    background: colors.fkColor,
                    width: 8,
                    height: 8,
                    left: -4,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const TableNode = memo(TableNodeComponent)
