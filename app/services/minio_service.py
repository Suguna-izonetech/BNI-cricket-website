"""
MinIO object-storage service — used by the Users module for photo uploads.

Responsibilities:
  - Singleton Minio client initialization
  - Bucket creation with public-read policy on startup
  - Image upload with validation (MIME type + size)
  - Image deletion by public URL
  - Presigned URL generation for private-bucket access
"""
import io
import uuid
import logging
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Singleton Minio client ────────────────────────────────────────────────────

_minio_client: Minio | None = None


def get_minio_client() -> Minio:
    """Return the singleton Minio client, creating it on first call."""
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL,
        )
    return _minio_client


def ensure_bucket_exists() -> None:
    """
    Create the MinIO bucket if it doesn't exist and apply a public-read policy.
    Called once during application startup.
    """
    client = get_minio_client()
    bucket = settings.MINIO_BUCKET
    try:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
            # Public-read policy so photo URLs are directly accessible
            policy = f"""{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Principal": {{"AWS": ["*"]}},
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::{bucket}/*"]
                }}]
            }}"""
            client.set_bucket_policy(bucket, policy)
            logger.info(f"Bucket '{bucket}' created with public-read policy.")
        else:
            logger.info(f"Bucket '{bucket}' already exists.")
    except S3Error as e:
        logger.error(f"MinIO bucket setup error: {e}")
        raise RuntimeError(f"MinIO setup failed: {e}")


# ── Upload / Delete ───────────────────────────────────────────────────────────

EXTENSION_MAP = {
    "image/jpeg": ".jpg",
    "image/png":  ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024


async def upload_image(file: UploadFile) -> str:
    """
    Validate and upload an image to MinIO.

    Validates:
      - MIME type (must be in ALLOWED_MIME_TYPES)
      - File size (must not exceed MAX_FILE_SIZE_MB)

    Returns:
        Public URL of the uploaded object.
    """
    content_type = file.content_type or ""
    if content_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed: {settings.ALLOWED_MIME_TYPES}",
        )

    # Stream read with size guard (64 KB chunks)
    chunks: list[bytes] = []
    total_size = 0
    while chunk := await file.read(65536):
        total_size += len(chunk)
        if total_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB} MB.",
            )
        chunks.append(chunk)

    file_bytes  = b"".join(chunks)
    file_stream = io.BytesIO(file_bytes)

    # Generate a unique object name
    ext         = EXTENSION_MAP.get(content_type, ".jpg")
    object_name = f"{uuid.uuid4()}{ext}"

    client = get_minio_client()
    try:
        client.put_object(
            bucket_name=settings.MINIO_BUCKET,
            object_name=object_name,
            data=file_stream,
            length=len(file_bytes),
            content_type=content_type,
        )
        logger.info(f"Uploaded image '{object_name}' to MinIO.")
    except S3Error as e:
        logger.error(f"MinIO upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image upload failed. Please try again.",
        )

    return f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET}/{object_name}"


def delete_image(photo_url: str) -> None:
    """
    Delete an image from MinIO given its public URL.
    Logs a warning on failure instead of raising (non-fatal cleanup).
    """
    try:
        prefix      = f"{settings.MINIO_PUBLIC_URL}/{settings.MINIO_BUCKET}/"
        object_name = (
            photo_url[len(prefix):]
            if photo_url.startswith(prefix)
            else photo_url.split(f"/{settings.MINIO_BUCKET}/")[-1]
        )
        get_minio_client().remove_object(settings.MINIO_BUCKET, object_name)
        logger.info(f"Deleted image '{object_name}' from MinIO.")
    except S3Error as e:
        logger.warning(f"MinIO delete warning (non-fatal): {e}")


def get_presigned_url(object_name: str, expires_seconds: int = 3600) -> str:
    """Generate a presigned URL for time-limited private access."""
    from datetime import timedelta
    try:
        return get_minio_client().presigned_get_object(
            settings.MINIO_BUCKET,
            object_name,
            expires=timedelta(seconds=expires_seconds),
        )
    except S3Error as e:
        logger.error(f"Presigned URL error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate presigned URL.",
        )
