"""DB-based auth: password hashing, session tokens, user lookup."""
from __future__ import annotations
import hashlib
import secrets
import sqlite3
import uuid
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


def _create_session(con: sqlite3.Connection, user_id: str) -> str:
    """Insert a 30-day session row and stamp last_login. Caller commits."""
    token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=30)).isoformat()
    con.execute(
        "INSERT INTO cb_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (token, user_id, now.isoformat(), expires),
    )
    con.execute("UPDATE cb_users SET last_login = ? WHERE id = ?", (now.isoformat(), user_id))
    return token


def login_user(username: str, password: str) -> dict | None:
    con = _con()
    row = con.execute(
        "SELECT id, username, role, password_hash, salt FROM cb_users WHERE username = ?",
        (username,),
    ).fetchone()
    if not row or not row["password_hash"] or not verify_password(password, row["password_hash"], row["salt"]):
        con.close()
        return None

    token = _create_session(con, row["id"])
    con.commit()
    con.close()
    return {"id": row["id"], "username": row["username"], "role": row["role"], "token": token}


def login_oauth_user(
    provider: str,
    oauth_id: str,
    email: str,
    display_name: str | None = None,
    avatar_url: str | None = None,
) -> dict:
    """Create or update a user from an OAuth provider, then open a session.

    Matching order: (provider, oauth_id) → existing email (links a local
    account to Google) → new user with role 'viewer' and no password.
    """
    con = _con()
    now = datetime.now(timezone.utc).isoformat()

    row = con.execute(
        "SELECT id, username, role FROM cb_users WHERE oauth_provider = ? AND oauth_id = ?",
        (provider, oauth_id),
    ).fetchone()

    if not row and email:
        row = con.execute("SELECT id, username, role FROM cb_users WHERE email = ?", (email,)).fetchone()
        if row:
            con.execute(
                "UPDATE cb_users SET oauth_provider = ?, oauth_id = ? WHERE id = ?",
                (provider, oauth_id, row["id"]),
            )

    if row:
        con.execute(
            "UPDATE cb_users SET email = ?, display_name = ?, avatar_url = ? WHERE id = ?",
            (email, display_name, avatar_url, row["id"]),
        )
        user = {"id": row["id"], "username": row["username"], "role": row["role"]}
    else:
        user_id = str(uuid.uuid4())
        base = (email.split("@")[0] if email else provider) or provider
        username = base
        if con.execute("SELECT 1 FROM cb_users WHERE username = ?", (username,)).fetchone():
            username = f"{base}-{secrets.token_hex(3)}"
        con.execute(
            """INSERT INTO cb_users (id, username, email, role, password_hash, salt, created_at,
                                     oauth_provider, oauth_id, display_name, avatar_url)
               VALUES (?, ?, ?, 'viewer', '', '', ?, ?, ?, ?, ?)""",
            (user_id, username, email, now, provider, oauth_id, display_name, avatar_url),
        )
        user = {"id": user_id, "username": username, "role": "viewer"}

    token = _create_session(con, user["id"])
    con.commit()
    con.close()
    user["token"] = token
    return user


def logout(token: str) -> None:
    con = _con()
    con.execute("DELETE FROM cb_sessions WHERE token = ?", (token,))
    con.commit()
    con.close()
