# sdk/python/src/yourbaas/modules/storage.py
from __future__ import annotations

from typing import Any

from baas.types import FileMeta, PresignedUpload
from baas.utils.http import HttpClient


class BucketBuilder:
    """
    MinIO storage operations for a specific bucket.

    Files are NEVER proxied through FastAPI — all uploads/downloads use
    presigned URLs that go directly to MinIO.

    Usage:
        # Get a presigned upload URL
        result = await baas.storage("avatars").upload(
            filename="profile.jpg",
            content_type="image/jpeg",
        )
        # Then PUT directly to result.upload_url using any HTTP client

        # List files
        files = await baas.storage("avatars").list_files()
        files = await baas.storage("avatars").list_files(prefix="2024/")

        # Get a download URL
        url = await baas.storage("avatars").get_download_url("path/to/file.jpg")

        # Delete a file
        await baas.storage("avatars").delete_file("path/to/file.jpg")
    """

    def __init__(self, http: HttpClient, project_id: str, bucket: str) -> None:
        self._http = http
        self._project_id = project_id
        self._bucket = bucket

    def _base(self) -> str:
        return f"/v1/storage/{self._project_id}/{self._bucket}"

    async def upload(
        self,
        *,
        filename: str,
        content_type: str,
        expires_in: int = 3600,
    ) -> PresignedUpload:
        """
        Request a presigned PUT URL for direct client upload.

        Returns a PresignedUpload with:
        - upload_url: PUT this URL directly from the client
        - file_url: The final publicly accessible download URL
        - key: The storage key (path) of the file
        """
        result = await self._http.post(
            f"{self._base()}/upload",
            json_body={
                "filename": filename,
                "content_type": content_type,
                "expires_in": expires_in,
            },
        )
        if isinstance(result, dict):
            return PresignedUpload(
                upload_url=result.get("upload_url", ""),
                file_url=result.get("file_url", ""),
                key=result.get("filename", filename),
                expires_in=expires_in,
            )
        raise ValueError(f"Unexpected response from storage upload: {result}")

    async def list_files(
        self,
        *,
        prefix: str | None = None,
        limit: int = 100,
    ) -> list[FileMeta]:
        """List files in this bucket, optionally filtered by prefix."""
        params: dict[str, Any] = {"limit": limit}
        if prefix:
            params["prefix"] = prefix

        result = await self._http.get(f"{self._base()}/files", params=params)
        items = result if isinstance(result, list) else []
        return [
            FileMeta(
                key=item.get("key", ""),
                size=item.get("size", 0),
                last_modified=item.get("last_modified"),
                content_type=item.get("content_type"),
                etag=item.get("etag"),
            )
            for item in items
        ]

    async def delete_file(self, file_path: str) -> bool:
        """Delete a file by its storage path/key. Returns True on success."""
        from baas.utils.errors import BaasError
        try:
            result = await self._http.delete(f"{self._base()}/{file_path}")
            if isinstance(result, dict):
                return result.get("deleted", False)
            return True
        except BaasError as e:
            if e.status == 404:
                return False
            raise

    async def get_download_url(
        self,
        file_path: str,
        *,
        expires_in: int = 3600,
    ) -> str:
        """
        Get a presigned download URL for a file.
        The URL is valid for expires_in seconds (default 1 hour).
        """
        result = await self._http.get(
            f"{self._base()}/{file_path}/url",
            params={"expires_in": expires_in},
        )
        if isinstance(result, dict):
            return result.get("url", "")
        return str(result)


class StorageModule:
    """
    Entry point for storage (MinIO) operations.

    baas.storage("bucket_name") → BucketBuilder
    """

    def __init__(self, http: HttpClient, project_id: str) -> None:
        self._http = http
        self._project_id = project_id

    def __call__(self, bucket: str) -> BucketBuilder:
        """Return a BucketBuilder for the given bucket."""
        return BucketBuilder(self._http, self._project_id, bucket)
