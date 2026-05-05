"""WorkspaceClient singleton + SQL execution helper."""

import os
import re
import logging

from databricks.sdk import WorkspaceClient

logger = logging.getLogger(__name__)

WAREHOUSE_ID = os.getenv("DATABRICKS_WAREHOUSE_ID", "")

_client = None

# Only allow alphanumeric + underscore + hyphens + dots for catalog/schema/table names
_IDENTIFIER_RE = re.compile(r"^[a-zA-Z0-9_\-\.]+$")


def validate_identifier(name: str, label: str = "identifier") -> str:
    """Validate a SQL identifier to prevent injection."""
    if not name or not _IDENTIFIER_RE.match(name):
        raise ValueError(f"Invalid {label}: {name!r}")
    return name


def get_client() -> WorkspaceClient:
    global _client
    if _client is None:
        _client = WorkspaceClient()
    return _client


def execute_sql(sql: str) -> list[dict]:
    """Execute SQL via Statement Execution API and return list of dicts."""
    client = get_client()
    result = client.statement_execution.execute_statement(
        warehouse_id=WAREHOUSE_ID,
        statement=sql,
        wait_timeout="50s",
    )
    if result.status.state.value != "SUCCEEDED":
        err = result.status.error
        raise Exception(f"SQL failed: {err}")

    columns = [c.name for c in result.manifest.schema.columns]
    rows = []
    if result.result and result.result.data_array:
        for row in result.result.data_array:
            rows.append(dict(zip(columns, row)))
    return rows
