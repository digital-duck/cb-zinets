# cb_zinets Retro — the Codebase Through the Armature Lens

*2026-07-04. A refactoring survey of cb_zinets against the armature principle
(deterministic bone, probabilistic flesh — see
`concept-book/docs/DEV/readme-roadmap.md`). Assessment only; nothing below has
been applied. Baseline commit: `903824b`.*

## Where the armature already holds

1. **The flesh vault.** All LLM output lives in `cb_concepts` keyed on
   (name, level, language, model). Every structural artifact — books, TOCs,
   symlinks, catalogs, PDFs — is regenerable at zero model cost. Today's
   405-book repair is the existence proof.
2. **Thin books / reference-don't-copy.** Canonical concept pages + per-domain
   symlinks form the variant coordinate system; books and PDFs resolve through
   it instead of duplicating content.
3. **Vertical gating.** Hanzi-specific behavior sits behind named seams:
   `_is_single_cjk()` (widgets, references), `config.yaml resources:`
   (link row), `matchesQuery()` (search), the ZiNets SQLite adapter.
4. **SPL orchestration.** The recipe (`build_concept_book.spl`) is
   deterministic control flow; the LLM fills named slots (per-concept section,
   payoff) behind `cache_get/put` and `verify_section`.
5. **Maintenance scripts import the generator** (`backfill_char_tools`,
   `backfill_char_resources` call `spl/tools.py` helpers) — repairs reference
   the bone, never fork it.

## Cracks, ranked (risk × payoff)

### P1 — catalog.json has five writers and no lock  ⚠ highest risk

`catalog_svc.upsert_domain`, `catalog_svc.mark_book_generated`,
`pdf_svc._mark_pdf_generated`, `scripts/backfill_pinyin.py`, and
`scripts/zinets_to_graph.py` all do read-modify-write on one 6,000-line JSON
file. `task_worker` runs up to `task_max_concurrent = 2` generations in
parallel, and batch runs execute several models concurrently — concurrent
`mark_book_generated` calls can silently drop each other's updates. This bug
class has already bitten once (commit `15d1f3c`: mark_book_generated wiped
pinyin).

**Fix:** make the catalog bone-in-a-database. Either (a) one writer module
with an `fcntl` file lock as a stopgap, or (b) properly: catalog tables in the
existing SQLite, with `catalog.json` demoted to a generated export (like
`resources.json`). (b) also fixes `mark_book_generated`'s glob-rescan of the
html dir on every call.

### P2 — two builders for the same bone (domain graphs)

`api/routers/phrase.py:generate_domain_dynamically()` (~200 inline lines) and
`scripts/zinets_to_graph.py` both build graph.yaml + graph.html. They have
already drifted once — the legacy repeated-character-deduped target names
(`book_phrase_没头脑`) vs. full names — and every future fix (like today's
whitespace trim) must be remembered twice.

**Fix:** extract one `domain_builder` module (decompose → graph_dict →
yaml + html + catalog entry); the API route and the CLI script become thin
callers. This kills an entire drift class.

### P3 — the path schema is encoded in 10+ places

`output/{level}.{language}/{model}/html/{book|concept}_{x}.html` is the bone's
coordinate system, and it's spelled out independently in `BookPage.js`
(`buildUrl`, `parseModel`, `parseLevelLang`), `GraphViewer.js`
(`_localizePath`), `catalog_svc`, `pdf_svc`, `executor`, `thin_books`,
`repair_thinned_books`, `zinets_to_graph`, `batch_gen_phrase`, plus two
apparently dead components. The roadmap wants variant axes to be
*configuration* — impossible while the schema is string-literal folklore.

**Fix:** one `paths.py` + one `paths.js` (build + parse, round-trip tested).
Mechanical, low risk, prerequisite for any new axis.

### P4 — bone asks flesh "do you exist?" by smelling it

Three copies of marker-sniffing existence checks (`text.includes('spl-credit')`)
in `BookPage.js`, `GraphViewer.js`, and the graph.html template — needed
because Vite serves the SPA index for missing files. Brittle: a template
footer change breaks navigation.

**Fix:** existence is bone knowledge — the catalog/manifest already records
what was generated. Serve existence from the catalog (BookPage already
pre-populates its cache from it; make that authoritative), keep one shared
sniffing fallback for uncatalogued files.

### P5 — bone baked into flesh artifacts (the cross-domain TOC)

`write_concept_html` bakes a birth-domain sidebar TOC into every canonical
page (~10% of page bytes). It caused two defects this session (Book page
sidebar hijack, Graph detail pane showing the wrong domain) — both patched
*in the viewers*, so the anomaly is now invisible but still present in 1,800+
files, waiting for the next new viewer.

**Fix:** stop baking sibling TOCs into canonicals; viewers own navigation
(they already do). Keep the h1/widget/references. One generator edit + one
zero-LLM-cost backfill to strip existing navs. Decide first: acceptable UX for
opening a canonical file directly (nav-less page vs. minimal back link).

### P6 — `spl/tools.py` is three modules wearing one file (1,034 lines)

Framework bone (domain cache, page templates, book assembly, symlink IO),
flesh-boundary processing (md→html, ~400-line LaTeX sanitizer,
`_decode_hex_escapes`), and the hanzi vertical adapter (`_char_tools_*`,
`_char_resources_html`, `_is_single_cjk`) live in one namespace.

**Fix:** split along exactly those three armature roles. Mechanical; it *is*
the first step of the roadmap's vertical-adapter extraction, so doing it now
pre-pays vertical #2.

### P7 — GraphViewer patches graph.html internals by force

