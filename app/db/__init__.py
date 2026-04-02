"""
Database layer — exposes both sync and async sessions.

  - get_sync_db  → used by Cricket Tournament routers
  - get_async_db → used by Users routers
"""
from app.db.sync_session import SyncBase, SyncSessionLocal, sync_engine, get_sync_db
from app.db.async_session import AsyncBase, AsyncSessionLocal, async_engine, get_async_db

__all__ = [
    "SyncBase",
    "SyncSessionLocal",
    "sync_engine",
    "get_sync_db",
    "AsyncBase",
    "AsyncSessionLocal",
    "async_engine",
    "get_async_db",
]
