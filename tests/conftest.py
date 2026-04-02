"""
Pytest configuration and shared fixtures for the Unified Backend.

Strategy:
  - Cricket tests  → SQLite in-memory via sync engine override
  - Users tests    → SQLite in-memory via async engine override (aiosqlite)

Both test databases are created fresh per test function and torn down after.
"""
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.sync_session  import SyncBase, get_sync_db
from app.db.async_session import AsyncBase, get_async_db

# ── Sync (Cricket) test DB ────────────────────────────────────────────────────
SYNC_TEST_URL = "sqlite:///./test_cricket.db"

sync_test_engine = create_engine(
    SYNC_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
SyncTestingSession = sessionmaker(
    autocommit=False, autoflush=False, bind=sync_test_engine
)


@pytest.fixture(scope="function")
def sync_db():
    """Fresh sync SQLite session for each cricket test."""
    SyncBase.metadata.create_all(bind=sync_test_engine)
    db = SyncTestingSession()
    try:
        yield db
    finally:
        db.close()
        SyncBase.metadata.drop_all(bind=sync_test_engine)


# ── Async (Users) test DB ─────────────────────────────────────────────────────
ASYNC_TEST_URL = "sqlite+aiosqlite:///./test_users.db"

async_test_engine = create_async_engine(
    ASYNC_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
AsyncTestingSession = async_sessionmaker(
    bind=async_test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="function")
async def async_db():
    """Fresh async SQLite session for each user test."""
    async with async_test_engine.begin() as conn:
        await conn.run_sync(AsyncBase.metadata.create_all)
    async with AsyncTestingSession() as session:
        yield session
    async with async_test_engine.begin() as conn:
        await conn.run_sync(AsyncBase.metadata.drop_all)


# ── Sync TestClient (Cricket endpoints) ───────────────────────────────────────
@pytest.fixture(scope="function")
def client(sync_db):
    """
    Sync TestClient with cricket DB override.
    Use for all /api/v1/cricket/* endpoint tests.
    """
    def override_sync_db():
        try:
            yield sync_db
        finally:
            pass

    app.dependency_overrides[get_sync_db] = override_sync_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Async TestClient (Users endpoints) ───────────────────────────────────────
@pytest_asyncio.fixture(scope="function")
async def async_client(async_db):
    """
    Async HTTPX client with users DB override.
    Use for all /api/v1/users/* endpoint tests.
    """
    async def override_async_db():
        yield async_db

    app.dependency_overrides[get_async_db] = override_async_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c
    app.dependency_overrides.clear()
