# scripts/ — generators, backfills, and shared libraries

Durable, re-runnable utilities. One-off incident repairs (not part of any
regular workflow) live in `scripts/maintenance/` instead — see
`scripts/maintenance/README.md`.

Run everything from the repo root (`cb-zinets/`) so `cb_config.py`'s relative
paths resolve correctly.

## Generators

| Script | What it does |
|---|---|
| `zinets_to_graph.py` | Builds a domain from the ZiNets SQLite DB: `graph.yaml` + `graph.html` + catalog update, in one step. Two modes — `--set-id N` for a static HSK tier (`public/domains/zinet-setid-N/`), or `--phrase "画蛇添足"` for on-demand phrase decomposition (`public/domains/画蛇添足/`). No args → full ~11,300-character corpus (`public/domains/chinese_characters/`). |
| `domain_builder.py` | The single materialization path (`graph dict → graph.yaml → graph.html`) that both `zinets_to_graph.py` and `api/routers/phrase.py` call into, so the CLI and the live API can't drift apart. Not run directly. |
| `concept_graph.py` | Generic concept-graph CLI/toolkit (vis.js HTML rendering, graph inspection commands: `list`, `ancestors`, `import`, etc.) that any domain module can plug into. `python scripts/concept_graph.py --help` for the full command list. |
| `phrase_decomposer.py` | Character/phrase decomposition into the 3-tier graph (primitives → concepts → applications) that powers phrase-mode generation. Library, not run directly. |

## Backfills / migrations (idempotent, safe to re-run)

Each of these patches *already-generated* HTML in place, without going
through the LLM again — useful when a UI/content feature is added after
content already exists for some models.

| Script | Usage | What it patches |
|---|---|---|
| `patch_pinyin_sonnet.py` | `python scripts/patch_pinyin_sonnet.py [--model sonnet\|gemma4\|...] [--dry-run]` | Injects the pinyin span (`_char_tools_span()` in `spl/tools.py`) into existing canonical `concept_*.html` pages, for models generated before the pinyin feature existed. Pure string patch, pulls pinyin from `zn_zi.pinyin`. Skips pages already patched, multi-glyph/radical fragments (`no-char-tools`), and single glyphs with no pinyin row in the DB (`no-pinyin-data`, e.g. `叶` `頁` `钅`). |
| `backfill_char_tools.py` | `python scripts/backfill_char_tools.py [--dry-run]` | Same idea, older/broader version: backfills the whole stroke-order-canvas + 🔊 pronounce widget (not just pinyin) into canonical `public/concepts/` pages, sourcing the HTML from `_char_tools_span()`/`_char_tools_block()` directly so backfilled pages stay in sync with the real generator. |
| `backfill_char_resources.py` | `python scripts/backfill_char_resources.py [--dry-run]` | Rebuilds the References row (成语 / dictionary links etc.) in existing pages from `config.yaml`'s current `resources:` list. Run after editing that list (e.g. swapping the temporary 成语 lookup site — see `reference_chengyu_lookup_temp` memory). |
| `backfill_pinyin.py` | `python scripts/backfill_pinyin.py` | One-off catalog.json backfill: attaches toneless pinyin (+ `pinyin_initials` for phrases) to existing catalog entries for search. New entries get this automatically via `pinyin_lib.py`; this is only needed after adding pinyin search to an already-populated catalog. |
| `export_resources.py` | `python scripts/export_resources.py` | Exports `config.yaml`'s `resources:` list to `public/resources.json` (the frontend Resources page has no YAML parser). Re-run whenever `config.yaml`'s resources change. |
| `create_default_symlinks.py` | `python scripts/create_default_symlinks.py [--dry-run] [--force]` | Creates `default -> sonnet` directory symlinks (sonnet: the fullest/highest-quality model) at both `public/concepts/{level}.{lang}/default` and every `public/domains/{domain}/output/{level}.{lang}/default`, so the Content/Book page's "— default (sonnet) —" model selection resolves to real content instead of a legacy no-model path. Skips a `{level}.{lang}` dir with no `sonnet` subdir yet (`no-sonnet`) and one that already has a `default` entry (`skipped`, unless `--force`). Exposes `create_default_symlinks()` for reuse — the Settings page's "Sync Catalog" button (`POST /api/catalog/sync` in `api/routers/domains.py`) calls it automatically after every sync, so this rarely needs a manual run. |

## Build tooling

| Script | What it does |
|---|---|
| `filter-published-models.js` | Postbuild step (wired into `npm run build`) that strips low-quality/unpublished model output (e.g. gemma3) from `dist/` before `gh-pages` deploy, so the static site never serves it. `public/domains/` on disk keeps the full set for local model comparison. |

## Shared libraries (imported, not run directly)

| Module | Purpose |
|---|---|
| `cb_config.py` | Single accessor for `config.yaml` + repo-root path (`ROOT`) + DB path. |
| `cb_paths.py` | The path-schema encoding for generated artifacts (`output/{level}.{lang}/{model}/...`). JS twin: `src/lib/paths.js` — keep both in sync. |
| `catalog_lib.py` | The only correct way to write `public/domains/catalog.json` — `update_catalog()` is fcntl-locked and atomic. Never write that JSON directly; concurrent generation jobs will corrupt it. |
| `pinyin_lib.py` | Shared toneless-pinyin lookup (`zn_zi.pinyin` → search-friendly strings). Used by `backfill_pinyin.py` and `api/services/catalog_svc.py`. |
