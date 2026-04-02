"""
Cricket Tournament — Matches router.
All routes are prefixed with /api/v1/cricket by the parent router.
"""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.sync_session import get_sync_db
from app.schemas.cricket_schemas import MatchOut, GenerateMatchesResponse, TeamOut
from app.services import match_service

router = APIRouter(prefix="/matches", tags=["Cricket · Matches"])


def _match_to_out(match) -> MatchOut:
    """Convert a Match ORM object to MatchOut schema."""
    return MatchOut(
        id=match.id,
        match_number=match.match_number,
        group_name=match.group.name,
        team1=TeamOut(id=match.team1.id, name=match.team1.name),
        team2=TeamOut(id=match.team2.id, name=match.team2.name),
        scheduled_at=match.scheduled_at,
        created_at=match.created_at,
    )


@router.post(
    "/generate",
    response_model=GenerateMatchesResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate round-robin matches for all groups",
)
def generate_matches(
    start_date: Optional[datetime] = Query(
        default=None,
        description=(
            "Optional ISO-8601 start date for scheduling. "
            "Each match is spaced 1 day apart. "
            "Example: 2025-06-01T10:00:00Z"
        ),
        example="2025-06-01T10:00:00Z",
    ),
    db: Session = Depends(get_sync_db),
):
    """
    Generates all 30 round-robin matches (6 per group × 5 groups).
    Match order is randomized. Previous matches are cleared first (idempotent).

    **Requires:** groups must be assigned via POST /api/v1/cricket/groups/assign.
    """
    matches = match_service.generate_matches(db, start_date)
    matches_out = [_match_to_out(m) for m in matches]
    return GenerateMatchesResponse(
        message=f"Successfully generated {len(matches_out)} matches.",
        total_matches=len(matches_out),
        matches=matches_out,
    )


@router.get("", response_model=List[MatchOut], summary="List all matches")
def list_all_matches(db: Session = Depends(get_sync_db)):
    """Return all 30 matches ordered by match_number."""
    return [_match_to_out(m) for m in match_service.get_all_matches(db)]


@router.get(
    "/{group_name}",
    response_model=List[MatchOut],
    summary="List matches for a specific group",
)
def list_matches_by_group(group_name: str, db: Session = Depends(get_sync_db)):
    """
    Return all 6 matches for a given group.

    - **group_name**: One of A, B, C, D, E (case-insensitive)
    """
    return [
        _match_to_out(m)
        for m in match_service.get_matches_by_group(db, group_name)
    ]
