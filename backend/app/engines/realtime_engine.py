import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def similarity_search(
    session: AsyncSession,
    schema: str,
    table: str,
    embedding: list[float],
    *,
    top_k: int = 10,
    threshold: float | None = None,
    extra_filter: str | None = None,
) -> list[dict[str, Any]]:
    """
    Perform cosine similarity search using pgvector.
    The table must have an 'embedding' column of type vector.
    """
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"

    where = "TRUE"
    if threshold is not None:
        where = f"1 - (embedding <=> '{vector_str}'::vector) >= {threshold}"
    if extra_filter:
        where += f" AND ({extra_filter})"

    query = f"""
        SELECT *, 1 - (embedding <=> '{vector_str}'::vector) as similarity
        FROM "{schema}"."{table}"
        WHERE {where}
        ORDER BY embedding <=> '{vector_str}'::vector
        LIMIT :top_k
    """

    result = await session.execute(text(query), {"top_k": top_k})
    return [dict(r._mapping) for r in result]


async def upsert_embedding(
    session: AsyncSession,
    schema: str,
    table: str,
    record_id: Any,
    embedding: list[float],
    metadata: dict[str, Any] | None = None,
) -> None:
    """Insert or update an embedding record."""
    vector_str = "[" + ",".join(str(x) for x in embedding) + "]"

    meta_cols = ""
    meta_vals = ""
    meta_update = ""
    params: dict[str, Any] = {"record_id": record_id, "embedding": vector_str}

    if metadata:
        for k, v in metadata.items():
            col = k.replace(" ", "_")
            meta_cols += f', "{col}"'
            meta_vals += f", :{col}"
            meta_update += f', "{col}" = EXCLUDED."{col}"'
            params[col] = v

    query = f"""
        INSERT INTO "{schema}"."{table}" (id, embedding{meta_cols})
        VALUES (:record_id, :embedding::vector{meta_vals})
        ON CONFLICT (id) DO UPDATE
        SET embedding = EXCLUDED.embedding{meta_update}
    """
    await session.execute(text(query), params)