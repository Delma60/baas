# sdk/python/src/yourbaas/modules/auth.py
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable

from baas.types import AuthSession, AuthUser, UnsubscribeFn
from baas.utils.errors import BaasError
from baas.utils.http import HttpClient

logger = logging.getLogger(__name__)


class AuthModule:
    """
    Per-project user authentication.

    All methods are async. For sync usage see BaasClientSync.

    Usage:
        session = await baas.auth.sign_in(email="...", password="...")
        user = await baas.auth.me()
        await baas.auth.sign_out()
    """

    def __init__(self, http: HttpClient, project_id: str) -> None:
        self._http = http
        self._project_id = project_id
        self._session: AuthSession | None = None
        self._listeners: list[Callable[[AuthSession | None], None]] = []

    # ── Internal ──────────────────────────────────────────────────────────────

    def _base(self) -> str:
        return f"/v1/auth/{self._project_id}"

    def _set_session(self, session: AuthSession | None) -> None:
        self._session = session
        if session:
            self._http.set_user_token(session.access_token)
        else:
            self._http.set_user_token(None)
        for listener in self._listeners:
            try:
                listener(session)
            except Exception:
                logger.exception("Error in session change listener")

    @staticmethod
    def _parse_session(data: dict[str, Any]) -> AuthSession:
        user_data = data.get("user", {})
        return AuthSession(
            user=AuthUser(
                id=user_data.get("id", ""),
                email=user_data.get("email", ""),
                name=user_data.get("name"),
                is_email_verified=user_data.get("is_email_verified", False),
                created_at=user_data.get("created_at"),
            ),
            access_token=data.get("access_token", ""),
            refresh_token=data.get("refresh_token"),
            token_type=data.get("token_type", "bearer"),
        )

    # ── Public API ────────────────────────────────────────────────────────────

    async def sign_up(self, *, email: str, password: str, name: str | None = None) -> AuthSession:
        """Register a new user. Returns a session with tokens."""
        data = await self._http.post(
            f"{self._base()}/signup",
            json_body={"email": email, "password": password, "name": name},
        )
        session = self._parse_session(data)
        self._set_session(session)
        return session

    async def sign_in(self, *, email: str, password: str) -> AuthSession:
        """Sign in with email and password. Returns a session with tokens."""
        data = await self._http.post(
            f"{self._base()}/signin",
            json_body={"email": email, "password": password},
        )
        session = self._parse_session(data)
        self._set_session(session)
        return session

    async def sign_out(self) -> None:
        """Sign out the current user. Clears local session state."""
        try:
            await self._http.post(f"{self._base()}/signout")
        except BaasError:
            pass  # Best-effort — clear local state regardless
        self._set_session(None)

    async def refresh(self, refresh_token: str | None = None) -> AuthSession:
        """Exchange a refresh token for a new access token."""
        token = refresh_token or (self._session.refresh_token if self._session else None)
        if not token:
            raise BaasError(
                code="NO_REFRESH_TOKEN",
                message="No refresh token available. Sign in again.",
            )
        data = await self._http.post(
            f"{self._base()}/refresh",
            json_body={"refresh_token": token},
        )
        # refresh endpoint doesn't return user — preserve existing
        new_session = AuthSession(
            user=self._session.user if self._session else AuthUser(id="", email=""),
            access_token=data.get("access_token", ""),
            refresh_token=data.get("refresh_token"),
            token_type=data.get("token_type", "bearer"),
        )
        self._set_session(new_session)
        return new_session

    async def me(self) -> AuthUser:
        """Fetch the current user's profile from the server."""
        data = await self._http.get(f"{self._base()}/me")
        return AuthUser(
            id=data.get("id", ""),
            email=data.get("email", ""),
            name=data.get("name"),
            is_email_verified=data.get("is_email_verified", False),
            created_at=data.get("created_at"),
        )

    def get_session(self) -> AuthSession | None:
        """Return the current in-memory session (no network call)."""
        return self._session

    def on_session_change(self, callback: Callable[[AuthSession | None], None]) -> UnsubscribeFn:
        """
        Subscribe to session changes (sign-in, sign-out, token refresh).

        Returns an unsubscribe callable:
            unsub = baas.auth.on_session_change(lambda s: print(s))
            unsub()  # removes the listener
        """
        self._listeners.append(callback)

        def unsub() -> None:
            try:
                self._listeners.remove(callback)
            except ValueError:
                pass

        return unsub
