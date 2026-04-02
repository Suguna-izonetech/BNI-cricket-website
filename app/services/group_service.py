"""
Service layer for Cricket Group management.

Business rules:
  - Exactly 20 teams must exist before assignment.
  - 5 groups (A–E), 4 teams each, randomly distributed.
  - Re-running clears previous assignments (idempotent).
"""
import random
from typing import List, Dict

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cricket_models import Group, GroupTeam, Team

GROUP_NAMES     = ["A", "B", "C", "D", "E"]
TEAMS_PER_GROUP = 4
REQUIRED_TEAMS  = len(GROUP_NAMES) * TEAMS_PER_GROUP  # 20


def _get_or_create_groups(db: Session) -> List[Group]:
    """Ensure all 5 group rows exist; create any that are missing."""
    groups = []
    for name in GROUP_NAMES:
        group = db.query(Group).filter(Group.name == name).first()
        if not group:
            group = Group(name=name)
            db.add(group)
        groups.append(group)
    db.commit()
    for g in groups:
        db.refresh(g)
    return groups


def assign_groups(db: Session) -> List[Dict]:
    """
    Randomly assign all teams into 5 groups.
    Clears any previous assignments first (safe to re-run).
    """
    teams: List[Team] = db.query(Team).all()
    if len(teams) != REQUIRED_TEAMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Exactly {REQUIRED_TEAMS} teams are required. "
                f"Currently {len(teams)} teams exist."
            ),
        )

    groups = _get_or_create_groups(db)

    # Clear previous assignments
    db.query(GroupTeam).delete()
    db.commit()

    team_list = list(teams)
    random.shuffle(team_list)

    result = []
    for i, group in enumerate(groups):
        assigned = team_list[i * TEAMS_PER_GROUP:(i + 1) * TEAMS_PER_GROUP]
        for team in assigned:
            db.add(GroupTeam(group_id=group.id, team_id=team.id))
        result.append({"group": group, "teams": assigned})

    db.commit()
    return result


def get_all_groups(db: Session) -> List[Dict]:
    """Retrieve all groups with their assigned teams."""
    groups = db.query(Group).order_by(Group.name).all()
    return [
        {"group": g, "teams": [gt.team for gt in g.group_teams]}
        for g in groups
    ]
