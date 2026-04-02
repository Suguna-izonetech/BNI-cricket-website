"""
Service layer for Cricket Team management.
All business logic lives here — routers stay thin.
"""
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cricket_models import Team


# 20 default teams seeded on startup
DEFAULT_TEAMS: List[str] = [
    "BNI Azpire", "BNI Benchmark", "BNI Champions", "BNI Dynamic",
    "BNI Emperor", "BNI Fortune", "BNI Gladiators", "BNI Harmony",
    "BNI Icons", "BNI Jaaguar", "BNI Kings", "BNI Legends",
    "BNI Millionaire", "BNI Nest", "BNI Prince", "BNI Sparkp",
    "Trichy A", "Trichy B", "PD A", "PD B"
]


def create_team(db: Session, name: str) -> Team:
    """Create a single team. Raises 409 if name already exists."""
    if db.query(Team).filter(Team.name == name).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Team '{name}' already exists.",
        )
    team = Team(name=name)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def create_teams_bulk(db: Session, names: List[str]) -> List[Team]:
    """Create multiple teams in one transaction. Raises on duplicates."""
    if not names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one team name is required.",
        )
    if len(names) != len(set(names)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate team names found in the request.",
        )
    existing = db.query(Team).filter(Team.name.in_(names)).all()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Teams already exist: {[t.name for t in existing]}",
        )
    teams = [Team(name=n) for n in names]
    db.add_all(teams)
    db.commit()
    for t in teams:
        db.refresh(t)
    return teams


def seed_default_teams(db: Session) -> List[Team]:
    """
    Insert default teams if not exists.
    Returns ONLY default teams (not entire DB).
    """

    existing_names = {
        name for (name,) in db.query(Team.name).all()
    }

    new_teams = [
        Team(name=n)
        for n in DEFAULT_TEAMS
        if n not in existing_names
    ]

    if new_teams:
        db.add_all(new_teams)
        db.commit()

    # ✅ Return ONLY seeded teams
    return (
        db.query(Team)
        .filter(Team.name.in_(DEFAULT_TEAMS))
        .order_by(Team.id)
        .all()
    )


def get_all_teams(db: Session) -> List[Team]:
    """Return all teams ordered by id."""
    return db.query(Team).order_by(Team.id).all()


def get_team_by_id(db: Session, team_id: int) -> Team:
    """Fetch a team by PK; raises 404 if not found."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id={team_id} not found.",
        )
    return team
