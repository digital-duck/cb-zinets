#!/usr/bin/env python3
"""Backfill pinyin into public/domains/catalog.json for Home page fuzzy search.

Reads char -> pinyin from db/cb_zinets.sqlite (zn_zi.pinyin) and attaches a
toneless, lowercase `pinyin` field to each single-character concept entry.
Phrase-level entries (the domain itself and its phrase_* capstone concept)
get a concatenated `pinyin` plus a `pinyin_initials` field for initials-only
matching (e.g. "szdt" -> 守株待兔).

Only touches catalog.json — graph.yaml, per-domain catalog files, and
generated books are untouched.
"""
import json
import re
import sqlite3
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "db" / "cb_zinets.sqlite"
CATALOG_PATH = ROOT / "public" / "domains" / "catalog.json"


def _strip_tone(syllable):
    syllable = syllable.strip()
    syllable = unicodedata.normalize("NFKD", syllable)
    syllable = "".join(ch for ch in syllable if not unicodedata.combining(ch))
    syllable = re.sub(r"[0-9]", "", syllable)
    return syllable.lower()


def _load_pinyin_map(conn):
    rows = conn.execute(
        "SELECT zi, pinyin FROM zn_zi WHERE pinyin IS NOT NULL AND pinyin != ''"
    ).fetchall()
    pinyin_map = {}
    for zi, pinyin in rows:
        # multiple readings look like "hui4; kuai4" or "lei2 / léi" -- take the first
        first_reading = re.split(r"[;/]", pinyin)[0]
        plain = _strip_tone(first_reading)
        if plain:
            pinyin_map[zi] = plain
    return pinyin_map


def _phrase_pinyin(name, pinyin_map):
    syllables = [pinyin_map.get(ch) for ch in name]
    if not syllables or any(s is None for s in syllables):
        return None, None
    return "".join(syllables), "".join(s[0] for s in syllables)


def main():
    if not DB_PATH.exists():
        sys.exit(f"Database not found: {DB_PATH}")
    if not CATALOG_PATH.exists():
        sys.exit(f"Catalog not found: {CATALOG_PATH}")

    conn = sqlite3.connect(DB_PATH)
    pinyin_map = _load_pinyin_map(conn)
    conn.close()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    chars_matched = 0
    phrases_matched = 0
    concepts_matched = 0

    for domain in catalog:
        phrase_name = domain.get("name") or domain.get("id", "")
        phrase_py, phrase_initials = _phrase_pinyin(phrase_name, pinyin_map)
        if phrase_py:
            domain["pinyin"] = phrase_py
            domain["pinyin_initials"] = phrase_initials
            phrases_matched += 1

        for concept in domain.get("generated_concepts", []):
            name = concept.get("name", "")
            if name.startswith("phrase_"):
                inner = name[len("phrase_"):]
                py, initials = _phrase_pinyin(inner, pinyin_map)
                if py:
                    concept["pinyin"] = py
                    concept["pinyin_initials"] = initials
                    concepts_matched += 1
                continue
            if len(name) == 1 and name in pinyin_map:
                concept["pinyin"] = pinyin_map[name]
                chars_matched += 1
                concepts_matched += 1

    CATALOG_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(
        f"Backfilled pinyin: {chars_matched} single chars, "
        f"{phrases_matched} phrase entries, {concepts_matched} concept entries updated"
    )


if __name__ == "__main__":
    main()
