# ZiNets ConceptBook — User Guide

## Why this app exists

Learning Chinese characters by rote memorisation is hard. There are 6,000+ commonly
used characters and no obvious structure to hold them together.

But there *is* structure. Chinese characters work like LEGO:

- A small set of **~422 elemental primitives** (the bricks) — including the 214
  KangXi radicals and a handful of other important pieces.
- A single rule — the **phono-semantic principle (形声字)** — governs over 80% of all
  characters: one brick gives the *meaning* (形), another gives the *sound* (声).

Learn ~200 bricks and this one rule, and thousands of unseen characters become
decodable on sight. That is the claim. `graph_lib.reducible()` machine-checks it:
every character in the graph must trace back to the primitive set.

**ZiNets ConceptBook** makes the LEGO structure navigable:

- The **concept graph** shows every character and its decomposition as an interactive
  network. Click any node to see what it is made of and what it makes.
- **Concept books** are on-demand lessons generated for any character or phrase —
  a structured explanation of its bricks, its meaning, its sound, and how to read
  unseen characters that share the same pieces.

---

## Current status (2026-06-28)

| Workflow | Status | Notes |
|---|---|---|
| Phrase → concept graph | ✅ Working | Enter any Chinese phrase/idiom; graph built from ZiNets DB |
| Graph → concept book (task queue) | ✅ Working | `POST /api/generate` queues task; log streams via `/api/tasks/{id}/stream` |
| Book reader | ✅ Working | Generated HTML loaded in iframe at `#/book?...` |
| Concept cache (cross-domain) | ✅ Working | Toggle in Settings; shared concept HTML under `public/concepts/` |
| Set-ID corpus domains | 🔧 Not yet run | `catalog.json` needs recreating; run `zinets_to_graph.py --set-id N` |

The phrase-based workflow (idiom → graph → book) is fully wired and validated.
The set-ID corpus workflow (large character sets) uses the same pipeline but needs
the steps in **Setup → Step 2** to be run first.

---

## What this app is

ZiNets ConceptBook is an interactive learning tool built around a full character
decomposition graph.

### Today — desktop web-app (phrase workflow)

A local Vite application you run on your own machine. Enter any Chinese phrase or
idiom and the app:

1. Decomposes every character into its primitive bricks using the ZiNets database.
2. Renders an interactive vis.js concept graph showing the dependency structure.
3. Lets you select any node and generate a concept book — a structured lesson
   covering every prerequisite, the composition rule, a memory hook, and practice.

### Coming next — zinets_vis portal

Integration into `~/projects/Proj-ZiNets/zinets_vis` for web deployment.
The phrase workflow is the integration point: same API, same SPL pipeline,
same generated HTML output, no catalog.json dependency.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python ≥ 3.11 in the `spl123` conda env | for the extractor and API |
| Node.js ≥ 18 + npm | for the Vite frontend |
| ZiNets SQLite database | at `db/cb_zinets.sqlite` (relative to repo root) |
| SPL.py runtime (`spl3`) | at `~/projects/digital-duck/SPL.py` — needed only for generating concept books |
| Ollama with `gemma4` pulled | default local model; or set `CB_LLM=claude_cli:claude-sonnet-4-6` for Claude |

---

## Setup

### Step 1 — Install frontend dependencies

```bash
cd ~/projects/digital-duck/cb_zinets
npm install
```

### Step 2 — Start the servers

**Terminal 1 — backend API:**

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
pip install -r requirements-api.txt
uvicorn api.app:app --reload --port 8000
```

**Terminal 2 — frontend:**

```bash
cd ~/projects/digital-duck/cb_zinets
npm run dev
# Opens at http://localhost:5173/cb-zinets/
```

---

## Validation — Phrase Workflow

These are the exact steps to validate the full pipeline from phrase input to
generated concept book. Run them in order after starting both servers.

### 1. Verify the API is up

```bash
curl -s http://localhost:8000/api/settings | python3 -m json.tool
```

Expected output (key fields):

```json
{
  "llm": "claude_cli:claude-sonnet-4-6",
  "spl_while_max_iter": 50,
  "spl_max_llm_calls": 50
}
```

If the endpoint returns 404, the router is not registered — check `api/app.py`.

### 2. Build a concept graph from a phrase

```bash
curl -s -X POST http://localhost:8000/api/phrase/graph \
  -H 'Content-Type: application/json' \
  -d '{"phrase": "守株待兔"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('phrase_id:', d['phrase_id'])
