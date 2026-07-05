# Maintenance scripts — one-shot repairs and migrations

These scripts fixed specific incidents; they are idempotent and safe to re-run,
but are not part of any regular workflow. Kept as executable documentation.

| Script | Incident | Writeup |
|---|---|---|
| `thin_books.py` | 2026-07-04 migration: converted legacy fat books (inlined single-character sections) to thin books (TOC links to canonical pages) | `docs/DEV/readme-retro-armature.md` (P5 context), thin-book architecture |
| `repair_thinned_books.py` | 2026-07-04 incident: an offset bug in thin_books' first version damaged 405 books; this reconstructs them from surviving structure | retro doc, "armature principle" section of `concept-book/docs/DEV/readme-roadmap.md` |

Durable, re-runnable utilities (backfills, exporters, generators) live one
level up in `scripts/`.
