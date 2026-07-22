# Maintaining the cb_zinets GitHub Pages site

Ongoing release loop for `https://digital-duck.github.io/cb-zinets/`, now that
one-time setup is done (repo made public, base path, `.nojekyll`, Pages
enabled — see `readme-pub-github-init.md` if any of that ever needs redoing).

---

## 1. What's published

Same split as before: GitHub Pages serves **static files only** (`dist/`,
built from `public/`) — the FastAPI backend never deploys.

| Works on Pages (read-only viewer) | Needs the API (won't work) |
|---|---|
| Home — browse, phrase/concept search, pinyin fuzzy match | Generate concept books, dynamic phrase → new domain |
| Graph page — navigator, node selection, Concept Detail pane | Settings saves, Sync Catalog |
| Book page — books, concept pages, TOC navigation | AI semantic Compare, Chat |
| Stroke-order animation (HanziWriter CDN) + 🔊 pronounce | — |

Two build-time filters make this possible, both applied automatically by
`npm run build`/`deploy` — nothing to remember to do by hand:

- **No login wall.** `.env.production` sets `VITE_PUBLIC_READONLY=true`,
  which `src/main.js` uses to skip the `checkAuth()`/login redirect (esbuild
  dead-code-eliminates the branch entirely at build time). Login still works
  normally in `npm run dev`.
- **Gemma3 excluded.** `scripts/filter-published-models.js` runs as the
  `postbuild` step and strips gemma3's output directories and catalog
  entries from `dist/` only — `public/domains/` keeps the full
  gemma3/gemma4/sonnet set locally for model-comparison review. To change
  which model(s) get excluded from a given build:

  ```bash
  node scripts/filter-published-models.js --models gemma3,other-model
  ```

  (only useful if run again after `vite build` but before `gh-pages -d dist`;
  normally you never call it directly — `npm run build` does it for you.)

---

## 2. The release loop

Every content update (new books/concepts from a batch-gen session, no code
change needed) still requires a redeploy — the site is a frozen copy of
`public/` at build time.

```bash
cd $HOME/projects/digital-duck/cb-zinets

# 1. reconcile the catalog after any batch generation session
curl -s -X POST http://localhost:8000/api/catalog/sync   # or Settings → Sync Catalog

# 2. bone X-ray — all invariants green
python3 -m pytest tests/ -q

# 3. eyeball locally before pushing (serves dist/ at the real base path)
npm run build
npm run preview        # → http://localhost:4173/cb-zinets/ (or next free port)

# 4. ship it
npm run deploy

# URL = https://digital-duck.github.io/cb-zinets/
```

In the preview, spot-check: Home search ("bu" hits both Phrases and
Concepts), open a book, open a concept page (stroke animation + 🔊), Graph
page detail pane. `npm run deploy` runs `vite build` (→ `postbuild` filter
automatically) then force-pushes a single fresh commit to `gh-pages`
(`--no-history --dotfiles`, set up once in `package.json`) — repeated
deploys don't balloon branch history, and `.nojekyll` always ships.

Commit your source changes to `main` separately, as usual; `gh-pages` is a
build artifact branch, never edit it directly.

---

## 3. Verify after deploy

Pages CDN + browser cache take ~10 min to catch up, so hard-refresh
(Ctrl+Shift+R) if you don't see the change immediately.

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://digital-duck.github.io/cb-zinets/
curl -s https://digital-duck.github.io/cb-zinets/domains/catalog.json | grep -c gemma3   # expect 0
```

Then in a real browser:
- [ ] Home renders the domain cards, no login screen
- [ ] Search "bu" → hits in both Phrases and Concepts
- [ ] Open a phrase book; TOC links load concept pages
- [ ] A concept page shows the stroke animation and 🔊 speaks
- [ ] Graph page loads the navigator; clicking a node fills Concept Detail
- [ ] Hash routes survive refresh (e.g. `…/cb-zinets/#/book?domain=…`)

---

## 4. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Old content after deploy | Pages CDN cache (~10 min) + browser cache. Hard-refresh; confirm the `gh-pages` branch tip actually changed (`git ls-remote --heads origin gh-pages`). |
| `npm run deploy` fails with auth error | `gh-pages` pushes over your git remote — confirm `git push origin` works (this repo uses SSH: `git@github.com:digital-duck/cb-zinets.git`). |
| Login screen appears on the live site | `.env.production`'s `VITE_PUBLIC_READONLY` didn't get picked up — confirm the file exists at repo root and `npm run build` (not some other build path) was used. |
| gemma3 content reappears on the live site | Someone ran `vite build` directly instead of `npm run build`, skipping the `postbuild` filter step. Always deploy via `npm run deploy` (or at least `npm run build`, which chains `postbuild` automatically). |
| Stroke animation missing on the live site | Loads HanziWriter from jsdelivr CDN — check the browser console for a blocked/CDN error; the page itself is fine. |
| Deploy takes a while | Normal — ~95MB of static content. `--no-history` keeps subsequent pushes to a single commit but still uploads changed files. |
| Site 404 entirely | Check *Settings → Pages* is still set to branch `gh-pages` / root, and the repo is still public (Pages needs public on the free plan). |

---

*Context: read-only viewer milestone (YouTube-lesson companion). The full
authoring stack — FastAPI + SPL + batch generation — stays local; Pages only
ever sees `dist/`. One-time setup steps (repo rename/visibility, base path,
`.nojekyll`, first Pages enable) are archived in `readme-pub-github-init.md`.*
