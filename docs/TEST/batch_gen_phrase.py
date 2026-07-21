#!/usr/bin/env python3
"""
batch_gen_phrase.py — batch concept-book generation utility for cb_zinets

Queues generation jobs via the API, polls for completion, and resumes
automatically from a progress file if interrupted. --phrases and --chars
are mutually exclusive:

  --phrases  multi-character phrases/idioms → a domain (graph.yaml) is
             found or created for each, then a "phrase_"-prefixed book is
             generated (phrase_X.html + concept_*.html per character — see
             cb_paths.book_rel for the phrase-vs-book filename rule).

  --chars    single elemental characters with no further decomposition
             (docs/TEST/elemental_chars.txt) → generated as standalone
             primitive concepts directly. No domain, no "phrase_" wrapper,
             no book — just concept_{char}.html written straight to the
             shared canonical directory (public/concepts/{level}.{lang}/{model}/).
             See spl/build_concept_only.spl.

USAGE
-----
# Phrases from a file, generate with sonnet:
    python docs/TEST/batch_gen_phrase.py \\
        --phrases docs/TEST/phrases.txt \\
        --llm claude_cli:sonnet

# Inline comma-separated phrases, generate with gemma3:
    python docs/TEST/batch_gen_phrase.py \\
        --phrases "马到成功,亡羊补牢,井底之蛙" \\
        --llm ollama:gemma3

# Elemental characters from a file, generate with sonnet:
    python docs/TEST/batch_gen_phrase.py \\
        --chars docs/TEST/elemental_chars.txt \\
        --llm claude_cli:sonnet

# With a log file:
    python docs/TEST/batch_gen_phrase.py \\
        --phrases docs/TEST/phrases.txt \\
        --llm claude_cli:sonnet \\
        --log docs/TEST/run_sonnet.log

# Force-regenerate even if output exists:
    python docs/TEST/batch_gen_phrase.py \\
        --phrases docs/TEST/phrases.txt \\
        --llm ollama:gemma3 --force

Multiple instances can run simultaneously in separate terminals
(e.g. sonnet + gemma3 in parallel) — each uses its own progress file.

INPUT FILE FORMAT
------------------
One phrase (or character) per line. Blank lines and lines starting with #
are ignored. Same format for --phrases and --chars.
"""
import json
import logging
import subprocess
import sys
import time
from pathlib import Path

import click
import requests
import yaml

_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_ROOT / "scripts"))
from catalog_lib import sync_catalog  # noqa: E402
from cb_paths import book_rel  # noqa: E402

DOMAINS_ROOT    = Path(__file__).parent.parent.parent / "public" / "domains"
SCRIPTS_DIR     = Path(__file__).parent.parent.parent / "scripts"
CATALOG_PATH    = DOMAINS_ROOT / "catalog.json"
DETAIL_DIR      = DOMAINS_ROOT / "catalog"
PROGRESS_DIR    = Path(__file__).parent


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_model(llm_spec: str) -> str:
    """Extract model name from 'adapter:model' or bare 'model'."""
    return llm_spec.split(":", 1)[-1] if ":" in llm_spec else llm_spec


def _load_phrases(phrases_input: str) -> list[str]:
    """Accept a .txt file path, comma-separated list, or single phrase."""
    p = Path(phrases_input)
    if p.exists() and p.is_file():
        lines = p.read_text(encoding="utf-8").splitlines()
        return [l.strip() for l in lines if l.strip() and not l.strip().startswith("#")]
    return [ph.strip() for ph in phrases_input.split(",") if ph.strip()]


def _find_domain(phrase: str) -> tuple[str, str] | None:
    """Return (domain_dir_name, target_key) for a phrase, or None if not found."""
    for d in sorted(DOMAINS_ROOT.iterdir()):
        if not d.is_dir() or d.name.startswith("zinet-setid-") or d.name == "chinese_characters":
            continue
        y = d / "input" / "graph.yaml"
        if not y.exists():
            continue
        data = yaml.safe_load(y.read_text(encoding="utf-8"))
        domain_name = data.get("domain", d.name)
        apps = list(data.get("applications", {}).keys())
        if domain_name == phrase or any(phrase in k for k in apps):
            return d.name, apps[0] if apps else f"phrase_{phrase}"
    return None


