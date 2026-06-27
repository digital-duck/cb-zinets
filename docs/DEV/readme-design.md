# cb_zinets — Design Reference

## 1. What this repo is

`cb_zinets` is the ConceptBook domain app for Chinese characters. It has two jobs:

1. **Extract** — read the ZiNets decomposition database and produce a `graph.yaml` that
   maps every active character onto the ConceptBook node schema.
2. **Present** — serve that graph as an interactive concept-graph navigator and
   on-demand concept books through the same Vite + FastAPI + SPL.py stack used by
   `concept-book`.

It is a standalone repo, not a subdirectory of `concept-book`. Once the graph and
books are validated, the output is intended for integration into the `zinets_vis`
Vue.js portal (Step 5 — deferred).

### Current and planned form factors

| Phase | Form | Status |
|---|---|---|
| **Now** | Desktop web-app — local Vite dev server + FastAPI backend | Active |
| **Next** | Hosted portal — GitHub Pages static site + optional cloud API | Planned |
| **Future** | Mobile app — native or PWA, surfaces concept books on character tap | Planned |

The hosted portal phase will deploy `dist/` to GitHub Pages (`/cb-zinets/` base path is
already set in `vite.config.js`). The mobile phase targets integration with `zinets_vis`
so that tapping any character node in the ZiNets portal opens its concept book in a
sidebar or modal.

---

## 2. Architecture

```
                           ┌───────────────────────────────────────────┐
                           │              cb_zinets repo               │
                           │                                           │
  zinets_cache.sqlite ──▶  │  scripts/zinets_to_graph.py               │
  (ZiNets DB)              │     └▶ public/domains/chinese_characters/ │
                           │         input/graph.yaml                  │
                           │                                           │
                           │  scripts/concept_graph.py  ───────────────┼──▶ output/graph.html
                           │                                           │       (vis.js navigator)
                           │  spl/build_concept_book.spl ──────────────┼──▶ output/{level}.{lang}/html/
                           │    (via SPL.py runtime)                   │       concept_{zi}.html
                           │                                           │
                           │  api/   (FastAPI, port 8000)  ◀───────────┼── npm run dev (Vite, port 5173)
                           │  src/   (Vite + Vanilla JS)               │
                           └───────────────────────────────────────────┘
```

### Component map

| Layer | Path | Role |
|---|---|---|
| Extractor | `scripts/zinets_to_graph.py` | DB → `graph.yaml` |
| Visualiser | `scripts/concept_graph.py` | `graph.yaml` → `graph.html` |
| Content pipeline | `spl/build_concept_book.spl` | `graph.yaml` → `concept_{zi}.html` via SPL.py |
| Backend | `api/` (FastAPI) | SSE streaming for book generation, PDF, settings |
| Frontend | `src/` (Vite + Vanilla JS) | graph navigator shell, book viewer |
| Domain data | `public/domains/chinese_characters/` | `input/graph.yaml`, `output/` |
| Catalog | `public/domains/catalog.json` | domain registry read by the frontend |

### Relationship to `concept-book`

`cb_zinets` is a **fork-in-structure** of `concept-book`:

- All `src/`, `api/`, `spl/`, `scripts/concept_graph.py` are copied from
  `~/projects/digital-duck/concept-book` and kept in sync manually.
- Adaptations: `vite.config.js` (`base: '/cb-zinets/'`), `index.html` (title/icon),
  `src/i18n.js` (app title), `src/pages/About.js` (domain description),
  `api/config.py` (adds `spl_file` field).
- The unique piece is `scripts/zinets_to_graph.py` — there is no equivalent in
  `concept-book`, where graphs are authored by hand or generated in SPL.py recipes.

---

## 3. Dependencies

### Runtime

| Dependency | Version | Purpose |
|---|---|---|
| Python | ≥ 3.11 | extractor + API + SPL pipeline |
| PyYAML | any | YAML serialisation in `zinets_to_graph.py` |
| FastAPI + uvicorn | ≥ 0.111 / 0.29 | backend API |
| sse-starlette | ≥ 2.0 | SSE streaming for generation log |
| pydantic-settings | ≥ 2.0 | `api/config.py` |
| mistune | ≥ 3.0 | Markdown rendering in PDF service |
| Node.js / npm | ≥ 18 | Vite dev server and build |
| Vite | ^5.4 | frontend bundler |

### External services and sibling repos

