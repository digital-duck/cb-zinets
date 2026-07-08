"""SQLite database for cb_zinets.

Tables (prefix cb_ to distinguish from zn_* ZiNets tables):
  cb_concepts           — cross-domain concept content cache
  cb_generation_tasks   — background task queue
  cb_users              — users with hashed passwords and roles
  cb_sessions           — session tokens (30-day expiry)
"""
from __future__ import annotations
import hashlib
import logging
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from api.config import settings

DB_PATH = settings.db_path  # from config.yaml (database.path); CB_DB_PATH overrides

_log = logging.getLogger(__name__)

_DDL = """\
CREATE TABLE IF NOT EXISTS cb_concepts (
    name         TEXT NOT NULL,
    level        TEXT NOT NULL,
    language     TEXT NOT NULL,
    model        TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TEXT NOT NULL,
    completed_at TEXT,
    content      TEXT,
    content_hash TEXT,
    PRIMARY KEY (name, level, language, model)
);

CREATE TABLE IF NOT EXISTS cb_generation_tasks (
    id           TEXT PRIMARY KEY,
    domain_id    TEXT NOT NULL,
    target       TEXT NOT NULL,
    level        TEXT NOT NULL DEFAULT 'intro',
    language     TEXT NOT NULL DEFAULT 'en',
    model        TEXT NOT NULL DEFAULT 'gemma4',
    skip_cache   INTEGER NOT NULL DEFAULT 0,
    kind         TEXT NOT NULL DEFAULT 'book',  -- 'book' (domain+target) or 'concept' (standalone primitive)
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TEXT NOT NULL,
    started_at   TEXT,
    completed_at TEXT,
    log          TEXT NOT NULL DEFAULT '',
    error        TEXT
);

CREATE TABLE IF NOT EXISTS cb_users (
    id            TEXT NOT NULL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT,
    role          TEXT NOT NULL DEFAULT 'viewer',
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    last_login    TEXT
);

CREATE TABLE IF NOT EXISTS cb_sessions (
    token       TEXT NOT NULL PRIMARY KEY,
    user_id     TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES cb_users(id)
);
"""

def _seed_admin(con: sqlite3.Connection) -> None:
    existing = con.execute("SELECT COUNT(*) FROM cb_users").fetchone()[0]
    if existing > 0:
        return
    password = settings.admin_password
    generated = password is None
    if generated:
        password = secrets.token_urlsafe(12)
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    con.execute(
        "INSERT INTO cb_users (id, username, role, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (str(uuid.uuid4()), "admin", "admin", dk.hex(), salt, datetime.now(timezone.utc).isoformat()),
    )
    if generated:
        _log.warning("Created default admin user — username: admin  password: %s (save this; not stored anywhere else)", password)
    else:
        _log.info("Created default admin user — username: admin  password: from CB_ADMIN_PASSWORD")


def _ensure_column(con: sqlite3.Connection, table: str, column: str, decl: str) -> None:
    """Add a column to an existing table if missing (migration for pre-existing DBs)."""
    cols = {row[1] for row in con.execute(f"PRAGMA table_info({table})")}
    if column not in cols:
        con.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")


def init_db(db_path: Path = DB_PATH) -> None:
    """Create the database file and tables if they don't already exist."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.executescript(_DDL)
    _ensure_column(con, "cb_generation_tasks", "skip_cache", "INTEGER NOT NULL DEFAULT 0")
    _ensure_column(con, "cb_generation_tasks", "kind", "TEXT NOT NULL DEFAULT 'book'")
    _seed_admin(con)
    con.commit()
    con.close()


def recover_stale_tasks(db_path: Path = DB_PATH) -> int:
    """Reset tasks stuck in 'running' from a previous server instance. Returns count."""
    con = sqlite3.connect(db_path)
    cur = con.execute(
        "UPDATE cb_generation_tasks SET status='failed', error='Server restarted during generation' "
        "WHERE status='running'"
    )
    count = cur.rowcount
    con.commit()
    con.close()
    return count
