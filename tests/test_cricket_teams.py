"""
Tests for Cricket Tournament — Teams endpoints.
Uses the sync TestClient fixture from conftest.py.
"""
import pytest


def test_list_teams_empty(client):
    """GET /api/v1/cricket/teams returns empty list before seeding."""
    resp = client.get("/api/v1/cricket/teams")
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_single_team(client):
    """POST /api/v1/cricket/teams creates one team."""
    resp = client.post("/api/v1/cricket/teams", json={"name": "Test XI"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test XI"
    assert "id" in data


def test_create_duplicate_team_returns_409(client):
    """Creating a team with a duplicate name returns 409."""
    client.post("/api/v1/cricket/teams", json={"name": "Alpha XI"})
    resp = client.post("/api/v1/cricket/teams", json={"name": "Alpha XI"})
    assert resp.status_code == 409


def test_bulk_create_teams(client):
    """POST /api/v1/cricket/teams/bulk creates multiple teams."""
    resp = client.post(
        "/api/v1/cricket/teams/bulk",
        json={"names": ["Team A", "Team B", "Team C"]},
    )
    assert resp.status_code == 201
    assert len(resp.json()) == 3


def test_seed_teams(client):
    """POST /api/v1/cricket/teams/seed inserts 20 default teams."""
    resp = client.post("/api/v1/cricket/teams/seed")
    assert resp.status_code == 201
    assert len(resp.json()) == 20


def test_seed_teams_is_idempotent(client):
    """Seeding twice does not create duplicates."""
    client.post("/api/v1/cricket/teams/seed")
    resp = client.post("/api/v1/cricket/teams/seed")
    assert resp.status_code == 201
    assert len(resp.json()) == 20
