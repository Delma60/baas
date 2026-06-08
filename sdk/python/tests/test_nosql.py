# sdk/python/tests/test_nosql.py
import pytest
from unittest.mock import AsyncMock, patch

from baas.modules.nosql import CollectionBuilder, FindBuilder, NoSQLModule
from baas.utils.http import HttpClient


def make_http() -> HttpClient:
    return HttpClient(base_url="http://localhost:8000", api_key="sk_anon_test")


def test_nosql_module_returns_collection_builder():
    http = make_http()
    nosql = NoSQLModule(http, "proj_test")
    builder = nosql("articles")
    assert isinstance(builder, CollectionBuilder)


def test_collection_builder_base_url():
    http = make_http()
    coll = CollectionBuilder(http, "proj_abc", "articles")
    assert coll._base() == "/v1/nosql/proj_abc/collections/articles"


def test_collection_find_returns_find_builder():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    builder = coll.find({"status": "published"})
    assert isinstance(builder, FindBuilder)
    assert builder._filter == {"status": "published"}


def test_find_builder_chain():
    http = make_http()
    builder = (
        FindBuilder(http, "proj_test", "articles")
        .find({"category": "tech"})
        .sort("created_at", -1)
        .limit(20)
        .skip(10)
    )
    assert builder._filter == {"category": "tech"}
    assert builder._sort_field == "created_at"
    assert builder._sort_dir == -1
    assert builder._limit_val == 20
    assert builder._skip_val == 10


def test_find_builder_fluent():
    http = make_http()
    builder = FindBuilder(http, "proj_test", "articles")
    assert builder.sort("name") is builder
    assert builder.limit(5) is builder
    assert builder.skip(0) is builder
    assert builder.find({}) is builder


@pytest.mark.asyncio
async def test_collection_get():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    with patch.object(http, "get", new_callable=AsyncMock, return_value={"id": "doc-1", "title": "Hello"}) as mock_get:
        result = await coll.get("doc-1")
    mock_get.assert_called_once_with("/v1/nosql/proj_test/collections/articles/doc-1")
    assert result["title"] == "Hello"


@pytest.mark.asyncio
async def test_collection_insert_one():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    payload = {"title": "New Article", "status": "draft"}
    with patch.object(http, "post", new_callable=AsyncMock, return_value={"id": "new-doc"}) as mock_post:
        result = await coll.insert_one(payload)
    mock_post.assert_called_once_with(
        "/v1/nosql/proj_test/collections/articles",
        json_body={"data": payload},
    )


@pytest.mark.asyncio
async def test_collection_insert_many():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    docs = [{"title": "A"}, {"title": "B"}]
    with patch.object(http, "post", new_callable=AsyncMock, return_value={"inserted_ids": ["id1", "id2"]}) as mock_post:
        result = await coll.insert_many(docs)
    mock_post.assert_called_once_with(
        "/v1/nosql/proj_test/collections/articles",
        json_body={"data": docs},
    )
    assert result == ["id1", "id2"]


@pytest.mark.asyncio
async def test_collection_update_one():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    with patch.object(http, "patch", new_callable=AsyncMock, return_value={"id": "doc-1"}) as mock_patch:
        await coll.update_one("doc-1", {"$set": {"title": "Updated"}})
    mock_patch.assert_called_once_with(
        "/v1/nosql/proj_test/collections/articles/doc-1",
        json_body={"update": {"$set": {"title": "Updated"}}},
    )


@pytest.mark.asyncio
async def test_collection_delete_one():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    with patch.object(http, "delete", new_callable=AsyncMock, return_value={"deleted": True}) as mock_del:
        await coll.delete_one("doc-1")
    mock_del.assert_called_once_with("/v1/nosql/proj_test/collections/articles/doc-1")


@pytest.mark.asyncio
async def test_collection_aggregate():
    http = make_http()
    coll = CollectionBuilder(http, "proj_test", "articles")
    pipeline = [{"$match": {"status": "published"}}, {"$count": "total"}]
    with patch.object(http, "post", new_callable=AsyncMock, return_value=[{"total": 42}]) as mock_post:
        result = await coll.aggregate(pipeline)
    mock_post.assert_called_once_with(
        "/v1/nosql/proj_test/collections/articles/aggregate",
        json_body={"pipeline": pipeline},
    )
    assert result == [{"total": 42}]
