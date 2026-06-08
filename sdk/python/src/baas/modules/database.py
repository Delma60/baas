# sdk/python/src/yourbaas/modules/database.py
from __future__ import annotations

from typing import Any

from baas.types import ListResult
from baas.types.filters import FilterOperator, QueryFilter
from baas.utils.http import HttpClient


class QueryBuilder:
    """
    Chainable SQL query builder.

    Usage:
        result = await baas.db("posts") \\
            .select("id, title, created_at") \\
            .filter("status", "eq", "published") \\
            .order("created_at", "desc") \\
            .limit(20) \\
            .execute()

        # Insert
        row = await baas.db("posts").insert({"title": "Hello"})

        # Update
        row = await baas.db("posts").update("post-id", {"status": "published"})

        # Delete
        await baas.db("posts").delete("post-id")
    """

    def __init__(self, http: HttpClient, project_id: str, table: str) -> None:
        self._http = http
        self._project_id = project_id
        self._table = table
        # Query state
        self._select_cols: str = "*"
        self._filters: list[QueryFilter] = []
        self._order_col: str | None = None
        self._order_dir: str = "asc"
        self._limit_val: int = 100
        self._offset_val: int = 0

    def _base(self) -> str:
        return f"/v1/db/{self._project_id}/{self._table}"

    # ── Query chain methods ───────────────────────────────────────────────────

    def select(self, columns: str) -> "QueryBuilder":
        """Specify which columns to return, e.g. 'id, title, created_at'."""
        self._select_cols = columns
        return self

    def filter(self, column: str, operator: FilterOperator, value: Any) -> "QueryBuilder":
        """Add a WHERE filter condition. Can be chained multiple times."""
        self._filters.append(QueryFilter(column=column, operator=operator, value=value))
        return self

    def order(self, column: str, direction: str = "asc") -> "QueryBuilder":
        """Set ORDER BY clause. direction: 'asc' | 'desc'."""
        self._order_col = column
        self._order_dir = direction.lower()
        return self

    def limit(self, n: int) -> "QueryBuilder":
        """Limit the number of rows returned."""
        self._limit_val = n
        return self

    def offset(self, n: int) -> "QueryBuilder":
        """Skip the first n rows."""
        self._offset_val = n
        return self

    # ── Execute ───────────────────────────────────────────────────────────────

    async def execute(self) -> ListResult:
        """Execute the SELECT query. Returns a ListResult with data + meta."""
        params: dict[str, Any] = {
            "select": self._select_cols,
            "limit": self._limit_val,
            "offset": self._offset_val,
        }
        if self._filters:
            params["filter"] = ",".join(f.to_param() for f in self._filters)
        if self._order_col:
            params["order"] = self._order_col
            params["order_dir"] = self._order_dir

        raw = await self._http.request("GET", self._base(), params=params, raw=True)
        body = raw.json() if hasattr(raw, "json") else {}
        # raw=True returns httpx.Response — re-request without raw for data
        result = await self._http.get(self._base(), params=params)
        # The envelope stripping happens in HttpClient, but we need meta too.
        # Re-request to get full envelope.
        import httpx as _httpx
        resp = await self._http._get_client().get(
            self._base(),
            params=params,
            headers=self._http._build_headers(),
        )
        body = resp.json() if resp.status_code < 400 else {}
        data = body.get("data", [])
        meta = body.get("meta", {})
        return ListResult(
            data=data if isinstance(data, list) else [],
            count=meta.get("count", len(data) if isinstance(data, list) else 0),
            limit=meta.get("limit", self._limit_val),
            offset=meta.get("offset", self._offset_val),
        )

    # ── CRUD helpers (bypass chain) ───────────────────────────────────────────

    async def get(self, row_id: str, *, select: str = "*") -> dict[str, Any]:
        """Fetch a single row by ID."""
        return await self._http.get(
            f"{self._base()}/{row_id}",
            params={"select": select},
        )

    async def insert(self, data: dict[str, Any] | list[dict[str, Any]]) -> Any:
        """Insert one row or a list of rows. Returns the inserted row(s)."""
        return await self._http.post(self._base(), json_body={"data": data})

    async def update(self, row_id: str, data: dict[str, Any]) -> dict[str, Any]:
        """Update a row by ID with partial data. Returns the updated row."""
        return await self._http.patch(f"{self._base()}/{row_id}", json_body={"data": data})

    async def delete(self, row_id: str) -> dict[str, Any]:
        """Delete a row by ID."""
        return await self._http.delete(f"{self._base()}/{row_id}")


class RpcBuilder:
    """
    Call a PostgreSQL function defined in the project schema.

    Usage:
        result = await baas.rpc("calculate_total") \\
            .args(order_id="abc123") \\
            .execute()
    """

    def __init__(self, http: HttpClient, project_id: str, fn_name: str) -> None:
        self._http = http
        self._project_id = project_id
        self._fn_name = fn_name
        self._args: dict[str, Any] = {}

    def args(self, **kwargs: Any) -> "RpcBuilder":
        """Set function arguments as keyword arguments."""
        self._args.update(kwargs)
        return self

    async def execute(self) -> list[dict[str, Any]]:
        """Call the PostgreSQL function. Returns rows."""
        data = await self._http.post(
            f"/v1/db/{self._project_id}/rpc/{self._fn_name}",
            json_body={"args": self._args},
        )
        return data if isinstance(data, list) else []


class DatabaseModule:
    """
    Entry point for SQL database operations.

    baas.db("table_name") → QueryBuilder
    baas.rpc("fn_name") → RpcBuilder
    """

    def __init__(self, http: HttpClient, project_id: str) -> None:
        self._http = http
        self._project_id = project_id

    def __call__(self, table: str) -> QueryBuilder:
        """Return a QueryBuilder for the given table."""
        return QueryBuilder(self._http, self._project_id, table)

    def rpc(self, fn_name: str) -> RpcBuilder:
        """Return an RpcBuilder for calling a PostgreSQL function."""
        return RpcBuilder(self._http, self._project_id, fn_name)
