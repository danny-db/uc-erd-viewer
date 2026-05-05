export interface ColumnInfo {
  name: string
  data_type: string
  is_nullable: boolean
  is_pk: boolean
  is_fk: boolean
  comment: string | null
  fk_target: string | null
}

export interface TableInfo {
  name: string
  schema_name: string
  table_type: string
  comment: string | null
  columns: ColumnInfo[]
  has_constraints: boolean
}

export interface Relationship {
  name: string
  fk_schema: string
  fk_table: string
  fk_columns: string[]
  pk_schema: string
  pk_table: string
  pk_columns: string[]
}

export interface ERDResponse {
  catalog: string
  schema_name: string
  tables: TableInfo[]
  relationships: Relationship[]
  query_time_ms: number
}
