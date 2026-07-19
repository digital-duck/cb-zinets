# Changelog

Developer-facing change log. Newest first.

## 2026-07-19

### Page renames — terminology sync (UI name = file name)

Every file in `src/pages/` is a page, so names now match the UI tabs
instead of carrying a redundant "Page" suffix. Renamed via `git mv` so
history follows:

| Before | After | Exported function |
|---|---|---|
| `src/pages/Domain.js` | `src/pages/DomainGraph.js` | `Domain` → `DomainGraph` |
| `src/pages/BookPage.js` | `src/pages/BookContent.js` | `BookPage` → `BookContent` |

Routes are unchanged (`#/domain/:id`, `#/graph`, `#/book?...`) — only
imports in `src/main.js` and comment references (`contentExists.js`,
`Home.js`, `style.css`) were updated.

### BookContent refactor — 1,136-line page split into modules

`src/pages/BookContent.js` is now a 386-line orchestrator (page state,
single/compare mode rendering, chat send). The building blocks moved to a
new `src/components/book/` folder:

| Module | Lines | Contents |
|---|---|---|
| `content.js` | 122 | variant/filename parsing, content-URL resolution (domain-local → canonical fallback), not-found placeholder, iframe loading, TOC extraction/hiding, `LEVELS`/`MODELS` constants |
| `NavSidebar.js` | 248 | Catalog/Files source toggle, domain search + picker, model filter, book picker, TOC section container |
| `TocSidebar.js` | 112 | Compare checkbox/button, contents list, SPL credit line |
| `ComparePane.js` | 89 | PANE C element, SSE-driven compare run, mini markdown renderer |
| `controls.js` | 100 | model/level/language select row, drag-to-resize splitter |
| `ChatWidget.js` | 88 | reviewer chat widget (admin-only) |

Behavior-preserving: code moved verbatim except leading underscores
dropped from now-exported names (`_fillTocSection` → `fillTocSection`,
etc.) and one dead import removed (`getLocale` was never used).
Verified: `vite build` clean, all 12 armature tests pass.

Manual test pass should exercise all six modules:
- [ ] open a book from the sidebar (Catalog and Files sources)
- [ ] domain search box (hanzi / pinyin / initials)
- [ ] click through TOC concept links; in-book `#anchor` links
- [ ] model/language dropdowns above the frame
- [ ] Compare mode: toggle on, Compare ▶, drag the PANE C splitter, ↻ fresh
- [ ] reviewer chat (admin login)

### About page — baseline languages corrected

Idioms bullet now lists all 5 generated languages (EN, ZH, ES, FR, DE) —
previously claimed only EN/ZH/ES. Baseline scope is fixed: ~100+ idioms ×
5 languages, 422 elemental characters × 8 languages (no further growth
planned, so the tracked corpus stays well under GitHub limits).

### Google OAuth login (earlier same day)

- Backend: `/api/auth/google/login`, `/api/auth/google/callback`,
  `/api/auth/providers` (authlib; `CB_GOOGLE_*` env vars; creates/links
  `cb_users` rows, normal `cb_sessions` token).
- Frontend: "Continue with Google" button on Login (shown only when the
  backend reports OAuth configured); `#/auth/callback?token=…` route.
- Real client ID/secret must be pasted into `.env` from Google Cloud
  Console — see `readme-deploy.md` §1 for setup and §2 for the pilot
  hardening list (top item: non-auth API routes are still ungated
  server-side).
- New deps: `authlib`, `itsdangerous`, `httpx` (installed in `spl123`).

Also written today: `readme-deploy.md` (pilot deployment guide) and the
codebase assessment appended to `readme-roadmap.md`.
