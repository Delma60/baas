# backend/app/api/internal/nosql_browse.py
"""
Internal-only endpoints for the dashboard to browse NoSQL data.
These are NOT exposed via /v1/ — only callable from Next.js with X-Internal-Secret.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel

from app.config import settings
from app.db.mongo import get_project_db

router = APIRouter(tags=["Internal NoSQL Browse"])
logger = logging.getLogger(__name__)


async def require_internal(x_internal_secret: str = Header(...)) -> None:
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(status_code=401, detail="Invalid internal secret")


InternalGuard = Depends(require_internal)


@router.get("/projects/{project_id}/nosql/collections", dependencies=[InternalGuard])
async def list_collections(
    project_id: str,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    """List all non-reserved collection names in a project's MongoDB database."""
    db = get_project_db(mongo_database)
    names = await db.list_collection_names()
    # Filter reserved collections
    public = [n for n in names if not n.startswith("_")]
    return {"data": {"collections": public}}


@router.get(
    "/projects/{project_id}/nosql/collections/{collection}/documents",
    dependencies=[InternalGuard],
)
async def list_collection_documents(
    project_id: str,
    collection: str,
    mongo_database: str = Query(...),
    limit: int = Query(default=50, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    """Fetch documents from a collection — dashboard only."""
    from app.engines.nosql_engine import find_documents

    db = get_project_db(mongo_database)
    docs, total = await find_documents(
        db, collection, limit=limit, skip=skip, sort=[("_id", -1)]
    )
    return {"data": {"docs": docs, "total": total}}


@router.post(
    "/projects/{project_id}/nosql/collections/{collection}/documents",
    status_code=201,
    dependencies=[InternalGuard],
)
async def insert_document_internal(
    project_id: str,
    collection: str,
    mongo_database: str = Query(...),
    body: dict[str, Any] = None,
) -> dict[str, Any]:
    from app.engines.nosql_engine import insert_document
    from fastapi import Body

    db = get_project_db(mongo_database)
    doc = await insert_document(db, collection, body or {})
    return {"data": doc}


@router.delete(
    "/projects/{project_id}/nosql/collections/{collection}/documents/{doc_id}",
    dependencies=[InternalGuard],
)
async def delete_document_internal(
    project_id: str,
    collection: str,
    doc_id: str,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    from app.engines.nosql_engine import delete_document

    db = get_project_db(mongo_database)
    deleted = await delete_document(db, collection, doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"data": {"deleted": True, "id": doc_id}}


@router.get("/projects/{project_id}/nosql/kv", dependencies=[InternalGuard])
async def list_kv_internal(
    project_id: str,
    mongo_database: str = Query(...),
    prefix: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict[str, Any]:
    from app.engines.nosql_engine import kv_list

    db = get_project_db(mongo_database)
    entries = await kv_list(db, prefix=prefix, limit=limit)
    return {"data": {"entries": entries}}


@router.delete(
    "/projects/{project_id}/nosql/kv/{key:path}",
    dependencies=[InternalGuard],
)
async def delete_kv_internal(
    project_id: str,
    key: str,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    from app.engines.nosql_engine import kv_delete

    db = get_project_db(mongo_database)
    deleted = await kv_delete(db, key)
    if not deleted:
        raise HTTPException(status_code=404, detail="Key not found")
    return {"data": {"deleted": True, "key": key}}


class CreateCollectionInternalRequest(BaseModel):
    collection: str


@router.post(
    "/projects/{project_id}/nosql/collections",
    status_code=201,
    dependencies=[InternalGuard],
)
async def create_collection_internal(
    project_id: str,
    body: CreateCollectionInternalRequest,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    from app.provisioner.nosql_provisioner import create_collection

    await create_collection(mongo_database, body.collection)
    return {"data": {"collection": body.collection, "created": True}}


@router.delete(
    "/projects/{project_id}/nosql/collections/{collection}",
    dependencies=[InternalGuard],
)
async def drop_collection_internal(
    project_id: str,
    collection: str,
    mongo_database: str = Query(...),
) -> dict[str, Any]:
    from app.provisioner.nosql_provisioner import drop_collection

    await drop_collection(mongo_database, collection)
    return {"data": {"collection": collection, "dropped": True}}