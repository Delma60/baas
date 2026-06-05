# backend/app/main.py
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await _bootstrap_superadmin()
    yield
    # Shutdown: close persistent connections
    from app.db.mongo import close_mongo_client
    from app.db.redis import close_redis
    await close_mongo_client()
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.node_env == "development" else None,
    redoc_url=None,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # /v1/* is API-key gated — CORS is permissive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
from app.api.v1.db.router import router as db_router
from app.api.v1.nosql.router import router as nosql_router
from app.api.v1.storage.router import router as storage_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.realtime.router import router as realtime_router
from app.api.v1.functions.router import router as functions_router
from app.api.v1.ai.router import router as ai_router
from app.api.internal.router import router as internal_router
from app.api.superadmin.router import router as superadmin_router

app.include_router(db_router, prefix="/v1")
app.include_router(nosql_router, prefix="/v1")
app.include_router(storage_router, prefix="/v1")
app.include_router(auth_router, prefix="/v1")
app.include_router(realtime_router, prefix="/v1")
app.include_router(functions_router, prefix="/v1")
app.include_router(ai_router, prefix="/v1")
app.include_router(internal_router, prefix="/internal")
app.include_router(superadmin_router, prefix="/superadmin")


async def _bootstrap_superadmin() -> None:
    """Create the initial super_admin if none exists."""
    from sqlalchemy import text
    from app.db.postgres import AsyncSessionLocal
    from app.auth.staff_auth import hash_staff_password
    import uuid

    if not settings.bootstrap_admin_email or not settings.bootstrap_admin_password:
        return

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id FROM staff WHERE role = 'super_admin' LIMIT 1")
        )
        if result.first():
            return  # Already bootstrapped

        await session.execute(
            text("""
                INSERT INTO staff (id, email, name, hashed_password, role, is_active)
                VALUES (:id, :email, :name, :pwd, 'super_admin', true)
                ON CONFLICT (email) DO NOTHING
            """),
            {
                "id": str(uuid.uuid4()),
                "email": settings.bootstrap_admin_email,
                "name": "Platform Admin",
                "pwd": hash_staff_password(settings.bootstrap_admin_password),
            },
        )
        await session.commit()
        logger.info("Bootstrapped super_admin: %s", settings.bootstrap_admin_email)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}