def _create_domain(phrase: str, log: logging.Logger) -> bool:
    """Run zinets_to_graph.py --phrase to create a missing domain. Returns True on success."""
    script = SCRIPTS_DIR / "zinets_to_graph.py"
    if not script.exists():
        log.error(f"       zinets_to_graph.py not found at {script}")
        return False
    result = subprocess.run(
        [sys.executable, str(script), "--phrase", phrase],
        capture_output=True, text=True,
        cwd=str(SCRIPTS_DIR.parent),
    )
    if result.returncode != 0:
        log.error(f"       domain creation failed: {result.stderr[-300:]}")
        return False
    return True


def _rescan_all_catalog(log: logging.Logger) -> None:
    """Sync every domain into catalog.json via the canonical implementation."""
    try:
        stats = sync_catalog()
        log.info(f"catalog sync complete — {stats}")
    except Exception as exc:
        log.error(f"catalog sync failed: {exc}")


def _update_catalog(domain_id: str, log: logging.Logger) -> None:
    """Sync one domain's books/generated_concepts into catalog.json."""
    try:
        stats = sync_catalog(domain_id)
        log.info(f"       catalog updated: books={stats['books']}, concepts={stats['concepts']}")
    except Exception as exc:
        log.error(f"       catalog update failed: {exc}")


def _output_exists(domain: str, target: str, level: str, lang: str, model: str) -> bool:
    """True if the book HTML already exists and is non-trivially sized."""
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


CONCEPTS_ROOT = Path(__file__).parent.parent.parent / "public" / "concepts"


def _concept_output_exists(char: str, level: str, lang: str, model: str) -> bool:
    """True if the standalone concept HTML already exists and is non-trivially sized."""
    path = CONCEPTS_ROOT / f"{level}.{lang}" / model / f"concept_{char}.html"
    return path.exists() and path.stat().st_size > 500


def _queue_concept(base_url: str, char: str, level: str, lang: str,
                    model: str, skip_cache: bool) -> str:
    """Queue a standalone primitive-concept job (kind='concept') — no domain, no book."""
    r = requests.post(f"{base_url}/api/generate", json={
        "target": char, "level": level, "language": lang,
        "model": model, "skip_cache": skip_cache, "kind": "concept",
    }, timeout=10)
    r.raise_for_status()
    return r.json()["task_id"]


_RATE_LIMIT_MARKERS = (
    "session limit",
    "ModelOverloaded",
    "Claude CLI limit reached",
)


def _is_rate_limited(base_url: str, task_id: str) -> bool:
    """Check the task's full log for a Claude CLI rate/session-limit signature."""
    try:
        r = requests.get(f"{base_url}/api/tasks/{task_id}/log", timeout=10)
        r.raise_for_status()
        return any(marker in r.text for marker in _RATE_LIMIT_MARKERS)
    except requests.exceptions.RequestException:
        return False


# Returned by _poll to tell the caller "stop the whole batch now" — as opposed
# to an ordinary per-item failure, which just gets logged and skipped. Both
# mean something systemic is wrong (session/rate limit, or a hung backend/spl3
# process) — moving on to the next item would almost certainly hit the same
# wall again, so the batch aborts instead of grinding through the rest of the
# list one 900s timeout at a time.
_ABORT_SENTINELS = ("RATE_LIMITED", "TIMEOUT")


def _poll(base_url: str, task_id: str, log: logging.Logger,
          timeout: int = 900, interval: int = 15) -> tuple[bool, str | None]:
    """Returns (success, error). error in _ABORT_SENTINELS signals the caller to abort the batch."""
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
                if _is_rate_limited(base_url, task_id):
                    return False, "RATE_LIMITED"
                return False, d.get("error") or "unknown error"
        except requests.exceptions.RequestException as exc:
            log.debug(f"poll retry: {exc}")
        time.sleep(interval)
    log.warning(f"       task {task_id[:8]} still not done after {timeout}s — treating as hung")
    return False, "TIMEOUT"


def _load_progress(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_progress(path: Path, progress: dict) -> None:
    path.write_text(json.dumps(progress, ensure_ascii=False, indent=2), encoding="utf-8")


def _setup_logging(log_file: str | None) -> logging.Logger:
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(message)s",
        datefmt="%H:%M:%S",
        handlers=handlers,
        force=True,
    )
    return logging.getLogger("batch_gen")


# ── Batch runners ─────────────────────────────────────────────────────────────

