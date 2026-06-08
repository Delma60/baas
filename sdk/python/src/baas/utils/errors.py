# sdk/python/src/yourbaas/utils/errors.py
from __future__ import annotations

from typing import Any


class BaasError(Exception):
    """
    Raised by all YourBaaS SDK methods on any non-2xx response or
    unexpected exception. Mirrors the JS SDK BaasError shape.
    """

    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
        status: int | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status = status

    def __repr__(self) -> str:
        return f"BaasError(code={self.code!r}, message={self.message!r}, status={self.status})"

    @classmethod
    def from_status(cls, status: int, body: dict[str, Any] | None = None) -> "BaasError":
        """Build a BaasError from an HTTP status code and optional response body."""
        body = body or {}
        error = body.get("error", {})
        code = error.get("code") or _status_to_code(status)
        message = error.get("message") or _status_to_message(status)
        details = error.get("details")
        return cls(code=code, message=message, details=details, status=status)


def _status_to_code(status: int) -> str:
    return {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "UNPROCESSABLE",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }.get(status, "UNKNOWN_ERROR")


def _status_to_message(status: int) -> str:
    return {
        400: "Bad request",
        401: "Authentication required",
        403: "Permission denied",
        404: "Resource not found",
        409: "Resource already exists",
        422: "Validation error",
        429: "Too many requests — please slow down",
        500: "Internal server error",
        502: "Upstream service error",
        503: "Service temporarily unavailable",
    }.get(status, f"Unexpected error (HTTP {status})")
