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