def _run_phrases(phrase_list, model, level, lang, base_url, progress_file,
                  progress, force, skip_cache, log: logging.Logger) -> tuple[int, int, int]:
    """Phrase/idiom mode: find-or-create a domain, generate a phrase_-capstone book."""
    ok = skipped = failed = 0

    for phrase in phrase_list:
        key = f"{phrase}|{model}|{level}|{lang}"

        if not force and progress.get(key) == "done":
            log.info(f"SKIP   {phrase}  (done in progress file)")
            skipped += 1
            continue

        match = _find_domain(phrase)
        if match is None:
            log.info(f"CREATE {phrase}  (no domain — running zinets_to_graph.py)")
            if not _create_domain(phrase, log):
                log.warning(f"SKIP   {phrase}  (domain creation failed)")
                skipped += 1
                continue
            match = _find_domain(phrase)
        if match is None:
            log.warning(f"SKIP   {phrase}  (domain not found after creation)")
            skipped += 1
            continue
        domain, target = match

        if not force and _output_exists(domain, target, level, lang, model):
            log.info(f"SKIP   {phrase}  (output exists → {domain}/{model})")
            progress[key] = "done"
            _save_progress(progress_file, progress)
            skipped += 1
            continue

        log.info(f"Queue  {phrase}  domain={domain}  target={target}")
        try:
            task_id = _queue(base_url, domain, target, level, lang, model, skip_cache)
            log.info(f"       task_id={task_id[:8]} ...")
        except Exception as exc:
            log.error(f"       queue error: {exc}")
            progress[key] = f"error: {exc}"
            _save_progress(progress_file, progress)
            failed += 1
            continue

        success, err = _poll(base_url, task_id, log)
        if success:
            log.info(f"       ✓ done")
            _update_catalog(domain, log)
            progress[key] = "done"
            ok += 1
        elif err in _ABORT_SENTINELS:
            if err == "RATE_LIMITED":
                log.error("       ✗ Claude CLI session/rate limit reached — stopping batch early.")
            else:
                log.error("       ✗ Task timed out with no completion — stopping batch early "
                           "(a hung backend/spl3 process would likely hang the same way on the "
                           "next phrase too, so it's not worth grinding through the rest of the list).")
            log.error(f"       {phrase} was NOT marked done — re-run later to pick up here and beyond.")
            log.info("")
            log.info(f"Stopped early — {ok} generated, {skipped} skipped, {failed} failed, "
                     f"{len(phrase_list) - ok - skipped - failed} not yet attempted.")
            log.info("Re-run once the issue is resolved; completed phrases are skipped automatically.")
            log.info("")
            log.info("Rescanning all domains into catalog.json…")
            _rescan_all_catalog(log)
            sys.exit(1)
        else:
            log.error(f"       ✗ {err}")
            progress[key] = f"error: {err}"
            failed += 1
        _save_progress(progress_file, progress)

    log.info("")
    log.info("Rescanning all domains into catalog.json…")
    _rescan_all_catalog(log)
    return ok, skipped, failed


def _run_chars(char_list, model, level, lang, base_url, progress_file,
               progress, force, skip_cache, log: logging.Logger) -> tuple[int, int, int]:
    """Elemental-character mode: standalone concept pages, no domain/book/phrase_ wrapper."""
    ok = skipped = failed = 0

    for char in char_list:
        key = f"{char}|{model}|{level}|{lang}"

        if not force and progress.get(key) == "done":
            log.info(f"SKIP   {char}  (done in progress file)")
            skipped += 1
            continue

        if not force and _concept_output_exists(char, level, lang, model):
            log.info(f"SKIP   {char}  (concept output exists → {model})")
            progress[key] = "done"
            _save_progress(progress_file, progress)
            skipped += 1
            continue

        log.info(f"Queue  {char}  (standalone concept)")
        try:
            task_id = _queue_concept(base_url, char, level, lang, model, skip_cache)
            log.info(f"       task_id={task_id[:8]} ...")
        except Exception as exc:
            log.error(f"       queue error: {exc}")
            progress[key] = f"error: {exc}"
            _save_progress(progress_file, progress)
            failed += 1
            continue

        success, err = _poll(base_url, task_id, log)
        if success:
            log.info(f"       ✓ done")
            progress[key] = "done"
            ok += 1
        elif err in _ABORT_SENTINELS:
            if err == "RATE_LIMITED":
                log.error("       ✗ Claude CLI session/rate limit reached — stopping batch early.")
            else:
                log.error("       ✗ Task timed out with no completion — stopping batch early "
                           "(a hung backend/spl3 process would likely hang the same way on the "
                           "next character too, so it's not worth grinding through the rest of the list).")
            log.error(f"       {char} was NOT marked done — re-run later to pick up here and beyond.")
            log.info("")
            log.info(f"Stopped early — {ok} generated, {skipped} skipped, {failed} failed, "
                     f"{len(char_list) - ok - skipped - failed} not yet attempted.")
            log.info("Re-run once the issue is resolved; completed characters are skipped automatically.")
            sys.exit(1)
        else:
            log.error(f"       ✗ {err}")
            progress[key] = f"error: {err}"
            failed += 1
        _save_progress(progress_file, progress)

    return ok, skipped, failed


