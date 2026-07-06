# Publishing cb_zinets to GitHub Pages

How to publish the static ConceptBook viewer to `https://digital-duck.github.io/cb-zinets/`.
Written for a first-time GitHub Pages deploy; every command runs from the repo root.

---

## 1. What gets published (and what doesn't)

GitHub Pages serves **static files only** — the FastAPI backend does not deploy.
`npm run build` bundles the SPA and copies everything in `public/` into `dist/`
(~123 MB: the 9,454 concept-page symlinks are materialized into real files,
which is exactly what Pages needs — it can't serve symlinks).

| Works on Pages (read-only viewer) | Needs the API (won't work) |
|---|---|
| Home — browse, phrase/concept search, pinyin fuzzy match (catalog.json is static) | Generate concept books |
| Graph page — navigator, node selection, Concept Detail pane | Dynamic phrase → new domain |
| Book page — books, concept pages, TOC navigation | PDF generation (existing PDFs under `output/*/pdf/` do serve) |
| Stroke-order animation (HanziWriter CDN) + 🔊 pronounce (browser speech) | AI semantic Compare, Chat |
| References rows (zdic, 成语, 书法 links) | Settings saves, Sync Catalog |

API-dependent buttons will fail quietly or show fetch errors — acceptable for a
viewer release. The missing-content check (`contentExists`) actually works
*better* on Pages than in dev: real 404s come back as 404s.

Site limits: 1 GB per site, 100 MB per file, ~100 GB/month bandwidth.
We're at ~123 MB total, largest file 1.6 MB — comfortable.
**Note:** on a free GitHub plan, Pages requires the repo to be **public**.

---

## 2. One-time setup

### 2a. Fix the base-path mismatch ⚠ (do this first)

Vite builds with `base: '/cb-zinets/'` (vite.config.js), so every asset URL
starts with `/cb-zinets/`. But a project site is served at
`https://<org>.github.io/<repo-name>/`, and the repo is named `cb_zinets`
(underscore). Deployed as-is, the page loads at `/cb_zinets/` but requests
assets from `/cb-zinets/` → blank page, 404s everywhere.

Pick **one**:

**Option A — rename the GitHub repo to `cb-zinets` (recommended).**
No code changes; hyphenated URLs are also the convention. On GitHub:
*repo → Settings → General → Repository name → `cb-zinets` → Rename*.
GitHub redirects the old name, but update your remote anyway:

```bash
git remote set-url origin git@github.com:digital-duck/cb-zinets.git
```

**Option B — change the base to match the repo.**
Edit one line in `vite.config.js`: `base: '/cb_zinets/'`.
(If you ever fork per-subject verticals, this is the knob each fork sets.)

### 2b. Prevent Jekyll processing

Pages runs Jekyll on branch-based sites by default; it's unnecessary and can
skip files. Drop an empty marker into `public/` so it ships inside every build:

```bash
touch public/.nojekyll
```

### 2c. Make the deploy script history-friendly

`gh-pages` (already in devDependencies) pushes a *new commit* to the `gh-pages`
branch per deploy — at 123 MB a deploy, branch history balloons fast. Add
`--no-history` so each deploy force-pushes a single fresh commit. In
`package.json`:

```json
"deploy": "vite build && gh-pages -d dist --no-history --dotfiles"
```

(`--dotfiles` makes sure `.nojekyll` is included.)

---

## 3. Publish

### 3a. Pre-flight checklist

```bash
# 1. finish/park batch jobs, then reconcile the catalog
#    (Settings page → Sync Catalog, or:)
curl -s -X POST http://localhost:8000/api/catalog/sync

# 2. bone X-ray — all invariants green
python3 -m pytest tests/ -q

# 3. build and eyeball locally (serves dist/ at the real base path)
npm run build
npm run preview        # → http://localhost:4173/cb-zinets/
```

In the preview, check: Home search ("bu" should hit both sections), open a
book, open a concept page (stroke animation + 🔊), Graph page detail pane.

### 3b. Deploy

```bash
npm run deploy
```

This builds and pushes `dist/` to the `gh-pages` branch of `origin`.
First push moves ~123 MB — give it a few minutes.

### 3c. Turn on Pages (first time only)

On GitHub: *repo → Settings → Pages*
- **Source**: Deploy from a branch
- **Branch**: `gh-pages`, folder `/ (root)` → Save

Wait 1–2 minutes (the *Actions* tab shows a "pages build and deployment" run),
then open:

```
https://digital-duck.github.io/cb-zinets/
```

---

## 4. Verify after deploy

- [ ] Home page renders with the domain cards (if blank → §6 base mismatch)
- [ ] Search "bu" → hits in both Phrases and Concepts
- [ ] Open a phrase book; TOC links load concept pages
- [ ] A concept page shows the red stroke animation (58px) and 🔊 speaks
- [ ] Graph page loads the navigator; clicking a node fills Concept Detail
- [ ] Hash routes survive refresh (e.g. `…/cb-zinets/#/book?domain=…`) —
      they will: the app uses hash routing, so no 404.html trick is needed

---

## 5. Updating the site (the release loop)

Every future release is just:

```bash
# after batch generation sessions:
curl -s -X POST http://localhost:8000/api/catalog/sync   # or the Settings button
python3 -m pytest tests/ -q
npm run deploy
```

Content changes only (new books/concepts, no code change) still need a deploy —
the site is a frozen copy of `public/` at build time. Commit your source to
`main` separately; `gh-pages` is a build artifact branch, never edit it.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Blank page; DevTools shows 404s on `/cb-zinets/assets/…` | Base path ≠ repo name — see §2a. |
| Site is 404 entirely | Pages not enabled, or first build still running (Actions tab), or repo is private on a free plan. |
| Old content after deploy | Pages CDN cache (~10 min) + browser cache. Hard-refresh (Ctrl+Shift+R); confirm the `gh-pages` branch tip actually changed. |
| `npm run deploy` fails with auth error | The `gh-pages` package pushes over your git remote — make sure `git push origin` works (SSH key) from this machine. |
| Stroke animation missing on the live site | It loads HanziWriter from jsdelivr CDN — check the browser console for a blocked/CDN error; the page itself is fine. |
| Deploy takes very long | Normal on first push (~123 MB). With `--no-history` subsequent pushes stay a single commit but still upload changed files. |

---

## 7. Later (optional)

- **GitHub Actions deploy** — instead of pushing from your machine, a workflow
  builds on every push to `main` (*Settings → Pages → Source: GitHub Actions*,
  then a workflow using `actions/upload-pages-artifact` + `actions/deploy-pages`).
  Worth switching to once releases are frequent; not needed for the first launch.
- **Custom domain** — *Settings → Pages → Custom domain* + a CNAME record at
  your DNS. Note: a custom domain serves from the domain **root**, so
  `base` would change to `'/'`.
- **Slim the payload** — if the site outgrows limits: publish fewer models per
  page (e.g. sonnet only), or exclude `output/*/pdf/` from the published build.

---

*Context: this releases cb_zinets as the read-only web app milestone
(YouTube-lesson companion). The full authoring stack — FastAPI + SPL + batch
generation — stays local; Pages only ever sees `dist/`.*
