"""
Synchronous SQLAlchemy session — used by the Cricket Tournament module.

The cricket module uses standard sync SQLAlchemy ORM (Session).
This keeps it decoupled from the async session used by the Users module.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings


# Sync engine — psycopg2 driver
sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# Session factory
SyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)


class SyncBase(DeclarativeBase):
    """Base class for all sync (cricket) ORM models."""
    pass


def get_sync_db():
    """
    FastAPI dependency that yields a sync DB session per request.
    Used by all Cricket Tournament endpoints.
    """
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()
