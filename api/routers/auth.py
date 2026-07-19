from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Header, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from api.config import settings
from api.services.auth_svc import login_user, login_oauth_user, logout, get_user_by_token

router = APIRouter()

# Google OAuth — same OAuth client (and callback path) as zinets_vis.
# Requires SessionMiddleware in app.py for the state/nonce cookie.
_oauth = None
if settings.google_client_id and settings.google_client_secret:
    from authlib.integrations.starlette_client import OAuth

    _oauth = OAuth()
    _oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


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


@router.get("/api/auth/providers")
async def api_providers():
    """Which login methods the frontend should offer."""
    return {"password": True, "google": _oauth is not None}


@router.get("/api/auth/google/login")
async def google_login(request: Request):
    if _oauth is None:
        raise HTTPException(status_code=503, detail="Google OAuth not configured (set CB_GOOGLE_CLIENT_ID / CB_GOOGLE_CLIENT_SECRET)")
    return await _oauth.google.authorize_redirect(
        request, settings.google_redirect_uri, prompt="select_account"
    )


@router.get("/api/auth/google/callback")
async def google_callback(request: Request):
    if _oauth is None:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    from authlib.integrations.starlette_client import OAuthError

    try:
        token = await _oauth.google.authorize_access_token(request)
        info = token.get("userinfo") or {}
        if not info.get("sub") or not info.get("email"):
            raise HTTPException(status_code=400, detail="Google did not return an email")
        user = login_oauth_user(
            provider="google",
            oauth_id=info["sub"],
            email=info["email"],
            display_name=info.get("name"),
            avatar_url=info.get("picture"),
        )
        return RedirectResponse(url=f"{settings.frontend_url}#/auth/callback?token={user['token']}")
    except OAuthError as e:
        return RedirectResponse(url=f"{settings.frontend_url}#/login?error={quote(str(e))}")