print('stats:    ', d['stats'])
print('html_size:', len(d['html']), 'bytes')
"
```

Expected:

```
phrase_id: phrase_守株待兔
stats:     {'primitives': 7, 'concepts': 9, 'applications': 1}
html_size: ~65000 bytes
```

Check that the graph was written to disk:

```bash
ls -lh ~/projects/digital-duck/cb_zinets/public/domains/守株待兔/input/graph.yaml
ls -lh ~/projects/digital-duck/cb_zinets/public/domains/守株待兔/output/graph.html
```

Both files must exist and be non-empty.

### 3. Validate the graph structure

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
python scripts/concept_graph.py \
  --domain "public/domains/守株待兔/input/graph.yaml" stats
```

Look for both of these lines:

```
Acyclic:    True
Reducible:  True
```

If `Reducible: False`, a character with no decomposition data ended up in the
`concepts` section. Fix: move it to `primitives` in `graph.yaml` and re-run.

### 4. Verify the graph YAML uses `needs:` (not `characters:`)

```bash
grep -A3 "phrase_守株待兔:" \
  ~/projects/digital-duck/cb_zinets/public/domains/守株待兔/input/graph.yaml
```

Expected:

```yaml
phrase_守株待兔:
  text: 守株待兔
  needs:
  - 守
```

If you see `characters:` instead of `needs:`, the `graph_lib.py` teaching-order
computation will return 0 concepts and the book will only have a Payoff section.
The bug is fixed in `phrase.py` and `zinets_to_graph.py`; re-POST to `/api/phrase/graph`
to regenerate.

### 5. Open the graph in the browser

1. Go to `http://localhost:5173/cb-zinets/`
2. The input bar shows `守株待兔` as the default. Click **构建图**.
3. Wait ~2 seconds for the API call. An iframe with the vis.js graph appears.
4. Confirm nodes are visible and colour-coded:
   - **Yellow rectangles** = primitives (tier 0 bricks)
   - **Green ellipses** = concepts (composed characters)
   - **Pink/red** = application (the phrase itself)
5. The left sidebar of the iframe shows a **Generate Concept Book** section with:
   - A target dropdown (pre-selected to the phrase node)
   - A level selector (Intro / Core / College / Research)
   - A **Skip cache** checkbox
   - A **Generate** button

If the sidebar is missing, open the browser console and check for errors in
`_injectGenerateSection`. The most common cause is the iframe writing the HTML
before vis.js has initialised — the 400 ms delay in `GraphBuilder.js` handles this.

### 6. Generate a concept book

1. In the target dropdown, select the phrase node (`phrase_守株待兔`) or any
   individual character (`守`, `株`, `待`, `兔`, …).
2. Leave level at **Intro** and model at `gemma4` (local Ollama).
3. Click **Generate**.
4. The button label changes to **Generating…**. The frontend POSTs to
   `/api/generate`, which enqueues the task and returns `{ task_id }` immediately.
   It then opens an SSE stream at `/api/tasks/{task_id}/stream` to tail the log.
5. The log area below the button streams SPL output lines in real time.
   You should see lines like:
   ```
   ▶ Starting spl3  output_dir=…
   Teaching 16 concepts toward phrase_守株待兔
   Section 0: 一
   Section 1: 丨
   ...
   ✓ Done
   ```
6. If **Concept Cache** is enabled (Settings page) and this phrase shares characters
   with a previously generated phrase, cache-hit concepts show:
   ```
   Concept DB cache HIT — 0 LLM calls
   ```
   These concepts complete instantly; only novel concepts call the LLM.
7. On completion, the page navigates automatically to
   `#/book?domain=守株待兔&target=phrase_守株待兔&level=intro&lang=en&model=gemma4`.


#### 30 more Chinese Idioms 成语
- https://www.thechairmansbao.com/blog/chengyu-chinese-idioms/



### 7. Verify the book HTML was written to disk

```bash
ls -lh ~/projects/digital-duck/cb_zinets/public/domains/守株待兔/output/intro.en/gemma4/html/
```

Expected files:

```
book_phrase_守株待兔.html   ← TOC index (loaded by BookPage.js in the iframe)
concept_一.html
concept_丨.html
concept_又.html
... (one file per concept in the teaching order)
```


### 8. Read the book in the browser

The BookPage loads automatically after generation. You can also navigate there
directly:

```
http://localhost:5173/cb-zinets/#/book?domain=守株待兔&target=phrase_守株待兔&level=intro&lang=en&model=gemma4
```

