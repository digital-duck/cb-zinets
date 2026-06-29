"""SQLite database for cb_zinets.

Tables (prefix cb_ to distinguish from zn_* ZiNets tables):
  cb_concepts           — cross-domain concept content cache
  cb_generation_tasks   — (Phase 2) background task queue
"""
from __future__ import annotations
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "db" / "cb_zinets.sqlite"

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
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TEXT NOT NULL,
    started_at   TEXT,
    completed_at TEXT,
    log          TEXT NOT NULL DEFAULT '',
    error        TEXT
);
"""


def init_db(db_path: Path = DB_PATH) -> None:
    """Create the database file and tables if they don't already exist."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(db_path)
    con.executescript(_DDL)
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
