import { colors } from '../lib/theme'

interface ToolbarProps {
  onAutoLayout: (dir: 'LR' | 'TB') => void
  onExport: (format: 'png' | 'svg' | 'pdf' | 'html' | 'dbml') => void
  tableCount: number
  relationshipCount: number
  queryTimeMs: number
}

export function Toolbar({ onAutoLayout, onExport, tableCount, relationshipCount, queryTimeMs }: ToolbarProps) {
  const btnStyle: React.CSSProperties = {
    padding: '6px 12px',
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.textPrimary,
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'border-color 0.15s',
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {/* Stats */}
      <span style={{ color: colors.textMuted, fontSize: 11, marginRight: 8 }}>
        {tableCount} tables &middot; {relationshipCount} relationships &middot; {queryTimeMs}ms
      </span>

      {/* Layout buttons */}
      <button style={btnStyle} onClick={() => onAutoLayout('LR')} title="Layout left-to-right">
        LR Layout
      </button>
      <button style={btnStyle} onClick={() => onAutoLayout('TB')} title="Layout top-to-bottom">
        TB Layout
      </button>

      {/* Export dropdown */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <select
          style={{
            ...btnStyle,
            background: colors.primary,
            border: `1px solid ${colors.primary}`,
            fontWeight: 600,
            paddingRight: 28,
            appearance: 'none',
          }}
          onChange={(e) => {
            if (e.target.value) {
              onExport(e.target.value as any)
              e.target.value = ''
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>Export...</option>
          <option value="png">PNG Image</option>
          <option value="svg">SVG Vector</option>
          <option value="pdf">PDF Document</option>
          <option value="html">Standalone HTML</option>
          <option value="dbml">DBML (dbdiagram.io)</option>
        </select>
      </div>
    </div>
  )
}
