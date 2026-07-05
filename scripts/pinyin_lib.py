"""Shared toneless-pinyin lookup helpers.

Single source of truth for turning zn_zi.pinyin readings into the lowercase,
tone-stripped strings used for pinyin fuzzy search. Used by both
scripts/backfill_pinyin.py (one-off catalog.json backfill) and
api/services/catalog_svc.py (so concept entries keep their pinyin field
every time a book is generated, instead of losing it on the next rebuild).
"""
from __future__ import annotations

import re
import sqlite3
import unicodedata
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "db" / "cb_zinets.sqlite"


def strip_tone(syllable: str) -> str:
    syllable = syllable.strip()
    syllable = unicodedata.normalize("NFKD", syllable)
    syllable = "".join(ch for ch in syllable if not unicodedata.combining(ch))
    syllable = re.sub(r"[0-9]", "", syllable)
    return syllable.lower()


def load_pinyin_map(db_path: Path = DEFAULT_DB_PATH) -> dict[str, str]:
    """char -> toneless pinyin (first reading) from zn_zi.pinyin."""
    if not db_path.exists():
        return {}
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            "SELECT zi, pinyin FROM zn_zi WHERE pinyin IS NOT NULL AND pinyin != ''"
        ).fetchall()
    finally:
        conn.close()
    pinyin_map: dict[str, str] = {}
    for zi, pinyin in rows:
        # multiple readings look like "hui4; kuai4" or "lei2 / léi" -- take the first
        first_reading = re.split(r"[;/]", pinyin)[0]
        plain = strip_tone(first_reading)
        if plain:
            pinyin_map[zi] = plain
    return pinyin_map


def phrase_pinyin(name: str, pinyin_map: dict[str, str]) -> tuple[str | None, str | None]:
    """Concatenated pinyin + initials for a multi-char name, or (None, None) if any char is unmapped."""
    syllables: list[str] = []
    for ch in name:
        syllable = pinyin_map.get(ch)
        if syllable is None:
            return None, None
        syllables.append(syllable)
    if not syllables:
        return None, None
    return "".join(syllables), "".join(s[0] for s in syllables)


def concept_pinyin_fields(name: str, pinyin_map: dict[str, str]) -> dict:
    """pinyin/pinyin_initials dict for a generated-concept name, or {}.

    The single shape for concept search fields — every writer that builds a
    generated_concepts entry (catalog_svc.mark_book_generated, the catalog
    rescanners in scripts/zinets_to_graph.py and docs/TEST/batch_gen_phrase.py,
    scripts/backfill_pinyin.py) must attach this, or Home's pinyin search goes
    blind for whatever that writer touched last (2026-07-04: 8,542 entries).
    """
    if name.startswith("phrase_"):
        py, initials = phrase_pinyin(name[len("phrase_"):], pinyin_map)
        return {"pinyin": py, "pinyin_initials": initials} if py else {}
    if len(name) == 1:
        py = pinyin_map.get(name)
        return {"pinyin": py} if py else {}
    return {}
