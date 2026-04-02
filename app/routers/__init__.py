"""
Routers package — exports one APIRouter per domain.

Mounting in main.py:
    app.include_router(cricket_router, prefix="/api/v1/cricket")
    app.include_router(users_router,   prefix="/api/v1")
"""
from fastapi import APIRouter

from app.routers.cricket_teams   import router as teams_router
from app.routers.cricket_groups  import router as groups_router
from app.routers.cricket_matches import router as matches_router
from app.routers.users           import router as users_router

# Cricket sub-routers are composed into one parent router so main.py
# only needs to mount a single cricket router.
cricket_router = APIRouter()
cricket_router.include_router(teams_router)
cricket_router.include_router(groups_router)
cricket_router.include_router(matches_router)

__all__ = ["cricket_router", "users_router"]
