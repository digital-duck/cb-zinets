# Deploying cb-zinets as a Web Portal (Pilot)

Status: recommendations written 2026-07-19, alongside the Google OAuth login feature.
Audience: single-operator pilot deployment for a small invited group (reviewers,
teachers, early learners).

---

## 1. What exists today

| Layer | Current state | Pilot-ready? |
|-------|---------------|--------------|
| Frontend | Vite + vanilla JS, hash router, login page (password + Google) | Yes |
| Auth | `cb_users`/`cb_sessions` in SQLite; PBKDF2 passwords; 30-day opaque tokens via `X-CB-Token`; Google OAuth (authlib) | Yes, with fixes below |
| API | FastAPI + background task worker (max 2 concurrent generations) | Mostly |
| Data | Two SQLite files (`db/…sqlite3` app DB, ZiNets source DB read-only) | Yes |
| Static hosting | GitHub Pages build with `VITE_PUBLIC_READONLY=true` (viewer only, no backend) | Already live |

### Google OAuth (added 2026-07-19)

- Backend: `GET /api/auth/google/login` → Google consent → `GET /api/auth/google/callback`
  → creates/links a `cb_users` row (role `viewer`, links by email to existing accounts)
  → opens a normal `cb_sessions` token → redirects to `{CB_FRONTEND_URL}#/auth/callback?token=…`.
- Frontend: "Continue with Google" button appears only when `GET /api/auth/providers`
  reports `google: true`.
- Config (`.env`, prefix `CB_`, see `.env.example`):

  ```bash
  CB_GOOGLE_CLIENT_ID=…apps.googleusercontent.com   # same OAuth client as zinets_vis
  CB_GOOGLE_CLIENT_SECRET=GOCSPX-…
  CB_GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback  # default
  CB_FRONTEND_URL=http://localhost:5173/cb-zinets/                       # default
  CB_SESSION_SECRET=<any long random string>        # fix it in prod (OAuth state cookie)
  ```

- The real client ID/secret are **not** in the zinets_vis repo (only placeholders in
  `cicd/backend/.env.production` and the OAuth setup docs). Copy them from
  Google Cloud Console → APIs & Services → Credentials, or from the deployed
  zinets_vis server's env.
- The dev callback path/port matches zinets_vis (`http://localhost:8000/api/auth/google/callback`),
  so the OAuth client's existing authorized redirect URI works unchanged for local dev.
  For the portal, add the production callback, e.g.
  `https://portal.example.com/api/auth/google/callback`, to the same OAuth client.
- Dependencies: `authlib`, `itsdangerous`, `httpx` (in `requirements-api.txt`;
  already installed in the `spl123` conda env).

---

## 2. Must-fix before exposing to the internet

Ordered by risk.

### 2.1 Server-side auth on all API routes (critical)

Today only `/api/auth/*` validates tokens. **Every other endpoint — generation,
tasks, settings, chat, and `/api/keys` (LLM API keys!) — is unauthenticated**;
the login screen is a frontend-only gate. Anyone who finds the API origin can
generate books on your LLM budget or read/write API keys.

Recommended: a FastAPI dependency applied per-router, so the read-only viewer
endpoints can stay public if desired:

```python
# api/deps.py
from fastapi import Header, HTTPException
from api.services.auth_svc import get_user_by_token

async def require_user(x_cb_token: str | None = Header(default=None)) -> dict:
    user = x_cb_token and get_user_by_token(x_cb_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(user: dict = Depends(require_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user
```

```python
# api/app.py — suggested tiers
app.include_router(domains.router)                                        # public (viewer)
app.include_router(browse.router)                                         # public (viewer)
app.include_router(generate.router, dependencies=[Depends(require_user)]) # costs money
app.include_router(tasks.router,    dependencies=[Depends(require_user)])
app.include_router(chat.router,     dependencies=[Depends(require_user)])
app.include_router(compare.router,  dependencies=[Depends(require_user)])
app.include_router(phrase.router,   dependencies=[Depends(require_user)])
app.include_router(pdf.router,      dependencies=[Depends(require_user)])
app.include_router(settings.router, dependencies=[Depends(require_admin)])
app.include_router(api_keys.router, dependencies=[Depends(require_admin)])
```

This also puts the `viewer`/`admin` role column to work: pilot users sign in
with Google and land as `viewer` (can read + generate); only `admin` touches
settings and API keys. Promote a user with one SQL statement:
`UPDATE cb_users SET role='admin' WHERE email='…';`

### 2.2 Lock down CORS

`allow_origins=["*"]` is fine locally, wrong on the internet:

```python
app.add_middleware(CORSMiddleware,
    allow_origins=[app_settings.frontend_url.rstrip("/").rsplit("/", 1)[0]],  # or an explicit list
    allow_methods=["*"], allow_headers=["*"])
```

