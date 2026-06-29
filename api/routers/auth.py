from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from api.services.auth_svc import login_user, logout, get_user_by_token

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


def _require_token(x_cb_token: str | None) -> dict:
    if not x_cb_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = get_user_by_token(x_cb_token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return user


@router.post("/api/auth/login")
async def api_login(req: LoginRequest):
    user = login_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"token": user["token"], "user": {"id": user["id"], "username": user["username"], "role": user["role"]}}


@router.post("/api/auth/logout")
async def api_logout(x_cb_token: str | None = Header(default=None)):
    if x_cb_token:
        logout(x_cb_token)
    return {"ok": True}


@router.get("/api/auth/me")
async def api_me(x_cb_token: str | None = Header(default=None)):
    return _require_token(x_cb_token)
