# cb_zinets deployment roadmap

Three phases, in order. Don't build a later phase's plumbing while still in
an earlier one — confirm the need is real before adding it.

## 1. Local-first (current phase)

Runs entirely on one person's machine: `npm run dev` + `uvicorn api.app:app`
locally, or the static read-only build published to GitHub Pages (see
`readme-pub-github.md`).

Ships **sonnet + gemma4 concept books as a pre-generated baseline** — a
local user can browse, search, and read the whole corpus with zero API key
and zero setup beyond cloning the repo. Nothing about reading the shipped
content requires an LLM key.

## 2. BYOK generation

Same local-first app. A user who wants to generate or customize *beyond*
the shipped baseline supplies their own LLM API key via
**Settings → LLM Model → API Keys**.

- Providers: Anthropic, Gemini, OpenAI, Qwen, Z (Zhipu), OpenRouter.ai
  (`api/services/api_keys_svc.py`).
- Keys are stored in a single gitignored `.env` at the repo root and applied
  to `os.environ` immediately (no restart) — **deliberately instance-global,
  not scoped per user account.** That's the right scope for this phase: one
  person, one instance, no reason to force per-account key isolation.
- Env var names match the SPL.py framework's own adapter conventions
  (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`,
  `DASHSCOPE_API_KEY` for Qwen, `ZHIPUAI_API_KEY`, `OPENROUTER_API_KEY`), so
  a saved key works immediately with the matching adapter.
- Keys are write-only in the UI — once saved, only a masked preview
  (`sk-p…a98X`) is ever shown again.

## 3. Hosted, server-backed portal (future — not being built now)

Community-based learning: multiple accounts, an LMS-style layer, progress
tracking, shared classes/cohorts, etc.

This is where user-scoped API keys would actually earn their complexity —
each community member bringing their own key/quota, isolated per
`user_id`, rather than the single shared `.env` from phase 2. Don't add
that plumbing until this phase is real; the current auth system
(`cb_users`/`cb_sessions` in `db/cbzinets.sqlite3`) is a client-side-only
gate today (confirmed: no server-side role enforcement on any `/api/*`
route yet) — phase 3 is also where that would need to become real
authorization, not just a login screen.

---

*Context: captured 2026-07-07 after building the LLM API Keys Settings
card, to record why it's instance-scoped rather than per-user — a
deliberate choice for phase 1, not an oversight.*

---

# Codebase assessment (2026-07-19)

Written after a full read-through while adding Google OAuth login.
Deployment-specific hardening lives in `readme-deploy.md`; this section is
about the app itself. Overall verdict: **healthy, deliberately simple, and
consistent with its own stated principles** — the main risks are growth
pains, not design flaws.

## What's working well

1. **The armature principle is actually practiced, not just documented.**
   `tests/test_armature.py` holds 12 deterministic invariant tests, each
   traceable to a real incident (whitespace corruption, thin-book
   conversion, 405-book repair). Structure QA'd by assertion, content by
   review — this is the repo's best habit and worth protecting.
2. **The task worker is more robust than its size suggests** (238 lines):
   atomic claim of pending tasks, stale-`running` recovery on restart,
   log streaming into the DB row plus a file artifact, and — notably —
   the "spl3 exited 0 but the promised HTML never landed" check that
   catches silently-swallowed LLM failures. That last one is the kind of
   verification most task queues skip.
3. **Near-zero dependency surface.** Two npm devDependencies (vite,
   gh-pages), no frontend framework, a short Python requirements list.
   For a solo-maintained project this is a real asset: nothing to
   upgrade-treadmill, minimal supply-chain exposure.
4. **Thoughtful data design**: thin books linking to canonical concept
   pages, symlinked `default` model aliases, a catalog with a tested
   concurrent-writer guarantee, `cb_` vs `zn_` table prefixes.
5. **Phase discipline.** The roadmap above says "don't build later-phase
   plumbing early" and the code obeys it (instance-global API keys,
   client-side-only auth gate — both documented as deliberate).

## Improvement suggestions

### Near-term (worth doing while still in phase 1–2)

1. **Split `BookPage.js` (1,136 lines).** It carries TOC extraction,
   variant/compare logic, the reviewer-chat widget, and PDF hooks in one
   file. The chat widget and the compare/variant picker are natural
   extraction seams. Same trajectory watch for `GraphViewer.js` (607) and
   `Settings.js` (577). Not urgent — but each is still growing.
2. **Centralize HTML escaping in the frontend.** There are ~54
   `innerHTML =` sites across pages/components. Today the interpolated
   content is your own catalog data and server-generated files, so risk
   is low — but reviewer-chat text and anything user-typed should go
   through `textContent` or one shared `escapeHtml()` (chat bubbles
   already do this correctly). One `src/lib/dom.js` helper (`el(tag,
   attrs, children)`) would shrink the page files *and* make escaping the
   default.
3. **Add a thin API test layer.** The armature tests cover generated
   structure but no test touches the FastAPI surface. `fastapi.testclient`
   + a temp SQLite file makes auth (login/me/logout, OAuth user
   creation/linking), task CRUD, and browse endpoints cheap to smoke-test
   — roughly one afternoon, and it protects the auth work just added.
4. **Add CI.** No `.github/workflows` today. A ~20-line action running
   `pytest -q` + `npm run build` on push would catch the two failure
   classes that actually occur here (structural regressions after batch
   runs, frontend build breaks) before they reach GitHub Pages deploys.
5. **`/api/chat` needs bounds even locally.** It shells the full
   conversation into `claude -p` with no cap on message length and no
   auth. Add a max-chars guard now; auth comes with the deploy work.
   Also note: on any server without the Claude CLI, chat silently breaks
   — the adapter fallback (`_call_via_spl`) should be the documented
   server path.
6. **Delete the stray tracked `cb_zinets.sqlite`** (0 bytes, repo root —
   the real DB is `db/cbzinets.sqlite3`, correctly ignored). Pure
   confusion-bait.

### Structural (watch, don't act yet)

7. **Generated corpus in git: fine now, has a ceiling.** ~20,500
   generated HTML files / 52 MB tracked (35 MB packed) is the phase-1
   "shipped baseline" working as designed — clone-and-read with zero
   keys. But every batch regeneration rewrites thousands of files and the
   pack only grows. When it hurts (clone times, GH limits at ~1 GB),
   the escape hatches are: a separate data repo/submodule, GitHub
   Releases tarballs fetched by a setup script, or git-LFS. Decide then,
   not now — but avoid `--no-history`-style rewrites later by not letting
   it reach 500 MB unnoticed.
8. **`scripts/concept_graph.py` (1,503 lines)** is the largest unit in
   the repo. Per the retro plan, leave it until vertical #2 forces the
   generalization — but when that lands, split along the existing seams
   (DB extraction / graph shaping / HTML emission) rather than growing a
   second monolith.
9. **Config sprawl (minor):** settings arrive from `config.yaml`,
   `.env` (`CB_*`), and `scripts/cb_config.py`, with `CB_DB_PATH`
   overriding YAML. It works, but a short "where settings come from"
   table in CLAUDE.md or api/config.py's docstring would save future
   debugging.
10. **SQLite write chattiness (only matters under load):** the worker
    commits one UPDATE per log line. Locally invisible; if generation
    ever runs at higher concurrency alongside web traffic, batch log
    appends (flush every N lines/seconds) and enable WAL. Pair with the
    WAL recommendation already in `readme-deploy.md`.

### Explicitly *not* recommended

- No frontend framework migration — the vanilla-JS + hash-router setup is
  proportionate to the app and is a feature, not debt.
- No Postgres, no Redis queue, no per-user API keys — all phase-3
  questions, per the phases above.
