# sdk/python/tests/test_kv.py
import pytest
from unittest.mock import AsyncMock, patch

from baas.modules.kv import KVModule
from baas.types import KVEntry
from baas.types.filters import KVBatchOperation
from baas.utils.errors import BaasError
from baas.utils.http import HttpClient


def make_kv() -> KVModule:
    http = HttpClient(base_url="http://localhost:8000", api_key="sk_anon_test")
    return KVModule(http, "proj_test")


def test_kv_base_url():
    kv = make_kv()
    assert kv._base() == "/v1/nosql/proj_test/kv"


@pytest.mark.asyncio
async def test_kv_get_returns_value():
    kv = make_kv()
    with patch.object(kv._http, "get", new_callable=AsyncMock, return_value={"key": "theme", "value": "dark"}):
        result = await kv.get("theme")
    assert result == "dark"


@pytest.mark.asyncio
async def test_kv_get_returns_none_on_404():
    kv = make_kv()
    with patch.object(kv._http, "get", new_callable=AsyncMock, side_effect=BaasError("NOT_FOUND", "Key not found", status=404)):
        result = await kv.get("missing-key")
    assert result is None


@pytest.mark.asyncio
async def test_kv_get_raises_on_non_404():
    kv = make_kv()
    with patch.object(kv._http, "get", new_callable=AsyncMock, side_effect=BaasError("INTERNAL_ERROR", "Server error", status=500)):
        with pytest.raises(BaasError) as exc_info:
            await kv.get("some-key")
    assert exc_info.value.status == 500


@pytest.mark.asyncio
async def test_kv_set_simple():
    kv = make_kv()
    with patch.object(kv._http, "put", new_callable=AsyncMock, return_value={"key": "theme", "value": "dark"}) as mock_put:
        entry = await kv.set("theme", "dark")
    mock_put.assert_called_once_with(
        "/v1/nosql/proj_test/kv/theme",
        json_body={"value": "dark"},
    )
    assert isinstance(entry, KVEntry)
    assert entry.key == "theme"
    assert entry.value == "dark"


@pytest.mark.asyncio
async def test_kv_set_with_ttl():
    kv = make_kv()
    with patch.object(kv._http, "put", new_callable=AsyncMock, return_value={"key": "session", "value": "abc"}) as mock_put:
        await kv.set("session", "abc", ttl=3600)
    mock_put.assert_called_once_with(
        "/v1/nosql/proj_test/kv/session",
        json_body={"value": "abc", "ttl": 3600},
    )


@pytest.mark.asyncio
async def test_kv_delete_existing():
    kv = make_kv()
    with patch.object(kv._http, "delete", new_callable=AsyncMock, return_value={"deleted": True}) as mock_del:
        result = await kv.delete("theme")
    mock_del.assert_called_once_with("/v1/nosql/proj_test/kv/theme")
    assert result is True


@pytest.mark.asyncio
async def test_kv_delete_missing():
    kv = make_kv()
    with patch.object(kv._http, "delete", new_callable=AsyncMock, side_effect=BaasError("NOT_FOUND", "Key not found", status=404)):
        result = await kv.delete("missing")
    assert result is False


@pytest.mark.asyncio
async def test_kv_list_all():
    kv = make_kv()
    mock_entries = [
        {"key": "a", "value": 1, "expires_at": None},
        {"key": "b", "value": 2, "expires_at": None},
    ]
    with patch.object(kv._http, "get", new_callable=AsyncMock, return_value=mock_entries) as mock_get:
        entries = await kv.list()
    mock_get.assert_called_once_with("/v1/nosql/proj_test/kv", params={"limit": 100})
    assert len(entries) == 2
    assert all(isinstance(e, KVEntry) for e in entries)


@pytest.mark.asyncio
async def test_kv_list_with_prefix():
    kv = make_kv()
    with patch.object(kv._http, "get", new_callable=AsyncMock, return_value=[]) as mock_get:
        await kv.list(prefix="user:", limit=50)
    mock_get.assert_called_once_with("/v1/nosql/proj_test/kv", params={"limit": 50, "prefix": "user:"})


@pytest.mark.asyncio
async def test_kv_batch():
    kv = make_kv()
    ops = [
        KVBatchOperation(op="set", key="counter", value=1),
        KVBatchOperation(op="get", key="theme"),
        KVBatchOperation(op="delete", key="old_key"),
    ]
    expected_payload = [
        {"op": "set", "key": "counter", "value": 1},
        {"op": "get", "key": "theme"},
        {"op": "delete", "key": "old_key"},
    ]
    with patch.object(kv._http, "post", new_callable=AsyncMock, return_value=[{"key": "counter", "set": True}]) as mock_post:
        result = await kv.batch(ops)
    mock_post.assert_called_once_with(
        "/v1/nosql/proj_test/kv/batch",
        json_body={"operations": expected_payload},
    )


def test_kv_batch_operation_to_dict_set():
    op = KVBatchOperation(op="set", key="k", value="v", ttl=60)
    d = op.to_dict()
    assert d == {"op": "set", "key": "k", "value": "v", "ttl": 60}


def test_kv_batch_operation_to_dict_get():
    op = KVBatchOperation(op="get", key="k")
    d = op.to_dict()
    assert d == {"op": "get", "key": "k"}
    assert "value" not in d
    assert "ttl" not in d
