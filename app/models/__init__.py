"""
Unified models package.

Importing this package registers all ORM models with their respective
metadata objects so that Alembic and create_all() can discover them.
"""
# Cricket Tournament models (sync / SyncBase)
from app.models.cricket_models import Team, Group, GroupTeam, Match  # noqa: F401

# Users model (async / AsyncBase)
from app.models.user_model import User  # noqa: F401

__all__ = ["Team", "Group", "GroupTeam", "Match", "User"]
