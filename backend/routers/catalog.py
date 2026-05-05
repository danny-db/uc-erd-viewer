"""Catalog/schema/table listing endpoints."""

import os
from fastapi import APIRouter, Query

from backend.database import execute_sql, validate_identifier

router = APIRouter()

DEFAULT_CATALOG = os.getenv("DEFAULT_CATALOG", "")
DEFAULT_SCHEMA = os.getenv("DEFAULT_SCHEMA", "")


@router.get("/catalogs")
async def list_catalogs():
    """List accessible catalogs."""
    rows = execute_sql("SHOW CATALOGS")
    catalogs = [r.get("catalog", r.get("catalog_name", "")) for r in rows]
    # Filter out system catalogs
    catalogs = [c for c in catalogs if c and c not in ("system", "__databricks_internal")]
    return {"catalogs": sorted(catalogs), "default": DEFAULT_CATALOG}


@router.get("/schemas")
async def list_schemas(catalog: str = Query(...)):
    """List schemas in a catalog."""
    cat = validate_identifier(catalog, "catalog")
    rows = execute_sql(f"SHOW SCHEMAS IN `{cat}`")
    schemas = [r.get("databaseName", r.get("schema_name", r.get("namespace", ""))) for r in rows]
    schemas = [s for s in schemas if s and s not in ("information_schema", "default")]
    return {"schemas": sorted(schemas), "default": DEFAULT_SCHEMA}


@router.get("/tables")
async def list_tables(catalog: str = Query(...), schema: str = Query(...)):
    """List tables in a schema."""
    cat = validate_identifier(catalog, "catalog")
    sch = validate_identifier(schema, "schema")
    rows = execute_sql(
        f"SELECT table_name, table_type, comment "
        f"FROM `{cat}`.information_schema.tables "
        f"WHERE table_schema = '{sch}' "
        f"ORDER BY table_name"
    )
    return {"tables": rows}
