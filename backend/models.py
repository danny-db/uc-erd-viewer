"""Pydantic response models for ERD API."""

from pydantic import BaseModel


class ColumnInfo(BaseModel):
    name: str
    data_type: str
    is_nullable: bool = True
    is_pk: bool = False
    is_fk: bool = False
    comment: str | None = None
    fk_target: str | None = None  # "schema.table.column" if FK


class TableInfo(BaseModel):
    name: str
    schema_name: str
    table_type: str
    comment: str | None = None
    columns: list[ColumnInfo] = []
    has_constraints: bool = False


class Relationship(BaseModel):
    name: str
    fk_schema: str
    fk_table: str
    fk_columns: list[str]
    pk_schema: str
    pk_table: str
    pk_columns: list[str]


class ERDResponse(BaseModel):
    catalog: str
    schema_name: str
    tables: list[TableInfo]
    relationships: list[Relationship]
    query_time_ms: int
