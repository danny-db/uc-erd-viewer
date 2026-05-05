/** Databricks-inspired color palette */
export const colors = {
  // Backgrounds
  bg: '#0f1117',
  bgCard: '#1a1d27',
  bgCardHeader: '#252833',
  bgSidebar: '#151720',
  bgHover: '#2a2d3a',

  // Text
  textPrimary: '#e8eaed',
  textSecondary: '#9aa0a6',
  textMuted: '#6b7280',

  // Accents
  primary: '#ff6f00',       // Databricks orange
  primaryLight: '#ff9100',
  pkColor: '#f59e0b',       // Amber for PK
  fkColor: '#6366f1',       // Indigo for FK
  edgeColor: '#6366f1',

  // Types
  typeString: '#34d399',
  typeNumber: '#60a5fa',
  typeDate: '#c084fc',
  typeBool: '#fb923c',
  typeOther: '#9aa0a6',

  // Borders
  border: '#2a2d3a',
  borderHover: '#ff6f00',
} as const

export function getTypeColor(dataType: string): string {
  const t = dataType.toUpperCase()
  if (t.includes('STRING') || t.includes('VARCHAR') || t.includes('CHAR') || t.includes('TEXT')) return colors.typeString
  if (t.includes('INT') || t.includes('LONG') || t.includes('DOUBLE') || t.includes('FLOAT') || t.includes('DECIMAL') || t.includes('BIGINT') || t.includes('SMALLINT') || t.includes('TINYINT')) return colors.typeNumber
  if (t.includes('DATE') || t.includes('TIMESTAMP')) return colors.typeDate
  if (t.includes('BOOL')) return colors.typeBool
  return colors.typeOther
}
