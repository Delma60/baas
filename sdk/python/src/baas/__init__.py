# sdk/python/src/yourbaas/__init__.py
"""
YourBaaS Python SDK

Quick start:
    from baas import BaasClient

    async def main():
        async with BaasClient(project_id="proj_abc123", api_key="sk_anon_...") as baas:
            # SQL database
            result = await baas.db("posts").select("id, title").limit(10).execute()
            print(result.data)

            # NoSQL
            docs = await baas.nosql("articles").find({"status": "published"}).execute()

            # KV store
            await baas.kv.set("user:theme", "dark")
            theme = await baas.kv.get("user:theme")

            # Storage
            upload = await baas.storage("avatars").upload(
                filename="photo.jpg",
                content_type="image/jpeg",
            )

            # Auth
            session = await baas.auth.sign_in(email="...", password="...")

            # Edge functions
            result = await baas.functions("my-fn").with_({"key": "value"}).call()

Sync usage (scripts/notebooks):
    from baas import BaasClientSync

    baas = BaasClientSync(project_id="proj_abc123", api_key="sk_anon_...")
    result = baas.db("posts").select("*").execute()
    baas.destroy()
"""

from baas.client import BaasClient, BaasClientSync
from baas.utils.errors import BaasError
from baas.types import (
    AuthSession,
    AuthUser,
    FileMeta,
    FunctionResult,
    KVEntry,
    ListResult,
    NoSQLListResult,
    PresignedUpload,
    RealtimeEvent,
)
from baas.types.filters import (
    KVBatchOperation,
    KVSetOptions,
    QueryFilter,
    RealtimeOptions,
    StorageUploadOptions,
)

__version__ = "0.1.0"

__all__ = [
    # Clients
    "BaasClient",
    "BaasClientSync",
    # Errors
    "BaasError",
    # Types
    "AuthSession",
    "AuthUser",
    "FileMeta",
    "FunctionResult",
    "KVEntry",
    "ListResult",
    "NoSQLListResult",
    "PresignedUpload",
    "RealtimeEvent",
    # Filter / option types
    "KVBatchOperation",
    "KVSetOptions",
    "QueryFilter",
    "RealtimeOptions",
    "StorageUploadOptions",
]
