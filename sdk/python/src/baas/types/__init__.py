# sdk/python/src/yourbaas/types/__init__.py
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal, Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

@dataclass
class AuthUser:
    id: str
    email: str
    name: str | None = None
    is_email_verified: bool = False
    created_at: str | None = None


@dataclass
class AuthSession:
    user: AuthUser
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


# ── SQL Database ──────────────────────────────────────────────────────────────

@dataclass
class ListResult:
    data: list[dict[str, Any]]
    count: int
    limit: int
    offset: int


# ── NoSQL ─────────────────────────────────────────────────────────────────────

@dataclass
class NoSQLListResult:
    data: list[dict[str, Any]]
    count: int
    limit: int
    skip: int


# ── KV ────────────────────────────────────────────────────────────────────────

@dataclass
class KVEntry:
    key: str
    value: Any
    expires_at: str | None = None


# ── Storage ───────────────────────────────────────────────────────────────────

@dataclass
class PresignedUpload:
    upload_url: str
    file_url: str
    key: str
    expires_in: int


@dataclass
class FileMeta:
    key: str
    size: int
    last_modified: str | None = None
    content_type: str | None = None
    etag: str | None = None
    url: str | None = None


# ── Edge Functions ────────────────────────────────────────────────────────────

@dataclass
class FunctionResult:
    status_code: int | None
    data: Any
    headers: dict[str, str] = field(default_factory=dict)


# ── Realtime ─────────────────────────────────────────────────────────────────

@dataclass
class RealtimeEvent:
    type: Literal["INSERT", "UPDATE", "DELETE"]
    record: dict[str, Any] | None = None
    old_record: dict[str, Any] | None = None
    table: str | None = None
    collection: str | None = None


# ── Unsubscribe callable ──────────────────────────────────────────────────────

UnsubscribeFn = Callable[[], None]

__all__ = [
    "AuthUser",
    "AuthSession",
    "ListResult",
    "NoSQLListResult",
    "KVEntry",
    "PresignedUpload",
    "FileMeta",
    "FunctionResult",
    "RealtimeEvent",
    "UnsubscribeFn",
]
