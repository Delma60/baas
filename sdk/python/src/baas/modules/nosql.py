# sdk/python/src/yourbaas/modules/nosql.py
from __future__ import annotations

from typing import Any

from baas.types import NoSQLListResult
from baas.utils.http import HttpClient


class FindBuilder:
    """
    Chainable find query builder for NoSQL collections.

    Usage:
        result = await baas.nosql("articles") \\
            .find({"category": "tech"}) \\
            .sort("created_at", -1) \\
            .limit(10) \\
            .execute()
    """

    def __init__(self, http: HttpClient, project_id: str, collection: str) -> None:
        self._http = http
        self._project_id = project_id
        self._collection = collection
        self._filter: dict[str, Any] | None = None
        self._sort_field: str | None = None
        self._sort_dir: int = -1
        self._limit_val: int = 100
        self._skip_val: int = 0

    def _base(self) -> str:
        return f"/v1/nosql/{self._project_id}/collections/{self._collection}"

    def find(self, filter_doc: dict[str, Any] | None = None) -> "FindBuilder":
        """Set a MongoDB-style filter document."""
        self._filter = filter_doc
        return self

    def sort(self, field: str, direction: int = -1) -> "FindBuilder":
        """Set sort field and direction. -1 = descending, 1 = ascending."""
        self._sort_field = field
        self._sort_dir = direction
        return self

    def limit(self, n: int) -> "FindBuilder":
        """Limit the number of documents returned."""
        self._limit_val = n
        return self

    def skip(self, n: int) -> "FindBuilder":
        """Skip the first n documents."""
        self._skip_val = n
        return self

    async def execute(self) -> NoSQLListResult:
        """Execute the find query."""
        params: dict[str, Any] = {
            "limit": self._limit_val,
            "skip": self._skip_val,
        }
        if self._sort_field:
            params["sort_field"] = self._sort_field
            params["sort_dir"] = self._sort_dir

        resp = await self._http._get_client().get(
            self._base(),
            params=params,
            headers=self._http._build_headers(),
        )
        body = resp.json() if resp.status_code < 400 else {}
        data = body.get("data", [])
        meta = body.get("meta", {})
        return NoSQLListResult(
            data=data if isinstance(data, list) else [],
            count=meta.get("count", len(data) if isinstance(data, list) else 0),
            limit=meta.get("limit", self._limit_val),
            skip=meta.get("skip", self._skip_val),
        )


class CollectionBuilder:
    """
    Full CRUD interface for a single MongoDB collection.

    Usage:
        # Chainable find
        result = await baas.nosql("articles").find({"status": "published"}).limit(10).execute()

        # Single document
        doc = await baas.nosql("articles").get("doc-id")

        # Insert
        doc = await baas.nosql("articles").insert_one({"title": "Hello"})
        ids = await baas.nosql("articles").insert_many([{"title": "A"}, {"title": "B"}])

        # Update
        doc = await baas.nosql("articles").update_one("doc-id", {"$set": {"title": "Updated"}})

        # Delete
        await baas.nosql("articles").delete_one("doc-id")

        # Aggregate
        results = await baas.nosql("articles").aggregate([{"$match": {...}}, {"$group": {...}}])
    """

    def __init__(self, http: HttpClient, project_id: str, collection: str) -> None:
        self._http = http
        self._project_id = project_id
        self._collection = collection

    def _base(self) -> str:
        return f"/v1/nosql/{self._project_id}/collections/{self._collection}"

    # ── Find (chainable) ──────────────────────────────────────────────────────

    def find(self, filter_doc: dict[str, Any] | None = None) -> FindBuilder:
        """Return a FindBuilder for chaining sort/limit/skip/execute."""
        builder = FindBuilder(self._http, self._project_id, self._collection)
        if filter_doc:
            builder.find(filter_doc)
        return builder

    # ── CRUD ─────────────────────────────────────────────────────────────────

    async def get(self, doc_id: str) -> dict[str, Any]:
        """Fetch a single document by ID."""
        return await self._http.get(f"{self._base()}/{doc_id}")

    async def insert_one(self, data: dict[str, Any]) -> dict[str, Any]:
        """Insert a single document. Returns the created document."""
        return await self._http.post(self._base(), json_body={"data": data})

    async def insert_many(self, docs: list[dict[str, Any]]) -> list[str]:
        """Insert multiple documents. Returns a list of inserted IDs."""
        result = await self._http.post(self._base(), json_body={"data": docs})
        if isinstance(result, dict):
            return result.get("inserted_ids", [])
        return []

    async def update_one(self, doc_id: str, update: dict[str, Any]) -> dict[str, Any]:
        """
        Update a document by ID.
        update should use MongoDB update operators, e.g. {"$set": {"title": "New"}}.
        """
        return await self._http.patch(f"{self._base()}/{doc_id}", json_body={"update": update})

    async def delete_one(self, doc_id: str) -> dict[str, Any]:
        """Delete a document by ID."""
        return await self._http.delete(f"{self._base()}/{doc_id}")

    async def aggregate(self, pipeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Run a MongoDB aggregation pipeline."""
        result = await self._http.post(
            f"{self._base()}/aggregate",
            json_body={"pipeline": pipeline},
        )
        return result if isinstance(result, list) else []


class NoSQLModule:
    """
    Entry point for NoSQL (MongoDB) operations.

    baas.nosql("collection_name") → CollectionBuilder
    """

    def __init__(self, http: HttpClient, project_id: str) -> None:
        self._http = http
        self._project_id = project_id

    def __call__(self, collection: str) -> CollectionBuilder:
        """Return a CollectionBuilder for the given collection."""
        return CollectionBuilder(self._http, self._project_id, collection)
