"""
Service layer for Cricket Match generation.

Business rules:
  - Groups must be assigned before generating matches.
  - Round-robin within each group: every team plays every other team once.
  - Matches per group = C(4,2) = 6  →  Total = 30.
  - Match order is randomized across the full schedule.
  - Re-generating clears previous matches (idempotent).
  - Optional: scheduled_at dates spaced one day apart.
"""
import random
import itertools
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.cricket_models import Group, GroupTeam, Match


def generate_matches(
    db: Session,
    start_date: Optional[datetime] = None,
) -> List[Match]:
    """
    Generate all 30 round-robin matches across 5 groups.

    Args:
        db:         SQLAlchemy sync session.
        start_date: If provided, matches are given sequential scheduled dates
                    (one per day) starting from this datetime.

    Returns:
        List of persisted Match ORM objects.
    """
    groups: List[Group] = (
        db.query(Group)
        .options(joinedload(Group.group_teams).joinedload(GroupTeam.team))
        .order_by(Group.name)
        .all()
    )

    if not groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No groups found. Run POST /api/v1/cricket/groups/assign first.",
        )

    # Validate every group has exactly 4 teams
    for group in groups:
        if len(group.group_teams) != 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Group {group.name} has {len(group.group_teams)} teams "
                    f"(expected 4). Re-run POST /api/v1/cricket/groups/assign."
                ),
            )

    # Clear previous matches (idempotent)
    db.query(Match).delete()
    db.commit()

    # Build all match pairs across groups
    all_pairs = []
    for group in groups:
        teams = [gt.team for gt in group.group_teams]
        for team1, team2 in itertools.combinations(teams, 2):
            all_pairs.append((team1, team2, group))

    # Randomize global match order
    random.shuffle(all_pairs)

    # Persist matches
    new_matches: List[Match] = []
    for match_number, (team1, team2, group) in enumerate(all_pairs, start=1):
        scheduled_at = None
        if start_date is not None:
            scheduled_at = start_date + timedelta(days=match_number - 1)

        match = Match(
            match_number=match_number,
            team1_id=team1.id,
            team2_id=team2.id,
            group_id=group.id,
            scheduled_at=scheduled_at,
        )
        db.add(match)
        new_matches.append(match)

    db.commit()

    # Refresh to eager-load relationships
    for m in new_matches:
        db.refresh(m)

    return new_matches


def get_all_matches(db: Session) -> List[Match]:
    """Return all matches ordered by match_number with relationships loaded."""
    return (
        db.query(Match)
        .options(
            joinedload(Match.team1),
            joinedload(Match.team2),
            joinedload(Match.group),
        )
        .order_by(Match.match_number)
        .all()
    )


def get_matches_by_group(db: Session, group_name: str) -> List[Match]:
    """
    Return all matches for a specific group.
    Raises 404 if the group name is invalid.
    """
    group = db.query(Group).filter(Group.name == group_name.upper()).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group '{group_name}' not found. Valid groups: A, B, C, D, E.",
        )
    return (
        db.query(Match)
        .options(
            joinedload(Match.team1),
            joinedload(Match.team2),
            joinedload(Match.group),
        )
        .filter(Match.group_id == group.id)
        .order_by(Match.match_number)
        .all()
    )
