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
import subprocess
import sys
import time
from pathlib import Path

import click
import requests
import yaml

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


def _scan_domain_content(domain_path: Path) -> tuple[list[dict], list[dict]]:
    """Scan output/{level}.{lang}/{model}/html/ for generated books and concepts."""
    books, concepts = [], []
    output_root = domain_path / "output"
    if not output_root.exists():
        return books, concepts
    for level_lang_dir in sorted(output_root.iterdir()):
        if not level_lang_dir.is_dir() or "." not in level_lang_dir.name:
            continue
        for model_dir in sorted(level_lang_dir.iterdir()):
            if not model_dir.is_dir():
                continue
            model = model_dir.name
            html_dir = model_dir / "html"
            if not html_dir.exists():
                continue
            rel_prefix = f"output/{level_lang_dir.name}/{model}/html"
            for html_file in sorted(html_dir.glob("*.html")):
                fname = html_file.name
                rel_file = f"{rel_prefix}/{fname}"
                if fname.startswith("book_"):
                    target = fname[len("book_"):-len(".html")]
                    books.append({"target": target, "file": rel_file, "model": model})
                elif fname.startswith("concept_"):
                    name = fname[len("concept_"):-len(".html")]
                    label = ("Phrase " + name[len("phrase_"):]) if name.startswith("phrase_") else name
                    concepts.append({"name": name, "label": label, "file": rel_file, "model": model})
    return books, concepts


def _rescan_all_catalog(log: logging.Logger) -> None:
    """Rescan every domain directory and sync all entries into catalog.json.

    Adds missing domains and refreshes books/generated_concepts for existing
    ones. Safe to call even when content generation is incomplete.
    """
    if not CATALOG_PATH.exists():
        log.warning("catalog.json not found — skipping full rescan")
        return
    try:
        catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        added = refreshed = 0
        for d in sorted(DOMAINS_ROOT.iterdir()):
            if not d.is_dir() or d.name.startswith("zinet-setid-") or d.name == "chinese_characters":
                continue
            graph_yaml = d / "input" / "graph.yaml"
            if not graph_yaml.exists():
                continue
            books, concepts = _scan_domain_content(d)
            entry = next((e for e in catalog if e.get("id") == d.name), None)
            if entry is None:
                data = yaml.safe_load(graph_yaml.read_text(encoding="utf-8"))
                entry = {
                    "id": d.name,
                    "name": d.name,
                    "capstone": next(iter(data.get("applications", {}).keys()), ""),
                    "has_book": len(books) > 0,
                    "has_navigator": (d / "output" / "graph.html").exists(),
                    "books": books,
                    "generated_concepts": concepts,
                    "tags": ["language", "chinese"],
                    "default_level": "intro",
                }
                catalog.append(entry)
                added += 1
            else:
                entry["books"] = books
                entry["generated_concepts"] = concepts
                entry["has_book"] = len(books) > 0
                refreshed += 1
            _write_domain_detail(d.name, books, concepts)
        CATALOG_PATH.write_text(
            json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        log.info(f"catalog rescan complete — added={added} refreshed={refreshed}")
    except Exception as exc:
        log.error(f"catalog rescan failed: {exc}")


def _write_domain_detail(domain_id: str, books: list, concepts: list) -> None:
    """Write public/domains/catalog/{domain_id}.json for fast per-domain lazy loading."""
    DETAIL_DIR.mkdir(exist_ok=True)
    detail_path = DETAIL_DIR / f"{domain_id}.json"
    detail_path.write_text(
        json.dumps({"books": books, "generated_concepts": concepts}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _update_catalog(domain_id: str, log: logging.Logger) -> None:
    """Rescan domain output directory and refresh books/generated_concepts in catalog.json."""
    if not CATALOG_PATH.exists():
        log.warning("       catalog.json not found — skipping catalog update")
        return
    try:
        catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        entry = next((e for e in catalog if e.get("id") == domain_id), None)
        if entry is None:
            log.warning(f"       domain {domain_id!r} not in catalog — skipping")
            return
        books, concepts = _scan_domain_content(DOMAINS_ROOT / domain_id)
        entry["books"] = books
        entry["generated_concepts"] = concepts
        entry["has_book"] = len(books) > 0
        CATALOG_PATH.write_text(
            json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        _write_domain_detail(domain_id, books, concepts)
        log.info(f"       catalog updated: books={len(books)}, concepts={len(concepts)}")
    except Exception as exc:
        log.error(f"       catalog update failed: {exc}")


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
        else:
            log.error(f"       ✗ {err}")
            progress[key] = f"error: {err}"
            failed += 1
        _save_progress(progress_file, progress)

    log.info("")
    log.info(f"Done — {ok} generated, {skipped} skipped, {failed} failed.")
    if failed:
        log.info("Re-run to retry failed phrases (done ones are skipped automatically).")

    log.info("")
    log.info("Rescanning all domains into catalog.json…")
    _rescan_all_catalog(log)

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
