"""
Phrase Decomposer: Convert idiomatic phrases/sentences into 3-tier concept graphs.

Architecture:
- Tier 0 (Primitives): Elemental characters with no components
- Tier 1 (Concepts): Individual characters in the input phrase + their decomposed parts
- Tier 2 (Applications): The input phrase/sentence itself

Example:
  Input:  "画蛇添足"
  ↓
  Characters: 画, 蛇, 添, 足
  ↓
  Recursive decomposition to all primitives
  ↓
  3-tier graph: phrase → characters → primitives
"""

from __future__ import annotations

import re
import sqlite3
from pathlib import Path


def decompose_character(
    zi: str, conn: sqlite3.Connection, max_depth: int = 10
) -> dict[str, int]:
    """
    Recursively decompose a single character to all constituent parts.

    Returns {character: depth}, where depth is the hierarchical level:
      - depth 0: the input character itself
      - depth 1: direct components
      - depth 2+: transitive components
      - leaf nodes have no further decomposition
    """
    query = """
    WITH RECURSIVE decomposition(zi, depth) AS (
      SELECT zi, 0 FROM zn_zi WHERE zi = ?

      UNION ALL

      SELECT comp, d.depth + 1
      FROM decomposition d
      JOIN (
        SELECT zi, TRIM(zi_left_up) as comp FROM zn_zi_part WHERE TRIM(zi_left_up) != ''
        UNION ALL
        SELECT zi, TRIM(zi_left) FROM zn_zi_part WHERE TRIM(zi_left) != ''
        UNION ALL
        SELECT zi, TRIM(zi_left_down) FROM zn_zi_part WHERE TRIM(zi_left_down) != ''
        UNION ALL
        SELECT zi, TRIM(zi_up) FROM zn_zi_part WHERE TRIM(zi_up) != ''
        UNION ALL
        SELECT zi, TRIM(zi_mid) FROM zn_zi_part WHERE TRIM(zi_mid) != ''
        UNION ALL
        SELECT zi, TRIM(zi_down) FROM zn_zi_part WHERE TRIM(zi_down) != ''
        UNION ALL
        SELECT zi, TRIM(zi_right_up) FROM zn_zi_part WHERE TRIM(zi_right_up) != ''
        UNION ALL
        SELECT zi, TRIM(zi_right) FROM zn_zi_part WHERE TRIM(zi_right) != ''
        UNION ALL
        SELECT zi, TRIM(zi_right_down) FROM zn_zi_part WHERE TRIM(zi_right_down) != ''
        UNION ALL
        SELECT zi, TRIM(zi_mid_out) FROM zn_zi_part WHERE TRIM(zi_mid_out) != ''
        UNION ALL
        SELECT zi, TRIM(zi_mid_in) FROM zn_zi_part WHERE TRIM(zi_mid_in) != ''
      ) parts ON d.zi = parts.zi
      WHERE d.depth < ?
    )
    SELECT zi, MIN(depth) AS depth FROM decomposition GROUP BY zi ORDER BY MIN(depth), zi
    """

    rows = conn.execute(query, (zi, max_depth)).fetchall()
    return {row[0]: row[1] for row in rows}


def parse_phrase(phrase: str) -> list[str]:
    """
    Extract unique Chinese characters from a phrase/sentence, for deciding
    which characters need decomposing into concepts/primitives. Do NOT use
    this to reconstruct the phrase itself (id, "needs"/"characters" list) —
    repeated characters (e.g. 不见不散) would be silently collapsed. Use
    extract_chars() for that.

    Input:  "画蛇添足, 守株待兔"
    Output: ['画', '蛇', '添', '足', '守', '株', '待', '兔']

    Removes:
      - Punctuation (Chinese and Western)
      - Whitespace
      - Duplicate characters
    """
    seen = set()
    chars = []
    for char in extract_chars(phrase):
        if char not in seen:
            chars.append(char)
            seen.add(char)

    return chars


