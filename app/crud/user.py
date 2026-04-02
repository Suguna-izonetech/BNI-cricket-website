"""
CRUD operations for the User model — async SQLAlchemy.
"""
import uuid
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user_model import User
from app.schemas.user_schemas import UserCreate

logger = logging.getLogger(__name__)


async def create_user(db: AsyncSession, data: UserCreate, photo_url: str) -> User:
    """Persist a new user with a pre-uploaded photo URL."""
    user = User(
        id=uuid.uuid4(),
        name=data.name,
        photo_url=photo_url,
        business=data.business,
        category=data.category,
        phone_no=data.phone_no,
        team_name=data.team_name,
        role=data.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"Created user {user.id}")
    return user


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Fetch a user by UUID; returns None if not found."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def list_users(
    db: AsyncSession, page: int = 1, page_size: int = 20
) -> tuple[int, list[User]]:
    """Return paginated users ordered by creation date (newest first)."""
    offset = (page - 1) * page_size

    count_result = await db.execute(select(func.count()).select_from(User))
    total = count_result.scalar_one()

    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )
    return total, list(result.scalars().all())


async def delete_user(db: AsyncSession, user: User) -> None:
    """Delete a user record from the database."""
    await db.delete(user)
    await db.commit()
    logger.info(f"Deleted user {user.id}")
