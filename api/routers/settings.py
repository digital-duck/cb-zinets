import asyncio

from fastapi import APIRouter
from pydantic import BaseModel

from api.config import settings

router = APIRouter()


class SettingsResponse(BaseModel):
    llm: str
    compare_cache_ttl: int
    spl_while_max_iter: int
    spl_max_llm_calls: int


class SettingsUpdate(BaseModel):
    llm: str | None = None
    compare_cache_ttl: int | None = None
    spl_while_max_iter: int | None = None
    spl_max_llm_calls: int | None = None


@router.get("/api/settings")
async def get_settings() -> SettingsResponse:
    return SettingsResponse(
        llm=settings.llm,
        compare_cache_ttl=settings.compare_cache_ttl,
        spl_while_max_iter=settings.spl_while_max_iter,
        spl_max_llm_calls=settings.spl_max_llm_calls,
    )


@router.put("/api/settings")
async def update_settings(body: SettingsUpdate) -> SettingsResponse:
    if body.llm is not None:
        settings.llm = body.llm
    if body.compare_cache_ttl is not None:
        settings.compare_cache_ttl = max(0, body.compare_cache_ttl)
    if body.spl_while_max_iter is not None:
        settings.spl_while_max_iter = max(1, body.spl_while_max_iter)
    if body.spl_max_llm_calls is not None:
        settings.spl_max_llm_calls = max(1, body.spl_max_llm_calls)
    return SettingsResponse(
        llm=settings.llm,
        compare_cache_ttl=settings.compare_cache_ttl,
        spl_while_max_iter=settings.spl_while_max_iter,
        spl_max_llm_calls=settings.spl_max_llm_calls,
    )


@router.get("/api/settings/ollama-models")
async def ollama_models() -> list[dict]:
    try:
        proc = await asyncio.create_subprocess_exec(
            "ollama", "list",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5)
        lines = stdout.decode().strip().split("\n")
        models = []
        for line in lines[1:]:
            parts = line.split()
            if parts:
                models.append({"value": parts[0], "label": parts[0]})
        models.sort(key=lambda m: m["label"])
        return models
    except Exception:
        return []
