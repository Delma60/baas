# backend/app/api/internal/router.py
import logging
import re
import secrets
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.postgres import get_db
from app.provisioner.sql_provisioner import (
    add_column,
    create_table,
    drop_column,
    drop_table,
    provision_project_schema,
    teardown_project_schema,
)
from app.provisioner.nosql_provisioner import (
    create_collection,
    drop_collection,
    provision_project_database,
    teardown_project_database,
)
from app.storage.minio import ensure_bucket_exists, get_bucket_name

router = APIRouter(tags=["Internal"])
logger = logging.getLogger(__name__)


# ─── Auth guard ───────────────────────────────────────────────────────────────

async def require_internal(x_internal_secret: str = Header(...)) -> None:
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")


InternalGuard = Depends(require_internal)


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9-]+", "-", value.lower())
    return cleaned.strip("-")[:50]


def generate_auth_jwt_secret() -> str:
    return secrets.token_urlsafe(32)


# ─── Project read helpers ─────────────────────────────────────────────────────

@router.get("/projects", dependencies=[InternalGuard])
async def list_projects(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    result = await db.execute(
        text("""
            SELECT p.id, p.name, p.status, p.region, p.db_schema,
                   p.mongo_database, p.created_at,
                   o.name AS organization_name
            FROM projects p
            LEFT JOIN organizations o ON o.id = p.organization_id
            ORDER BY p.created_at DESC
        """),
    )
    projects = [dict(r) for r in result.mappings()]
    return {"data": projects}


@router.get("/projects/{project_id}", dependencies=[InternalGuard])
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    result = await db.execute(
        text("""
            SELECT p.id, p.name, p.slug, p.status, p.region,
                   p.db_schema, p.mongo_database, p.created_at,
                   o.id AS organization_id, o.name AS organization_name
            FROM projects p
            LEFT JOIN organizations o ON o.id = p.organization_id
            WHERE p.id = :project_id
        """),
        {"project_id": project_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"data": dict(row)}


# ─── Platform Auth ────────────────────────────────────────────────────────────

class PlatformSignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str | None = None


class PlatformSignInRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/auth/signup", status_code=201, dependencies=[InternalGuard])
async def platform_signup(
    body: PlatformSignUpRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Register a new platform developer account.
    Creates a row in the public `users` table.
    """
    from app.auth.project_auth import hash_password

    existing = await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": body.email},
    )
    if existing.first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    hashed = hash_password(body.password)

    await db.execute(
        text("""
            INSERT INTO users (id, email, name, hashed_password, is_email_verified)
            VALUES (:id, :email, :name, :pwd, false)
        """),
        {
            "id": user_id,
            "email": body.email,
            "name": body.name or body.email.split("@")[0],
            "pwd": hashed,
        },
    )
    await db.commit()

    logger.info("Platform user registered: %s", body.email)
    return {
        "data": {
            "user": {
                "id": user_id,
                "email": body.email,
                "name": body.name or body.email.split("@")[0],
            }
        }
    }


@router.post("/auth/signin", dependencies=[InternalGuard])
async def platform_signin(
    body: PlatformSignInRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Authenticate a platform developer account.
    Returns user data; session management is handled by Auth.js on the Next.js side.
    """
    from app.auth.project_auth import verify_password

    result = await db.execute(
        text("""
            SELECT id, email, name, hashed_password, is_banned
            FROM users
            WHERE email = :email
        """),
        {"email": body.email},
    )
    row = result.mappings().first()

    # Deliberate constant-time path: check password even if user not found
    # (avoids timing-based user enumeration)
    if not row:
        # Still call verify to prevent timing attacks
        verify_password("dummy", "$2b$12$invalidhashplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(body.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if row["is_banned"]:
        raise HTTPException(status_code=403, detail="This account has been suspended")

    # Best-effort last_login_at update — don't let this fail the request
    try:
        await db.execute(
            text("UPDATE users SET last_login_at = NOW() WHERE id = :id"),
            {"id": row["id"]},
        )
        await db.commit()
    except Exception as e:
        logger.warning("Failed to update last_login_at for user %s: %s", row["id"], e)
        await db.rollback()

    return {
        "data": {
            "user": {
                "id": row["id"],
                "email": row["email"],
                "name": row["name"],
            }
        }
    }


# ─── Projects ─────────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    project_id: str
    name: str
    db_schema: str
    mongo_database: str
    region: str = Field(default="lagos")
    description: str | None = None


@router.post("/projects", status_code=201, dependencies=[InternalGuard])
async def create_project(
    body: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Provision all resources for a new project and persist its public record."""
    slug = slugify(body.name)
    jwt_secret = generate_auth_jwt_secret()

    existing = await db.execute(
        text(
            "SELECT id FROM projects WHERE id = :project_id OR slug = :slug OR db_schema = :db_schema OR mongo_database = :mongo_database"
        ),
        {
            "project_id": body.project_id,
            "slug": slug,
            "db_schema": body.db_schema,
            "mongo_database": body.mongo_database,
        },
    )
    if existing.first():
        raise HTTPException(status_code=409, detail="A project with this identifier already exists")

    try:
        await provision_project_schema(body.project_id, body.db_schema)
        await provision_project_database(body.project_id, body.mongo_database)

        await db.execute(
            text(
                """
                INSERT INTO projects (
                    id, organization_id, name, slug, region, status,
                    db_schema, mongo_database, auth_jwt_secret
                ) VALUES (
                    :id, NULL, :name, :slug, :region, 'active',
                    :db_schema, :mongo_database, :auth_jwt_secret
                )
                """
            ),
            {
                "id": body.project_id,
                "name": body.name,
                "slug": slug,
                "region": body.region,
                "db_schema": body.db_schema,
                "mongo_database": body.mongo_database,
                "auth_jwt_secret": jwt_secret,
            },
        )
        await db.commit()

        logger.info("Provisioned and saved project: %s", body.project_id)
        return {"data": {"project_id": body.project_id, "provisioned": True}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Infrastructure provisioning failed: {str(e)}")


@router.delete("/projects/{project_id}", dependencies=[InternalGuard])
async def delete_project(
    project_id: str,
    db_schema: str = Query(...),
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    """Teardown all resources for a project."""
    await teardown_project_schema(db_schema)
    await teardown_project_database(mongo_database)
    logger.info("Torn down project: %s", project_id)
    return {"data": {"project_id": project_id, "deleted": True}}


# ─── SQL Tables ───────────────────────────────────────────────────────────────

class CreateTableRequest(BaseModel):
    table: str
    columns: list[dict[str, Any]]
    enable_rls: bool = False
    enable_realtime: bool = False


@router.post("/projects/{project_id}/tables", status_code=201, dependencies=[InternalGuard])
async def create_sql_table(
    project_id: str,
    body: CreateTableRequest,
    db_schema: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await create_table(
        db, db_schema, body.table, body.columns,
        enable_rls=body.enable_rls,
        enable_realtime=body.enable_realtime,
    )
    await db.commit()
    return {"data": {"table": body.table, "created": True}}


@router.delete("/projects/{project_id}/tables/{table}", dependencies=[InternalGuard])
async def drop_sql_table(
    project_id: str,
    table: str,
    db_schema: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await drop_table(db, db_schema, table)
    await db.commit()
    return {"data": {"table": table, "dropped": True}}


class AddColumnRequest(BaseModel):
    column: dict[str, Any]


@router.post("/projects/{project_id}/tables/{table}/columns", status_code=201, dependencies=[InternalGuard])
async def add_table_column(
    project_id: str,
    table: str,
    body: AddColumnRequest,
    db_schema: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await add_column(db, db_schema, table, body.column)
    await db.commit()
    return {"data": {"column": body.column.get("name"), "added": True}}


@router.delete("/projects/{project_id}/tables/{table}/columns/{column}", dependencies=[InternalGuard])
async def drop_table_column(
    project_id: str,
    table: str,
    column: str,
    db_schema: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await drop_column(db, db_schema, table, column)
    await db.commit()
    return {"data": {"column": column, "dropped": True}}


# ─── NoSQL Collections ────────────────────────────────────────────────────────

class CreateCollectionRequest(BaseModel):
    collection: str
    indexes: list[dict[str, Any]] | None = None
    enable_change_stream: bool = False


@router.post("/projects/{project_id}/collections", status_code=201, dependencies=[InternalGuard])
async def create_nosql_collection(
    project_id: str,
    body: CreateCollectionRequest,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    await create_collection(
        mongo_database,
        body.collection,
        indexes=body.indexes,
        enable_change_stream=body.enable_change_stream,
    )
    return {"data": {"collection": body.collection, "created": True}}


@router.delete("/projects/{project_id}/collections/{collection}", dependencies=[InternalGuard])
async def drop_nosql_collection(
    project_id: str,
    collection: str,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    await drop_collection(mongo_database, collection)
    return {"data": {"collection": collection, "dropped": True}}


# ─── Storage Buckets ──────────────────────────────────────────────────────────

class CreateBucketRequest(BaseModel):
    bucket: str


@router.post("/projects/{project_id}/buckets", status_code=201, dependencies=[InternalGuard])
async def create_storage_bucket(
    project_id: str,
    body: CreateBucketRequest,
) -> dict[str, Any]:
    full_name = get_bucket_name(project_id, body.bucket)
    ensure_bucket_exists(full_name)
    return {"data": {"bucket": body.bucket, "full_name": full_name, "created": True}}


# ─── API Keys ─────────────────────────────────────────────────────────────────

class CreateApiKeyRequest(BaseModel):
    project_id: str
    key_type: str = Field(default="anon", pattern="^(anon|service)$")
    label: str | None = None


@router.post("/api-keys", status_code=201, dependencies=[InternalGuard])
async def create_api_key(
    body: CreateApiKeyRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    import hashlib
    import secrets

    raw_key = f"sk_{body.key_type}_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_id = str(uuid.uuid4())

    await db.execute(
        text("""
            INSERT INTO api_keys (id, project_id, key_hash, key_type, is_active, label)
            VALUES (:id, :project_id, :key_hash, :key_type, true, :label)
        """),
        {
            "id": key_id,
            "project_id": body.project_id,
            "key_hash": key_hash,
            "key_type": body.key_type,
            "label": body.label or f"{body.key_type} key",
        },
    )
    await db.commit()

    return {
        "data": {
            "id": key_id,
            "key": raw_key,  # Only returned once — client must store it
            "key_type": body.key_type,
            "project_id": body.project_id,
        }
    }


@router.delete("/api-keys/{key_id}", dependencies=[InternalGuard])
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    await db.execute(
        text("UPDATE api_keys SET is_active = false WHERE id = :id"),
        {"id": key_id},
    )
    await db.commit()
    return {"data": {"id": key_id, "revoked": True}}


# ─── Usage ────────────────────────────────────────────────────────────────────

@router.get("/usage/{project_id}", dependencies=[InternalGuard])
async def get_project_usage(
    project_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    result = await db.execute(
        text("""
            SELECT metric, SUM(value) as total
            FROM usage_records
            WHERE project_id = :project_id
              AND period_start >= NOW() - INTERVAL '30 days'
            GROUP BY metric
        """),
        {"project_id": project_id},
    )
    rows = {r["metric"]: r["total"] for r in result.mappings()}
    return {"data": rows}


# ─── Permissions ──────────────────────────────────────────────────────────────

class UpsertPermissionRequest(BaseModel):
    resource_name: str
    engine: str = Field(pattern="^(sql|nosql|kv)$")
    rules_json: str  # JSON string of rules array


@router.put("/projects/{project_id}/permissions", dependencies=[InternalGuard])
async def upsert_permissions(
    project_id: str,
    body: UpsertPermissionRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Create or replace permission rules for a resource."""
    await db.execute(
        text("""
            INSERT INTO resource_permissions (id, project_id, resource_name, engine, rules_json)
            VALUES (:id, :project_id, :resource_name, :engine, :rules_json)
            ON CONFLICT (project_id, resource_name, engine)
            DO UPDATE SET rules_json = EXCLUDED.rules_json
        """),
        {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "resource_name": body.resource_name,
            "engine": body.engine,
            "rules_json": body.rules_json,
        },
    )
    await db.commit()

    from app.db.redis import get_redis
    redis = await get_redis()
    await redis.delete(f"perms:{project_id}:{body.engine}:{body.resource_name}")

    return {"data": {"resource": body.resource_name, "updated": True}}