| Service / Repo | Path | Notes |
|---|---|---|
| ZiNets SQLite DB | `~/projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite` | source of all character data; read-only |
| SPL.py runtime | `~/projects/digital-duck/SPL.py` | concept-book generation; requires `spl123` conda env |
| **concept-book** | `~/projects/digital-duck/concept-book` | upstream for all UI / API / SPL files copied into this repo |
| **concept-book-press** | `~/projects/digital-duck/concept-book-press` | provides `pipeline.cli validate` — the authoritative graph validator |
| **zinets_vis** | `~/projects/Proj-ZiNets/zinets_vis` | Vue.js portal; future integration target (Step 5) |
| **zinets** (private) | `~/projects/digital-duck/zinets` | ZiNets research repo — papers, experiments, elemental-character studies |
| **dd-work** | `https://github.com/digital-duck/dd-work` | public index of all writing: arXiv papers, blogs, books |

#### concept-book-press in detail

`concept-book-press` is a standalone ingestion-and-extraction pipeline for creating
ConceptBook `graph.yaml` files from structured textbook sources (PDF, OpenStax HTML).
For `cb_zinets` the ingest and extract stages are replaced by `zinets_to_graph.py`,
but the **validate** stage is shared:

```bash
cd ~/projects/digital-duck/concept-book-press
python -B -m pipeline.cli validate \
  -i ~/projects/digital-duck/cb_zinets/public/domains/chinese_characters/input/graph.yaml
```

The validator (`pipeline/validate/checker.py`) runs six checks against any
ConceptBook `graph.yaml`:

| Check | What it verifies |
|---|---|
| Valid references | every `composed_of` / `needs` target exists as a node |
| Acyclic | no circular dependency chains |
| Reducible | every concept/application traces back to at least one primitive |
| Weakly connected | no orphan subgraphs (warning, not error) |
| Primitive purity | primitives have no `composed_of` dependencies |
| Tier consistency | each node's tier = 1 + max(tier of its direct dependencies) |

#### zinets research repo (private)

`~/projects/digital-duck/zinets` is a private research repository containing:

- `docs/arxiv/zinets-01`, `zinets-02`, `zinets-03` — the ZiNets paper series
- `docs/arxiv/chinese-char-as-living-fossil` — paper on characters as living semantic fossils
- `docs/research/elemental-char-*.md` — studies defining and justifying the ~422 elemental characters
- `docs/research/zinets-v*.md` / `.pdf` — versioned research manuscripts

The elemental-character research in this repo provides the intellectual foundation for
the primitive classification used in `zinets_to_graph.py`. When the primitive/elemental
definition changes (e.g., edge-case characters are reclassified), the extractor logic
should be updated to match.

#### dd-work — writing index

`https://github.com/digital-duck/dd-work` is the public-facing index of all
Digital Duck writing: arXiv preprints, Medium/blog posts, and book drafts. It is
the canonical place to find published or in-progress work that motivates the design
decisions in this repo.

### Conda environment

All Python execution (extractor, API, SPL pipeline) runs in the `spl123` conda
environment. The environment is not managed by this repo.

---

## 4. Data model

### `graph.yaml` node schema

```yaml
domain: chinese_characters

primitives:
  人:                          # node key = the character itself
    symbol: rén                # pinyin with tone diacritics
    defines: person — a walking figure
    label: person              # optional English label (zi_en)
    tier: 0                    # always 0 for primitives

concepts:
  休:
    composed_of: [人, 木]      # direct component characters
    symbol: xiū
    defines: rest — a person leaning against a tree
    label: rest
    tier: 1                    # 1 + max(tier of components)

applications: {}               # reserved for 2-char / 4-char phrases (future)
```

### `catalog.json` entry (single-domain registry)

```json
{
  "id": "chinese_characters",
  "name": "Chinese Characters",
  "nodes": 0,
  "edges": 0,
  "primitives": 0,
  "concepts": 0,
  "applications": 0,
  "tags": ["language"],
  "default_level": "intro",
  "has_navigator": false,
  "has_book": false,
  "books": [],
  "generated_concepts": []
}
```

The numeric stats and `has_navigator` / `has_book` / `books` / `generated_concepts`
fields are populated manually (or by a future update script) after the graph and
books are generated.

---

## 5. Extractor implementation (`zinets_to_graph.py`)

### Algorithm

```
1. Load all active zi (zn_zi WHERE is_active='Y'), optionally filtered by set_id.
2. Load decomposition rows (zn_zi_part WHERE is_active='Y').
   - For each row, collect non-null part fields whose value is in our active set.
   - Deduplicate components while preserving positional order.
3. Load fallback definitions from zn_character_cache.
4. Classify:
   - primitives = active zi with NO entry in zn_zi_part (or all parts outside our set)
   - concepts   = active zi with at least one in-set component
5. Compute BFS tiers:
   - Seed queue with all primitives (tier 0).
   - For each dequeued node at tier T, update each dependent's tier to max(current, T+1).
   - Decrement in-degree counter; enqueue when it reaches 0.
   - Characters with unresolved cycles or missing components get a best-effort tier.
6. Build graph dict, serialise to YAML.
```

