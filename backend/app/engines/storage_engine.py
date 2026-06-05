import logging
from datetime import datetime
from typing import Any

from botocore.exceptions import ClientError

from app.config import settings
from app.storage.minio import get_bucket_name, get_s3_client

logger = logging.getLogger(__name__)


def _verify_bucket_ownership(project_id: str, bucket: str) -> str:
    """Construct and verify the full bucket name belongs to the project."""
    full_name = get_bucket_name(project_id, bucket)
    return full_name


async def get_presigned_upload_url(
    project_id: str,
    bucket: str,
    filename: str,
    content_type: str,
    expires_in: int = 3600,
) -> dict[str, str]:
    full_bucket = _verify_bucket_ownership(project_id, bucket)
    s3 = get_s3_client()

    # Ensure bucket exists
    try:
        s3.head_bucket(Bucket=full_bucket)
    except ClientError as e:
        code = int(e.response["Error"]["Code"])
        if code == 404:
            s3.create_bucket(Bucket=full_bucket)
        else:
            raise

    # Generate a unique key
    import uuid
    key = f"{uuid.uuid4().hex}/{filename}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": full_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )

    # Replace internal endpoint with public endpoint in the URL
    if settings.minio_endpoint in upload_url:
        public_endpoint = settings.minio_public_endpoint.rstrip("/")
        internal = f"http://{settings.minio_endpoint}"
        upload_url = upload_url.replace(internal, public_endpoint)

    file_url = f"{settings.minio_public_endpoint.rstrip('/')}/{full_bucket}/{key}"

    return {
        "upload_url": upload_url,
        "file_url": file_url,
        "key": key,
        "expires_in": str(expires_in),
    }


async def list_files(
    project_id: str,
    bucket: str,
    prefix: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    full_bucket = _verify_bucket_ownership(project_id, bucket)
    s3 = get_s3_client()

    kwargs: dict[str, Any] = {"Bucket": full_bucket, "MaxKeys": min(limit, 1000)}
    if prefix:
        kwargs["Prefix"] = prefix

    try:
        response = s3.list_objects_v2(**kwargs)
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchBucket":
            return []
        raise

    files = []
    for obj in response.get("Contents", []):
        files.append({
            "key": obj["Key"],
            "size": obj["Size"],
            "last_modified": obj["LastModified"].isoformat() if isinstance(obj["LastModified"], datetime) else str(obj["LastModified"]),
            "content_type": obj.get("ContentType"),
        })
    return files


async def delete_file(project_id: str, bucket: str, file_key: str) -> bool:
    full_bucket = _verify_bucket_ownership(project_id, bucket)
    s3 = get_s3_client()
    try:
        s3.delete_object(Bucket=full_bucket, Key=file_key)
        return True
    except ClientError:
        return False


async def get_presigned_download_url(
    project_id: str,
    bucket: str,
    file_key: str,
    expires_in: int = 3600,
) -> str:
    full_bucket = _verify_bucket_ownership(project_id, bucket)
    s3 = get_s3_client()

    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": full_bucket, "Key": file_key},
        ExpiresIn=expires_in,
    )

    # Replace internal endpoint with public
    if settings.minio_endpoint in url:
        public_endpoint = settings.minio_public_endpoint.rstrip("/")
        internal = f"http://{settings.minio_endpoint}"
        url = url.replace(internal, public_endpoint)

    return url