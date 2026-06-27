"""
Generate graph.yaml for the chinese_characters ConceptBook domain
from the ZiNets SQLite database.

Input:  ~/projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite
Output: ../public/domains/chinese_characters/input/graph.yaml

Usage:
    python scripts/zinets_to_graph.py
    python scripts/zinets_to_graph.py --set-id 300,100,30,10
    python scripts/zinets_to_graph.py --set-id 300 --output /tmp/test_graph.yaml
"""

from __future__ import annotations

import argparse
import sqlite3
from collections import defaultdict, deque
from pathlib import Path

import yaml


DB_PATH = Path.home() / "projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite"

DEFAULT_OUTPUT = (
    Path(__file__).parent.parent
    / "public/domains/chinese_characters/input/graph.yaml"
)

# ── Pinyin tone-number → diacritic conversion ─────────────────────────────────
# Maps vowel + tone_number to vowel with diacritic.
_TONE_MAP: dict[str, tuple[str, str, str, str]] = {
    "a": ("ā", "á", "ǎ", "à"),
    "e": ("ē", "é", "ě", "è"),
    "i": ("ī", "í", "ǐ", "ì"),
    "o": ("ō", "ó", "ǒ", "ò"),
    "u": ("ū", "ú", "ǔ", "ù"),
    "ü": ("ǖ", "ǘ", "ǚ", "ǜ"),
    "v": ("ǖ", "ǘ", "ǚ", "ǜ"),  # 'v' is used for ü in some systems
}

# Tone-mark placement rule: a/e always get the mark; for ou the o gets it;
# otherwise the last vowel in the final gets it.
def _add_tone(syllable: str, tone: int) -> str:
    """Apply tone diacritic (1-4) to a pinyin syllable. Tone 5 = neutral (unchanged)."""
    if tone < 1 or tone > 4:
        return syllable
    idx = tone - 1
    s = syllable.replace("v", "ü")
    for vowel in ("a", "e", "ou", "o", "ui", "iu", "i", "u", "ü"):
        if vowel in s:
            mark_on = vowel[0] if len(vowel) > 1 and vowel not in ("ou",) else vowel
            if mark_on in _TONE_MAP:
                return s.replace(mark_on, _TONE_MAP[mark_on][idx], 1)
    return s


def to_diacritic(pinyin_num: str) -> str:
    """Convert 'ren2' → 'rén', 'san1' → 'sān', handles multi-syllable 'zhong1guo2'."""
    import re
    def _convert(m: re.Match) -> str:
        syllable, tone_str = m.group(1), m.group(2)
        return _add_tone(syllable, int(tone_str))
    return re.sub(r"([a-züA-ZÜ]+)([1-5])", _convert, pinyin_num)

# All position fields in zn_zi_part that represent component characters
PART_FIELDS = [
    "zi_left_up", "zi_left", "zi_left_down",
    "zi_up", "zi_mid", "zi_down",
    "zi_right_up", "zi_right", "zi_right_down",
    "zi_mid_out", "zi_mid_in",
]


# ── Database loaders ──────────────────────────────────────────────────────────

def load_zi(conn: sqlite3.Connection, set_ids: list[str] | None) -> dict[str, dict]:
    query = """
        SELECT zi, pinyin, zi_en, desc_en, desc_cn, set_id
        FROM zn_zi
        WHERE is_active = 'Y'
    """
    params: list = []
    if set_ids:
        placeholders = ",".join("?" * len(set_ids))
        query += f" AND set_id IN ({placeholders})"
        params = set_ids

    rows = conn.execute(query, params).fetchall()
    return {
        row[0]: {
            "pinyin":  to_diacritic(row[1]) if row[1] else "",
            "zi_en":   row[2] or "",
            "desc_en": row[3] or "",
            "desc_cn": row[4] or "",
            "set_id":  row[5] or "",
        }
        for row in rows
    }


def load_parts(
    conn: sqlite3.Connection, zi_set: set[str]
) -> dict[str, list[str]]:
    """Return {zi: [component, ...]} for zi that have at least one component."""
    part_cols = ", ".join(PART_FIELDS)
    rows = conn.execute(
        f"SELECT zi, {part_cols} FROM zn_zi_part WHERE is_active = 'Y'"
    ).fetchall()

    parts: dict[str, list[str]] = {}
    for row in rows:
        zi = row[0]
        if zi not in zi_set:
            continue
        # Collect non-null, non-empty components that are in our working set
        components = [
            v for v in row[1:]
            if v and v.strip() and v.strip() in zi_set
        ]
        if components:
            # Deduplicate while preserving order
            seen: set[str] = set()
            unique = [c for c in components if not (c in seen or seen.add(c))]
            parts[zi] = unique

    return parts


def load_char_cache(
    conn: sqlite3.Connection, zi_set: set[str]
) -> dict[str, str]:
    """LLM-generated meaning fallback from zn_character_cache."""
    if not zi_set:
        return {}
    placeholders = ",".join("?" * len(zi_set))
    rows = conn.execute(
        f"SELECT character, meaning FROM zn_character_cache WHERE character IN ({placeholders})",
        list(zi_set),
    ).fetchall()
    return {row[0]: row[1] or "" for row in rows}


