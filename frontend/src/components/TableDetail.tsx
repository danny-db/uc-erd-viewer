import type { TableInfo } from '../types'
import { colors, getTypeColor } from '../lib/theme'

interface TableDetailProps {
  table: TableInfo | null
  onClose: () => void
}

export function TableDetail({ table, onClose }: TableDetailProps) {
  if (!table) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: colors.bgSidebar,
        borderLeft: `1px solid ${colors.border}`,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 15 }}>
            {table.name}
          </div>
          <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {table.table_type} &middot; {table.columns.length} columns
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.textMuted,
            fontSize: 20,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          &times;
        </button>
      </div>

      {/* Comment */}
      {table.comment && (
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ color: colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
            Description
          </div>
          <div style={{ color: colors.textPrimary, fontSize: 13, lineHeight: 1.4 }}>
            {table.comment}
          </div>
        </div>
      )}

      {/* Columns */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        <div style={{ padding: '0 20px 8px', color: colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
          Columns
        </div>
        {table.columns.map((col) => (
          <div
            key={col.name}
            style={{
              padding: '8px 20px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {col.is_pk && (
                <span style={{ color: colors.pkColor, fontWeight: 700, fontSize: 10 }}>PK</span>
              )}
              {col.is_fk && (
                <span style={{ color: colors.fkColor, fontWeight: 700, fontSize: 10 }}>FK</span>
              )}
              <span style={{ color: colors.textPrimary, fontWeight: col.is_pk ? 600 : 400, fontSize: 13 }}>
                {col.name}
              </span>
              <span style={{ color: getTypeColor(col.data_type), fontSize: 11, marginLeft: 'auto' }}>
                {col.data_type}
              </span>
            </div>
            {col.comment && (
              <div style={{ color: colors.textMuted, fontSize: 11, paddingLeft: col.is_pk || col.is_fk ? 24 : 0 }}>
                {col.comment}
              </div>
            )}
            {col.fk_target && (
              <div style={{ color: colors.fkColor, fontSize: 11, paddingLeft: 24 }}>
                &rarr; {col.fk_target}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
