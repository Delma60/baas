# sdk/python/tests/test_storage.py
import pytest
from unittest.mock import AsyncMock, patch

from baas.modules.storage import BucketBuilder, StorageModule
from baas.types import FileMeta, PresignedUpload
from baas.utils.errors import BaasError
from baas.utils.http import HttpClient


def make_bucket(bucket: str = "avatars") -> BucketBuilder:
    http = HttpClient(base_url="http://localhost:8000", api_key="sk_anon_test")
    return BucketBuilder(http, "proj_test", bucket)


def test_storage_module_returns_bucket_builder():
    http = HttpClient(base_url="http://localhost:8000", api_key="sk_anon_test")
    storage = StorageModule(http, "proj_test")
    builder = storage("avatars")
    assert isinstance(builder, BucketBuilder)
    assert builder._bucket == "avatars"
    assert builder._project_id == "proj_test"


def test_bucket_builder_base_url():
    bucket = make_bucket("documents")
    assert bucket._base() == "/v1/storage/proj_test/documents"


@pytest.mark.asyncio
async def test_upload_calls_post_correctly():
    bucket = make_bucket("avatars")
    mock_response = {
        "upload_url": "https://minio.example.com/presigned-upload",
        "file_url": "https://minio.example.com/proj_test-avatars/abc.jpg",
        "filename": "profile.jpg",
    }
    with patch.object(bucket._http, "post", new_callable=AsyncMock, return_value=mock_response) as mock_post:
        result = await bucket.upload(filename="profile.jpg", content_type="image/jpeg")
    mock_post.assert_called_once_with(
        "/v1/storage/proj_test/avatars/upload",
        json_body={"filename": "profile.jpg", "content_type": "image/jpeg", "expires_in": 3600},
    )
    assert isinstance(result, PresignedUpload)
    assert result.upload_url == "https://minio.example.com/presigned-upload"


@pytest.mark.asyncio
async def test_upload_custom_expires_in():
    bucket = make_bucket()
    mock_response = {"upload_url": "https://...", "file_url": "https://...", "filename": "f.txt"}
    with patch.object(bucket._http, "post", new_callable=AsyncMock, return_value=mock_response) as mock_post:
        await bucket.upload(filename="f.txt", content_type="text/plain", expires_in=7200)
    call_kwargs = mock_post.call_args[1]["json_body"]
    assert call_kwargs["expires_in"] == 7200


@pytest.mark.asyncio
async def test_list_files_returns_file_meta():
    bucket = make_bucket("documents")
    mock_files = [
        {"key": "report.pdf", "size": 1024, "last_modified": "2024-01-01T00:00:00Z", "content_type": "application/pdf", "etag": "abc123"},
        {"key": "summary.txt", "size": 256, "last_modified": "2024-01-02T00:00:00Z", "content_type": "text/plain", "etag": "def456"},
    ]
    with patch.object(bucket._http, "get", new_callable=AsyncMock, return_value=mock_files):
        files = await bucket.list_files()
    assert len(files) == 2
    assert all(isinstance(f, FileMeta) for f in files)
    assert files[0].key == "report.pdf"
    assert files[0].size == 1024


@pytest.mark.asyncio
async def test_list_files_with_prefix():
    bucket = make_bucket()
    with patch.object(bucket._http, "get", new_callable=AsyncMock, return_value=[]) as mock_get:
        await bucket.list_files(prefix="2024/", limit=50)
    mock_get.assert_called_once_with(
        "/v1/storage/proj_test/avatars/files",
        params={"limit": 50, "prefix": "2024/"},
    )


@pytest.mark.asyncio
async def test_delete_file_success():
    bucket = make_bucket()
    with patch.object(bucket._http, "delete", new_callable=AsyncMock, return_value={"deleted": True}):
        result = await bucket.delete_file("path/to/photo.jpg")
    assert result is True


@pytest.mark.asyncio
async def test_delete_file_not_found():
    bucket = make_bucket()
    with patch.object(bucket._http, "delete", new_callable=AsyncMock, side_effect=BaasError("NOT_FOUND", "File not found", status=404)):
        result = await bucket.delete_file("nonexistent.jpg")
    assert result is False


@pytest.mark.asyncio
async def test_delete_file_server_error_raises():
    bucket = make_bucket()
    with patch.object(bucket._http, "delete", new_callable=AsyncMock, side_effect=BaasError("INTERNAL_ERROR", "Server error", status=500)):
        with pytest.raises(BaasError):
            await bucket.delete_file("file.jpg")


@pytest.mark.asyncio
async def test_get_download_url():
    bucket = make_bucket()
    with patch.object(bucket._http, "get", new_callable=AsyncMock, return_value={"url": "https://cdn.example.com/photo.jpg?sig=abc"}) as mock_get:
        url = await bucket.get_download_url("photos/profile.jpg")
    mock_get.assert_called_once_with(
        "/v1/storage/proj_test/avatars/photos/profile.jpg/url",
        params={"expires_in": 3600},
    )
    assert url == "https://cdn.example.com/photo.jpg?sig=abc"


@pytest.mark.asyncio
async def test_get_download_url_custom_expiry():
    bucket = make_bucket()
    with patch.object(bucket._http, "get", new_callable=AsyncMock, return_value={"url": "https://..."}) as mock_get:
        await bucket.get_download_url("file.pdf", expires_in=86400)
    call_params = mock_get.call_args[1]["params"]
    assert call_params["expires_in"] == 86400