The right panel should show the generated book HTML in an iframe. The left sidebar
shows phrase · target · level · model. A **← Back to Graph** link returns to the
input page.

If the iframe shows a blank page or 404, check:

```bash
# File must exist
ls ~/projects/digital-duck/cb_zinets/public/domains/守株待兔/output/intro.en/gemma4/html/book_phrase_守株待兔.html
```

The Vite dev server serves `public/` under `/cb-zinets/`, so the full URL is:
```
http://localhost:5173/cb-zinets/domains/%E5%AE%88%E6%A0%AA%E5%BE%85%E5%85%94/output/intro.en/gemma4/html/book_phrase_%E5%AE%88%E6%A0%AA%E5%BE%85%E5%85%94.html
```

### 9. Validate partial-book recovery (optional)

To confirm the EXCEPTION handler works when the domain is large:

1. Set Settings → `While Max Iterations` to `5` (forces an early cutoff).
2. Generate a book for `phrase_守株待兔` with Skip cache checked.
3. The log should show `WARNING: concept generation interrupted` and then still
   write a partial book.
4. Reset `While Max Iterations` to `50` afterward.

---

## Configuration

Set these in a `.env` file at the repo root or export before starting the API:

| Variable | Default | Purpose |
|---|---|---|
| `CB_SPL_DIR` | `~/projects/digital-duck/SPL.py` | SPL.py root directory |
| `CB_PUBLIC_DOMAINS` | `./public/domains` | domain data root |
| `CB_LLM` | `claude_cli:claude-sonnet-4-6` | LLM adapter:model (changeable in Settings UI) |
| `CB_DEFAULT_MODEL` | `gemma4` | default model used in Generate |
| `CB_SPL_WHILE_MAX_ITER` | `50` | max WHILE loop iterations per SPL run |
| `CB_SPL_MAX_LLM_CALLS` | `50` | max LLM calls per SPL run |

---

## Troubleshooting

**`needs:` key missing in graph.yaml — book only has Payoff section**
: The phrase domain was generated by an older version of `phrase.py` that emitted
  `characters:` instead of `needs:`. Fix: POST to `/api/phrase/graph` again
  (it regenerates the domain) or manually edit the YAML and re-POST.

**Graph iframe is blank or shows no nodes**
: Open the browser console inside the iframe (right-click → Inspect inside the
  iframe, or add `?debug=1` to the URL). If vis.js errors appear, the `graph.html`
  is likely corrupt — re-POST to `/api/phrase/graph` to regenerate it.

**Generate button is greyed out**
: No target is selected in the dropdown. If the dropdown is empty, the `win.__cb_RAW`
  binding is missing — the iframe hasn't fully initialised. Reload the page.

**`spl3: command not found`**
: The `spl123` conda environment is not active. Run `conda activate spl123` before
  starting the API.

**`WHILE loop exceeded N iterations`**
: The domain has more concepts than the SPL loop limit. Increase
  `CB_SPL_WHILE_MAX_ITER` (default 50) or use the Settings page. The EXCEPTION
  handler will produce a partial book rather than failing completely.

**`MaxLLMCalls exceeded`**
: Each concept can take up to 3 LLM calls (generate + optional refine × 2).
  For large phrases, increase `CB_SPL_MAX_LLM_CALLS` (default 50).

**Book iframe shows 404**
: The book HTML was not written. Check the generation log for errors. Confirm the
  output directory exists:
  `public/domains/{phrase}/output/{level}.en/gemma4/html/`

**`catalog.json` errors in the backend log**
: `catalog.json` is optional for the phrase workflow and its absence is silently
  ignored. If you need it for set-ID corpus domains, recreate it:
  ```bash
  echo '[]' > public/domains/catalog.json
  python scripts/zinets_to_graph.py --set-id 10
  ```

---

## Next: integrating into zinets_vis

Once validated in cb_zinets, the phrase workflow will be integrated into
`~/projects/Proj-ZiNets/zinets_vis` (the production web portal). The integration
points are:

- **`POST /api/phrase/graph`** — same endpoint, same response shape
- **`GET /api/generate`** (SSE) — same event protocol (`started`, `log`, `done`, `gen_error`)
- **Generated HTML** — static files under `public/domains/{phrase}/output/...`
- **BookPage.js** — loads the book HTML in an iframe; no catalog required

No catalog.json, no domain registry, no landing page needed — the phrase is both
the domain ID and the user's entry point.
