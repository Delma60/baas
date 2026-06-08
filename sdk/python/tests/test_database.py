# sdk/python/tests/test_database.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from baas.modules.database import DatabaseModule, QueryBuilder, RpcBuilder
from baas.types.filters import QueryFilter
from baas.utils.http import HttpClient


def make_http() -> HttpClient:
    return HttpClient(base_url="http://localhost:8000", api_key="sk_anon_test")


def test_db_module_returns_query_builder():
    http = make_http()
    db = DatabaseModule(http, "proj_test")
    builder = db("posts")
    assert isinstance(builder, QueryBuilder)


def test_db_module_rpc_returns_rpc_builder():
    http = make_http()
    db = DatabaseModule(http, "proj_test")
    rpc = db.rpc("my_function")
    assert isinstance(rpc, RpcBuilder)


def test_query_builder_select():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    result = builder.select("id, title, created_at")
    assert result is builder  # fluent
    assert builder._select_cols == "id, title, created_at"


def test_query_builder_filter():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    result = builder.filter("status", "eq", "published")
    assert result is builder
    assert len(builder._filters) == 1
    f = builder._filters[0]
    assert f.column == "status"
    assert f.operator == "eq"
    assert f.value == "published"


def test_query_builder_multiple_filters():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts") \
        .filter("status", "eq", "published") \
        .filter("author_id", "eq", "user-123") \
        .filter("views", "gte", 100)
    assert len(builder._filters) == 3


def test_query_builder_order():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    result = builder.order("created_at", "desc")
    assert result is builder
    assert builder._order_col == "created_at"
    assert builder._order_dir == "desc"


def test_query_builder_limit():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    result = builder.limit(25)
    assert result is builder
    assert builder._limit_val == 25


def test_query_builder_offset():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    result = builder.offset(50)
    assert result is builder
    assert builder._offset_val == 50


def test_query_filter_to_param():
    f = QueryFilter(column="status", operator="eq", value="published")
    assert f.to_param() == "status:eq:published"


def test_query_filter_to_param_numeric():
    f = QueryFilter(column="views", operator="gte", value=100)
    assert f.to_param() == "views:gte:100"


def test_query_builder_full_chain():
    http = make_http()
    builder = (
        QueryBuilder(http, "proj_test", "posts")
        .select("id, title")
        .filter("status", "eq", "published")
        .filter("views", "gte", 10)
        .order("created_at", "desc")
        .limit(20)
        .offset(0)
    )
    assert builder._select_cols == "id, title"
    assert len(builder._filters) == 2
    assert builder._order_col == "created_at"
    assert builder._limit_val == 20


def test_query_builder_base_url():
    http = make_http()
    builder = QueryBuilder(http, "proj_abc", "users")
    assert builder._base() == "/v1/db/proj_abc/users"


def test_rpc_builder_args():
    http = make_http()
    rpc = RpcBuilder(http, "proj_test", "get_user_stats")
    result = rpc.args(user_id="abc123", include_deleted=False)
    assert result is rpc
    assert rpc._args == {"user_id": "abc123", "include_deleted": False}


def test_rpc_builder_chained_args():
    http = make_http()
    rpc = RpcBuilder(http, "proj_test", "fn") \
        .args(x=1) \
        .args(y=2)
    assert rpc._args == {"x": 1, "y": 2}


@pytest.mark.asyncio
async def test_query_builder_insert_calls_post():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    with patch.object(http, "post", new_callable=AsyncMock, return_value={"id": "new-id"}) as mock_post:
        result = await builder.insert({"title": "Hello", "status": "draft"})
    mock_post.assert_called_once_with(
        "/v1/db/proj_test/posts",
        json_body={"data": {"title": "Hello", "status": "draft"}},
    )


@pytest.mark.asyncio
async def test_query_builder_update_calls_patch():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    with patch.object(http, "patch", new_callable=AsyncMock, return_value={"id": "row-1"}) as mock_patch:
        await builder.update("row-1", {"status": "published"})
    mock_patch.assert_called_once_with(
        "/v1/db/proj_test/posts/row-1",
        json_body={"data": {"status": "published"}},
    )


@pytest.mark.asyncio
async def test_query_builder_delete_calls_delete():
    http = make_http()
    builder = QueryBuilder(http, "proj_test", "posts")
    with patch.object(http, "delete", new_callable=AsyncMock, return_value={"deleted": True}) as mock_del:
        await builder.delete("row-1")
    mock_del.assert_called_once_with("/v1/db/proj_test/posts/row-1")


@pytest.mark.asyncio
async def test_rpc_builder_execute():
    http = make_http()
    rpc = RpcBuilder(http, "proj_test", "calculate_total")
    with patch.object(http, "post", new_callable=AsyncMock, return_value=[{"total": 42}]) as mock_post:
        result = await rpc.args(order_id="ord-1").execute()
    mock_post.assert_called_once_with(
        "/v1/db/proj_test/rpc/calculate_total",
        json_body={"args": {"order_id": "ord-1"}},
    )
    assert result == [{"total": 42}]
