"""
Cricket Tournament — Groups router.
All routes are prefixed with /api/v1/cricket by the parent router.
"""
from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.sync_session import get_sync_db
from app.schemas.cricket_schemas import GroupOut, AssignGroupsResponse, TeamOut
from app.services import group_service

router = APIRouter(prefix="/groups", tags=["Cricket · Groups"])


@router.post(
    "/assign",
    response_model=AssignGroupsResponse,
    status_code=status.HTTP_200_OK,
    summary="Randomly assign 20 teams into 5 groups",
)
def assign_groups(db: Session = Depends(get_sync_db)):
    """
    Randomly distributes all 20 teams into 5 groups (A–E), 4 teams each.
    Previous assignments are cleared first — safe to re-run.

    **Requires:** exactly 20 teams to exist in the database.
    """
    raw = group_service.assign_groups(db)
    groups_out = [
        GroupOut(
            id=item["group"].id,
            name=item["group"].name,
            teams=[TeamOut(id=t.id, name=t.name) for t in item["teams"]],
        )
        for item in raw
    ]
    return AssignGroupsResponse(
        message="Teams successfully assigned to groups.",
        groups=groups_out,
    )


@router.get("", response_model=List[GroupOut], summary="List all groups with their teams")
def list_groups(db: Session = Depends(get_sync_db)):
    """Return all 5 groups with the teams assigned to each."""
    raw = group_service.get_all_groups(db)
    return [
        GroupOut(
            id=item["group"].id,
            name=item["group"].name,
            teams=[TeamOut(id=t.id, name=t.name) for t in item["teams"]],
        )
        for item in raw
    ]
