#!/usr/bin/env python3
"""
Regenerate all phrase domains with gemma3 (Ollama).

Thin wrapper around regen_sonnet.py — same resume/skip logic,
separate progress file so gemma3 and sonnet runs don't collide.

USAGE
-----
    python docs/TEST/regen_gemma3.py

# Custom phrase list:
    python docs/TEST/regen_gemma3.py --phrases docs/TEST/phrases.txt

# Force re-run everything:
    python docs/TEST/regen_gemma3.py --force

Can run in a second terminal alongside regen_sonnet.py — tasks
queue on the backend and are processed one at a time.
"""
import sys
from pathlib import Path

# Reuse all logic from regen_sonnet.py
sys.path.insert(0, str(Path(__file__).parent))
import regen_sonnet

# Override defaults
regen_sonnet.DEFAULT_PROGRESS_FILE = Path(__file__).parent / "regen_progress_gemma3.json"

if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Batch-regenerate concept books with gemma3")
    ap.add_argument("--phrases",    type=Path, default=None)
    ap.add_argument("--model",      default="gemma3")
    ap.add_argument("--level",      default="intro")
    ap.add_argument("--lang",       default="en")
    ap.add_argument("--base-url",   default="http://localhost:8000")
    ap.add_argument("--force",      action="store_true")
    ap.add_argument("--skip-cache", action="store_true", default=True)
    ap.add_argument("--progress",   type=Path,
                    default=Path(__file__).parent / "regen_progress_gemma3.json")
    args = ap.parse_args()

    phrases = regen_sonnet._load_phrases(args.phrases)
    progress = regen_sonnet._load_progress(args.progress)

    print(f"Batch regen  model={args.model}  level={args.level}  lang={args.lang}")
    print(f"Phrases: {len(phrases)}  |  Progress file: {args.progress}\n")

    ok = skipped = failed = 0

    for phrase in phrases:
        key = f"{phrase}|{args.model}|{args.level}|{args.lang}"

        if not args.force and progress.get(key) == "done":
            print(f"  SKIP  {phrase}  (recorded done in progress file)")
            skipped += 1
            continue

        match = regen_sonnet._find_domain(phrase)
        if match is None:
            print(f"  SKIP  {phrase}  (no matching domain found)")
            skipped += 1
            continue
        domain, target = match

        if not args.force and regen_sonnet._output_exists(domain, target, args.level, args.lang, args.model):
            print(f"  SKIP  {phrase}  (output already exists → {domain})")
            progress[key] = "done"
            regen_sonnet._save_progress(args.progress, progress)
            skipped += 1
            continue

        print(f"  Queue {phrase}  domain={domain}  target={target}", end="", flush=True)
        try:
            task_id = regen_sonnet._queue(args.base_url, domain, target, args.level, args.lang,
                                          args.model, args.skip_cache)
            print(f"  [{task_id[:8]}]", end="", flush=True)
        except Exception as exc:
            print(f"\n  ✗ queue error: {exc}")
            progress[key] = f"error: {exc}"
            regen_sonnet._save_progress(args.progress, progress)
            failed += 1
            continue

        success, err = regen_sonnet._poll(args.base_url, task_id)
        if success:
            print("  ✓")
            progress[key] = "done"
            ok += 1
        else:
            print(f"  ✗ {err}")
            progress[key] = f"error: {err}"
            failed += 1
        regen_sonnet._save_progress(args.progress, progress)

    print(f"\nDone — {ok} generated, {skipped} skipped, {failed} failed.")
    if failed:
        print("Re-run to retry failed phrases.")
    sys.exit(0 if failed == 0 else 1)
