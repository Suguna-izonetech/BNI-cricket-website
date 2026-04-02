"""
Tests for Users (Form Submission) endpoints.
Uses the async_client fixture from conftest.py.

Note: MinIO calls are mocked so tests run without a live MinIO instance.
"""
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.models.user_model import User


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_user(**kwargs) -> User:
    """Create an in-memory User ORM object for DB seeding."""
    from datetime import datetime, timezone
    defaults = dict(
        id=uuid.uuid4(),
        name="Test User",
        photo_url="http://localhost:9000/user-photos/test.jpg",
        business="Test Business",
        category="Technology",
        phone_no="+1234567890",
        team_name=None,
        role=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    defaults.update(kwargs)
    return User(**defaults)


MOCK_PHOTO_URL = "http://localhost:9000/user-photos/mock-uuid.jpg"


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_users_empty(async_client):
    """GET /api/v1/users/ returns empty list when no users exist."""
    resp = await async_client.get("/api/v1/users/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
@patch("app.routers.users.upload_image", new_callable=AsyncMock, return_value=MOCK_PHOTO_URL)
async def test_create_user_success(mock_upload, async_client, async_db):
    """POST /api/v1/users/ creates a user and returns 201."""
    import io
    resp = await async_client.post(
        "/api/v1/users/",
        data={
            "name":     "Alice Sharma",
            "business": "Acme Corp",
            "category": "Technology",
            "phone_no": "+9876543210",
        },
        files={"photo": ("test.jpg", io.BytesIO(b"fake-image-data"), "image/jpeg")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"]     == "Alice Sharma"
    assert data["business"] == "Acme Corp"
    assert "id" in data
    assert data["photo_url"] == MOCK_PHOTO_URL


@pytest.mark.asyncio
async def test_get_user_not_found(async_client):
    """GET /api/v1/users/{id} returns 404 for unknown UUID."""
    random_id = uuid.uuid4()
    resp = await async_client.get(f"/api/v1/users/{random_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_user_not_found(async_client):
    """DELETE /api/v1/users/{id} returns 404 for unknown UUID."""
    random_id = uuid.uuid4()
    resp = await async_client.delete(f"/api/v1/users/{random_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_create_user_invalid_phone(async_client):
    """POST /api/v1/users/ with invalid phone_no returns 422."""
    import io
    resp = await async_client.post(
        "/api/v1/users/",
        data={
            "name":     "Bob",
            "business": "Test Co",
            "category": "Finance",
            "phone_no": "abc",          # invalid
        },
        files={"photo": ("t.jpg", io.BytesIO(b"x"), "image/jpeg")},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_users_pagination(async_client, async_db):
    """GET /api/v1/users/?page=1&page_size=5 respects pagination params."""
    resp = await async_client.get("/api/v1/users/?page=1&page_size=5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"]      == 1
    assert data["page_size"] == 5
