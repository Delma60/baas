# sdk/python/src/yourbaas/client.py
"""
YourBaaS Python SDK — BaasClient

Async client (recommended):
    from baas import BaasClient

    baas = BaasClient(project_id="proj_abc123", api_key="sk_anon_...")
    result = await baas.db("posts").select("id, title").execute()
    await baas.destroy()

Sync wrapper (scripts / notebooks):
    from baas import BaasClientSync

    baas = BaasClientSync(project_id="proj_abc123", api_key="sk_anon_...")
    result = baas.db("posts").select("id, title").execute_sync()
"""
from __future__ import annotations

import asyncio
import os
from typing import Any

from baas.modules.auth import AuthModule
from baas.modules.database import DatabaseModule
from baas.modules.functions import FunctionsModule
from baas.modules.kv import KVModule
from baas.modules.nosql import NoSQLModule
from baas.modules.realtime import RealtimeModule
from baas.modules.storage import StorageModule
from baas.utils.http import HttpClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

_DEFAULT_BASE_URL = os.getenv("BAAS_BASE_URL", "https://api.yourbaas.com")


class BaasClient:
    """
    Async YourBaaS client. All module methods are coroutines.

    Args:
        project_id: Your project's ID (e.g. 'proj_abc123').
        api_key: Your project's API key (anon or service role).
        base_url: FastAPI base URL. Defaults to the production endpoint.

    Usage:
        baas = BaasClient(project_id="proj_abc123", api_key="sk_anon_...")

        # SQL database
        result = await baas.db("posts").select("*").limit(10).execute()

        # NoSQL
        docs = await baas.nosql("articles").find({"status": "published"}).execute()

        # Key-Value
        await baas.kv.set("user:theme", "dark")
        theme = await baas.kv.get("user:theme")

        # Storage
        upload = await baas.storage("avatars").upload(filename="photo.jpg", content_type="image/jpeg")

        # Auth
        session = await baas.auth.sign_in(email="user@example.com", password="pass")

        # Edge functions
        result = await baas.functions("my-function").with_({"key": "value"}).call()

        # Cleanup
        await baas.destroy()
    """

    def __init__(
        self,
        *,
        project_id: str,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
    ) -> None:
        self.project_id = project_id
        self._api_key = api_key
        self._base_url = base_url

        self._http = HttpClient(base_url=base_url, api_key=api_key)

        # Module instances
        self.auth = AuthModule(self._http, project_id)
        self.db = DatabaseModule(self._http, project_id)
        self.nosql = NoSQLModule(self._http, project_id)
        self.kv = KVModule(self._http, project_id)
        self.storage = StorageModule(self._http, project_id)
        self.functions = FunctionsModule(self._http, project_id)
        self.realtime = RealtimeModule(self._http, project_id, base_url, api_key)

    async def destroy(self) -> None:
        """Close the underlying HTTP client and disconnect realtime."""
        await self.realtime.disconnect()
        await self._http.aclose()

    async def __aenter__(self) -> "BaasClient":
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.destroy()


# ── Sync wrapper ──────────────────────────────────────────────────────────────

class _SyncQueryBuilderWrapper:
    """Wraps an async QueryBuilder for synchronous use."""

    def __init__(self, builder: Any) -> None:
        self._builder = builder

    def select(self, columns: str) -> "_SyncQueryBuilderWrapper":
        self._builder.select(columns)
        return self

    def filter(self, column: str, operator: str, value: Any) -> "_SyncQueryBuilderWrapper":
        self._builder.filter(column, operator, value)
        return self

    def order(self, column: str, direction: str = "asc") -> "_SyncQueryBuilderWrapper":
        self._builder.order(column, direction)
        return self

    def limit(self, n: int) -> "_SyncQueryBuilderWrapper":
        self._builder.limit(n)
        return self

    def offset(self, n: int) -> "_SyncQueryBuilderWrapper":
        self._builder.offset(n)
        return self

    def execute(self) -> Any:
        return asyncio.run(self._builder.execute())

    def get(self, row_id: str, **kwargs: Any) -> Any:
        return asyncio.run(self._builder.get(row_id, **kwargs))

    def insert(self, data: Any) -> Any:
        return asyncio.run(self._builder.insert(data))

    def update(self, row_id: str, data: Any) -> Any:
        return asyncio.run(self._builder.update(row_id, data))

    def delete(self, row_id: str) -> Any:
        return asyncio.run(self._builder.delete(row_id))


class _SyncModuleProxy:
    """Generic sync proxy that wraps async module methods with asyncio.run."""

    def __init__(self, module: Any) -> None:
        self._module = module

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        result = self._module(*args, **kwargs)
        # If the module's __call__ returns a builder, wrap it
        if hasattr(result, "execute") and asyncio.iscoroutinefunction(result.execute):
            return _SyncBuilderProxy(result)
        return result

    def __getattr__(self, name: str) -> Any:
        attr = getattr(self._module, name)
        if asyncio.iscoroutinefunction(attr):
            def sync_method(*args: Any, **kwargs: Any) -> Any:
                return asyncio.run(attr(*args, **kwargs))
            return sync_method
        return attr


class _SyncBuilderProxy:
    """Proxies any builder object, making async methods synchronous."""

    def __init__(self, builder: Any) -> None:
        object.__setattr__(self, "_builder", builder)

    def __getattr__(self, name: str) -> Any:
        attr = getattr(object.__getattribute__(self, "_builder"), name)
        if asyncio.iscoroutinefunction(attr):
            def sync_method(*args: Any, **kwargs: Any) -> Any:
                return asyncio.run(attr(*args, **kwargs))
            return sync_method
        # Chain method — wrap returned builder
        if callable(attr):
            def chain_method(*args: Any, **kwargs: Any) -> Any:
                result = attr(*args, **kwargs)
                if result is object.__getattribute__(self, "_builder"):
                    return self
                return result
            return chain_method
        return attr


class BaasClientSync:
    """
    Synchronous YourBaaS client — wraps every async method with asyncio.run().
    Intended for scripts, Jupyter notebooks, and one-off operations.

    For production async applications use BaasClient instead.

    Usage:
        from baas import BaasClientSync

        baas = BaasClientSync(project_id="proj_abc123", api_key="sk_anon_...")

        result = baas.db("posts").select("*").execute()
        value = baas.kv.get("my-key")
        session = baas.auth.sign_in(email="...", password="...")
    """

    def __init__(
        self,
        *,
        project_id: str,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
    ) -> None:
        self._async_client = BaasClient(
            project_id=project_id,
            api_key=api_key,
            base_url=base_url,
        )
        self.project_id = project_id

        # Wrap each module
        self.auth = _SyncModuleProxy(self._async_client.auth)
        self.db = _SyncModuleProxy(self._async_client.db)
        self.nosql = _SyncModuleProxy(self._async_client.nosql)
        self.kv = _SyncModuleProxy(self._async_client.kv)
        self.storage = _SyncModuleProxy(self._async_client.storage)
        self.functions = _SyncModuleProxy(self._async_client.functions)

    def destroy(self) -> None:
        asyncio.run(self._async_client.destroy())
