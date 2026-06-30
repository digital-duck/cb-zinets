#!/usr/bin/env python3
"""
batch_gen_phrase.py — batch concept-book generation utility for cb_zinets

Queues phrase-domain generation jobs via the API, polls for completion,
and resumes automatically from a progress file if interrupted.

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

PHRASE FILE FORMAT
------------------
One phrase per line. Blank lines and lines starting with # are ignored.
"""
import json
import logging
import sys
import time
from pathlib import Path

import click
import requests
import yaml

DOMAINS_ROOT = Path(__file__).parent.parent.parent / "public" / "domains"
PROGRESS_DIR  = Path(__file__).parent


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


def _output_exists(domain: str, target: str, level: str, lang: str, model: str) -> bool:
    """True if the book HTML already exists and is non-trivially sized."""
    path = DOMAINS_ROOT / domain / "output" / f"{level}.{lang}" / model / "html" / f"book_{target}.html"
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


def _poll(base_url: str, task_id: str, log: logging.Logger,
          timeout: int = 900, interval: int = 15) -> tuple[bool, str | None]:
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
            log.debug(f"poll retry: {exc}")
        time.sleep(interval)
    return False, f"timed out after {timeout}s"


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


# ── CLI ───────────────────────────────────────────────────────────────────────

@click.command()
@click.option("--phrases", "-p", required=True,
              help='Comma-separated phrases ("马到成功,亡羊补牢") or path to a .txt file (one phrase per line).')
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
def main(phrases, llm, level, lang, base_url, log_file, progress_file, force, skip_cache):
    """Batch-generate cb_zinets concept books for Chinese phrases.

    Resumes from a progress file if interrupted — already-done phrases are
    skipped automatically. Safe to run multiple instances in parallel for
    different models (each has its own progress file).
    """
    model = _parse_model(llm)
    log   = _setup_logging(log_file)

    if progress_file is None:
        progress_file = PROGRESS_DIR / f"batch_gen_progress_{model}.json"
    else:
        progress_file = Path(progress_file)

    phrase_list = _load_phrases(phrases)
    progress    = _load_progress(progress_file)

    log.info(f"Batch gen  llm={llm}  model={model}  level={level}  lang={lang}  skip_cache={skip_cache}")
    log.info(f"Phrases: {len(phrase_list)}  |  Progress file: {progress_file}")
    log.info("")

    ok = skipped = failed = 0

    for phrase in phrase_list:
        key = f"{phrase}|{model}|{level}|{lang}"

        if not force and progress.get(key) == "done":
            log.info(f"SKIP   {phrase}  (done in progress file)")
            skipped += 1
            continue

        match = _find_domain(phrase)
        if match is None:
            log.warning(f"SKIP   {phrase}  (no matching domain in public/domains/)")
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
            progress[key] = "done"
            ok += 1
        else:
            log.error(f"       ✗ {err}")
            progress[key] = f"error: {err}"
            failed += 1
        _save_progress(progress_file, progress)

    log.info("")
    log.info(f"Done — {ok} generated, {skipped} skipped, {failed} failed.")
    if failed:
        log.info("Re-run to retry failed phrases (done ones are skipped automatically).")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
