"""
Asynchronous SQLAlchemy session — used by the Users (form-submission) module.

The users module uses async SQLAlchemy with asyncpg driver for high-throughput
file uploads and non-blocking DB queries.
"""
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Async engine — asyncpg driver
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class AsyncBase(DeclarativeBase):
    """Base class for all async (users) ORM models."""
    pass


async def get_async_db() -> AsyncSession:
    """
    FastAPI dependency that yields an async DB session per request.
    Used by all Users / form-submission endpoints.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
