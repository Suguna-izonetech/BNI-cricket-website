"""
Cricket Tournament — Teams router.
All routes are prefixed with /api/v1/cricket by the parent router.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.sync_session import get_sync_db
from app.schemas.cricket_schemas import TeamCreate, TeamBulkCreate, TeamOut
from app.services import team_service

router = APIRouter(prefix="/teams", tags=["Cricket · Teams"])


@router.post(
    "",
    response_model=TeamOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a single team",
)
def create_team(payload: TeamCreate, db: Session = Depends(get_sync_db)):
    """Create one team. Returns 409 if the name already exists."""
    return team_service.create_team(db, payload.name)


@router.post(
    "/bulk",
    response_model=List[TeamOut],
    status_code=status.HTTP_201_CREATED,
    summary="Create multiple teams at once",
)
def create_teams_bulk(payload: TeamBulkCreate, db: Session = Depends(get_sync_db)):
    """Create multiple teams in a single request."""
    return team_service.create_teams_bulk(db, payload.names)


@router.post(
    "/seed",
    response_model=List[TeamOut],
    status_code=status.HTTP_201_CREATED,
    summary="Seed the default 20 teams",
)
def seed_teams(db: Session = Depends(get_sync_db)):
    """
    Insert the pre-defined 20 teams.
    Teams that already exist are skipped (safe to call multiple times).
    """
    return team_service.seed_default_teams(db)


@router.get("", response_model=List[TeamOut], summary="List all teams")
def list_teams(db: Session = Depends(get_sync_db)):
    """Return all teams ordered by id."""
    return team_service.get_all_teams(db)