### Pinyin conversion

`zn_zi.pinyin` stores tones as trailing digits (CC-CEDICT / MDBG format: `ren2`).
The extractor converts to Unicode diacritics (`rén`) via `to_diacritic()` using the
standard placement rules (a/e always; ou→o; last-vowel-in-final otherwise).

### Fallback chain for `defines:`

1. `zn_zi.desc_en` — hand-curated English description (preferred)
2. `zn_character_cache.meaning` — LLM-generated definition (joined on `character = zi`)
3. `zn_zi.desc_cn` — Chinese description (last resort)
4. `""` — empty string (validator will warn)

### HSK filtering (`--set-id`)

`zn_zi.set_id` groups characters by approximate frequency / HSK level:

| set_id | approx. count | meaning |
|--------|---------------|-----------------------|
| `'300'` | 250 | top-300 most-used characters |
| `'100'` | 93 | top-100 |
| `'30'` | 31 | top-30 |
| `'10'` | 9 | top-10 |
| `''` | ~10,908 | remaining (unclassified) |

Passing `--set-id 300,100,30,10` produces a ~383-character graph suitable for
prototyping and validation before scaling to the full corpus.

---

## 6. Assumptions

1. **Primitive = no decomposition in `zn_zi_part`.**
   A character is treated as primitive if it has no row in `zn_zi_part` with at
   least one non-null part field whose value is also in the active set. This matches
   how ZiNets defines "elemental" but misses characters that *have* a decomposition
   row yet are traditionally considered atomic (e.g., some KangXi radicals that are
   technically decomposable in the database). These are accepted as primitives for
   now and flagged in §7.

   **Terminology note — "primitive" vs "elemental" in the Chinese character domain.**
   In the ConceptBook framework, *primitive* is the generic term for any foundational
   node with no further decomposition — the floor of the DAG. For Chinese characters
   this label risks confusion with historical or palaeographic usage: the "original"
   forms of characters (Oracle bone script, 甲骨文; Bronze inscriptions, 金文) are a
   separate scholarly concept referring to ancient writing systems, not to modern
   composition units.

   To avoid this confusion the ZiNets research uses the term **elemental characters**
   (汉字基本单元) for the ~422 nodes that sit at tier 0. "Elemental" signals
   *compositional role* — these are the indivisible bricks for the purpose of the
   modern composition rule — without implying they are historically primitive or
   graphically undecomposable in every palaeographic tradition. The `graph.yaml`
   node kind remains `primitive` (matching the ConceptBook schema), but all
   documentation and UI copy should prefer "elemental" when discussing the Chinese
   character domain specifically.

   Not surprisingly, many elemental characters can be traced to Oracle forms.

2. **Components outside the active set are silently dropped.**
   If character A decomposes into B + C but C is not in the active set (e.g., because
   of a `--set-id` filter), C is excluded from `composed_of`. If that leaves A with
   no components, A is reclassified as a primitive. This is correct behaviour for
   filtered subsets.

3. **No duplicate component roles.**
   The 11 positional fields in `zn_zi_part` (`zi_left`, `zi_right`, `zi_up`, …) can
   repeat the same character (e.g., 林 = 木 + 木). The extractor deduplicates:
   `composed_of: [木]`, not `[木, 木]`. The `pieces:` field (used in the pilot to
   list repeated bricks) is not generated — the ConceptBook SPL pipeline does not
   currently use it.

4. **BFS tiers are well-defined only for DAGs.**
   Cycles in `zn_zi_part` (which should not exist but may occur due to data quality)
   cause some nodes to keep non-zero `remaining_deps` and never enter the BFS queue.
   These receive a best-effort tier computed from whatever part tiers are available.

5. **Pinyin is single-reading only.**
   `zn_zi.pinyin` stores one reading per character. Polyphonic characters (多音字,
   e.g., 行 xíng / háng) are represented by whichever reading the database records
   as primary.

---

## 7. Limitations

### Data gaps

- **`applications:` is empty.** The `zn_zi` table contains only single characters;
  2-character and 4-character idiomatic phrases (compound words) require a separate
  data source not yet available in `zinets_cache.sqlite`.

- **~10,908 characters have no `set_id`.**
  These are active in the database but have no HSK-level classification. They are
  included in the default (no-filter) run but excluded by any `--set-id` filter.

