import logging

from app.db.mongo import get_project_db

logger = logging.getLogger(__name__)

KV_COLLECTION = "_kv"


async def provision_project_database(mongo_database: str) -> None:
    """
    Initialize a MongoDB database for a project.
    Creates the _kv collection with required indexes.
    """
    db = get_project_db(mongo_database)

    # Create the _kv collection with a unique index on key
    kv_coll = db[KV_COLLECTION]
    await kv_coll.create_index("key", unique=True)
    # TTL index on expires_at (MongoDB removes docs when expires_at passes)
    await kv_coll.create_index("expires_at", expireAfterSeconds=0, sparse=True)

    # System metadata collection
    system_coll = db["_system"]
    await system_coll.update_one(
        {"_id": "config"},
        {"$setOnInsert": {"created_at": __import__("datetime").datetime.utcnow()}},
        upsert=True,
    )

    logger.info("Provisioned MongoDB database: %s", mongo_database)


async def teardown_project_database(mongo_database: str) -> None:
    """Drop a project's MongoDB database entirely."""
    from app.db.mongo import get_mongo_client
    client = get_mongo_client()
    await client.drop_database(mongo_database)
    logger.info("Torn down MongoDB database: %s", mongo_database)


async def create_collection(
    mongo_database: str,
    collection: str,
    *,
    indexes: list[dict] | None = None,
    enable_change_stream: bool = False,
) -> None:
    """Create a MongoDB collection and optionally add indexes."""
    if collection.startswith("_"):
        raise ValueError(f"Collection names starting with '_' are reserved: {collection}")

    db = get_project_db(mongo_database)
    coll = db[collection]

    # Create collection explicitly (insert + delete a dummy doc)
    # This ensures the collection exists before any queries
    try:
        await db.create_collection(collection)
    except Exception:
        pass  # Already exists

    # Created_at index for sorting
    await coll.create_index("_id")

    if indexes:
        for idx in indexes:
            keys = [(k, v) for k, v in idx.get("keys", {}).items()]
            options = {k: v for k, v in idx.items() if k != "keys"}
            if keys:
                await coll.create_index(keys, **options)

    logger.info("Created collection: %s.%s", mongo_database, collection)


async def drop_collection(mongo_database: str, collection: str) -> None:
    if collection.startswith("_"):
        raise ValueError(f"Cannot drop reserved collection: {collection}")

    db = get_project_db(mongo_database)
    await db.drop_collection(collection)
    logger.info("Dropped collection: %s.%s", mongo_database, collection)