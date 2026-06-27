import asyncio

from fastapi import APIRouter
from pydantic import BaseModel

from api.config import settings

router = APIRouter()


class SettingsResponse(BaseModel):
    llm: str


class SettingsUpdate(BaseModel):
    llm: str


@router.get("/api/settings")
async def get_settings() -> SettingsResponse:
    return SettingsResponse(llm=settings.llm)


@router.put("/api/settings")
async def update_settings(body: SettingsUpdate) -> SettingsResponse:
    settings.llm = body.llm
    return SettingsResponse(llm=settings.llm)


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
