# backend/app/api/internal/settings_browse.py
"""
Internal-only endpoints for the project settings dashboard.
NOT exposed via /v1/ — only callable from Next.js with X-Internal-Secret.

Endpoints:
  GET  /projects/{id}/api-keys          — list all API keys for a project
  POST /projects/{id}/api-keys          — create a new API key
  DELETE /projects/{id}/api-keys/{kid}  — revoke an API key
  GET  /projects/{id}/settings          — get editable project settings
  PATCH /projects/{id}/settings         — update project name / description
"""
import hashlib
import logging
import secrets
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.postgres import get_db

router = APIRouter(tags=["Internal Settings"])
logger = logging.getLogger(__name__)


async def require_internal(x_internal_secret: str = Header(...)) -> None:
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")


InternalGuard = Depends(require_internal)


# ─── API Keys ─────────────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/api-keys", dependencies=[InternalGuard])
async def list_api_keys(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """List all API keys for a project (key hashes only — never raw keys)."""
    try:
        result = await db.execute(
            text("""
                SELECT id, project_id, key_type, label, is_active, created_at,
                       LEFT(key_hash, 8) AS key_prefix
                FROM api_keys
                WHERE project_id = :project_id
                ORDER BY created_at ASC
            """),
            {"project_id": project_id},
        )
        keys = []
        for row in result.mappings():
            r = dict(row)
            if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                r["created_at"] = r["created_at"].isoformat()
            keys.append(r)
        return {"data": {"keys": keys}}
    except Exception as e:
        logger.warning("Failed to list API keys for %s: %s", project_id, e)
        return {"data": {"keys": []}}


class CreateApiKeyRequest(BaseModel):
    key_type: str = Field(default="anon", pattern="^(anon|service)$")
    label: str | None = None


@router.post("/projects/{project_id}/api-keys", status_code=201, dependencies=[InternalGuard])
async def create_project_api_key(
    project_id: str,
    body: CreateApiKeyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Create a new API key for a project. Returns the raw key ONCE."""
    # Verify project exists
    exists = await db.execute(
        text("SELECT id FROM projects WHERE id = :pid"), {"pid": project_id}
    )
    if not exists.first():
        raise HTTPException(status_code=404, detail="Project not found")

    raw_key = f"sk_{body.key_type}_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_id = str(uuid.uuid4())
    label = body.label or f"{body.key_type} key"

    await db.execute(
        text("""
            INSERT INTO api_keys (id, project_id, key_hash, key_type, is_active, label)
            VALUES (:id, :project_id, :key_hash, :key_type, true, :label)
        """),
        {
            "id": key_id,
            "project_id": project_id,
            "key_hash": key_hash,
            "key_type": body.key_type,
            "label": label,
        },
    )
    await db.commit()

    return {
        "data": {
            "id": key_id,
            "key": raw_key,       # shown ONCE to user
            "key_type": body.key_type,
            "label": label,
            "is_active": True,
        }
    }


@router.delete("/projects/{project_id}/api-keys/{key_id}", dependencies=[InternalGuard])
async def revoke_project_api_key(
    project_id: str,
    key_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Revoke (soft-delete) an API key."""
    result = await db.execute(
        text("""
            UPDATE api_keys SET is_active = false
            WHERE id = :key_id AND project_id = :project_id
            RETURNING id
        """),
        {"key_id": key_id, "project_id": project_id},
    )
    if not result.first():
        raise HTTPException(status_code=404, detail="API key not found")
    await db.commit()

    # Bust Redis cache for this key
    try:
        from app.db.redis import get_redis
        redis = await get_redis()
        # We can't bust by key_id easily without the hash, so scan for it
        async for cache_key in redis.scan_iter("apikey:*"):
            cached = await redis.get(cache_key)
            if cached:
                import json
                data = json.loads(cached)
                if data.get("id") == key_id:
                    await redis.delete(cache_key)
                    break
    except Exception:
        pass

    return {"data": {"id": key_id, "revoked": True}}


# ─── Project Settings ─────────────────────────────────────────────────────────

@router.get("/projects/{project_id}/settings", dependencies=[InternalGuard])
async def get_project_settings(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get the editable settings for a project."""
    result = await db.execute(
        text("""
            SELECT p.id, p.name, p.slug, p.region, p.status,
                   p.db_schema, p.mongo_database, p.created_at,
                   o.id AS org_id, o.name AS org_name, o.plan AS org_plan,
                   o.owner_id
            FROM projects p
            LEFT JOIN organizations o ON o.id = p.organization_id
            WHERE p.id = :project_id
        """),
        {"project_id": project_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")

    r = dict(row)
    if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
        r["created_at"] = r["created_at"].isoformat()
    return {"data": r}


class UpdateProjectSettingsRequest(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=40)
    description: str | None = None


@router.patch("/projects/{project_id}/settings", dependencies=[InternalGuard])
async def update_project_settings(
    project_id: str,
    body: UpdateProjectSettingsRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Update editable project fields (name, description)."""
    updates: dict[str, Any] = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.description is not None:
        updates["description"] = body.description

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["project_id"] = project_id

    result = await db.execute(
        text(f"UPDATE projects SET {set_clause} WHERE id = :project_id RETURNING id, name"),
        updates,
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.commit()
    return {"data": dict(row)}


# ─── Members (org members who have access to this project) ────────────────────

@router.get("/projects/{project_id}/members", dependencies=[InternalGuard])
async def list_project_members(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    List members of the organization that owns this project.
    In the current architecture, all org members have access to all org projects.
    """
    try:
        result = await db.execute(
            text("""
                SELECT u.id, u.email, u.name, u.created_at,
                       CASE WHEN o.owner_id = u.id THEN 'owner' ELSE 'member' END AS role
                FROM projects p
                JOIN organizations o ON o.id = p.organization_id
                JOIN users u ON u.id = o.owner_id
                WHERE p.id = :project_id

                UNION

                SELECT u.id, u.email, u.name, u.created_at, 'member' AS role
                FROM projects p
                JOIN organizations o ON o.id = p.organization_id
                JOIN organization_members om ON om.organization_id = o.id
                JOIN users u ON u.id = om.user_id
                WHERE p.id = :project_id
                  AND u.id != o.owner_id

                ORDER BY role DESC, name
            """),
            {"project_id": project_id},
        )
        members = []
        for row in result.mappings():
            r = dict(row)
            if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                r["created_at"] = r["created_at"].isoformat()
            members.append(r)
        return {"data": {"members": members}}
    except Exception as e:
        logger.warning("Failed to list members: %s", e)
        # Fallback: just return owner
        result2 = await db.execute(
            text("""
                SELECT u.id, u.email, u.name, u.created_at, 'owner' AS role
                FROM projects p
                JOIN organizations o ON o.id = p.organization_id
                JOIN users u ON u.id = o.owner_id
                WHERE p.id = :project_id
            """),
            {"project_id": project_id},
        )
        members = []
        for row in result2.mappings():
            r = dict(row)
            if r.get("created_at") and hasattr(r["created_at"], "isoformat"):
                r["created_at"] = r["created_at"].isoformat()
            members.append(r)
        return {"data": {"members": members}}