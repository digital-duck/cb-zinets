"""Task queue API: POST /api/generate, GET /api/tasks/*, GET /api/tasks/{id}/stream."""
import asyncio
import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from api.services.task_worker import create_task, get_task, list_tasks, _LOGS_DIR

router = APIRouter()


class GenerateRequest(BaseModel):
    domain: str
    target: str
    level: str = "intro"
    language: str = "en"
    model: str = "gemma4"
    skip_cache: bool = False


@router.post("/api/generate")
async def enqueue_generate(body: GenerateRequest):
    """Queue a book generation job. Returns task_id immediately."""
    task_id = create_task(
        domain_id=body.domain,
        target=body.target,
        level=body.level,
        language=body.language,
        model=body.model,
    )
    return {"task_id": task_id}


@router.get("/api/tasks")
async def get_tasks(limit: int = 50):
    """List recent generation tasks, newest first."""
    return {"tasks": list_tasks(limit)}


@router.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Return the current status and metadata for a task (no log body)."""
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    task_out = {k: v for k, v in task.items() if k != "log"}
    return task_out


@router.get("/api/tasks/{task_id}/stream")
async def stream_task(task_id: str, request: Request):
    """SSE stream of log lines for a task. Reconnect-safe: replays full log on reconnect."""

    async def gen():
        cursor = 0
        while True:
            if await request.is_disconnected():
                break

            task = get_task(task_id)
            if task is None:
                yield {"event": "gen_error", "data": json.dumps({"message": "Task not found"})}
                break

            # Stream any new log content since last iteration
            log = task["log"] or ""
            if len(log) > cursor:
                new_content = log[cursor:]
                cursor = len(log)
                for line in new_content.splitlines():
                    if line:
                        yield {"event": "log", "data": json.dumps({"message": line})}

            status = task["status"]
            if status == "done":
                yield {
                    "event": "done",
                    "data": json.dumps({
                        "domain": task["domain_id"],
                        "target": task["target"],
                        "model": task["model"],
                        "log_url": f"/api/tasks/{task_id}/log",
                    }),
                }
                break
            elif status == "failed":
                yield {
                    "event": "gen_error",
                    "data": json.dumps({"message": task["error"] or "Generation failed"}),
                }
                break

            await asyncio.sleep(0.5)

    return EventSourceResponse(gen())


@router.get("/api/tasks/{task_id}/log")
async def get_task_log(task_id: str):
    """Return raw log text for a task (from file if written, otherwise from DB)."""
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    created_at = task.get("created_at", "")
    ts = created_at[:19].replace('-', '').replace('T', '-').replace(':', '')
    log_path = _LOGS_DIR / f"{task['domain_id']}-{ts}.txt"

    if log_path.exists():
        content = log_path.read_text(encoding="utf-8")
    else:
        content = task.get("log") or ""

    return PlainTextResponse(content, media_type="text/plain; charset=utf-8")
