import { useState, useEffect } from 'react'
import { colors } from '../lib/theme'

interface SidebarProps {
  onGenerate: (catalog: string, schema: string) => void
  loading: boolean
  compact: boolean
  showTypes: boolean
  showOrphans: boolean
  onToggleCompact: () => void
  onToggleTypes: () => void
  onToggleOrphans: () => void
}

export function Sidebar({
  onGenerate,
  loading,
  compact,
  showTypes,
  showOrphans,
  onToggleCompact,
  onToggleTypes,
  onToggleOrphans,
}: SidebarProps) {
  const [catalogs, setCatalogs] = useState<string[]>([])
  const [schemas, setSchemas] = useState<string[]>([])
  const [catalog, setCatalog] = useState('')
  const [schema, setSchema] = useState('')
  const [defaultCatalog, setDefaultCatalog] = useState('')

  // Fetch catalogs on mount
  useEffect(() => {
    fetch('/api/catalogs')
      .then((r) => r.json())
      .then((d) => {
        setCatalogs(d.catalogs || [])
        if (d.default) {
          setDefaultCatalog(d.default)
          setCatalog(d.default)
        }
      })
  }, [])

  // Fetch schemas when catalog changes
  useEffect(() => {
    if (!catalog) { setSchemas([]); return }
    fetch(`/api/schemas?catalog=${encodeURIComponent(catalog)}`)
      .then((r) => r.json())
      .then((d) => {
        setSchemas(d.schemas || [])
        setSchema(d.default || '')
      })
  }, [catalog])

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.textPrimary,
    fontSize: 13,
    outline: 'none',
  }

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 0',
    cursor: 'pointer',
    color: active ? colors.textPrimary : colors.textMuted,
    fontSize: 13,
    userSelect: 'none',
  })

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: colors.bgSidebar,
        borderRight: `1px solid ${colors.border}`,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ color: colors.primary, fontWeight: 700, fontSize: 16 }}>
          UC ERD Viewer
        </div>
        <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
          Unity Catalog Entity Relationships
        </div>
      </div>

      {/* Catalog selector */}
      <div>
        <label style={{ color: colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Catalog
        </label>
        <select
          style={selectStyle}
          value={catalog}
          onChange={(e) => { setCatalog(e.target.value); setSchema('') }}
        >
          <option value="">Select catalog...</option>
          {catalogs.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Schema selector */}
      <div>
        <label style={{ color: colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Schema
        </label>
        <select
          style={selectStyle}
          value={schema}
          onChange={(e) => setSchema(e.target.value)}
          disabled={!catalog}
        >
          <option value="">Select schema...</option>
          {schemas.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Generate button */}
      <button
        onClick={() => catalog && schema && onGenerate(catalog, schema)}
        disabled={!catalog || !schema || loading}
        style={{
          padding: '10px 16px',
          background: (!catalog || !schema || loading) ? colors.bgHover : colors.primary,
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 13,
          cursor: (!catalog || !schema || loading) ? 'not-allowed' : 'pointer',
          opacity: (!catalog || !schema || loading) ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {loading ? 'Querying...' : 'Generate ERD'}
      </button>

      {/* Separator */}
      <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '4px 0' }} />

      {/* Toggles */}
      <div>
        <label style={{ color: colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block' }}>
          Display Options
        </label>

        <div style={toggleStyle(showTypes)} onClick={onToggleTypes}>
          <input type="checkbox" checked={showTypes} readOnly style={{ accentColor: colors.primary }} />
          Show column types
        </div>
        <div style={toggleStyle(showOrphans)} onClick={onToggleOrphans}>
          <input type="checkbox" checked={showOrphans} readOnly style={{ accentColor: colors.primary }} />
          Show orphan tables
        </div>
        <div style={toggleStyle(compact)} onClick={onToggleCompact}>
          <input type="checkbox" checked={compact} readOnly style={{ accentColor: colors.primary }} />
          Compact mode (names only)
        </div>
      </div>
    </div>
  )
}
