"""Main ERD endpoint — queries information_schema for PK/FK constraints."""

import time
import logging
from collections import defaultdict

from fastapi import APIRouter, Query

from backend.database import execute_sql, validate_identifier
from backend.models import ERDResponse, TableInfo, ColumnInfo, Relationship

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/erd", response_model=ERDResponse)
async def get_erd(catalog: str = Query(...), schema: str = Query(...)):
    """Get full ERD data for a catalog.schema — tables, columns, constraints, relationships."""
    cat = validate_identifier(catalog, "catalog")
    sch = validate_identifier(schema, "schema")

    start = time.time()

    # Query 1: Tables
    tables_raw = execute_sql(
        f"SELECT table_name, table_type, comment "
        f"FROM `{cat}`.information_schema.tables "
        f"WHERE table_schema = '{sch}' "
        f"AND table_type IN ('MANAGED', 'EXTERNAL', 'VIEW', 'MANAGED_SHALLOW_CLONE', 'MATERIALIZED_VIEW') "
        f"ORDER BY table_name"
    )

    # Query 2: Columns
    columns_raw = execute_sql(
        f"SELECT table_name, column_name, ordinal_position, full_data_type, "
        f"is_nullable, comment "
        f"FROM `{cat}`.information_schema.columns "
        f"WHERE table_schema = '{sch}' "
        f"ORDER BY table_name, ordinal_position"
    )

    # Query 3: Constraints + key columns (PK and FK identification)
    constraints_raw = execute_sql(
        f"SELECT tc.table_name, tc.constraint_name, tc.constraint_type, "
        f"kcu.column_name, kcu.ordinal_position "
        f"FROM `{cat}`.information_schema.table_constraints tc "
        f"JOIN `{cat}`.information_schema.key_column_usage kcu "
        f"ON tc.constraint_catalog = kcu.constraint_catalog "
        f"AND tc.constraint_schema = kcu.constraint_schema "
        f"AND tc.constraint_name = kcu.constraint_name "
        f"WHERE tc.table_schema = '{sch}' "
        f"AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY') "
        f"ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position"
    )

    # Query 4: FK relationships (the edges)
    # Join FK key_column_usage with PK key_column_usage via referential_constraints,
    # matching on ordinal_position to correctly pair composite key columns.
    relationships_raw = execute_sql(
        f"SELECT DISTINCT rc.constraint_name, "
        f"kcu_fk.table_schema AS fk_schema, kcu_fk.table_name AS fk_table, kcu_fk.column_name AS fk_column, "
        f"kcu_pk.table_schema AS pk_schema, kcu_pk.table_name AS pk_table, kcu_pk.column_name AS pk_column, "
        f"kcu_fk.ordinal_position "
        f"FROM `{cat}`.information_schema.referential_constraints rc "
        f"JOIN `{cat}`.information_schema.key_column_usage kcu_fk "
        f"ON rc.constraint_catalog = kcu_fk.constraint_catalog "
        f"AND rc.constraint_schema = kcu_fk.constraint_schema "
        f"AND rc.constraint_name = kcu_fk.constraint_name "
        f"JOIN `{cat}`.information_schema.key_column_usage kcu_pk "
        f"ON rc.unique_constraint_catalog = kcu_pk.constraint_catalog "
        f"AND rc.unique_constraint_schema = kcu_pk.constraint_schema "
        f"AND rc.unique_constraint_name = kcu_pk.constraint_name "
        f"AND kcu_fk.ordinal_position = kcu_pk.ordinal_position "
        f"WHERE kcu_fk.table_schema = '{sch}' OR kcu_pk.table_schema = '{sch}' "
        f"ORDER BY rc.constraint_name, kcu_fk.ordinal_position"
    )

    elapsed_ms = int((time.time() - start) * 1000)

    # ── Assemble response ──

    # Build PK/FK column sets
    pk_columns: dict[str, set[str]] = defaultdict(set)  # table -> {col, col, ...}
    fk_columns: dict[str, set[str]] = defaultdict(set)
    constrained_tables: set[str] = set()

    for c in constraints_raw:
        table = c["table_name"]
        col = c["column_name"]
        ctype = c["constraint_type"]
        constrained_tables.add(table)
        if ctype == "PRIMARY KEY":
            pk_columns[table].add(col)
        elif ctype == "FOREIGN KEY":
            fk_columns[table].add(col)

    # Build FK target map: (fk_table, fk_column) -> "pk_schema.pk_table.pk_column"
    fk_targets: dict[tuple[str, str], str] = {}
    seen_rel_cols: set[tuple[str, str, str]] = set()  # dedupe (constraint, fk_col, pk_col)
    deduped_relationships: list[dict] = []
    for r in relationships_raw:
        key = (r["constraint_name"], r["fk_column"], r["pk_column"])
        if key not in seen_rel_cols:
            seen_rel_cols.add(key)
            deduped_relationships.append(r)
            fk_targets[(r["fk_table"], r["fk_column"])] = f"{r['pk_schema']}.{r['pk_table']}.{r['pk_column']}"
    relationships_raw = deduped_relationships

    # Group columns by table
    columns_by_table: dict[str, list[ColumnInfo]] = defaultdict(list)
    for col in columns_raw:
        table = col["table_name"]
        col_name = col["column_name"]
        columns_by_table[table].append(ColumnInfo(
            name=col_name,
            data_type=col.get("full_data_type", "STRING"),
            is_nullable=col.get("is_nullable", "YES") == "YES",
            is_pk=col_name in pk_columns.get(table, set()),
            is_fk=col_name in fk_columns.get(table, set()),
            comment=col.get("comment"),
            fk_target=fk_targets.get((table, col_name)),
        ))

    # Build tables
    tables = []
    for t in tables_raw:
        name = t["table_name"]
        tables.append(TableInfo(
            name=name,
            schema_name=sch,
            table_type=t.get("table_type", "MANAGED"),
            comment=t.get("comment"),
            columns=columns_by_table.get(name, []),
            has_constraints=name in constrained_tables,
        ))

    # Build relationships (group multi-column FKs)
    rel_map: dict[str, Relationship] = {}
    for r in relationships_raw:
        cname = r["constraint_name"]
        if cname not in rel_map:
            rel_map[cname] = Relationship(
                name=cname,
                fk_schema=r["fk_schema"],
                fk_table=r["fk_table"],
                fk_columns=[r["fk_column"]],
                pk_schema=r["pk_schema"],
                pk_table=r["pk_table"],
                pk_columns=[r["pk_column"]],
            )
        else:
            rel_map[cname].fk_columns.append(r["fk_column"])
            rel_map[cname].pk_columns.append(r["pk_column"])

    logger.info(f"ERD for {cat}.{sch}: {len(tables)} tables, {len(rel_map)} relationships in {elapsed_ms}ms")

    return ERDResponse(
        catalog=cat,
        schema_name=sch,
        tables=tables,
        relationships=list(rel_map.values()),
        query_time_ms=elapsed_ms,
    )
