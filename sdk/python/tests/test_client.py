# sdk/python/tests/test_client.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from baas import BaasClient, BaasClientSync
from baas.modules.auth import AuthModule
from baas.modules.database import DatabaseModule
from baas.modules.functions import FunctionsModule
from baas.modules.kv import KVModule
from baas.modules.nosql import NoSQLModule
from baas.modules.realtime import RealtimeModule
from baas.modules.storage import StorageModule


def test_client_init_sets_project_id():
    client = BaasClient(project_id="proj_test123", api_key="sk_anon_abc")
    assert client.project_id == "proj_test123"


def test_client_exposes_all_modules():
    client = BaasClient(project_id="proj_test", api_key="sk_anon_xyz")
    assert isinstance(client.auth, AuthModule)
    assert isinstance(client.db, DatabaseModule)
    assert isinstance(client.nosql, NoSQLModule)
    assert isinstance(client.kv, KVModule)
    assert isinstance(client.storage, StorageModule)
    assert isinstance(client.functions, FunctionsModule)
    assert isinstance(client.realtime, RealtimeModule)


def test_client_custom_base_url():
    client = BaasClient(
        project_id="proj_local",
        api_key="sk_anon_local",
        base_url="http://localhost:8000",
    )
    assert client._base_url == "http://localhost:8000"
    assert client._http._base_url == "http://localhost:8000"


def test_client_api_key_passed_to_http():
    client = BaasClient(project_id="proj_test", api_key="sk_anon_secret123")
    assert client._http._api_key == "sk_anon_secret123"


@pytest.mark.asyncio
async def test_client_context_manager():
    async with BaasClient(project_id="proj_ctx", api_key="sk_anon_ctx") as client:
        assert client.project_id == "proj_ctx"
    # After __aexit__, client should be closed (no assertion needed, just no exception)


@pytest.mark.asyncio
async def test_client_destroy_closes_http():
    client = BaasClient(project_id="proj_destroy", api_key="sk_anon_d")
    with patch.object(client._http, "aclose", new_callable=AsyncMock) as mock_close:
        with patch.object(client.realtime, "disconnect", new_callable=AsyncMock):
            await client.destroy()
    mock_close.assert_called_once()


@pytest.mark.asyncio
async def test_client_destroy_disconnects_realtime():
    client = BaasClient(project_id="proj_rt", api_key="sk_anon_rt")
    with patch.object(client.realtime, "disconnect", new_callable=AsyncMock) as mock_disc:
        with patch.object(client._http, "aclose", new_callable=AsyncMock):
            await client.destroy()
    mock_disc.assert_called_once()


def test_sync_client_init():
    client = BaasClientSync(project_id="proj_sync", api_key="sk_anon_sync")
    assert client.project_id == "proj_sync"


def test_sync_client_exposes_modules():
    client = BaasClientSync(project_id="proj_sync", api_key="sk_anon_sync")
    # Modules are wrapped proxies — just check they're accessible
    assert client.auth is not None
    assert client.db is not None
    assert client.nosql is not None
    assert client.kv is not None
    assert client.storage is not None
    assert client.functions is not None


def test_sync_client_destroy():
    client = BaasClientSync(project_id="proj_sync_d", api_key="sk_anon_sd")
    with patch.object(client._async_client, "destroy", new_callable=AsyncMock):
        # Should not raise
        import asyncio
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(client._async_client.destroy())
        finally:
            loop.close()
