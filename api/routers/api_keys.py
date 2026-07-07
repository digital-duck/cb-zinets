"""LLM provider API key management — see api/services/api_keys_svc.py."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services import api_keys_svc

router = APIRouter()


class ApiKeyUpdate(BaseModel):
    provider: str
    api_key: str


@router.get("/api/settings/api-keys")
async def get_api_keys() -> dict:
    return api_keys_svc.get_status()


@router.put("/api/settings/api-keys")
async def put_api_key(body: ApiKeyUpdate) -> dict:
    try:
        return api_keys_svc.set_key(body.provider, body.api_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/api/settings/api-keys/{provider}")
async def delete_api_key(provider: str) -> dict:
    try:
        api_keys_svc.clear_key(provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True}
