#!/usr/bin/env python3
"""
Regenerate concept books for a list of phrases using sonnet (or any model).

USAGE
-----
# Run all phrases in the default list file:
    python docs/TEST/regen_sonnet.py

# Supply your own phrase list (one phrase per line, # lines are comments):
    python docs/TEST/regen_sonnet.py --phrases docs/TEST/phrases.txt

# Override model / level / language:
    python docs/TEST/regen_sonnet.py --model sonnet --level intro --lang en

# Force-regenerate even if output already exists:
    python docs/TEST/regen_sonnet.py --force

RESUME
------
Progress is saved to <output-dir>/regen_progress.json after each domain.
Re-running the script automatically skips already-completed phrases.
Delete the file (or use --force) to start over.

PHRASE LIST FORMAT
------------------
One phrase per line.  Blank lines and lines starting with # are ignored.
Example:
    马到成功
    亡羊补牢
    # 一举两得   ← skipped
    井底之蛙
"""
import argparse
import json
import sys
import time
from pathlib import Path

import requests
import yaml

# ── Paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT    = Path(__file__).parent.parent.parent
DOMAINS_ROOT = REPO_ROOT / "public" / "domains"
DEFAULT_PHRASES_FILE = Path(__file__).parent / "phrases.txt"
DEFAULT_PROGRESS_FILE = Path(__file__).parent / "regen_progress.json"

sys.path.insert(0, str(REPO_ROOT / "scripts"))
from cb_paths import book_rel  # noqa: E402

# ── Default phrase list (used when no --phrases file is given) ────────────────

DEFAULT_PHRASES = [
    "一举两得",
    "一见钟情",
    "井底之蛙",
    "亡羊补牢",
    "学而不思则罔思而不学",
    "守株待兔",
    "对牛弹琴",
    "显而易见",
    "独一无二",
    "画蛇添足",
    "解放",
    "马到成功",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_phrases(path: Path | None) -> list[str]:
    """Load phrases from file, or return defaults."""
    if path is None:
        return DEFAULT_PHRASES
    lines = path.read_text(encoding="utf-8").splitlines()
    return [l.strip() for l in lines if l.strip() and not l.strip().startswith("#")]


def _find_domain(phrase: str) -> tuple[str, str] | None:
    """
    Return (domain_dir_name, target_key) for a phrase by scanning graph.yaml files.
    Matches on domain name OR on the phrase_ application key.
    """
    for d in sorted(DOMAINS_ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith("zinet-setid-") or d.name == "chinese_characters":
            continue
        y = d / "input" / "graph.yaml"
        if not y.exists():
            continue
        data = yaml.safe_load(y.read_text(encoding="utf-8"))
        domain_name = data.get("domain", d.name)
        apps = list(data.get("applications", {}).keys())
        # Match by domain name or by phrase inside any application key
        if domain_name == phrase or any(phrase in k for k in apps):
            target = apps[0] if apps else f"phrase_{phrase}"
            return d.name, target
    return None


def _output_exists(domain: str, target: str, level: str, lang: str, model: str) -> bool:
    """True if the book HTML was already generated for this combination."""
    path = DOMAINS_ROOT / domain / book_rel(level, lang, model, target)
    return path.exists() and path.stat().st_size > 500


def _queue(base_url: str, domain: str, target: str, level: str, lang: str,
           model: str, skip_cache: bool) -> str:
    r = requests.post(f"{base_url}/api/generate", json={
        "domain": domain, "target": target,
        "level": level, "language": lang,
        "model": model, "skip_cache": skip_cache,
    }, timeout=10)
    r.raise_for_status()
    return r.json()["task_id"]


def _poll(base_url: str, task_id: str, timeout: int = 900, interval: int = 15) -> tuple[bool, str | None]:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(f"{base_url}/api/tasks/{task_id}", timeout=30)
            r.raise_for_status()
            d = r.json()
            status = d["status"]
            if status == "done":
                return True, None
            if status == "failed":
                return False, d.get("error") or "unknown error"
        except requests.exceptions.RequestException as exc:
            print(f"\n    (poll retry: {exc})", end="", flush=True)
        time.sleep(interval)
    return False, f"timed out after {timeout}s"


def _load_progress(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            pass
    return {}


def _save_progress(path: Path, progress: dict) -> None:
    path.write_text(json.dumps(progress, ensure_ascii=False, indent=2))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Batch-regenerate concept books via the cb_zinets API")
    ap.add_argument("--phrases",    type=Path, default=None,
                    help="Text file with one phrase per line (default: built-in list)")
    ap.add_argument("--model",      default="sonnet")
    ap.add_argument("--level",      default="intro")
    ap.add_argument("--lang",       default="en")
    ap.add_argument("--base-url",   default="http://localhost:8000")
    ap.add_argument("--force",      action="store_true",
                    help="Regenerate even if output already exists")
    ap.add_argument("--skip-cache", action="store_true", default=True,
                    help="Pass skip_cache=true to the API (default: true)")
    ap.add_argument("--progress",   type=Path, default=DEFAULT_PROGRESS_FILE,
                    help="Progress file for resumption")
    args = ap.parse_args()

    phrases = _load_phrases(args.phrases)
    progress = _load_progress(args.progress)

    print(f"Batch regen  model={args.model}  level={args.level}  lang={args.lang}")
    print(f"Phrases: {len(phrases)}  |  Progress file: {args.progress}\n")

    ok = skipped = failed = 0

    for phrase in phrases:
        key = f"{phrase}|{args.model}|{args.level}|{args.lang}"

        # ── Already completed in a previous run ──
        if not args.force and progress.get(key) == "done":
            print(f"  SKIP  {phrase}  (recorded done in progress file)")
            skipped += 1
            continue

        # ── Resolve domain + target ──
        match = _find_domain(phrase)
        if match is None:
            print(f"  SKIP  {phrase}  (no matching domain found in public/domains/)")
            skipped += 1
            continue
        domain, target = match

        # ── Skip if output file already exists (unless --force) ──
        if not args.force and _output_exists(domain, target, args.level, args.lang, args.model):
            print(f"  SKIP  {phrase}  (output already exists → {domain})")
            progress[key] = "done"
            _save_progress(args.progress, progress)
            skipped += 1
            continue

        # ── Queue ──
        print(f"  Queue {phrase}  domain={domain}  target={target}", end="", flush=True)
        try:
            task_id = _queue(args.base_url, domain, target, args.level, args.lang,
                             args.model, args.skip_cache)
            print(f"  [{task_id[:8]}]", end="", flush=True)
        except Exception as exc:
            print(f"\n  ✗ queue error: {exc}")
            progress[key] = f"error: {exc}"
            _save_progress(args.progress, progress)
            failed += 1
            continue

        # ── Poll ──
        success, err = _poll(args.base_url, task_id)
        if success:
            print("  ✓")
            progress[key] = "done"
            ok += 1
        else:
            print(f"  ✗ {err}")
            progress[key] = f"error: {err}"
            failed += 1
        _save_progress(args.progress, progress)

    print(f"\nDone — {ok} generated, {skipped} skipped, {failed} failed.")
    if failed:
        print("Re-run the script to retry failed phrases (already-done ones will be skipped).")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
