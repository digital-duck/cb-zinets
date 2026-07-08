#!/usr/bin/env python3
"""
sweep_language_check.py — diagnostic sweep: does the LLM honor @language reliably?

For each (concept, language) pair, forces a fresh (skip_cache) standalone-concept
generation via the task queue and inspects the task log to see whether
spl/tools.py's verify_language() caught the model ignoring the language
instruction on its first attempt (and had to refine_section() its way to a fix).

This is a diagnostic, not a content generator: run it after adding a new target
language, or whenever you suspect the model is dropping the language instruction.
The per-language first-attempt failure rate is the signal for whether
concept_book_prompts.spl's write_section prompt needs a stronger language
instruction — the verify+refine step in the SPL workflows (added 2026-07-07)
is a safety net, not a fix for a systematic prompt weakness. A language that
fails here every time needs the prompt looked at; an occasional one-off is
normal LLM variance and the safety net is enough.

Always uses skip_cache=True — a cache hit would silently skip the LLM call
and tell you nothing about current instruction-following behavior.

Usage:
    python scripts/sweep_language_check.py
    python scripts/sweep_language_check.py --concept 乙 --langs fr,es,pt,ko,de
    python scripts/sweep_language_check.py --concept 一 --langs ar --llm claude_cli:sonnet
"""
import argparse
import re
import sys
import time
from pathlib import Path

import requests

_ROOT = Path(__file__).resolve().parent.parent
_CONCEPTS_ROOT = _ROOT / "public" / "concepts"

# Independent re-check of the final saved content, duplicated from
# spl/tools.py::verify_language (single source of truth) so this script has
# no dependency on the SPL.py framework being importable standalone — see
# scripts/patch_pinyin_sonnet.py for the same intentional-duplication pattern.
_ENGLISH_STOPWORDS = frozenset("""
the and is are this that with from your you imagine picture think notice consider
when where what which how why because like just only very more most some each
""".split())


def _verify_language(section: str, language: str) -> str:
    if not language or language == "en":
        return "ok"
    words = re.findall(r"[a-zA-Z']+", section.lower())
    if len(words) < 20:
        return "ok"
    hits = sum(1 for w in words if w in _ENGLISH_STOPWORDS)
    if hits / len(words) > 0.08:
        return "fail"
    return "ok"


def _extract_section_text(html: str) -> str:
    m = re.search(r"<section>(.*?)</section>", html, re.DOTALL)
    text = m.group(1) if m else html
    return re.sub(r"<[^>]+>", " ", text)


def _queue(base_url: str, concept: str, level: str, language: str, model: str) -> str:
    r = requests.post(f"{base_url}/api/generate", json={
        "target": concept, "level": level, "language": language,
        "model": model, "skip_cache": True, "kind": "concept",
    }, timeout=10)
    r.raise_for_status()
    return r.json()["task_id"]


def _poll(base_url: str, task_id: str, timeout: int = 180, interval: int = 3) -> tuple[bool, str | None]:
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = requests.get(f"{base_url}/api/tasks/{task_id}", timeout=30)
        r.raise_for_status()
        d = r.json()
        if d["status"] == "done":
            return True, None
        if d["status"] == "failed":
            return False, d.get("error") or "unknown error"
        time.sleep(interval)
    return False, f"timed out after {timeout}s"


def _get_log(base_url: str, task_id: str) -> str:
    r = requests.get(f"{base_url}/api/tasks/{task_id}/log", timeout=10)
    r.raise_for_status()
    return r.text


def _first_attempt_result(log_text: str) -> str:
    """'ok' | 'refined' | 'unknown' — based on the verify_language log lines."""
    for line in log_text.splitlines():
        if "Language check FAILED" in line:
            return "refined"
        if "Language check OK" in line:
            return "ok"
    return "unknown"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--concept", default="乙", help="Character/concept to test (default: 乙).")
    ap.add_argument("--langs", default="fr,es,pt,ko,de", help="Comma-separated language codes.")
    ap.add_argument("--llm", default="sonnet", help='Bare model name ("sonnet") or "adapter:model".')
    ap.add_argument("--level", default="intro", help="Content level (default: intro).")
    ap.add_argument("--base-url", default="http://localhost:8000", help="cb_zinets API base URL.")
    args = ap.parse_args()

    model = args.llm.split(":", 1)[-1] if ":" in args.llm else args.llm
    langs = [l.strip() for l in args.langs.split(",") if l.strip()]

    print(f"Sweep  concept={args.concept}  llm={args.llm}  model={model}  level={args.level}")
    print(f"Languages: {langs}\n")

    rows: list[tuple[str, str, str]] = []  # (lang, first_attempt, final_check)

    for lang in langs:
        print(f"[{lang}] queueing (skip_cache=True)...")
        try:
            task_id = _queue(args.base_url, args.concept, args.level, lang, model)
        except Exception as exc:
            print(f"[{lang}]   queue error: {exc}")
            rows.append((lang, "error", str(exc)))
            continue

        success, err = _poll(args.base_url, task_id)
        if not success:
            print(f"[{lang}]   ✗ {err}")
            rows.append((lang, "error", err or ""))
            continue

        log_text = _get_log(args.base_url, task_id)
        first_attempt = _first_attempt_result(log_text)

        # Independent re-check against the actual HTML file written to disk —
        # what a reader would actually see — not just trusting the in-run check.
        out_path = _CONCEPTS_ROOT / f"{args.level}.{lang}" / model / f"concept_{args.concept}.html"
        if out_path.exists():
            final_text = _extract_section_text(out_path.read_text(encoding="utf-8"))
            final_check = _verify_language(final_text, lang)
        else:
            final_check = "unknown (file not found)"

        print(f"[{lang}]   first attempt: {first_attempt}   final content: {final_check}")
        rows.append((lang, first_attempt, final_check))

    print("\n" + "=" * 60)
    print(f"{'lang':<6} {'first attempt':<15} {'final content':<15}")
    print("-" * 60)
    needs_attention = []
    for lang, first_attempt, final_check in rows:
        print(f"{lang:<6} {first_attempt:<15} {final_check:<15}")
        if first_attempt == "refined" or final_check == "fail":
            needs_attention.append(lang)
    print("=" * 60)

    if needs_attention:
        print(f"\n{len(needs_attention)}/{len(rows)} language(s) needed a refine or still look wrong: {needs_attention}")
        print("A single 'refined' can be normal LLM variance (the safety net caught and fixed it).")
        print("A language that fails repeatedly across concepts is the signal to strengthen")
        print("concept_book_prompts.spl's write_section prompt, not just rely on the retry.")
    else:
        print("\nAll languages passed on the first attempt — no prompt changes indicated.")

    sys.exit(1 if any(r[2] == "fail" for r in rows) else 0)


if __name__ == "__main__":
    main()
