# sdk/python/src/yourbaas/modules/realtime.py
from __future__ import annotations

import logging
from typing import Any, Callable

from baas.types import RealtimeEvent, UnsubscribeFn
from baas.utils.errors import BaasError
from baas.utils.http import HttpClient

logger = logging.getLogger(__name__)


class RealtimeModule:
    """
    Subscribe to real-time database changes via Socket.io.

    Uses python-socketio's async client. The Socket.io server runs on the
    same base URL under the namespace /{project_id}.

    Usage:
        # SQL table changes
        unsub = baas.realtime.on("posts", lambda event: print(event))

        # NoSQL collection changes
        unsub2 = baas.realtime.on_collection("articles", lambda event: print(event))

        # Clean up
        unsub()
        await baas.realtime.disconnect()

    Note: Requires the `python-socketio[asyncio-client]` extra.
    """

    def __init__(self, http: HttpClient, project_id: str, base_url: str, api_key: str) -> None:
        self._http = http
        self._project_id = project_id
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._sio: Any = None
        self._connected = False
        self._sql_handlers: dict[str, list[Callable[[RealtimeEvent], None]]] = {}
        self._nosql_handlers: dict[str, list[Callable[[RealtimeEvent], None]]] = {}

    def _get_sio(self) -> Any:
        if self._sio is None:
            try:
                import socketio  # type: ignore[import]
            except ImportError as exc:
                raise BaasError(
                    code="MISSING_DEPENDENCY",
                    message=(
                        "python-socketio is required for realtime support. "
                        "Install it with: pip install 'yourbaas[realtime]'"
                    ),
                ) from exc
            self._sio = socketio.AsyncClient(logger=False, engineio_logger=False)
            self._register_events()
        return self._sio

    def _register_events(self) -> None:
        sio = self._sio

        @sio.event
        async def connect() -> None:  # type: ignore[misc]
            self._connected = True
            logger.debug("Realtime connected for project %s", self._project_id)

        @sio.event
        async def disconnect() -> None:  # type: ignore[misc]
            self._connected = False
            logger.debug("Realtime disconnected")

        @sio.on("db_change")  # type: ignore[misc]
        async def on_db_change(data: dict[str, Any]) -> None:
            resource = data.get("resource", "")
            event = RealtimeEvent(
                type=data.get("type", "INSERT"),
                record=data.get("new") or data.get("payload"),
                old_record=data.get("old"),
                table=resource,
            )
            for handler in self._sql_handlers.get(resource, []):
                try:
                    handler(event)
                except Exception:
                    logger.exception("Error in SQL realtime handler for %s", resource)

        @sio.on("collection_change")  # type: ignore[misc]
        async def on_collection_change(data: dict[str, Any]) -> None:
            resource = data.get("resource", "")
            event = RealtimeEvent(
                type=data.get("type", "INSERT"),
                record=data.get("new") or data.get("payload"),
                old_record=data.get("old"),
                collection=resource,
            )
            for handler in self._nosql_handlers.get(resource, []):
                try:
                    handler(event)
                except Exception:
                    logger.exception("Error in NoSQL realtime handler for %s", resource)

    async def _ensure_connected(self) -> None:
        sio = self._get_sio()
        if not self._connected:
            user_token = self._http.get_user_token()
            auth: dict[str, str] = {"api_key": self._api_key}
            if user_token:
                auth["token"] = user_token
            await sio.connect(
                self._base_url,
                namespaces=[f"/{self._project_id}"],
                auth=auth,
                transports=["websocket"],
            )

    def on(
        self,
        table: str,
        callback: Callable[[RealtimeEvent], None],
    ) -> UnsubscribeFn:
        """
        Subscribe to SQL table changes (INSERT, UPDATE, DELETE).

        Returns an unsubscribe callable that removes this specific listener.
        Note: Does not disconnect the socket — call disconnect() explicitly.
        """
        self._sql_handlers.setdefault(table, []).append(callback)

        def unsub() -> None:
            handlers = self._sql_handlers.get(table, [])
            try:
                handlers.remove(callback)
            except ValueError:
                pass

        return unsub

    def on_collection(
        self,
        collection: str,
        callback: Callable[[RealtimeEvent], None],
    ) -> UnsubscribeFn:
        """
        Subscribe to MongoDB collection changes (INSERT, UPDATE, DELETE).

        Returns an unsubscribe callable.
        """
        self._nosql_handlers.setdefault(collection, []).append(callback)

        def unsub() -> None:
            handlers = self._nosql_handlers.get(collection, [])
            try:
                handlers.remove(callback)
            except ValueError:
                pass

        return unsub

    async def connect(self) -> None:
        """Explicitly connect the Socket.io client."""
        await self._ensure_connected()

    async def disconnect(self) -> None:
        """Disconnect the Socket.io client and clear all handlers."""
        self._sql_handlers.clear()
        self._nosql_handlers.clear()
        if self._sio and self._connected:
            await self._sio.disconnect()
        self._connected = False
