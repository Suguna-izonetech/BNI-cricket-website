"""
SQLAlchemy ORM models for Cricket Tournament module
"""

from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    group_teams = relationship("GroupTeam", back_populates="team")
    home_matches = relationship("Match", foreign_keys="Match.team1_id", back_populates="team1")
    away_matches = relationship("Match", foreign_keys="Match.team2_id", back_populates="team2")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), unique=True, nullable=False)

    group_teams = relationship("GroupTeam", back_populates="group")
    matches = relationship("Match", back_populates="group")


class GroupTeam(Base):
    __tablename__ = "group_teams"

    __table_args__ = (
        UniqueConstraint("group_id", "team_id", name="uq_group_team"),
    )

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    group = relationship("Group", back_populates="group_teams")
    team = relationship("Team", back_populates="group_teams")


class Match(Base):
    __tablename__ = "matches"

    __table_args__ = (
        UniqueConstraint("team1_id", "team2_id", "group_id", name="uq_match"),
    )

    id = Column(Integer, primary_key=True, index=True)
    match_number = Column(Integer, nullable=False)

    team1_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team2_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team1 = relationship("Team", foreign_keys=[team1_id], back_populates="home_matches")
    team2 = relationship("Team", foreign_keys=[team2_id], back_populates="away_matches")
    group = relationship("Group", back_populates="matches")