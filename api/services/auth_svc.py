"""DB-based auth: password hashing, session tokens, user lookup."""
from __future__ import annotations
import hashlib
import secrets
import sqlite3
from datetime import datetime, timezone, timedelta

from api.services.db import DB_PATH


def _con() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return dk.hex(), salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    dk, _ = hash_password(password, salt)
    return secrets.compare_digest(dk, stored_hash)


def get_user_by_token(token: str) -> dict | None:
    con = _con()
    now = datetime.now(timezone.utc).isoformat()
    row = con.execute(
        """SELECT u.id, u.username, u.role, u.email
           FROM cb_sessions s JOIN cb_users u ON s.user_id = u.id
           WHERE s.token = ? AND s.expires_at > ?""",
        (token, now),
    ).fetchone()
    con.close()
    return dict(row) if row else None


def login_user(username: str, password: str) -> dict | None:
    con = _con()
    row = con.execute(
        "SELECT id, username, role, password_hash, salt FROM cb_users WHERE username = ?",
        (username,),
    ).fetchone()
    if not row or not verify_password(password, row["password_hash"], row["salt"]):
        con.close()
        return None

    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=30)).isoformat()
    con.execute(
        "INSERT INTO cb_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (token, row["id"], now.isoformat(), expires),
    )
    con.execute("UPDATE cb_users SET last_login = ? WHERE id = ?", (now.isoformat(), row["id"]))
    con.commit()
    con.close()
    return {"id": row["id"], "username": row["username"], "role": row["role"], "token": token}


def logout(token: str) -> None:
    con = _con()
    con.execute("DELETE FROM cb_sessions WHERE token = ?", (token,))
    con.commit()
    con.close()
