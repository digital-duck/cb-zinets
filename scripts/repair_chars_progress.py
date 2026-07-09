#!/usr/bin/env python3
"""
repair_chars_progress.py — drop false-"done" entries from a --chars batch
progress file where the promised concept_*.html was never actually written.

Root cause (fixed 2026-07-08 in api/services/task_worker.py): spl3 exits 0
even when a workflow's EXCEPTION handler catches an error (e.g. Claude's
ModelOverloaded, a rate-limit signal) and RETURNs gracefully without ever
calling write_concept_html(). The task queue used to trust the exit code
alone, so these silently-failed generations were marked 'done' and
propagated into the batch script's progress file — permanently skipping
them on every future --chars run since "done" entries are never retried.

This is a one-time-per-incident repair, not a routine tool: after the
task_worker.py fix lands, run this once to clear the false entries, then
re-run the same --chars batch — dropped characters will regenerate for real
(and now correctly marked failed-and-retried if they hit ModelOverloaded
again, instead of silently "succeeding").

Usage:
    python scripts/repair_chars_progress.py docs/TEST/batch_gen_progress_chars_sonnet.json
    python scripts/repair_chars_progress.py docs/TEST/batch_gen_progress_chars_sonnet.json --dry-run
"""
import argparse
import json
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
_CONCEPTS_ROOT = _ROOT / "public" / "concepts"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("progress_file", type=Path, help="Path to a batch_gen_progress_chars_*.json file.")
    ap.add_argument("--dry-run", action="store_true", help="Report only, don't modify the file.")
    args = ap.parse_args()

    progress = json.loads(args.progress_file.read_text(encoding="utf-8"))

    dropped: list[str] = []
    kept = 0
    for key, status in list(progress.items()):
        if status != "done":
            continue  # error entries are already retried on next run — nothing to fix
        char, model, level, lang = key.split("|")
        out_file = _CONCEPTS_ROOT / f"{level}.{lang}" / model / f"concept_{char}.html"
        if out_file.exists() and out_file.stat().st_size >= 500:
            kept += 1
            continue
        dropped.append(key)
        if not args.dry_run:
            del progress[key]

    if not args.dry_run and dropped:
        args.progress_file.write_text(
            json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    by_lang: dict[str, int] = {}
    for key in dropped:
        _, _, _, lang = key.split("|")
        by_lang[lang] = by_lang.get(lang, 0) + 1

    print(f"{'DRY RUN — ' if args.dry_run else ''}{args.progress_file}")
    print(f"kept (file verified on disk): {kept}")
    print(f"dropped (false 'done', file missing/too small): {len(dropped)}")
    for lang, n in sorted(by_lang.items()):
        print(f"  {lang}: {n} — will regenerate on the next --chars run for that language")


if __name__ == "__main__":
    main()
