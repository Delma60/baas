# sdk/python/src/yourbaas/utils/http.py
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx

from baas.utils.errors import BaasError

logger = logging.getLogger(__name__)

_DEFAULT_RETRIES = 3
_RETRY_BACKOFF_BASE = 0.5  # seconds


class HttpClient:
    """
    Thin wrapper around httpx.AsyncClient.

    Responsibilities:
    - Injects `Authorization: Bearer <api_key>` on every request.
    - Injects `X-User-Token: <user_token>` when a session token exists.
    - Automatically retries on HTTP 429 (rate limited), up to _DEFAULT_RETRIES times.
    - Deserializes `{ "data": ... }` envelopes, raises BaasError on errors.
    """

    def __init__(self, base_url: str, api_key: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._user_token: str | None = None
        self._client: httpx.AsyncClient | None = None

    # ── Session token (set by auth module after sign-in) ──────────────────────

    def set_user_token(self, token: str | None) -> None:
        self._user_token = token

    def get_user_token(self) -> str | None:
        return self._user_token

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=httpx.Timeout(30.0),
            )
        return self._client

    async def aclose(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── Core request ─────────────────────────────────────────────────────────

    def _build_headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers: dict[str, str] = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self._user_token:
            headers["X-User-Token"] = self._user_token
        if extra:
            headers.update(extra)
        return headers

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: Any = None,
        headers: dict[str, str] | None = None,
        raw: bool = False,
    ) -> Any:
        """
        Perform an HTTP request with retry on 429.
        Returns the `data` field of the response envelope unless raw=True.
        Raises BaasError on non-2xx status codes.
        """
        url = path if path.startswith("http") else path
        req_headers = self._build_headers(headers)

        for attempt in range(_DEFAULT_RETRIES + 1):
            client = self._get_client()
            try:
                response = await client.request(
                    method,
                    url,
                    params=params,
                    content=json.dumps(json_body).encode() if json_body is not None else None,
                    headers=req_headers,
                )
            except httpx.TransportError as exc:
                if attempt < _DEFAULT_RETRIES:
                    await asyncio.sleep(_RETRY_BACKOFF_BASE * (2 ** attempt))
                    continue
                raise BaasError(
                    code="NETWORK_ERROR",
                    message=f"Network error: {exc}",
                    status=None,
                ) from exc

            if response.status_code == 429 and attempt < _DEFAULT_RETRIES:
                retry_after = float(response.headers.get("Retry-After", _RETRY_BACKOFF_BASE * (2 ** attempt)))
                logger.debug("Rate limited — retrying in %.1fs (attempt %d)", retry_after, attempt + 1)
                await asyncio.sleep(retry_after)
                continue

            if response.status_code >= 400:
                body: dict[str, Any] = {}
                try:
                    body = response.json()
                except Exception:
                    pass
                raise BaasError.from_status(response.status_code, body)

            if raw:
                return response

            try:
                data = response.json()
            except Exception:
                return None

            return data.get("data") if isinstance(data, dict) and "data" in data else data

        raise BaasError(code="MAX_RETRIES", message="Maximum retry attempts exceeded", status=429)

    # ── Convenience methods ───────────────────────────────────────────────────

    async def get(self, path: str, *, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> Any:
        return await self.request("GET", path, params=params, headers=headers)

    async def post(self, path: str, *, json_body: Any = None, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> Any:
        return await self.request("POST", path, json_body=json_body, params=params, headers=headers)

    async def patch(self, path: str, *, json_body: Any = None, headers: dict[str, str] | None = None) -> Any:
        return await self.request("PATCH", path, json_body=json_body, headers=headers)

    async def put(self, path: str, *, json_body: Any = None, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> Any:
        return await self.request("PUT", path, json_body=json_body, params=params, headers=headers)

    async def delete(self, path: str, *, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> Any:
        return await self.request("DELETE", path, params=params, headers=headers)
