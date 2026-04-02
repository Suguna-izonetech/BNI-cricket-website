"""
Pydantic schemas for the Cricket Tournament module.
"""
from __future__ import annotations
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ── Team ─────────────────────────────────────────────────────────────────────

class TeamCreate(BaseModel):
    """Payload for creating a single team."""
    name: str


class TeamBulkCreate(BaseModel):
    """Payload for creating multiple teams at once."""
    names: List[str]


class TeamOut(BaseModel):
    """Team response schema."""
    model_config = ConfigDict(from_attributes=True)
    id:   int
    name: str


# ── Group ─────────────────────────────────────────────────────────────────────

class GroupOut(BaseModel):
    """Group response schema — includes teams assigned to it."""
    model_config = ConfigDict(from_attributes=True)
    id:    int
    name:  str
    teams: List[TeamOut] = []


# ── Match ─────────────────────────────────────────────────────────────────────

class MatchOut(BaseModel):
    """Match response schema."""
    model_config = ConfigDict(from_attributes=True)
    id:           int
    match_number: int
    group_name:   str
    team1:        TeamOut
    team2:        TeamOut
    scheduled_at: Optional[datetime] = None
    created_at:   datetime


# ── Generic responses ─────────────────────────────────────────────────────────

class AssignGroupsResponse(BaseModel):
    message: str
    groups:  List[GroupOut]


class GenerateMatchesResponse(BaseModel):
    message:       str
    total_matches: int
    matches:       List[MatchOut]
