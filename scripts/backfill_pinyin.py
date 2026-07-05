#!/usr/bin/env python3
"""Backfill pinyin into catalog.json (and per-domain detail files) for search.

Reads char -> pinyin from db/cb_zinets.sqlite (zn_zi.pinyin) and attaches a
toneless, lowercase `pinyin` field to each single-character concept entry.
Phrase-level entries (the domain itself and its phrase_* capstone concept)
get a concatenated `pinyin` plus a `pinyin_initials` field for initials-only
matching (e.g. "szdt" -> 守株待兔).

Every generated_concepts writer attaches these fields itself via
pinyin_lib.concept_pinyin_fields (catalog_svc, zinets_to_graph and
batch_gen_phrase rescanners), so this script is a repair tool: run it after
any regression that leaves entries pinyin-less (Home's Concepts search goes
blind without them — 2026-07-04, 8,542 entries).
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pinyin_lib import load_pinyin_map, phrase_pinyin, concept_pinyin_fields  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "db" / "cb_zinets.sqlite"
CATALOG_PATH = ROOT / "public" / "domains" / "catalog.json"


def main():
    if not DB_PATH.exists():
        sys.exit(f"Database not found: {DB_PATH}")
    if not CATALOG_PATH.exists():
        sys.exit(f"Catalog not found: {CATALOG_PATH}")

    pinyin_map = load_pinyin_map(DB_PATH)
    from catalog_lib import update_catalog

    stats = {"phrases": 0, "concepts": 0, "details": 0}

    def _enrich_concepts(concepts: list) -> int:
        n = 0
        for concept in concepts:
            fields = concept_pinyin_fields(concept.get("name", ""), pinyin_map)
            if fields:
                concept.update(fields)
                n += 1
        return n

    # All mutation happens inside the locked update so concurrent writers
    # (generation task worker, PDF service, batch rescans) can't be clobbered.
    def _backfill(catalog: list) -> None:
        for domain in catalog:
            phrase_name = domain.get("name") or domain.get("id", "")
            phrase_py, phrase_initials = phrase_pinyin(phrase_name, pinyin_map)
            if phrase_py:
                domain["pinyin"] = phrase_py
                domain["pinyin_initials"] = phrase_initials
                stats["phrases"] += 1
            stats["concepts"] += _enrich_concepts(domain.get("generated_concepts", []))

    update_catalog(_backfill, CATALOG_PATH)

    # Per-domain detail files (catalog/{id}.json) carry the same concept
    # entries for lazy loading — keep their pinyin fields in step too.
    for detail_path in sorted((CATALOG_PATH.parent / "catalog").glob("*.json")):
        detail = json.loads(detail_path.read_text(encoding="utf-8"))
        if _enrich_concepts(detail.get("generated_concepts", [])):
            detail_path.write_text(
                json.dumps(detail, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
            )
            stats["details"] += 1

    print(
        f"Backfilled pinyin: {stats['phrases']} phrase entries, "
        f"{stats['concepts']} concept entries, {stats['details']} detail files updated"
    )


if __name__ == "__main__":
    main()
