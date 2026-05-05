import { useState, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from './components/Sidebar'
import { ERDCanvas } from './components/ERDCanvas'
import { TableDetail } from './components/TableDetail'
import type { ERDResponse, TableInfo } from './types'

export default function App() {
  const [data, setData] = useState<ERDResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)

  // Display options
  const [compact, setCompact] = useState(false)
  const [showTypes, setShowTypes] = useState(true)
  const [showOrphans, setShowOrphans] = useState(false)

  const handleGenerate = useCallback(async (catalog: string, schema: string) => {
    setLoading(true)
    setError(null)
    setSelectedTable(null)
    try {
      const resp = await fetch(`/api/erd?catalog=${encodeURIComponent(catalog)}&schema=${encodeURIComponent(schema)}`)
      if (!resp.ok) {
        const errText = await resp.text()
        throw new Error(`API error ${resp.status}: ${errText}`)
      }
      const erdData: ERDResponse = await resp.json()
      setData(erdData)
    } catch (e: any) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectTable = useCallback(
    (tableName: string) => {
      if (!data) return
      const table = data.tables.find((t) => t.name === tableName) || null
      setSelectedTable(table)
    },
    [data]
  )

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar
          onGenerate={handleGenerate}
          loading={loading}
          compact={compact}
          showTypes={showTypes}
          showOrphans={showOrphans}
          onToggleCompact={() => setCompact((v) => !v)}
          onToggleTypes={() => setShowTypes((v) => !v)}
          onToggleOrphans={() => setShowOrphans((v) => !v)}
        />

        <ERDCanvas
          data={data}
          compact={compact}
          showTypes={showTypes}
          showOrphans={showOrphans}
          onSelectTable={handleSelectTable}
        />

        <TableDetail table={selectedTable} onClose={() => setSelectedTable(null)} />

        {/* Error banner */}
        {error && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#dc2626',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 13,
              zIndex: 30,
              maxWidth: 600,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </ReactFlowProvider>
  )
}
