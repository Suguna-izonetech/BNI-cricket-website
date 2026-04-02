# Unified Backend API

A production-ready FastAPI backend that merges two independent projects into a single, clean codebase with one shared PostgreSQL database.

---

## Modules

| Module | Description | Route Prefix |
|--------|-------------|--------------|
| **Users** | Form submission with MinIO photo uploads | `/api/v1/users` |
| **Cricket Tournament** | Group assignment + round-robin scheduling | `/api/v1/cricket` |

---

## Project Structure

```
unified_backend/
├── app/
│   ├── core/
│   │   └── config.py              # Unified pydantic-settings config
│   ├── db/
│   │   ├── sync_session.py        # Sync SQLAlchemy (Cricket module)
│   │   └── async_session.py       # Async SQLAlchemy (Users module)
│   ├── models/
│   │   ├── cricket_models.py      # Team, Group, GroupTeam, Match
│   │   └── user_model.py          # User
│   ├── schemas/
│   │   ├── cricket_schemas.py     # Cricket Pydantic schemas
│   │   └── user_schemas.py        # User Pydantic schemas
│   ├── routers/
│   │   ├── cricket_teams.py       # /api/v1/cricket/teams
│   │   ├── cricket_groups.py      # /api/v1/cricket/groups
│   │   ├── cricket_matches.py     # /api/v1/cricket/matches
│   │   └── users.py               # /api/v1/users
│   ├── services/
│   │   ├── team_service.py        # Cricket team business logic
│   │   ├── group_service.py       # Cricket group business logic
│   │   ├── match_service.py       # Cricket match business logic
│   │   └── minio_service.py       # MinIO upload/delete
│   ├── crud/
│   │   └── user.py                # Async user DB operations
│   ├── utils/
│   │   └── helpers.py             # Shared utilities
│   └── main.py                    # Single unified entry point
├── alembic/
│   ├── env.py                     # Merged Alembic env (both metadata)
│   └── versions/
│       └── 0001_unified_initial.py  # Creates all 5 tables
├── tests/
│   ├── conftest.py                # Sync + async test fixtures
│   ├── test_cricket_teams.py
│   ├── test_cricket_groups_matches.py
│   └── test_users.py
├── schema.sql                     # Final unified SQL schema
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## Merge Decisions

| Conflict | Decision |
|----------|----------|
| Two separate databases | Single `unified_db` — all 5 tables coexist (no name conflicts) |
| Sync vs Async SQLAlchemy | Both coexist: `SyncBase` (cricket), `AsyncBase` (users), separate session files |
| Different config systems | Unified `pydantic-settings` `Settings` class |
| Two `main.py` files | Single `main.py` with merged lifespan (seeds teams + ensures MinIO bucket) |
| Route conflicts (`/health`, `/`) | Single `/health`; cricket under `/api/v1/cricket/`, users under `/api/v1/users/` |
| Different requirements | De-duplicated; pinned to latest compatible versions |
| Two Alembic setups | Single `alembic/env.py` with merged metadata from both bases |

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
# 1. Clone / place project files
cd unified_backend

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your secrets if needed

# 3. Start all services (Postgres + MinIO + API)
docker compose up --build

# API:          http://localhost:8000
# Swagger UI:   http://localhost:8000/docs
# MinIO UI:     http://localhost:9001  (admin / minioadmin)
```

### Option B — Local Development

```bash
# 1. Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start infrastructure
docker compose up postgres minio -d

# 4. Copy and configure .env
cp .env.example .env
# Set POSTGRES_HOST=localhost, MINIO_ENDPOINT=localhost:9000

# 5. Run Alembic migrations (creates all tables)
alembic upgrade head

# 6. Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> On startup, the app automatically:
> - Creates cricket tables (idempotent)
> - Seeds 20 default cricket teams
> - Creates the MinIO bucket with public-read policy

---

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Root info + module URLs |
| GET | `/health` | Health probe |

### Users (`/api/v1/users`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/users/` | Create user with photo (multipart form) |
| GET | `/api/v1/users/` | List users (paginated: `?page=1&page_size=20`) |
| GET | `/api/v1/users/{id}` | Get user by UUID |
| DELETE | `/api/v1/users/{id}` | Delete user + remove photo from MinIO |

### Cricket Tournament (`/api/v1/cricket`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/cricket/teams/seed` | Seed 20 default teams (auto on startup) |
| POST | `/api/v1/cricket/teams` | Create one team |
| POST | `/api/v1/cricket/teams/bulk` | Create multiple teams |
| GET | `/api/v1/cricket/teams` | List all teams |
| POST | `/api/v1/cricket/groups/assign` | Randomly assign 20 teams into 5 groups |
| GET | `/api/v1/cricket/groups` | List all groups with their teams |
| POST | `/api/v1/cricket/matches/generate` | Generate 30 round-robin matches |
| GET | `/api/v1/cricket/matches` | List all 30 matches |
| GET | `/api/v1/cricket/matches/{group}` | Matches for one group (A–E) |

#### Cricket Workflow

```
1. POST /api/v1/cricket/teams/seed         ← already done on startup
2. POST /api/v1/cricket/groups/assign      ← randomly assigns 20 teams to 5 groups
3. POST /api/v1/cricket/matches/generate   ← generates 30 round-robin matches
4. GET  /api/v1/cricket/matches            ← view the full schedule
```

---

## Running Tests

```bash
# Install test extras (already in requirements.txt)
pip install pytest pytest-asyncio httpx aiosqlite

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run only cricket tests
pytest tests/test_cricket_teams.py tests/test_cricket_groups_matches.py

# Run only users tests
pytest tests/test_users.py
```

Tests use in-memory SQLite — no live PostgreSQL or MinIO required.

---

## Database Migrations

```bash
# Apply all migrations (run this before first start)
alembic upgrade head

# Check current revision
alembic current

# Autogenerate a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Roll back one step
alembic downgrade -1

# Roll back all
alembic downgrade base
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | `Unified Backend API` | Application name |
| `DEBUG` | `false` | Enable SQL echo and debug logging |
| `APP_ENV` | `development` | Environment name |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | `unified_db` | Database name |
| `MINIO_ENDPOINT` | `localhost:9000` | MinIO S3 endpoint |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `user-photos` | Bucket for user photos |
| `MINIO_USE_SSL` | `false` | Use HTTPS for MinIO |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | Public URL for photo links |
| `MAX_FILE_SIZE_MB` | `5` | Max photo upload size |
| `ALLOWED_MIME_TYPES` | `["image/jpeg","image/png","image/webp"]` | Accepted image types |
| `ALLOWED_ORIGINS` | `["*"]` | CORS allowed origins |
