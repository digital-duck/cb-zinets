"""Repo-level configuration — single accessor for config.yaml and shared paths.

The shared Python modules live in scripts/; the repo root is one level up.
Settings that must be editable without touching code (currently the SQLite
database path) live in config.yaml under their own key. Defaults here keep
everything working when the key is absent.

    database:
      path: db/cbzinets.sqlite3     # relative to the repo root

Consumers: pinyin_lib.DEFAULT_DB_PATH, catalog_lib.DB_PATH, api.config
(Settings.db_path default — still overridable via the CB_DB_PATH env var),
scripts, and tests.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "config.yaml"

_DEFAULT_DB = "db/cbzinets.sqlite3"


def _load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    import yaml
    return yaml.safe_load(CONFIG_PATH.read_text(encoding="utf-8")) or {}


def db_path() -> Path:
    """SQLite database path from config.yaml (database.path), repo-root relative."""
    rel = (_load_config().get("database") or {}).get("path", _DEFAULT_DB)
    p = Path(rel)
    return p if p.is_absolute() else ROOT / p


DB_PATH = db_path()
