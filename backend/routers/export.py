"""Server-side DBML export from ERD data."""

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from backend.models import ERDResponse

router = APIRouter()


def generate_dbml(data: ERDResponse) -> str:
    """Generate DBML text from ERD response data."""
    lines = [f"// Generated from {data.catalog}.{data.schema_name}", ""]

    for table in data.tables:
        lines.append(f"Table {table.name} {{")
        for col in table.columns:
            attrs = []
            if col.is_pk:
                attrs.append("pk")
            if not col.is_nullable:
                attrs.append("not null")
            if col.comment:
                safe_comment = col.comment.replace("'", "\\'")
                attrs.append(f"note: '{safe_comment}'")
            attr_str = f" [{', '.join(attrs)}]" if attrs else ""
            lines.append(f"  {col.name} {col.data_type}{attr_str}")
        lines.append("}")
        lines.append("")

    # Relationships
    for rel in data.relationships:
        for fk_col, pk_col in zip(rel.fk_columns, rel.pk_columns):
            lines.append(f"Ref: {rel.fk_table}.{fk_col} > {rel.pk_table}.{pk_col}")

    return "\n".join(lines)


@router.post("/dbml", response_class=PlainTextResponse)
async def export_dbml(data: ERDResponse):
    """Generate DBML from ERD data."""
    dbml = generate_dbml(data)
    return PlainTextResponse(
        content=dbml,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=erd-{data.catalog}-{data.schema_name}.dbml"},
    )