# ── Graph construction ────────────────────────────────────────────────────────

def _defines(zi: str, meta: dict, char_cache: dict[str, str]) -> str:
    """Fallback chain: desc_en → cache.meaning → desc_cn → ''."""
    if meta["desc_en"]:
        return meta["desc_en"]
    if char_cache.get(zi):
        return char_cache[zi]
    return meta["desc_cn"]


def compute_tiers(
    primitives: list[str], parts: dict[str, list[str]]
) -> dict[str, int]:
    """BFS tier: primitives = 0; others = 1 + max(tier of direct components)."""
    tiers: dict[str, int] = {p: 0 for p in primitives}

    # Reverse map: component → [characters that use it]
    dependents: dict[str, list[str]] = defaultdict(list)
    remaining_deps: dict[str, int] = {}
    for zi, deps in parts.items():
        remaining_deps[zi] = len(deps)
        for dep in deps:
            dependents[dep].append(zi)

    queue: deque[str] = deque(primitives)
    while queue:
        current = queue.popleft()
        current_tier = tiers[current]
        for dep in dependents[current]:
            tiers[dep] = max(tiers.get(dep, 0), current_tier + 1)
            remaining_deps[dep] -= 1
            if remaining_deps[dep] == 0:
                queue.append(dep)

    # Characters with unresolved cycles or missing components get a best-effort tier
    for zi, deps in parts.items():
        if zi not in tiers:
            tiers[zi] = max((tiers.get(d, 0) for d in deps), default=0) + 1

    return tiers


def build_graph(
    zi_meta: dict[str, dict],
    parts: dict[str, list[str]],
    char_cache: dict[str, str],
) -> dict:
    all_zi = set(zi_meta.keys())
    primitives_set = all_zi - set(parts.keys())
    concepts_set = set(parts.keys())

    tiers = compute_tiers(list(primitives_set), parts)

    # ── primitives ────────────────────────────────────────────────────────────
    primitives: dict = {}
    for zi in sorted(primitives_set):
        meta = zi_meta[zi]
        node: dict = {
            "symbol":  meta["pinyin"],
            "defines": _defines(zi, meta, char_cache),
            "tier":    0,
        }
        if meta["zi_en"]:
            node["label"] = meta["zi_en"]
        primitives[zi] = node

    # ── concepts ──────────────────────────────────────────────────────────────
    concepts: dict = {}
    for zi in sorted(concepts_set, key=lambda z: (tiers.get(z, 1), z)):
        meta = zi_meta[zi]
        node = {
            "composed_of": parts[zi],
            "symbol":      meta["pinyin"],
            "defines":     _defines(zi, meta, char_cache),
            "tier":        tiers.get(zi, 1),
        }
        if meta["zi_en"]:
            node["label"] = meta["zi_en"]
        concepts[zi] = node

    return {
        "domain":       "chinese_characters",
        "primitives":   primitives,
        "concepts":     concepts,
        "applications": {},
    }


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate graph.yaml from the ZiNets SQLite database."
    )
    parser.add_argument(
        "--db", type=Path, default=DB_PATH,
        help="Path to zinets_cache.sqlite",
    )
    parser.add_argument(
        "--set-id", type=str, default=None,
        metavar="IDS",
        help="Comma-separated set_id values to include, e.g. '300,100,30,10'. "
             "Default: all active characters.",
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Output path for graph.yaml",
    )
    args = parser.parse_args()

    set_ids = (
        [s.strip() for s in args.set_id.split(",") if s.strip()]
        if args.set_id else None
    )

    print(f"DB:     {args.db}")
    print(f"Filter: set_id in {set_ids}" if set_ids else "Filter: all active")
    print(f"Output: {args.output}\n")

    conn = sqlite3.connect(args.db)

    print("Loading zi metadata…")
    zi_meta = load_zi(conn, set_ids)
    print(f"  {len(zi_meta)} characters")

    if not zi_meta:
        print("No characters found. Check --set-id values.")
        conn.close()
        return

    print("Loading decomposition parts…")
    parts = load_parts(conn, set(zi_meta.keys()))
    n_prim = len(zi_meta) - len(parts)
    print(f"  {n_prim} primitives, {len(parts)} composed characters")

    print("Loading character cache (definition fallbacks)…")
    char_cache = load_char_cache(conn, set(zi_meta.keys()))
    print(f"  {len(char_cache)} cache entries")

    conn.close()

    print("\nBuilding graph…")
    graph = build_graph(zi_meta, parts, char_cache)
    print(f"  {len(graph['primitives'])} primitives, {len(graph['concepts'])} concepts")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as fh:
        yaml.dump(
            graph, fh,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
        )
    print(f"\nWrote {args.output}")


if __name__ == "__main__":
    main()
