from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.sync_session import SyncBase


# -------------------------
# Team
# -------------------------
class Team(SyncBase):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)

    group_teams = relationship("GroupTeam", back_populates="team")
    home_matches = relationship(
        "Match",
        foreign_keys="Match.team1_id",
        back_populates="team1"
    )
    away_matches = relationship(
        "Match",
        foreign_keys="Match.team2_id",
        back_populates="team2"
    )

    def __repr__(self):
        return f"<Team id={self.id} name={self.name!r}>"


# -------------------------
# Group
# -------------------------
class Group(SyncBase):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), unique=True, nullable=False)

    group_teams = relationship("GroupTeam", back_populates="group")
    matches = relationship("Match", back_populates="group")

    def __repr__(self):
        return f"<Group id={self.id} name={self.name!r}>"


# -------------------------
# GroupTeam
# -------------------------
class GroupTeam(SyncBase):
    __tablename__ = "group_teams"
    __table_args__ = (
        UniqueConstraint("group_id", "team_id", name="uq_group_team"),
    )

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    group = relationship("Group", back_populates="group_teams")
    team = relationship("Team", back_populates="group_teams")

    def __repr__(self):
        return f"<GroupTeam group_id={self.group_id} team_id={self.team_id}>"


# -------------------------
# Match
# -------------------------
class Match(SyncBase):
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
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    team1 = relationship("Team", foreign_keys=[team1_id], back_populates="home_matches")
    team2 = relationship("Team", foreign_keys=[team2_id], back_populates="away_matches")
    group = relationship("Group", back_populates="matches")

    def __repr__(self):
        return (
            f"<Match #{self.match_number} "
            f"{self.team1_id} vs {self.team2_id} "
            f"group={self.group_id}>"
        )