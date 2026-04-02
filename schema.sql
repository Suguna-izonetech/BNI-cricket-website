-- ═══════════════════════════════════════════════════════════════════════════════
-- Unified Backend — Final SQL Schema
-- Database: unified_db (PostgreSQL 16)
--
-- Tables:
--   users        → Users module (Form Submission + MinIO photo storage)
--   teams        → Cricket module
--   groups       → Cricket module
--   group_teams  → Cricket module (many-to-many join)
--   matches      → Cricket module
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension (required for users.id)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT                     NOT NULL,
    photo_url   TEXT                     NOT NULL,
    business    TEXT                     NOT NULL,
    category    TEXT                     NOT NULL,
    phone_no    VARCHAR(20)              NOT NULL,
    team_name   TEXT,
    role        TEXT,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ix_users_created_at ON users (created_at);


-- ── Teams ─────────────────────────────────────────────────────────────────────
CREATE TABLE teams (
    id   SERIAL       PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE INDEX ix_teams_id   ON teams (id);
CREATE INDEX ix_teams_name ON teams (name);


-- ── Groups ────────────────────────────────────────────────────────────────────
CREATE TABLE groups (
    id   SERIAL      PRIMARY KEY,
    name VARCHAR(10) NOT NULL UNIQUE   -- 'A', 'B', 'C', 'D', 'E'
);

CREATE INDEX ix_groups_id ON groups (id);


-- ── GroupTeams (many-to-many: groups ↔ teams) ────────────────────────────────
CREATE TABLE group_teams (
    id       SERIAL  PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    team_id  INTEGER NOT NULL REFERENCES teams(id)  ON DELETE CASCADE,
    CONSTRAINT uq_group_team UNIQUE (group_id, team_id)
);

CREATE INDEX ix_group_teams_id ON group_teams (id);


-- ── Matches ───────────────────────────────────────────────────────────────────
CREATE TABLE matches (
    id           SERIAL                   PRIMARY KEY,
    match_number INTEGER                  NOT NULL,
    team1_id     INTEGER                  NOT NULL REFERENCES teams(id)  ON DELETE RESTRICT,
    team2_id     INTEGER                  NOT NULL REFERENCES teams(id)  ON DELETE RESTRICT,
    group_id     INTEGER                  NOT NULL REFERENCES groups(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_match UNIQUE (team1_id, team2_id, group_id)
);

CREATE INDEX ix_matches_id ON matches (id);


-- ── updated_at auto-update trigger (users table) ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
