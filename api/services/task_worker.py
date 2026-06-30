"""Background task worker: pulls pending cb_generation_tasks from SQLite and runs spl3.

A single asyncio.Task is launched in the FastAPI lifespan. It processes tasks one at a
time (serial queue). The subprocess continues even if the SSE client disconnects, and
mark_book_generated() is always called on success.
"""
import asyncio
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from api.services.db import DB_PATH
from api.services.executor import _build_spl_cmd, _get_output_dir, _SPL_DIR

_LOGS_DIR = Path(__file__).parent.parent.parent / "logs"

_POLL_INTERVAL = 2.0  # seconds between polls when queue is empty


# ── Task CRUD ─────────────────────────────────────────────────────────────────

def create_task(
    domain_id: str,
    target: str,
    level: str,
    language: str,
    model: str,
) -> str:
    """Insert a pending task row. Returns the new task ID."""
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    initial_log = f"▶ Queued  target={target}  model={model}  level={level}  lang={language}\n"
    con = sqlite3.connect(DB_PATH)
    con.execute(
        """INSERT INTO cb_generation_tasks
           (id, domain_id, target, level, language, model, status, created_at, log)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (task_id, domain_id, target, level, language, model, "pending", now, initial_log),
    )
    con.commit()
    con.close()
    return task_id


def get_task(task_id: str) -> dict | None:
    """Fetch a task row by ID. Returns None if not found."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    row = con.execute(
        "SELECT * FROM cb_generation_tasks WHERE id=?", (task_id,)
    ).fetchone()
    con.close()
    return dict(row) if row else None


def list_tasks(limit: int = 50) -> list[dict]:
    """Return the most recent tasks, newest first."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT id, domain_id, target, level, language, model, status, created_at, started_at, completed_at, error "
        "FROM cb_generation_tasks ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    con.close()
    return [dict(r) for r in rows]


# ── Worker internals ──────────────────────────────────────────────────────────

def _claim_next_task() -> dict | None:
    """Atomically claim the oldest pending task. Returns None if queue is empty."""
    now = datetime.now(timezone.utc).isoformat()
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        row = con.execute(
            "SELECT * FROM cb_generation_tasks WHERE status='pending' ORDER BY created_at LIMIT 1"
        ).fetchone()
        if row is None:
            return None
        con.execute(
            "UPDATE cb_generation_tasks SET status='running', started_at=? WHERE id=?",
            (now, row["id"]),
        )
        con.commit()
        return dict(row)
    except Exception:
        con.rollback()
        return None
    finally:
        con.close()


def _append_log(task_id: str, line: str) -> None:
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "UPDATE cb_generation_tasks SET log = log || ? WHERE id=?",
        (line + "\n", task_id),
    )
    con.commit()
    con.close()


def _complete_task(task_id: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "UPDATE cb_generation_tasks SET status='done', completed_at=? WHERE id=?",
        (now, task_id),
    )
    con.commit()
    con.close()


def _fail_task(task_id: str, error: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    con = sqlite3.connect(DB_PATH)
    con.execute(
        "UPDATE cb_generation_tasks SET status='failed', completed_at=?, error=? WHERE id=?",
        (now, error, task_id),
    )
    con.commit()
    con.close()


def _write_log_file(task_id: str, domain_id: str, created_at: str) -> Path:
    """Write full task log from DB to logs/{domain_id}-{ts}.txt. Returns the path."""
    _LOGS_DIR.mkdir(exist_ok=True)
    # 2026-06-28T12:34:56.789+00:00 → 20260628-123456
    ts = created_at[:19].replace('-', '').replace('T', '-').replace(':', '')
    log_path = _LOGS_DIR / f"{domain_id}-{ts}.txt"
    con = sqlite3.connect(DB_PATH)
    row = con.execute("SELECT log FROM cb_generation_tasks WHERE id=?", (task_id,)).fetchone()
    con.close()
    log_path.write_text(row[0] if row and row[0] else "", encoding="utf-8")
    return log_path


async def _execute_task(task: dict) -> None:
    """Run spl3 for the task, streaming log lines into the DB row."""
    domain_id = task["domain_id"]
    target = task["target"]
    level = task["level"]
    language = task["language"]
    model = task["model"]
    task_id = task["id"]

    output_dir = _get_output_dir(domain_id, level, language, model)
    output_dir.mkdir(parents=True, exist_ok=True)

    # skip_cache is not persisted in the task row — default False for queued tasks
    cmd, spl_env = _build_spl_cmd(domain_id, target, level, language, model, output_dir)

    _append_log(task_id, f"▶ Starting spl3  output_dir={output_dir}")

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(_SPL_DIR),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=spl_env,
    )

    assert proc.stdout is not None
    async for raw in proc.stdout:
        line = raw.decode(errors="replace").rstrip()
        if line:
            _append_log(task_id, line)

    await proc.wait()

    if proc.returncode == 0:
        from api.services.catalog_svc import mark_book_generated
        mark_book_generated(domain_id, target, level, language, model)
        _append_log(task_id, "✓ Done")
        _complete_task(task_id)
    else:
        msg = f"spl3 exited {proc.returncode}"
        _append_log(task_id, f"✗ {msg}")
        _fail_task(task_id, msg)

    _write_log_file(task_id, domain_id, task["created_at"])


# ── Worker loop ───────────────────────────────────────────────────────────────

async def run_worker() -> None:
    """Background worker. Runs up to settings.task_max_concurrent tasks in parallel."""
    from api.config import settings
    sem = asyncio.Semaphore(settings.task_max_concurrent)
    active: set[asyncio.Task] = set()

    async def _run_one(task: dict) -> None:
        async with sem:
            try:
                await _execute_task(task)
            except Exception as exc:
                _fail_task(task["id"], str(exc))

    while True:
        # Drain finished tasks from the active set
        active = {t for t in active if not t.done()}

        if len(active) < settings.task_max_concurrent:
            task = _claim_next_task()
            if task is not None:
                t = asyncio.create_task(_run_one(task))
                active.add(t)
                continue  # immediately try to claim another

        await asyncio.sleep(_POLL_INTERVAL)