The wrapper `eval`s into the iframe, overrides `handleSelect`, injects
sections next to `#path-header`, restyles by element ID, and watches with a
MutationObserver. It works, but the UI is two halves (template in
`concept_graph.py`, injections in `GraphViewer.js`) coupled by private
implementation details.

**Fix (when the graph template is next touched):** graph.html exposes stable
slots and events (`postMessage`/CustomEvent contract, `data-slot` mount
points); the wrapper stops eval-patching. This is the templating-discipline
poster child — the slot contract *is* the template for vertical #2.

### P8 — dead code and script sprawl  (trivial)

`src/components/ConceptPanel.js` and `BookViewer.js` are imported by nothing
(superseded by BookPage) — delete. `scripts/` mixes durable tools
(`zinets_to_graph`, backfills) with one-shot incident scripts
(`repair_thinned_books`, `thin_books` post-migration) — move the latter to
`scripts/maintenance/` with a README pointing at the incident writeups.

### P9 — the bone has no X-ray (zero tests)

No test suite exists. Every audit this session — thin-book invariants, padded
names, symlink resolution, catalog/pinyin integrity — was written ad hoc in
chat and discarded. The armature principle says bone QA is *assertions*;
today those assertions live nowhere.

**Fix:** a small pytest suite that graduates the session's sweeps into
permanent checks: (1) book invariants (nav+`<main>`+h1, TOC links resolve, no
inline single-CJK sections), (2) no whitespace-padded IDs anywhere, (3) path
schema round-trip, (4) catalog schema + no duplicate variant entries,
(5) decompose trims and recurses (惛 reaches 氏/日). Cheap to write — they
already exist in prose — and they turn every future incident's detector into
a permanent skeleton check.

### P10 — cross-language twin logic  (document, don't fix)

`_is_single_cjk` (py) / `_isSingleChar` (js), path regexes (until P3), marker
sniffing (until P4). Unavoidable in a py+js codebase; each pair should carry a
cross-reference comment naming its twin so a change to one prompts the other.

## Suggested order

| Wave | Items | Rationale |
|---|---|---|
| 1 — correctness now | **P1** | Only live data-loss risk; batches run daily |
| 2 — cheap wins | **P8, P9, P3** | Hours each; P9 locks in today's hard-won invariants |
| 3 — bug-class removals | **P5, P2** | Each deletes a category of future defect |
| 4 — pre-extraction | **P6, P4** | Sets up the vertical-adapter interface |
| 5 — with vertical #2 | **P7, P10** | Needs the second consumer to design against |

The theme across every crack: none of them are flesh problems. The LLM content
and its cache are sound. Everything on this list is bone that was welded in
two places, or bone hiding inside flesh artifacts, or bone with no X-ray —
which is exactly what the armature lens is supposed to find.

---

## Implementation status (2026-07-04, same day)

| Item | Status | Where |
|---|---|---|
| **P1** catalog concurrency | ✅ done | `catalog_lib.py` — single locked writer (fcntl + atomic `os.replace`); all five producers routed through `update_catalog()` (catalog_svc, pdf_svc, backfill_pinyin, zinets_to_graph; the phrase router writes via catalog_svc). Verified: 8 procs × 25 updates, 0 lost. SQLite-backed catalog remains the roadmap endgame. |
| **P2** duplicate domain builders | ✅ done | `scripts/domain_builder.py` — graph.yaml is the single source of truth; graph.html always derived from it. Found and fixed a live drift bug: the CLI's hand-built nx graph dropped deep sub-component edges (春生夏长's html was missing 8 edges its own yaml implied). Three copies → one (`api/routers/phrase.py` −190 lines, CLI phrase mode −180 lines). Application-node naming kept per caller (`phrase_` prefix drives book filenames — unifying it is a separate, user-visible decision). |
| **P3** path schema | ✅ core done | `cb_paths.py` + `src/lib/paths.js` (documented twins, twin-consistency test). Wired: catalog_svc, pdf_svc, BookPage, GraphViewer. Remaining literals (executor, templates) can migrate opportunistically. |
| **P4** existence by sniffing | ✅ consolidated | `src/lib/contentExists.js` — one sniff implementation, catalog-seeded via `markKnown()` from both BookPage and GraphViewer. Full catalog-as-authority still depends on the SQLite catalog move. |
| **P5** bone baked into flesh | ✅ done | Canonical concept pages are now navless (`_CONCEPT_PAGE_TEMPLATE` in spl/tools.py; no birth-domain TOC, title, or back-link). Credit footer moved outside `<main>` so the existence marker survives while book/PDF `<main>` extraction stays clean. Backfill: `scripts/maintenance/strip_baked_toc.py` converted 3,152 pages, idempotent. |
| **P8** dead code / script sprawl | ✅ done | ConceptPanel.js, BookViewer.js deleted; thin_books.py + repair_thinned_books.py quarantined in `scripts/maintenance/` with a README; dead `load_parts_recursive` removed. |
| **P9** no X-ray | ✅ done | `tests/test_armature.py` — 11 invariants graduated from today's incident audits: path round-trip + JS/py twin agreement, zn_zi_part trim, decompose recursion (惛→氏/日), padded filenames, navless canonicals, thin-book invariants (structure, live TOC links, no unthinned sections, no repair fragments), symlink resolution, catalog schema, deep-edge wiring, concurrent-writer safety. `python3 -m pytest tests/ -q`. |
| **P10** twin logic | ✅ documented | cb_paths.py ↔ paths.js, tools.py `_is_single_cjk` ↔ Home.js `_isSingleChar`, contentExists.js ↔ concept_graph.py template — each names its twin at the definition site. |
| **P6** split spl/tools.py | ⏳ deferred | Pre-extraction for vertical #2, per wave 4. |
| **P7** graph.html slot contract | ⏳ deferred | Design against the second consumer, per wave 5. |
