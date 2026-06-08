# sdk/python/src/yourbaas/modules/functions.py
from __future__ import annotations

from typing import Any

from baas.types import FunctionResult
from baas.utils.http import HttpClient


class FunctionInvokeBuilder:
    """
    Builder for invoking an edge function.

    Note: `with_` is used instead of `with` because `with` is a reserved keyword in Python.

    Usage:
        result = await baas.functions("send-welcome-email") \\
            .with_({"user_id": "abc123", "template": "welcome"}) \\
            .headers({"X-Custom-Header": "value"}) \\
            .call()
    """

    def __init__(self, http: HttpClient, project_id: str, function_name: str) -> None:
        self._http = http
        self._project_id = project_id
        self._function_name = function_name
        self._payload: dict[str, Any] = {}
        self._headers: dict[str, str] = {}

    def with_(self, payload: dict[str, Any]) -> "FunctionInvokeBuilder":
        """Set the payload/body to send to the function. (with_ because with is reserved)"""
        self._payload = payload
        return self

    def headers(self, headers: dict[str, str]) -> "FunctionInvokeBuilder":
        """Set custom headers to forward to the edge function."""
        self._headers.update(headers)
        return self

    async def call(self) -> FunctionResult:
        """Invoke the edge function. Returns a FunctionResult."""
        result = await self._http.post(
            f"/v1/functions/{self._project_id}/invoke/{self._function_name}",
            json_body={
                "payload": self._payload,
                "headers": self._headers,
            },
        )
        if isinstance(result, dict):
            inner = result.get("data", result)
            if isinstance(inner, dict):
                return FunctionResult(
                    status_code=inner.get("status"),
                    data=inner.get("data"),
                    headers=inner.get("headers", {}),
                )
        return FunctionResult(status_code=None, data=result)


class FunctionsModule:
    """
    Entry point for edge function invocations.

    baas.functions("function-name") → FunctionInvokeBuilder
    """

    def __init__(self, http: HttpClient, project_id: str) -> None:
        self._http = http
        self._project_id = project_id

    def __call__(self, function_name: str) -> FunctionInvokeBuilder:
        """Return a FunctionInvokeBuilder for the named function."""
        return FunctionInvokeBuilder(self._http, self._project_id, function_name)
