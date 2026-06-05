import logging
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

RESERVED_COLLECTIONS = {"_kv", "_system"}
FORBIDDEN_OPERATORS = {"$where", "$function", "$accumulator"}


def _validate_collection(name: str) -> None:
    if name.startswith("_") and name not in RESERVED_COLLECTIONS:
        raise ValueError(f"Collection names starting with '_' are reserved: {name}")


def _sanitize_filter(filter_doc: dict[str, Any]) -> dict[str, Any]:
    """Recursively remove forbidden MongoDB operators."""
    result = {}
    for k, v in filter_doc.items():
        if k in FORBIDDEN_OPERATORS:
            raise ValueError(f"Forbidden operator: {k}")
        if isinstance(v, dict):
            result[k] = _sanitize_filter(v)
        elif isinstance(v, list):
            result[k] = [_sanitize_filter(i) if isinstance(i, dict) else i for i in v]
        else:
            result[k] = v
    return result


def _serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert ObjectId and other BSON types to JSON-serializable forms."""
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, dict):
            result[k] = _serialize_doc(v)
        elif isinstance(v, list):
            result[k] = [_serialize_doc(i) if isinstance(i, dict) else i for i in v]
        else:
            result[k] = v
    # Rename _id to id for API consumers
    if "_id" in result:
        result["id"] = result.pop("_id")
    return result


# ─── Document operations ──────────────────────────────────────────────────────

async def find_documents(
    db: AsyncIOMotorDatabase,
    collection: str,
    *,
    filter_doc: dict[str, Any] | None = None,
    projection: dict[str, Any] | None = None,
    sort: list[tuple[str, int]] | None = None,
    limit: int = 100,
    skip: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    _validate_collection(collection)
    safe_filter = _sanitize_filter(filter_doc or {})

    coll = db[collection]
    cursor = coll.find(safe_filter, projection)
    if sort:
        cursor = cursor.sort(sort)
    cursor = cursor.skip(skip).limit(min(limit, 1000))

    docs = []
    async for doc in cursor:
        docs.append(_serialize_doc(doc))

    total = await coll.count_documents(safe_filter)
    return docs, total


async def get_document(
    db: AsyncIOMotorDatabase,
    collection: str,
    doc_id: str,
) -> dict[str, Any] | None:
    _validate_collection(collection)
    coll = db[collection]
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        obj_id = doc_id  # type: ignore[assignment]

    doc = await coll.find_one({"_id": obj_id})
    return _serialize_doc(doc) if doc else None


async def insert_document(
    db: AsyncIOMotorDatabase,
    collection: str,
    data: dict[str, Any],
) -> dict[str, Any]:
    _validate_collection(collection)
    coll = db[collection]
    result = await coll.insert_one(data)
    doc = await coll.find_one({"_id": result.inserted_id})
    return _serialize_doc(doc) if doc else {"id": str(result.inserted_id)}


async def insert_many_documents(
    db: AsyncIOMotorDatabase,
    collection: str,
    docs: list[dict[str, Any]],
) -> list[str]:
    _validate_collection(collection)
    coll = db[collection]
    result = await coll.insert_many(docs)
    return [str(i) for i in result.inserted_ids]


async def update_document(
    db: AsyncIOMotorDatabase,
    collection: str,
    doc_id: str,
    update: dict[str, Any],
) -> dict[str, Any] | None:
    _validate_collection(collection)
    safe_update = _sanitize_filter(update)

    # Ensure at least one update operator is used
    if not any(k.startswith("$") for k in safe_update):
        safe_update = {"$set": safe_update}

    coll = db[collection]
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        obj_id = doc_id  # type: ignore[assignment]

    await coll.update_one({"_id": obj_id}, safe_update)
    doc = await coll.find_one({"_id": obj_id})
    return _serialize_doc(doc) if doc else None


async def delete_document(
    db: AsyncIOMotorDatabase,
    collection: str,
    doc_id: str,
) -> bool:
    _validate_collection(collection)
    coll = db[collection]
    try:
        obj_id = ObjectId(doc_id)
    except Exception:
        obj_id = doc_id  # type: ignore[assignment]

    result = await coll.delete_one({"_id": obj_id})
    return result.deleted_count > 0


async def aggregate_documents(
    db: AsyncIOMotorDatabase,
    collection: str,
    pipeline: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    _validate_collection(collection)
    # Validate each pipeline stage
    safe_pipeline = [_sanitize_filter(stage) for stage in pipeline]

    coll = db[collection]
    results = []
    async for doc in coll.aggregate(safe_pipeline):
        results.append(_serialize_doc(doc))
    return results


# ─── Key-Value operations (uses _kv collection) ───────────────────────────────

KV_COLLECTION = "_kv"


async def kv_get(db: AsyncIOMotorDatabase, key: str) -> Any:
    coll = db[KV_COLLECTION]
    import datetime
    doc = await coll.find_one({"key": key})
    if not doc:
        return None
    # Check TTL (if set and expired)
    if doc.get("expires_at") and doc["expires_at"] < datetime.datetime.utcnow():
        await coll.delete_one({"key": key})
        return None
    return doc.get("value")


async def kv_set(db: AsyncIOMotorDatabase, key: str, value: Any, ttl: int | None = None) -> None:
    import datetime
    coll = db[KV_COLLECTION]
    doc: dict[str, Any] = {"key": key, "value": value}
    if ttl:
        doc["expires_at"] = datetime.datetime.utcnow() + datetime.timedelta(seconds=ttl)
    else:
        doc["expires_at"] = None
    await coll.update_one({"key": key}, {"$set": doc}, upsert=True)


async def kv_delete(db: AsyncIOMotorDatabase, key: str) -> bool:
    coll = db[KV_COLLECTION]
    result = await coll.delete_one({"key": key})
    return result.deleted_count > 0


async def kv_list(db: AsyncIOMotorDatabase, prefix: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    import datetime
    coll = db[KV_COLLECTION]
    filter_doc: dict[str, Any] = {
        "$or": [{"expires_at": None}, {"expires_at": {"$gt": datetime.datetime.utcnow()}}]
    }
    if prefix:
        filter_doc["key"] = {"$regex": f"^{prefix}"}

    results = []
    async for doc in coll.find(filter_doc, {"_id": 0, "key": 1, "value": 1, "expires_at": 1}).limit(limit):
        results.append({
            "key": doc["key"],
            "value": doc["value"],
            "expires_at": doc.get("expires_at").isoformat() if doc.get("expires_at") else None,
        })
    return results