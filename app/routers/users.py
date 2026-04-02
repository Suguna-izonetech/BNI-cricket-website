"""
Users (Form Submission) router — async endpoints.
All routes are prefixed with /api/v1/users by the parent router.
"""
import uuid
import logging

from fastapi import (
    APIRouter, Depends, HTTPException,
    UploadFile, File, Form, Query, status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.async_session import get_async_db
from app.schemas.user_schemas import (
    UserCreate, UserResponse, UserListResponse, MessageResponse,
)
from app.crud import user as crud_user
from app.services.minio_service import upload_image, delete_image
from app.utils.helpers import clamp

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user with photo upload",
)
async def create_user(
    name:      str           = Form(...),
    business:  str           = Form(...),
    category:  str           = Form(...),
    phone_no:  str           = Form(...),
    team_name: Optional[str] = Form(None),
    role:      Optional[str] = Form(None),
    photo:     UploadFile    = File(...),
    db:        AsyncSession  = Depends(get_async_db),
):
    """
    Create a user with multipart form data including a photo file.

    The photo is uploaded to MinIO first; if the DB write fails,
    the uploaded image is automatically cleaned up.
    """
    # Validate form data via Pydantic
    try:
        user_data = UserCreate(
            name=name, business=business, category=category,
            phone_no=phone_no, team_name=team_name, role=role,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # Upload image to MinIO
    photo_url = await upload_image(photo)

    # Persist to database — rollback and clean up image on failure
    try:
        user = await crud_user.create_user(db, user_data, photo_url)
    except Exception as e:
        logger.error(f"DB error during user creation: {e}")
        delete_image(photo_url)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save user. Please try again.",
        )

    return user


@router.get("/", response_model=UserListResponse, summary="List all users (paginated)")
async def list_users(
    page:      int          = Query(default=1,  ge=1, description="Page number"),
    page_size: int          = Query(default=20, ge=1, le=100, description="Items per page"),
    db:        AsyncSession = Depends(get_async_db),
):
    """Return a paginated list of users, newest first."""
    page_size = clamp(page_size, 1, 100)
    total, users = await crud_user.list_users(db, page=page, page_size=page_size)
    return UserListResponse(total=total, page=page, page_size=page_size, items=users)


@router.get("/{user_id}", response_model=UserResponse, summary="Get a user by ID")
async def get_user(
    user_id: uuid.UUID,
    db:      AsyncSession = Depends(get_async_db),
):
    """Fetch a single user by their UUID."""
    user = await crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    summary="Delete a user and their photo",
)
async def delete_user(
    user_id: uuid.UUID,
    db:      AsyncSession = Depends(get_async_db),
):
    """Delete a user record and remove their photo from MinIO."""
    user = await crud_user.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    photo_url = user.photo_url
    await crud_user.delete_user(db, user)
    delete_image(photo_url)
    return MessageResponse(message=f"User {user_id} deleted successfully.")
