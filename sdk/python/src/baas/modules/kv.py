# sdk/python/src/yourbaas/modules/kv.py
from __future__ import annotations

from typing import Any

from baas.types import KVEntry
from baas.types.filters import KVBatchOperation, KVSetOptions
from baas.utils.http import HttpClient


class KVModule:
    """
    Key-value store backed by MongoDB's _kv collection.

    Usage:
        await baas.kv.set("user:theme", "dark")
        value = await baas.kv.get("user:theme")
        await baas.kv.delete("user:theme")
        entries = await baas.kv.list(prefix="user:")
        results = await baas.kv.batch([
            KVBatchOperation(op="set", key="a", value=1),
            KVBatchOperation(op="get", key="b"),
        ])
    """

    def __init__(self, http: HttpClient, project_id: str) -> None:
        self._http = http
        self._project_id = project_id

    def _base(self) -> str:
        return f"/v1/nosql/{self._project_id}/kv"

    async def get(self, key: str) -> Any:
        """Get a value by key. Returns None if the key does not exist."""
        from baas.utils.errors import BaasError
        try:
            result = await self._http.get(f"{self._base()}/{key}")
            if isinstance(result, dict):
                return result.get("value")
            return result
        except BaasError as e:
            if e.status == 404:
                return None
            raise

    async def set(self, key: str, value: Any, *, ttl: int | None = None) -> KVEntry:
        """
        Set a value. Optional ttl in seconds.
        Returns the stored KVEntry.
        """
        body: dict[str, Any] = {"value": value}
        if ttl is not None:
            body["ttl"] = ttl
        result = await self._http.put(f"{self._base()}/{key}", json_body=body)
        if isinstance(result, dict):
            return KVEntry(
                key=result.get("key", key),
                value=result.get("value", value),
            )
        return KVEntry(key=key, value=value)

    async def delete(self, key: str) -> bool:
        """Delete a key. Returns True if the key existed."""
        from baas.utils.errors import BaasError
        try:
            result = await self._http.delete(f"{self._base()}/{key}")
            if isinstance(result, dict):
                return result.get("deleted", False)
            return True
        except BaasError as e:
            if e.status == 404:
                return False
            raise

    async def list(
        self,
        *,
        prefix: str | None = None,
        limit: int = 100,
    ) -> list[KVEntry]:
        """
        List key-value entries. Optional prefix filter.
        """
        params: dict[str, Any] = {"limit": limit}
        if prefix:
            params["prefix"] = prefix

        result = await self._http.get(self._base(), params=params)
        items = result if isinstance(result, list) else []
        return [
            KVEntry(
                key=item.get("key", ""),
                value=item.get("value"),
                expires_at=item.get("expires_at"),
            )
            for item in items
        ]

    async def batch(self, operations: list[KVBatchOperation]) -> list[dict[str, Any]]:
        """
        Execute multiple get/set/delete operations in a single request.

        Example:
            from baas.types.filters import KVBatchOperation
            results = await baas.kv.batch([
                KVBatchOperation(op="set", key="counter", value=1),
                KVBatchOperation(op="get", key="theme"),
                KVBatchOperation(op="delete", key="old_key"),
            ])
        """
        payload = [op.to_dict() for op in operations]
        result = await self._http.post(
            f"/v1/nosql/{self._project_id}/kv/batch",
            json_body={"operations": payload},
        )
        return result if isinstance(result, list) else []