# ── CLI ───────────────────────────────────────────────────────────────────────

@click.command()
@click.option("--phrases", "-p", default=None,
              help='Comma-separated phrases ("马到成功,亡羊补牢") or path to a .txt file (one phrase per line). '
                   'Mutually exclusive with --chars.')
@click.option("--chars", "-c", default=None,
              help='Comma-separated elemental characters, or path to a .txt file (one character per line; see '
                   'docs/TEST/elemental_chars.txt). Generates standalone concept pages — no domain, no "phrase_" '
                   'wrapper, no book. Mutually exclusive with --phrases.')
@click.option("--llm", "-l", default="sonnet", show_default=True,
              help='Model spec: bare name ("sonnet", "gemma3") or "adapter:model" ("claude_cli:sonnet", "ollama:gemma3"). '
                   'The model part becomes the output folder name.')
@click.option("--level", default="intro", show_default=True, help="Content level (intro/core/college/research).")
@click.option("--lang", default="en", show_default=True, help="Content language code.")
@click.option("--base-url", default="http://localhost:8000", show_default=True, help="cb_zinets API base URL.")
@click.option("--log", "log_file", default=None, type=click.Path(),
              help="Optional log file. Output is always shown on stdout too.")
@click.option("--progress", "progress_file", default=None, type=click.Path(),
              help="Progress JSON file for resumption. Default: batch_gen_progress_<model>.json in docs/TEST/.")
@click.option("--force", is_flag=True, default=False,
              help="Regenerate even if output already exists on disk.")
@click.option("--skip-cache/--no-skip-cache", default=False, show_default=True,
              help="Pass skip_cache to the API (bypasses SPL content cache). Default: use cache.")
def main(phrases, chars, llm, level, lang, base_url, log_file, progress_file, force, skip_cache):
    """Batch-generate cb_zinets content — phrases (books) or elemental characters (concept pages).

    Resumes from a progress file if interrupted — already-done items are
    skipped automatically. Safe to run multiple instances in parallel for
    different models (each has its own progress file).
    """
    if bool(phrases) == bool(chars):
        raise click.UsageError("Pass exactly one of --phrases or --chars.")

    mode = "chars" if chars else "phrases"
    model = _parse_model(llm)
    log   = _setup_logging(log_file)

    if progress_file is None:
        # Same default filename --phrases has always used, for backward compatibility
        # with existing progress files; --chars gets its own to avoid mixing the two.
        suffix = f"chars_{model}" if mode == "chars" else model
        progress_file = PROGRESS_DIR / f"batch_gen_progress_{suffix}.json"
    else:
        progress_file = Path(progress_file)

    item_list = _load_phrases(chars if chars else phrases)
    progress  = _load_progress(progress_file)

    log.info(f"Batch gen  mode={mode}  llm={llm}  model={model}  level={level}  lang={lang}  skip_cache={skip_cache}")
    log.info(f"Items: {len(item_list)}  |  Progress file: {progress_file}")
    log.info("")

    if mode == "chars":
        ok, skipped, failed = _run_chars(item_list, model, level, lang, base_url, progress_file,
                                          progress, force, skip_cache, log)
    else:
        ok, skipped, failed = _run_phrases(item_list, model, level, lang, base_url, progress_file,
                                            progress, force, skip_cache, log)

    log.info("")
    log.info(f"Done — {ok} generated, {skipped} skipped, {failed} failed.")
    if failed:
        log.info("Re-run to retry failed items (done ones are skipped automatically).")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
