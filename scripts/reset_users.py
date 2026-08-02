#!/usr/bin/env python3
"""One-shot script to wipe all users/sessions and create the two dev accounts.

Usage (from repo root, spl123 env):
    python scripts/reset_users.py
"""
import hashlib
import secrets
import sqlite3
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cb_config import DB_PATH

USERS = [
    {"username": "zinets_00", "password": "<INITIAL_VALUE>", "role": "admin"},
    {"username": "zinets_10", "password": "<INITIAL_VALUE>", "role": "viewer"},
]


def hash_password(password: str) -> tuple[str, str]:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return dk.hex(), salt


def main() -> None:
    con = sqlite3.connect(DB_PATH)
    con.execute("DELETE FROM cb_sessions")
    con.execute("DELETE FROM cb_users")
    now = datetime.now(timezone.utc).isoformat()
    for u in USERS:
        pw_hash, salt = hash_password(u["password"])
        con.execute(
            "INSERT INTO cb_users (id, username, role, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), u["username"], u["role"], pw_hash, salt, now),
        )
        print(f"  created  {u['username']}  role={u['role']}")
    con.commit()
    con.close()
    print("Done.")


if __name__ == "__main__":
    main()
