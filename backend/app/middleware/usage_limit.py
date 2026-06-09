# backend/app/middleware/usage_limit.py
"""
Usage limit enforcement middleware.

Called as a FastAPI dependency on all /v1/* SDK routes.
Reads the project's current 30-day usage from Redis cache (written by
the Celery usage_sync task) and compares against the org's plan limits.

Fast path: Redis cache hit → single HGETALL, no DB.
Slow path: cache miss → DB query, result cached for 5 min.
"""
import json
import logging
from typing import Any

from fastapi import HTTPException, Request
from sqlalchemy import text

from app.db.redis import get_redis

logger = logging.getLogger(__name__)

# Cache TTL for usage + plan data
USAGE_CACHE_TTL = 300  # 5 minutes

# Map API route prefix → usage metric being consumed
METRIC_MAP: dict[str, str] = {
    "/v1/db": "db_reads",       # default; writes handled separately
    "/v1/nosql": "nosql_reads",
    "/v1/storage": "storage_bytes",
    "/v1/functions": "function_calls",
    "/v1/ai": "ai_requests",
}


def _get_metric_for_request(path: str, method: str) -> str | None:
    """Map an HTTP path + method to a usage metric."""
    if path.startswith("/v1/db"):
        return "db_writes" if method in ("POST", "PATCH", "DELETE") else "db_reads"
    if path.startswith("/v1/nosql"):
        return "nosql_writes" if method in ("POST", "PATCH", "DELETE", "PUT") else "nosql_reads"
    if path.startswith("/v1/storage"):
        return "storage_bytes"
    if path.startswith("/v1/functions"):
        return "function_calls"
    if path.startswith("/v1/ai"):
        return "ai_requests"
    return None


async def _fetch_plan_limits(project_id: str) -> dict[str, Any]:
    """
    Fetch plan limits for the project's org.
    Returns a dict with metric → limit (None = unlimited).
    """
    from app.db.postgres import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("""
                SELECT pl.sql_rows, pl.nosql_docs, pl.storage_bytes,
                       pl.function_calls, pl.ai_requests
                FROM plan_limits pl
                JOIN organizations o ON o.plan = pl.plan
                JOIN projects p ON p.organization_id = o.id
                WHERE p.id = :project_id
            """),
            {"project_id": project_id},
        )
        row = result.mappings().first()
        if not row:
            return {}
        return {
            "db_reads": row["sql_rows"],
            "db_writes": row["sql_rows"],
            "nosql_reads": row["nosql_docs"],
            "nosql_writes": row["nosql_docs"],
            "storage_bytes": row["storage_bytes"],
            "function_calls": row["function_calls"],
            "ai_requests": row["ai_requests"],
        }


async def _fetch_usage(project_id: str) -> dict[str, int]:
    """
    Fetch 30-day rolling usage for a project.
    Tries Redis aggregate cache first.
    """
    redis = await get_redis()
    cache_key = f"usage_limit:{project_id}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    from app.db.postgres import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("""
                SELECT metric, SUM(value)::bigint AS total
                FROM usage_records
                WHERE project_id = :project_id
                  AND period_start >= NOW() - INTERVAL '30 days'
                GROUP BY metric
            """),
            {"project_id": project_id},
        )
        rows = {r["metric"]: int(r["total"]) for r in result.mappings()}

    await redis.setex(cache_key, USAGE_CACHE_TTL, json.dumps(rows))
    return rows


async def check_usage_limits(request: Request) -> None:
    """
    FastAPI dependency — enforces plan usage limits.
    Raises HTTP 429 with a clear message if the project has exceeded its limit.
    """
    project_id = getattr(request.state, "project_id", None)
    if not project_id:
        return  # Not an authenticated SDK route

    metric = _get_metric_for_request(request.url.path, request.method)
    if not metric:
        return  # Route doesn't consume a metered resource

    try:
        limits = await _fetch_plan_limits(project_id)
        limit = limits.get(metric)

        if limit is None:
            return  # Unlimited on this plan

        usage = await _fetch_usage(project_id)
        current = usage.get(metric, 0)

        if current >= limit:
            # Format human-readable limit
            if limit >= 1_000_000:
                limit_str = f"{limit // 1_000_000}M"
            elif limit >= 1_000:
                limit_str = f"{limit // 1_000}K"
            else:
                limit_str = str(limit)

            raise HTTPException(
                status_code=429,
                detail={
                    "code": "USAGE_LIMIT_EXCEEDED",
                    "message": f"You have reached the {metric.replace('_', ' ')} limit for your plan ({limit_str}). Upgrade to continue.",
                    "metric": metric,
                    "limit": limit,
                    "current": current,
                    "upgrade_url": "https://yourbaas.com/billing",
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        # Never block a request due to a monitoring failure
        logger.warning("Usage limit check failed for project %s: %s", project_id, e)