If the frontend and API share one origin behind a reverse proxy (recommended,
§3), you can drop CORS almost entirely.

### 2.3 HTTPS + fixed secrets

- Terminate TLS at a reverse proxy (Caddy is the least-effort choice; automatic
  Let's Encrypt).
- Set `CB_SESSION_SECRET` to a fixed value so OAuth logins survive API restarts
  mid-flow.
- Set `CB_ADMIN_PASSWORD` before first boot on the server (otherwise a random
  one is logged once).
- Google will refuse a plain-HTTP redirect URI for non-localhost hosts; the
  production `CB_GOOGLE_REDIRECT_URI` must be `https://`.

### 2.4 Token-in-URL on OAuth callback (accept for pilot, note it)

The callback puts the session token in the URL fragment
(`#/auth/callback?token=…`), mirroring zinets_vis. Fragments are not sent to
servers or proxies, but they do land in browser history. Acceptable for a
pilot; the clean fix later is an httpOnly cookie set by the callback and a
cookie-reading variant of `get_user_by_token`.

### 2.5 Session hygiene (small, cheap)

- Purge expired rows occasionally:
  `DELETE FROM cb_sessions WHERE expires_at < datetime('now');` (cron or on startup).
- Consider shortening token life from 30 days to ~7 for the pilot.

---

## 3. Recommended pilot architecture

One small VPS (2 vCPU / 4 GB, e.g. Hetzner/DO/Lightsail) — same shape as the
zinets_vis deployment, one origin, no CORS:

```
                    ┌────────────────────────── VPS ─────────────────────────┐
 https://portal.…  →│ Caddy (TLS, gzip)                                      │
                    │   /cb-zinets/*  → static files from `npm run build`    │
                    │   /api/*        → 127.0.0.1:8000 (uvicorn, systemd)    │
                    │ uvicorn api.app:app  (spl123 env, 1 worker — see note) │
                    │ db/*.sqlite3  +  nightly backup → object storage       │
                    └────────────────────────────────────────────────────────┘
```

Caddyfile sketch:

```
portal.example.com {
    handle /api/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle_path /cb-zinets/* {
        root * /srv/cb-zinets/dist
        try_files {path} /index.html
        file_server
    }
    redir / /cb-zinets/ 302
}
```

systemd unit sketch:

```ini
[Service]
WorkingDirectory=/srv/cb-zinets
EnvironmentFile=/srv/cb-zinets/.env
ExecStart=/home/deploy/anaconda3/envs/spl123/bin/uvicorn api.app:app --host 127.0.0.1 --port 8000
Restart=always
```

Notes:

- **Keep uvicorn at 1 worker.** The in-process task worker + SQLite queue assume
  a single process; multiple workers would run duplicate task loops. One worker
  is plenty for a pilot.
- Build the frontend with a production env file that does **not** set
  `VITE_PUBLIC_READONLY` (that flag is only for the GitHub Pages static export)
  and, if the API is same-origin, the existing relative `/api` fetches work as-is.
- The GitHub Pages read-only site can stay up as the public demo; the portal is
  the authenticated, generation-capable instance.

Alternative (less ops, more constraints): Railway/Fly.io/Render single
container. Works, but SQLite needs a persistent volume and the generation
pipeline needs the SPL toolchain in the image — the VPS route is simpler given
the conda/SPL dependencies.

---

## 4. Hardening & operations (pilot-grade)

1. **Backups** — nightly `sqlite3 db/cbzinets.sqlite3 ".backup '/backups/cb-$(date +%F).sqlite3'"`
   plus `public/domains/` (generated books are re-derivable but expensive — they
   are LLM output). rsync/rclone to object storage.
2. **WAL mode** — `PRAGMA journal_mode=WAL;` once on the app DB; better
   concurrency between the API and the task worker.
3. **LLM cost control** —
   - `task_max_concurrent = 2` already bounds parallelism; add a simple per-user
     daily task quota (count rows in `cb_generation_tasks` by user) before the
     pilot if users can generate freely. This requires adding a `user_id` column
     to `cb_generation_tasks` — also useful for attribution in reviews.
   - Per the roadmap, BYOK (bring-your-own-key) is the phase-2 answer; for the
     pilot, instance-global keys + quotas are fine.
4. **Rate limiting** — one line in Caddy (`rate_limit`) or `slowapi` on the
   generation endpoints; 429 beats a surprise LLM bill.
5. **Logging/monitoring** — you already have `logs/` for generation output; add
   uvicorn access logs (systemd journal) and an uptime ping on
   `/api/auth/health`-style endpoint (add a trivial `GET /api/health` if the
   proxy needs one). For a pilot, UptimeRobot + `journalctl` is enough.
6. **Pin dependencies** — freeze `requirements-api.txt` versions
   (`pip freeze`-based lock) before building the server so the VPS matches dev.
7. **Secrets** — `.env` on the server, `chmod 600`, never in git (already
   ignored). The LLM keys stored via `/api/keys` land in the DB — one more
   reason §2.1 gates that router as admin-only.

---

## 5. Pilot rollout checklist

- [ ] Apply §2.1 auth dependencies; verify with `curl` (no token → 401 on generate/settings/keys)
- [ ] `UPDATE cb_users SET role='admin'` for your own Google account after first login
- [ ] CORS restricted or same-origin via proxy
- [ ] Google Console: add `https://…/api/auth/google/callback` redirect URI; move the
      OAuth consent screen to "In production" if pilot users are outside the test-user list
- [ ] `.env` on server: `CB_GOOGLE_*`, `CB_SESSION_SECRET`, `CB_ADMIN_PASSWORD`,
      `CB_FRONTEND_URL=https://portal.example.com/cb-zinets/`, `CB_GOOGLE_REDIRECT_URI=https://…`
- [ ] Caddy + systemd up; frontend built without `VITE_PUBLIC_READONLY`
- [ ] WAL mode + nightly backup cron
- [ ] Rate limit on `/api/generate*`; per-user quota if invitees can generate
- [ ] Smoke test: Google login → generate one small book → PDF export → logout
- [ ] Invite pilot users (they arrive as `viewer`)

## 6. Deferred (post-pilot, matches the deployment roadmap)

- httpOnly-cookie sessions (replaces token-in-fragment and localStorage)
- BYOK per-user API keys → removes the shared-budget problem
- Per-user generation history/attribution (`user_id` on tasks + concepts)
- Postgres if concurrent writers ever outgrow SQLite (unlikely at pilot scale)
- LMS/community portal features per the phase-3 roadmap



# ToDo list

## 2026-07-19

```markdown

Done. Google OAuth login is implemented and the deployment guide is written. Summary:

1. Google-auth login (implemented)

One important discovery first: the real Google client ID/secret are not anywhere on disk — both zinets_vis copies contain only placeholders (GOCSPX-your-actual-secret) in .env.example files and docs. You'll need to paste the actual values from Google Cloud Console (or your deployed zinets_vis server) into cb-zinets/.env. I kept the callback path and port identical to zinets_vis dev (http://localhost:8000/api/auth/google/callback), so your existing OAuth client's authorized redirect URI works without any Console changes for local dev.

What I built (adapted zinets_vis's authlib flow to cb-zinets's existing cb_users/cb_sessions opaque-token auth, rather than importing its JWT stack):

- Backend: api/routers/auth.py gains /api/auth/google/login, /api/auth/google/callback, and /api/auth/providers. auth_svc.py gains login_oauth_user() — matches by (provider, oauth_id), links to an existing local account by email, or creates a new viewer user, then opens a normal 30-day session. db.py migrates cb_users with oauth_provider/oauth_id/display_name/avatar_url columns. app.py adds SessionMiddleware (OAuth state cookie only). Config: new CB_GOOGLE_CLIENT_ID, CB_GOOGLE_CLIENT_SECRET, CB_GOOGLE_REDIRECT_URI, CB_FRONTEND_URL, CB_SESSION_SECRET settings, with slots in .env and a committed .env.example.
- Frontend: Login.js shows a "Continue with Google" button only when the backend reports OAuth is configured; main.js handles the #/auth/callback?token=… return; router.js now passes query params generically (also shows OAuth errors on the login page).
- Verified: backend imports clean under spl123 (I installed authlib, itsdangerous, httpx there and added them to requirements-api.txt), vite build passes, and a live smoke test shows providers → {"google": false} and a 503 on the login endpoint while creds are unset. The button appears automatically once you fill in .env. Full end-to-end Google flow needs the real creds to test.

2. Deployment recommendations → docs/DEV/readme-deploy.md

The one thing to read before anything else: every API route except /api/auth/* is currently unauthenticated server-side — generation, tasks, settings, and the LLM API-key endpoints. The login screen is a frontend-only gate, so exposing the API as-is means anyone can spend your LLM budget or read stored keys. The doc's §2.1 gives a ready-to-paste require_user/require_admin dependency scheme with a suggested public/user/admin tier per router, which also finally puts the viewer/admin roles to work.

The rest of the doc covers: CORS lock-down, single-VPS architecture (Caddy + systemd + one uvicorn worker — must stay at 1 worker because of the in-process task queue), HTTPS/secrets, the token-in-URL-fragment caveat, SQLite WAL + backups, LLM cost controls (per-user quotas now, BYOK phase 2 per your roadmap), a rollout checklist, and deferred post-pilot items.

```