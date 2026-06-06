# backend/app/api/internal/sql_browse.py
"""
Internal-only endpoints for the dashboard to browse SQL (PostgreSQL) data.
NOT exposed via /v1/ — only callable from Next.js with X-Internal-Secret.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.postgres import get_db

router = APIRouter(tags=["Internal SQL Browse"])
logger = logging.getLogger(__name__)


async def require_internal(x_internal_secret: str = Header(...)) -> None:
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")


InternalGuard = Depends(require_internal)


@router.get("/projects/{project_id}/sql/tables", dependencies=[InternalGuard])
async def list_tables(
    project_id: str,
    db_schema: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    List all user-created tables in the project's PostgreSQL schema,
    along with approximate row counts.
    """
    result = await db.execute(
        text("""
            SELECT
                t.table_name,
                COALESCE(s.n_live_tup, 0)::bigint AS row_count
            FROM information_schema.tables t
            LEFT JOIN pg_stat_user_tables s
                ON s.schemaname = t.table_schema
                AND s.relname = t.table_name
            WHERE t.table_schema = :schema
              AND t.table_type = 'BASE TABLE'
              AND t.table_name NOT LIKE '\_%'  -- exclude reserved tables like _auth_users
            ORDER BY t.table_name
        """),
        {"schema": db_schema},
    )
    tables = [{"name": row["table_name"], "rows": row["row_count"]} for row in result.mappings()]
    return {"data": {"tables": tables}}


@router.get("/projects/{project_id}/sql/tables/{table}/columns", dependencies=[InternalGuard])
async def list_columns(
    project_id: str,
    table: str,
    db_schema: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """List columns for a specific table."""
    # Validate identifiers
    if not table.replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid table name")
    if not db_schema.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid schema name")

    result = await db.execute(
        text("""
            SELECT
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = :schema
              AND table_name = :table
            ORDER BY ordinal_position
        """),
        {"schema": db_schema, "table": table},
    )
    columns = [dict(row) for row in result.mappings()]
    return {"data": {"columns": columns}}


@router.get("/projects/{project_id}/sql/tables/{table}/rows", dependencies=[InternalGuard])
async def list_rows(
    project_id: str,
    table: str,
    db_schema: str = Query(...),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    order_col: str | None = Query(default=None),
    order_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Fetch rows from a table — dashboard use only."""
    # Validate identifiers
    if not table.replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid table name")
    if not db_schema.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid schema name")
    if order_col and not order_col.replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid order column")

    order_clause = ""
    if order_col:
        order_clause = f'ORDER BY "{order_col}" {order_dir.upper()}'
    else:
        # Default: order by created_at if it exists, else id
        order_clause = "ORDER BY created_at DESC NULLS LAST"

    rows_result = await db.execute(
        text(f'SELECT * FROM "{db_schema}"."{table}" {order_clause} LIMIT :limit OFFSET :offset'),
        {"limit": limit, "offset": offset},
    )
    count_result = await db.execute(
        text(f'SELECT COUNT(*) FROM "{db_schema}"."{table}"'),
    )

    rows = [dict(r._mapping) for r in rows_result]
    # Serialize non-JSON-serializable types
    serialized = []
    for row in rows:
        clean = {}
        for k, v in row.items():
            if hasattr(v, "isoformat"):
                clean[k] = v.isoformat()
            elif isinstance(v, bytes):
                clean[k] = v.hex()
            else:
                clean[k] = v
        serialized.append(clean)

    total = count_result.scalar() or 0
    return {"data": {"rows": serialized, "total": total, "limit": limit, "offset": offset}}


class RunQueryRequest(BaseModel):
    query: str
    db_schema: str


@router.post("/projects/{project_id}/sql/query", dependencies=[InternalGuard])
async def run_query(
    project_id: str,
    body: RunQueryRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Execute a read-only SQL query in the project's schema.
    Only SELECT statements are permitted.
    """
    query = body.query.strip()
    if not query.upper().startswith("SELECT"):
        raise HTTPException(
            status_code=400,
            detail="Only SELECT queries are permitted from the dashboard.",
        )

    db_schema = body.db_schema
    if not db_schema.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid schema name")

    try:
        # Set the search_path so unqualified table names resolve to the project schema
        await db.execute(text(f'SET LOCAL search_path TO "{db_schema}", public'))
        result = await db.execute(text(query))
        rows = [dict(r._mapping) for r in result]

        # Serialize
        serialized = []
        for row in rows:
            clean = {}
            for k, v in row.items():
                if hasattr(v, "isoformat"):
                    clean[k] = v.isoformat()
                elif isinstance(v, bytes):
                    clean[k] = v.hex()
                else:
                    clean[k] = v
            serialized.append(clean)

        return {"data": {"rows": serialized, "total": len(serialized)}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))