- **`zi_en` coverage is sparse.**
  Many characters have no English label in `zn_zi.zi_en`. The `label:` field is
  omitted from the node in those cases; the frontend falls back to the character
  itself as the display key.

- **`desc_en` coverage is partial.**
  Not every character has a hand-curated `desc_en`. The LLM fallback
  (`zn_character_cache`) covers 61 characters in the HSK subset; the remaining
  characters fall back to `desc_cn` or an empty string.

### Structural

- **Elemental edge-cases.**
  Some characters among the ~422 primitives are not standalone Unicode characters
  (e.g., variant forms or graphical components used only inside other characters).
  They appear as nodes but cannot be displayed by the browser's default font.
  This is a known gap from traditional dictionaries and is accepted for now.

- **`catalog.json` stats are static.**
  The `nodes`, `edges`, `primitives`, `concepts`, `applications` counts in
  `public/domains/catalog.json` are set to `0` by default and must be updated
  manually (or by a future helper script) after each graph regeneration.

- **No incremental update.**
  `zinets_to_graph.py` always rewrites `graph.yaml` from scratch. There is no
  diff or merge mode.

- **Concept books are not regenerated automatically.**
  When `graph.yaml` changes (e.g., after a database update), previously generated
  `concept_{zi}.html` files are not invalidated. Re-generation is a manual step.

### Planned but not yet implemented

- Convert `catalog.json` stats automatically after graph generation.
- Add `applications:` from a compound-word source.
- `zinets_vis` integration (Step 5): sidebar panel surfacing `concept_{zi}.html`
  when a character node is tapped in the Vue.js portal.

---

## 8. Roadmap

The items below are not yet designed or implemented. They are captured here so that
future architecture decisions can account for them.

### 8.1 Hosted portal

Deploy the static `dist/` build to GitHub Pages and, optionally, a lightweight
cloud API for on-demand book generation without a local SPL.py install.

- `vite.config.js` base path (`/cb-zinets/`) is already set for GitHub Pages.
- `npm run deploy` already builds and pushes to `gh-pages`.
- Remaining work: CI pipeline, cloud API hosting, CDN for pre-generated books.

### 8.2 Mobile app

A mobile-first view (or PWA) that integrates with the `zinets_vis` Vue.js portal.
When a user taps a character node, the app opens the corresponding concept book in a
sidebar or full-screen panel.

- Concept books are self-contained HTML files — they can be embedded in any WebView.
- Link pattern: `{CB_BASE}/chinese_characters/output/intro.zh/html/concept_{zi}.html`
- Design is deferred until the graph and books are validated at scale (Step 5).

### 8.3 Context-aware note-taking

Allow learners to annotate any concept book page with personal notes, mnemonics, or
stroke-order reminders. Notes are:

- Stored locally (localStorage or IndexedDB) in the browser — no backend required
  for the basic version.
- Keyed by `(domain, zi, level, lang)` so switching language/level preserves notes.
- Exportable as JSON or Markdown for backup and sharing.

A future server-side variant would store notes in a user account and sync across
devices (relevant to the hosted-portal phase).

### 8.4 Learning management

Track which characters a learner has studied, which concept books they have read, and
which bricks they have mastered. Core features:

- **Progress state** per character: unseen → introduced → practised → mastered.
- **Spaced repetition hooks**: surface characters whose tier-1 bricks are mastered
  but the composed character has not yet been introduced.
- **`gap()` integration**: the SPL `answer_on_demand.spl` already implements a gap
  function (concepts a learner still needs vs. what they already know). Learning
  management provides the known-set as input.
- **HSK tier dashboard**: visualise coverage across `set_id` groups.

Persistence: localStorage for single-device; a lightweight backend (FastAPI + SQLite
or cloud DB) for multi-device sync in the hosted-portal phase.

### 8.5 Sharing and collaborative learning

Enable learners and teachers to share concept books, note collections, and learning
paths.

- **Static share links** — a pre-generated concept book URL is shareable immediately
  (it is just a static HTML file on the hosted portal).
- **Annotated share links** — encode note highlights as URL fragments or short codes,
  loadable by anyone who opens the link.
- **Classroom collections** — a teacher assembles a curated subset of characters
  (e.g., HSK1 + key radicals) into a shareable "collection" that sets the graph
  viewport and pre-generates books for all nodes in the set.
- **Collaborative annotation** — multiple users annotate the same concept book; notes
  are merged and displayed with author tags (requires the server-side notes backend
  from §8.3).

These features are additive and do not require changes to the core graph or book
generation pipeline.
