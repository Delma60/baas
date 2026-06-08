# sdk/python/src/yourbaas/types/filters.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

# ── SQL query filters ─────────────────────────────────────────────────────────

FilterOperator = Literal["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]


@dataclass
class QueryFilter:
    column: str
    operator: FilterOperator
    value: Any

    def to_param(self) -> str:
        """Serialize to the ?filter= query param format: col:op:value"""
        return f"{self.column}:{self.operator}:{self.value}"


# ── NoSQL filters ─────────────────────────────────────────────────────────────

# NoSQL filters are plain MongoDB-style dicts — no wrapper needed.
# Type alias for documentation purposes.
NoSQLFilter = dict[str, Any]

# ── KV options ────────────────────────────────────────────────────────────────


@dataclass
class KVSetOptions:
    ttl: int | None = None  # TTL in seconds; None = no expiry


@dataclass
class KVBatchOperation:
    op: Literal["get", "set", "delete"]
    key: str
    value: Any = None
    ttl: int | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {"op": self.op, "key": self.key}
        if self.value is not None:
            d["value"] = self.value
        if self.ttl is not None:
            d["ttl"] = self.ttl
        return d


# ── Storage options ───────────────────────────────────────────────────────────


@dataclass
class StorageUploadOptions:
    filename: str
    content_type: str
    expires_in: int = 3600


# ── Realtime options ──────────────────────────────────────────────────────────


@dataclass
class RealtimeOptions:
    event_types: list[str] = field(default_factory=lambda: ["INSERT", "UPDATE", "DELETE"])


# ── Function invoke options ───────────────────────────────────────────────────


@dataclass
class FunctionInvokeOptions:
    payload: dict[str, Any] = field(default_factory=dict)
    headers: dict[str, str] = field(default_factory=dict)