def extract_chars(phrase: str) -> list[str]:
    """
    Extract characters from a phrase/sentence, preserving order and
    duplicates (unlike parse_phrase). Use this wherever the literal
    composition of the phrase matters, e.g. its id or "needs" list.

    Input:  "不见不散"
    Output: ['不', '见', '不', '散']

    Removes punctuation and whitespace only.
    """
    cleaned = re.sub(r'[，、；：！？。·\s\,\.\!\?\:\;]+', '', phrase)
    return [char for char in cleaned if char]


def decompose_phrase(
    phrase: str, conn: sqlite3.Connection, max_depth: int = 10
) -> dict[str, dict[str, int]]:
    """
    Decompose all characters in a phrase to their constituent parts.

    Returns {character: {constituent: depth, ...}, ...}

    Example:
      "画" → {"画": 0, "一": 1, "凵": 1, "田": 1, ...}
    """
    chars = parse_phrase(phrase)
    decompositions = {}

    for char in chars:
        try:
            decompositions[char] = decompose_character(char, conn, max_depth)
        except Exception as e:
            print(f"Warning: Failed to decompose '{char}': {e}")
            decompositions[char] = {char: 0}

    return decompositions


def compute_phrase_tiers(
    decompositions: dict[str, dict[str, int]], phrase_chars: list[str]
) -> dict[str, int]:
    """
    Compute global tier assignments for all nodes in the decomposition.

    Tier assignment:
      - Tier 1: Characters mentioned in the phrase (concepts to learn)
      - Tier 0: All components that make up those characters (primitives/foundations)

    Returns {character: tier, ...}
    """
    phrase_char_set = set(phrase_chars)
    tiers = {}

    # Collect all characters across all decompositions
    for char, parts in decompositions.items():
        for part in parts.keys():
            # Phrase characters are tier 1 (concepts)
            if part in phrase_char_set:
                tiers[part] = 1
            # Components are tier 0 (primitives)
            elif part not in tiers:
                tiers[part] = 0

    # Ensure phrase characters are always tier 1
    for char in phrase_chars:
        tiers[char] = 1

    return tiers


def load_zi_metadata(
    conn: sqlite3.Connection, chars: set[str]
) -> dict[str, dict]:
    """Load pinyin, definitions, labels for a set of characters."""
    if not chars:
        return {}

    placeholders = ",".join("?" * len(chars))
    query = f"""
    SELECT zi, pinyin, zi_en, desc_en, desc_cn
    FROM zn_zi
    WHERE zi IN ({placeholders})
    """

    rows = conn.execute(query, list(chars)).fetchall()
    return {
        row[0]: {
            "pinyin": _to_diacritic(row[1]) if row[1] else "",
            "label": row[2] or "",
            "desc_en": row[3] or "",
            "desc_cn": row[4] or "",
        }
        for row in rows
    }


def load_character_cache(
    conn: sqlite3.Connection, chars: set[str]
) -> dict[str, str]:
    """Load LLM-generated meanings from zn_character_cache."""
    if not chars:
        return {}

    placeholders = ",".join("?" * len(chars))
    rows = conn.execute(
        f"SELECT character, meaning FROM zn_character_cache WHERE character IN ({placeholders})",
        list(chars),
    ).fetchall()
    return {row[0]: row[1] or "" for row in rows}


def _to_diacritic(pinyin_num: str) -> str:
    """Convert pinyin with tone numbers (e.g., 'ren2') to diacritics (e.g., 'rén')."""
    import re

    tone_map = {
        "a": ("ā", "á", "ǎ", "à"),
        "e": ("ē", "é", "ě", "è"),
        "i": ("ī", "í", "ǐ", "ì"),
        "o": ("ō", "ó", "ǒ", "ò"),
        "u": ("ū", "ú", "ǔ", "ù"),
        "ü": ("ǖ", "ǘ", "ǚ", "ǜ"),
        "v": ("ǖ", "ǘ", "ǚ", "ǜ"),
    }

    def _add_tone(syllable: str, tone: int) -> str:
        if tone < 1 or tone > 4:
            return syllable
        idx = tone - 1
        s = syllable.replace("v", "ü")
        for vowel in ("a", "e", "ou", "o", "ui", "iu", "i", "u", "ü"):
            if vowel in s:
                mark_on = vowel[0] if len(vowel) > 1 and vowel not in ("ou",) else vowel
                if mark_on in tone_map:
                    return s.replace(mark_on, tone_map[mark_on][idx], 1)
        return s

    def _convert(m: re.Match) -> str:
        syllable, tone_str = m.group(1), m.group(2)
        return _add_tone(syllable, int(tone_str))

    return re.sub(r"([a-züA-ZÜ]+)([1-5])", _convert, pinyin_num)


