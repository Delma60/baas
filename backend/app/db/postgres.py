from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings
from sqlalchemy import text

engine = create_async_engine(
    settings.database_url,
    echo=settings.node_env == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def set_tenant_session(session: AsyncSession, schema: str) -> None:
    """Set per-transaction session-local search_path and optionally drop privileges
    to a restricted role using `SET LOCAL` so the transaction is confined to the
    tenant schema even if a higher-privilege user is used for the connection.
    """
    # Use SET LOCAL so the setting applies only for the current transaction.
    await session.execute(text(f'SET LOCAL search_path TO "{schema}", public'))
    if settings.db_enable_rls and settings.db_restricted_role:
        # Role names are identifiers; do not interpolate user-provided values unsafely.
        role = settings.db_restricted_role
        await session.execute(text(f'SET LOCAL ROLE "{role}"'))


async def set_tenant_connection(conn, schema: str) -> None:
    """Same as set_tenant_session but operates on a connection object from engine.connect()."""
    await conn.execute(text(f'SET LOCAL search_path TO "{schema}", public'))
    if settings.db_enable_rls and settings.db_restricted_role:
        role = settings.db_restricted_role
        await conn.execute(text(f'SET LOCAL ROLE "{role}"'))