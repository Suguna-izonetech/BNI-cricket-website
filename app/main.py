"""
Unified Backend API
====================
Single entry point that merges:
  - Cricket Tournament Match Scheduling API  (sync SQLAlchemy)
  - User Form Submission API with MinIO      (async SQLAlchemy)

API route layout:
  GET  /                          → Root info
  GET  /health                    → Health probe (k8s / load-balancer)
  GET  /docs                      → Swagger UI
  GET  /redoc                     → ReDoc UI

  # Users module
  POST   /api/v1/users/           → Create user + upload photo
  GET    /api/v1/users/           → List users (paginated)
  GET    /api/v1/users/{id}       → Get user by UUID
  DELETE /api/v1/users/{id}       → Delete user + remove photo

  # Cricket module
  POST   /api/v1/cricket/teams/seed         → Seed 20 default teams
  POST   /api/v1/cricket/teams/bulk         → Bulk create teams
  POST   /api/v1/cricket/teams              → Create one team
  GET    /api/v1/cricket/teams              → List all teams
  POST   /api/v1/cricket/groups/assign      → Randomly assign teams to groups
  GET    /api/v1/cricket/groups             → List groups with teams
  POST   /api/v1/cricket/matches/generate   → Generate round-robin schedule
  GET    /api/v1/cricket/matches            → List all matches
  GET    /api/v1/cricket/matches/{group}    → Matches for one group
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings

# ── Models must be imported before table creation ─────────────────────────────
# Importing the package registers all ORM models with their Base metadata.
import app.models  # noqa: F401

from app.db.sync_session import sync_engine, SyncBase, SyncSessionLocal
from app.services.team_service import seed_default_teams
from app.services.minio_service import ensure_bucket_exists
from app.routers import cricket_router, users_router

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup / shutdown lifecycle.

    Startup:
      1. Create all sync (cricket) DB tables if they don't exist.
      2. Seed the 20 default cricket teams (idempotent).
      3. Create MinIO bucket with public-read policy if needed.

    Note: Async (users) tables are managed exclusively by Alembic migrations.
    """
    logger.info("=== Unified Backend starting up ===")

    # 1. Create cricket tables (sync engine, idempotent)
    SyncBase.metadata.create_all(bind=sync_engine)
    logger.info("[startup] Cricket tournament tables ready.")

    # 2. Seed default 20 teams
    db = SyncSessionLocal()
    try:
        seed_default_teams(db)
        logger.info("[startup] Default 20 cricket teams seeded (or already present).")
    finally:
        db.close()

    # 3. Ensure MinIO bucket exists
    try:
        ensure_bucket_exists()
        logger.info("[startup] MinIO bucket ready.")
    except Exception as e:
        logger.error(f"[startup] MinIO setup failed: {e} — continuing without MinIO.")

    yield  # ── Application runs here ──────────────────────────────────────────

    logger.info("=== Unified Backend shutting down ===")


# ── Application factory ───────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "**Unified Backend** combining:\n\n"
        "- 🏏 **Cricket Tournament API** — group & round-robin match scheduling\n"
        "- 👤 **User Form Submission API** — user registration with MinIO photo storage\n\n"
        "**Cricket workflow:**\n"
        "1. `POST /api/v1/cricket/teams/seed` — seed 20 teams (auto on startup)\n"
        "2. `POST /api/v1/cricket/groups/assign` — assign teams to 5 groups\n"
        "3. `POST /api/v1/cricket/matches/generate` — generate 30 round-robin matches\n"
        "4. `GET  /api/v1/cricket/matches` — view the full schedule\n\n"
        "**User workflow:**\n"
        "1. `POST /api/v1/users/` — submit form with photo (multipart)\n"
        "2. `GET  /api/v1/users/` — list registered users\n"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
# Cricket Tournament routes: /api/v1/cricket/teams, /groups, /matches
app.include_router(cricket_router, prefix="/api/v1/cricket")

# Users / Form Submission routes: /api/v1/users
app.include_router(users_router, prefix="/api/v1")


# ── Root & health endpoints ───────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    """Root endpoint — returns API info and available route prefixes."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "modules": {
            "users":   "/api/v1/users",
            "cricket": "/api/v1/cricket",
        },
    }


@app.get("/health", tags=["Health"])
async def health():
    """Kubernetes / load-balancer health probe."""
    return JSONResponse({"status": "healthy", "app": settings.APP_NAME})
