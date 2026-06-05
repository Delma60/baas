# backend/app/api/v1/storage/router.py
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.dependencies import AuthCtx, ProjectCtx
from app.engines.storage_engine import (
    delete_file,
    get_presigned_download_url,
    get_presigned_upload_url,
    list_files,
)
from app.models.requests import PresignedUploadRequest

router = APIRouter(prefix="/storage", tags=["Storage"])
logger = logging.getLogger(__name__)


@router.post("/{project_id}/{bucket}/upload", status_code=201)
async def get_upload_url(
    project_id: str,
    bucket: str,
    body: PresignedUploadRequest,
    ctx: ProjectCtx,
    auth: AuthCtx,
) -> dict[str, Any]:
    """Get a presigned PUT URL to upload a file directly to MinIO."""
    if ctx["project_id"] != project_id:
        raise HTTPException(status_code=403, detail="Project ID mismatch")

    result = await get_presigned_upload_url(
        project_id=project_id,
        bucket=bucket,
        filename=body.filename,
        content_type=body.content_type,
        expires_in=body.expires_in,
    )
    return {"data": result}


@router.get("/{project_id}/{bucket}/files")
async def list_bucket_files(
    project_id: str,
    bucket: str,
    ctx: ProjectCtx,
    auth: AuthCtx,
    prefix: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
) -> dict[str, Any]:
    if ctx["project_id"] != project_id:
        raise HTTPException(status_code=403, detail="Project ID mismatch")

    files = await list_files(project_id=project_id, bucket=bucket, prefix=prefix, limit=limit)
    return {"data": files, "meta": {"count": len(files)}}


@router.delete("/{project_id}/{bucket}/{file_path:path}")
async def delete_bucket_file(
    project_id: str,
    bucket: str,
    file_path: str,
    ctx: ProjectCtx,
    auth: AuthCtx,
) -> dict[str, Any]:
    if ctx["project_id"] != project_id:
        raise HTTPException(status_code=403, detail="Project ID mismatch")

    deleted = await delete_file(project_id=project_id, bucket=bucket, file_key=file_path)
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")
    return {"data": {"deleted": True, "key": file_path}}


@router.get("/{project_id}/{bucket}/{file_path:path}/url")
async def get_download_url(
    project_id: str,
    bucket: str,
    file_path: str,
    ctx: ProjectCtx,
    auth: AuthCtx,
    expires_in: int = Query(default=3600, ge=60, le=86400),
) -> dict[str, Any]:
    if ctx["project_id"] != project_id:
        raise HTTPException(status_code=403, detail="Project ID mismatch")

    url = await get_presigned_download_url(
        project_id=project_id,
        bucket=bucket,
        file_key=file_path,
        expires_in=expires_in,
    )
    return {"data": {"url": url, "key": file_path, "expires_in": expires_in}}