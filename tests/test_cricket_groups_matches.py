"""
Tests for Cricket Tournament — Groups and Matches endpoints.
Uses the sync TestClient fixture from conftest.py.
"""
import pytest


def _seed_and_assign(client):
    """Helper: seed 20 teams and assign them to groups."""
    client.post("/api/v1/cricket/teams/seed")
    resp = client.post("/api/v1/cricket/groups/assign")
    assert resp.status_code == 200
    return resp.json()


# ── Group tests ───────────────────────────────────────────────────────────────

def test_assign_groups_requires_20_teams(client):
    """Assigning groups without 20 teams returns 400."""
    resp = client.post("/api/v1/cricket/groups/assign")
    assert resp.status_code == 400


def test_assign_groups_success(client):
    """Assigning groups with 20 teams returns 5 groups of 4 teams each."""
    data = _seed_and_assign(client)
    assert data["message"] == "Teams successfully assigned to groups."
    groups = data["groups"]
    assert len(groups) == 5
    for group in groups:
        assert len(group["teams"]) == 4


def test_assign_groups_is_idempotent(client):
    """Re-running assign returns 5 groups without duplicates."""
    _seed_and_assign(client)
    data = _seed_and_assign(client)
    assert len(data["groups"]) == 5


def test_list_groups(client):
    """GET /api/v1/cricket/groups returns all groups."""
    _seed_and_assign(client)
    resp = client.get("/api/v1/cricket/groups")
    assert resp.status_code == 200
    assert len(resp.json()) == 5


# ── Match tests ───────────────────────────────────────────────────────────────

def test_generate_matches_requires_groups(client):
    """Generating matches without groups returns 400."""
    resp = client.post("/api/v1/cricket/matches/generate")
    assert resp.status_code == 400


def test_generate_matches_success(client):
    """Generating matches after group assignment returns 30 matches."""
    _seed_and_assign(client)
    resp = client.post("/api/v1/cricket/matches/generate")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_matches"] == 30
    assert len(data["matches"]) == 30


def test_generate_matches_is_idempotent(client):
    """Re-generating matches clears previous ones; still returns 30."""
    _seed_and_assign(client)
    client.post("/api/v1/cricket/matches/generate")
    resp = client.post("/api/v1/cricket/matches/generate")
    assert resp.status_code == 200
    assert resp.json()["total_matches"] == 30


def test_list_all_matches(client):
    """GET /api/v1/cricket/matches returns all 30 matches."""
    _seed_and_assign(client)
    client.post("/api/v1/cricket/matches/generate")
    resp = client.get("/api/v1/cricket/matches")
    assert resp.status_code == 200
    assert len(resp.json()) == 30


def test_list_matches_by_group(client):
    """GET /api/v1/cricket/matches/{group} returns 6 matches for that group."""
    _seed_and_assign(client)
    client.post("/api/v1/cricket/matches/generate")
    for group_name in ["A", "B", "C", "D", "E"]:
        resp = client.get(f"/api/v1/cricket/matches/{group_name}")
        assert resp.status_code == 200
        assert len(resp.json()) == 6


def test_list_matches_invalid_group(client):
    """GET /api/v1/cricket/matches/Z returns 404."""
    _seed_and_assign(client)
    client.post("/api/v1/cricket/matches/generate")
    resp = client.get("/api/v1/cricket/matches/Z")
    assert resp.status_code == 404
