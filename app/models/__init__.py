"""
Unified models package.

Importing this package registers all ORM models with their respective
metadata objects so that Alembic and create_all() can discover them.
"""

from app.models.user_model import User

from app.models.cricket_models import (
    Team,
    Group,
    GroupTeam,
    Match
)

__all__ = ["Team", "Group", "GroupTeam", "Match", "User"]