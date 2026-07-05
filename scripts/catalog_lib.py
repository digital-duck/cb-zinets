"""Single write-path for public/domains/catalog.json.

catalog.json is read by the frontend as static data but written by several
producers (generation task worker, PDF service, dynamic phrase router, CLI
scripts). Each used to do its own read-modify-write; with the task worker
running up to CB_TASK_MAX_CONCURRENT generations and batch runs driving
several models in parallel, concurrent writers could silently drop each
other's updates (this bit once: commit 15d1f3c, pinyin wiped on rebuild).

All mutations now go through update_catalog(), which serializes writers with
an fcntl lock and publishes atomically (temp file + os.replace), so readers
never see a torn file. Armature rule: the catalog is bone — one writer, one
lock, one ledger. (Roadmap: replace file+lock with catalog tables in SQLite
and demote catalog.json to a generated export.)
"""
from __future__ import annotations

import fcntl
import json
import os
import tempfile
from pathlib import Path
from typing import Callable

from cb_config import ROOT as _ROOT, DB_PATH as _CFG_DB
CATALOG_PATH = _ROOT / "public" / "domains" / "catalog.json"


def read_catalog(path: Path = CATALOG_PATH) -> list[dict]:
    """Plain read; safe against torn writes because writes are atomic."""
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def update_catalog(mutate: Callable[[list[dict]], object],
                   path: Path = CATALOG_PATH) -> None:
    """Apply `mutate(catalog)` under an exclusive lock and publish atomically.

    `mutate` edits the list in place (its return value is ignored). The lock
    covers read → mutate → replace, so concurrent writers queue instead of
    clobbering; os.replace keeps every reader's view complete.
    """
    lock_path = path.with_suffix(".json.lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with open(lock_path, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            catalog = read_catalog(path)
            mutate(catalog)
            fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    json.dump(catalog, f, ensure_ascii=False, indent=2)
                    f.write("\n")
                os.replace(tmp, path)
            except BaseException:
                if os.path.exists(tmp):
                    os.unlink(tmp)
                raise
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


# ── Canonical filesystem → catalog sync ───────────────────────────────────────
# The one rescan implementation. The Settings page "Sync Catalog" button
# (POST /api/catalog/sync), the batch runner's rescans, and any CLI repair all
# call sync_catalog(); nobody scans domain directories into catalog entries on
# their own (a private copy in batch_gen_phrase.py once dropped the pinyin
# fields and blinded Home's concept search — 2026-07-04).

DOMAINS_ROOT = CATALOG_PATH.parent
DB_PATH = _CFG_DB


def scan_domain_content(domain_path: Path, pinyin_map: dict) -> tuple[list[dict], list[dict]]:
    """Scan output/{level}.{lang}/{model}/html/ → (books, concepts) entries."""
    from pinyin_lib import concept_pinyin_fields

    books: list[dict] = []
    concepts: list[dict] = []
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
                    concepts.append({
                        "name": name, "label": label, "file": rel_file, "model": model,
                        **concept_pinyin_fields(name, pinyin_map),
                    })
    return books, concepts


def write_domain_detail(domain_id: str, books: list, concepts: list) -> None:
    """Write public/domains/catalog/{domain_id}.json for per-domain lazy loading."""
    detail_dir = DOMAINS_ROOT / "catalog"
    detail_dir.mkdir(exist_ok=True)
    (detail_dir / f"{domain_id}.json").write_text(
        json.dumps({"books": books, "generated_concepts": concepts},
                   ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def sync_catalog(domain_id: str | None = None) -> dict:
    """Sync catalog.json (and detail files) with what exists on disk.

    Scans every domain directory (or just `domain_id`), refreshes each
    entry's books/generated_concepts/has_book/has_navigator and its pinyin
    search fields, adds entries for phrase domains missing from the catalog,
    and rewrites the per-domain detail files. Existing entry fields the scan
    doesn't own (name, capstone, tags, pdfs, node/edge counts) are preserved.

    Idempotent; safe alongside live generation (locked write). Returns stats:
    {scanned, added, refreshed, books, concepts, concepts_without_pinyin}.
    """
    import yaml
    from pinyin_lib import load_pinyin_map, phrase_pinyin

    pinyin_map = load_pinyin_map(DB_PATH)
    stats = {"scanned": 0, "added": 0, "refreshed": 0,
             "books": 0, "concepts": 0, "concepts_without_pinyin": 0}
    scanned: list[tuple[str, list[dict], list[dict], Path]] = []

    dirs = [DOMAINS_ROOT / domain_id] if domain_id else sorted(DOMAINS_ROOT.iterdir())
    for d in dirs:
        if not d.is_dir() or not (d / "input" / "graph.yaml").exists():
            continue
        books, concepts = scan_domain_content(d, pinyin_map)
        scanned.append((d.name, books, concepts, d))
        stats["scanned"] += 1
        stats["books"] += len(books)
        stats["concepts"] += len(concepts)
        stats["concepts_without_pinyin"] += sum(1 for c in concepts if not c.get("pinyin"))

    def _mutate(catalog: list[dict]) -> None:
        for name, books, concepts, d in scanned:
            entry = next((e for e in catalog if e.get("id") == name), None)
            if entry is None:
                # Only phrase domains are auto-added; zinet-setid-* and the
                # full-corpus domain carry stats owned by zinets_to_graph.py.
                if name.startswith("zinet-setid-") or name == "chinese_characters":
                    continue
                data = yaml.safe_load((d / "input" / "graph.yaml").read_text(encoding="utf-8"))
                py, initials = phrase_pinyin(name, pinyin_map)
                entry = {
                    "id": name,
                    "name": name,
                    "capstone": next(iter((data.get("applications") or {}).keys()), ""),
                    "has_navigator": (d / "output" / "graph.html").exists(),
                    "tags": ["language", "chinese"],
                    "default_level": "intro",
                    **({"pinyin": py, "pinyin_initials": initials} if py else {}),
                }
                catalog.append(entry)
                stats["added"] += 1
            else:
                entry["has_navigator"] = (d / "output" / "graph.html").exists()
                stats["refreshed"] += 1
            entry["books"] = books
            entry["generated_concepts"] = concepts
            entry["has_book"] = len(books) > 0

    update_catalog(_mutate)
    for name, books, concepts, _ in scanned:
        write_domain_detail(name, books, concepts)
    return stats