def build_phrase_graph(
    phrase: str,
    conn: sqlite3.Connection,
    max_depth: int = 10,
) -> dict:
    """
    Build a 3-tier concept graph from a phrase.

    Returns {
        "phrase": "画蛇添足",
        "applications": {phrase_id: {...}},
        "concepts": {character: {...}},
        "primitives": {character: {...}},
    }
    """
    # Parse phrase to get character list
    phrase_chars = parse_phrase(phrase)

    # Decompose all characters
    decompositions = decompose_phrase(phrase, conn, max_depth)

    # Collect all characters across all tiers
    all_chars = set()
    for char, parts in decompositions.items():
        all_chars.add(char)
        all_chars.update(parts.keys())

    # Load metadata
    zi_meta = load_zi_metadata(conn, all_chars)
    char_cache = load_character_cache(conn, all_chars)

    # Compute tiers
    tiers = compute_phrase_tiers(decompositions, phrase_chars)

    # Helper to define a node
    def _defines(zi: str) -> str:
        """Fallback chain for definitions."""
        meta = zi_meta.get(zi, {})
        if meta.get("desc_en"):
            return meta["desc_en"]
        if char_cache.get(zi):
            return char_cache[zi]
        return meta.get("desc_cn", "")

    # Build node structures by tier
    primitives = {}
    concepts = {}

    for zi in sorted(all_chars):
        tier = tiers.get(zi, 0)
        meta = zi_meta.get(zi, {})

        node = {
            "symbol": meta.get("pinyin", ""),
            "defines": _defines(zi),
            "tier": tier,
        }

        if meta.get("label"):
            node["label"] = meta["label"]

        # For concepts (not primitives), add composed_of
        if zi in decompositions and decompositions[zi]:
            # Direct components (depth 1) from decomposition
            direct_parts = [
                c for c, d in decompositions[zi].items() if d == 1
            ]
            if direct_parts:
                node["composed_of"] = sorted(direct_parts)

        if tier == 0:
            primitives[zi] = node
        else:
            concepts[zi] = node

    # Create phrase node (tier 2) — preserve repeated characters (e.g. 不见不散)
    full_chars = extract_chars(phrase)
    phrase_id = "phrase_" + "".join(full_chars)

    applications = {
        phrase_id: {
            "text": phrase,
            "characters": full_chars,
            "defines": "",  # Placeholder for phrase definition
            "tier": 2,
        }
    }

    return {
        "phrase": phrase,
        "phrase_id": phrase_id,
        "applications": applications,
        "concepts": concepts,
        "primitives": primitives,
    }


if __name__ == "__main__":
    from cb_config import DB_PATH as db_path
    conn = sqlite3.connect(db_path)

    # Test with idiomatic phrases
    phrases = ["画蛇添足", "守株待兔", "卧虎藏龙"]

    for phrase in phrases:
        print(f"\n{'='*60}")
        print(f"Phrase: {phrase}")
        print(f"{'='*60}")

        graph = build_phrase_graph(phrase, conn)

        print(f"\nApplications (Tier 2): {len(graph['applications'])}")
        for pid, node in graph['applications'].items():
            print(f"  {node['text']} → {node['characters']}")

        print(f"\nConcepts (Tier 1): {len(graph['concepts'])}")
        for char in sorted(graph['concepts'].keys()):
            node = graph['concepts'][char]
            composed = node.get('composed_of', [])
            print(f"  {char} ({node['symbol']}) = {' + '.join(composed)}")

        print(f"\nPrimitives (Tier 0): {len(graph['primitives'])}")
        primitives_list = sorted(graph['primitives'].keys())
        print(f"  {' '.join(primitives_list)}")

    conn.close()
