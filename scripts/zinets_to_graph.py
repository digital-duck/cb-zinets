"""
Generate graph.yaml + graph.html for a ZiNets-based ConceptBook domain.

Modes:

1. PHRASE MODE (Dynamic decomposition):
    python scripts/zinets_to_graph.py --phrase "画蛇添足"
    python scripts/zinets_to_graph.py --phrase "守株待兔,卧虎藏龙"
    → Creates domain folder: public/domains/画蛇添足/

2. SET-ID MODE (Static character sets):
    python scripts/zinets_to_graph.py --set-id 10   → public/domains/zinet-setid-10/
    python scripts/zinets_to_graph.py --set-id 30   → public/domains/zinet-setid-30/
    python scripts/zinets_to_graph.py               → public/domains/chinese_characters/

Each run produces:
    {domain}/input/graph.yaml    — concept graph data
    {domain}/output/graph.html   — interactive navigator
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sqlite3
from collections import defaultdict, deque
from pathlib import Path

import yaml


DB_PATH = Path(__file__).parent.parent / "db/cb_zinets.sqlite"
DOMAINS_ROOT = Path(__file__).parent.parent / "public/domains"
CATALOG_PATH = DOMAINS_ROOT / "catalog.json"

# ── Pinyin tone-number → diacritic conversion ─────────────────────────────────
_TONE_MAP: dict[str, tuple[str, str, str, str]] = {
    "a": ("ā", "á", "ǎ", "à"),
    "e": ("ē", "é", "ě", "è"),
    "i": ("ī", "í", "ǐ", "ì"),
    "o": ("ō", "ó", "ǒ", "ò"),
    "u": ("ū", "ú", "ǔ", "ù"),
    "ü": ("ǖ", "ǘ", "ǚ", "ǜ"),
    "v": ("ǖ", "ǘ", "ǚ", "ǜ"),
}

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
        components = [
            v for v in row[1:]
            if v and v.strip() and v.strip() in zi_set
        ]
        if components:
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


# ── HTML generation ───────────────────────────────────────────────────────────

def generate_html(yaml_path: Path, html_path: Path, domain_id: str) -> None:
    """Generate interactive HTML navigator by importing concept_graph.py functions."""
    cg_path = Path(__file__).parent / "concept_graph.py"
    spec = importlib.util.spec_from_file_location("concept_graph", cg_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load concept_graph from {cg_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]

    graph = mod._load_yaml_graph(yaml_path)
    html = mod._to_html(graph, domain_name=domain_id)
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(html, encoding="utf-8")
    print(f"  Wrote graph.html ({graph.number_of_nodes()} nodes) → {html_path}")


# ── Catalog upsert ────────────────────────────────────────────────────────────

def _catalog_entry_defaults(domain_id: str) -> dict:
    """Build a new catalog entry skeleton for a zinet-setid-* domain."""
    set_id = domain_id.removeprefix("zinet-setid-")
    return {
        "id":                domain_id,
        "name":              f"Chinese Characters — Top {set_id}",
        "description":       f"Top-{set_id} most frequent Chinese characters from the ZiNets corpus.",
        "capstone":          "",
        "nodes":             0,
        "edges":             0,
        "primitives":        0,
        "concepts":          0,
        "applications":      0,
        "tags":              ["language", "chinese"],
        "default_level":     "intro",
        "has_navigator":     False,
        "has_book":          False,
        "books":             [],
        "generated_concepts": [],
    }


def update_catalog(graph: dict, domain_id: str, html_path: Path) -> None:
    """Upsert the domain entry in catalog.json with current graph stats."""
    if not CATALOG_PATH.exists():
        print(f"  catalog.json not found at {CATALOG_PATH}, skipping.")
        return

    n_primitives = len(graph["primitives"])
    n_concepts = len(graph["concepts"])
    n_nodes = n_primitives + n_concepts
    n_edges = sum(
        len(node["composed_of"]) for node in graph["concepts"].values()
    )

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    entry = next((e for e in catalog if e.get("id") == domain_id), None)
    if entry is None:
        entry = _catalog_entry_defaults(domain_id)
        catalog.append(entry)
        print(f"  Added new catalog entry: {domain_id!r}")

    entry["nodes"] = n_nodes
    entry["edges"] = n_edges
    entry["primitives"] = n_primitives
    entry["concepts"] = n_concepts
    entry["has_navigator"] = html_path.exists()

    CATALOG_PATH.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"  catalog.json: nodes={n_nodes}, edges={n_edges}, "
        f"primitives={n_primitives}, concepts={n_concepts}, "
        f"has_navigator={html_path.exists()}"
    )


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    import networkx as nx
    from phrase_decomposer import parse_phrase, decompose_character
    from concept_graph import _to_html

    parser = argparse.ArgumentParser(
        description="Generate graph.yaml + graph.html for a ZiNets ConceptBook domain."
    )
    parser.add_argument(
        "--db", type=Path, default=DB_PATH,
        help="Path to zinets_cache.sqlite",
    )
    parser.add_argument(
        "--phrase", type=str, default=None,
        metavar="PHRASE",
        help="Generate domain from phrase (e.g. '画蛇添足'). "
             "Creates domain folder with phrase name.",
    )
    parser.add_argument(
        "--set-id", type=str, default=None,
        metavar="ID",
        help="Single set_id value to include (e.g. '10', '30', '100', '300'). "
             "Creates domain zinet-setid-{ID}. "
             "Default: all active characters → domain 'chinese_characters'.",
    )
    parser.add_argument(
        "--output", type=Path, default=None,
        help="Override graph.yaml output path (for testing). "
             "Default: public/domains/{domain-id}/input/graph.yaml",
    )
    args = parser.parse_args()

    # ── PHRASE MODE ──────────────────────────────────────────────────────────
    if args.phrase:
        conn = sqlite3.connect(args.db)
        phrase = args.phrase.strip()
        phrase_chars = parse_phrase(phrase)

        if not phrase_chars:
            print(f"❌ No valid characters in: {phrase}")
            conn.close()
            return

        domain_id = phrase
        domain_dir = DOMAINS_ROOT / domain_id
        yaml_path = domain_dir / "input" / "graph.yaml"
        html_path = domain_dir / "output" / "graph.html"

        print(f"Domain: {domain_id}")
        print(f"DB:     {args.db}")
        print(f"Phrase: {phrase}")
        print(f"Characters: {phrase_chars}\n")

        # Build graph dict for YAML
        graph_dict = {
            "domain": phrase,
            "primitives": {},
            "concepts": {},
            "applications": {}
        }

        # Build NetworkX graph for vis-network
        nx_graph = nx.DiGraph()
        phrase_id = "phrase_" + "".join(phrase_chars)

        nx_graph.add_node(
            phrase_id,
            kind="application",
            tier=2,
            defines=phrase,
            composed_of=phrase_chars
        )
        graph_dict["applications"][phrase_id] = {
            "text": phrase,
            "needs": phrase_chars,
            "defines": phrase,
            "tier": 2
        }

        # Process each character
        all_nodes = {}
        for char in phrase_chars:
            decomp = decompose_character(char, conn, 10)

            cursor = conn.execute(
                "SELECT pinyin, zi_en, desc_en, desc_cn FROM zn_zi WHERE zi = ?",
                (char,)
            )
            meta = cursor.fetchone()
            pinyin = meta[0] if meta else ""
            label = meta[1] if meta else char
            defines = meta[2] or meta[3] if meta else ""

            graph_dict["concepts"][char] = {
                "symbol": pinyin,
                "defines": defines,
                "tier": 1,
                "label": label,
                "composed_of": [c for c, d in decomp.items() if d == 1 and c != char]
            }

            nx_graph.add_node(
                char,
                kind="concept",
                tier=1,
                defines=defines,
                label=label or char,
                prereqs=[c for c, d in decomp.items() if d == 1 and c != char]
            )
            nx_graph.add_edge(char, phrase_id)

            all_nodes[char] = {
                "kind": "concept",
                "tier": 1,
                "defines": defines,
                "label": label
            }

            # Add components
            for component, depth in decomp.items():
                if component == char:
                    continue

                if component not in all_nodes:
                    cursor = conn.execute(
                        "SELECT pinyin, zi_en, desc_en, desc_cn FROM zn_zi WHERE zi = ?",
                        (component,)
                    )
                    comp_meta = cursor.fetchone()
                    comp_pinyin = comp_meta[0] if comp_meta else ""
                    comp_label = comp_meta[1] if comp_meta else component
                    comp_defines = comp_meta[2] or comp_meta[3] if comp_meta else ""

                    comp_decomp = decompose_character(component, conn, 1)
                    is_primitive = len(comp_decomp) <= 1

                    if is_primitive:
                        graph_dict["primitives"][component] = {
                            "symbol": comp_pinyin,
                            "defines": comp_defines,
                            "tier": 0,
                            "label": comp_label
                        }
                        kind = "primitive"
                        tier = 0
                    else:
                        if component not in graph_dict["concepts"]:
                            graph_dict["concepts"][component] = {
                                "symbol": comp_pinyin,
                                "defines": comp_defines,
                                "tier": 1,
                                "label": comp_label,
                                "composed_of": [c for c, d in comp_decomp.items() if d == 1 and c != component]
                            }
                        kind = "concept"
                        tier = 1

                    all_nodes[component] = {
                        "kind": kind,
                        "tier": tier,
                        "defines": comp_defines,
                        "label": comp_label
                    }

                    nx_graph.add_node(
                        component,
                        kind=kind,
                        tier=tier,
                        defines=comp_defines,
                        label=comp_label or component,
                        prereqs=[]
                    )

                    if depth == 1:
                        nx_graph.add_edge(component, char)

        conn.close()

        # Write graph.yaml
        yaml_path.parent.mkdir(parents=True, exist_ok=True)
        with open(yaml_path, 'w', encoding='utf-8') as f:
            yaml.dump(graph_dict, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        print(f"✅ Wrote {yaml_path}")

        # Generate vis-network HTML
        html = _to_html(nx_graph, domain_name=phrase)
        html_path.parent.mkdir(parents=True, exist_ok=True)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"✅ Wrote {html_path}")

        print(f"\n📊 Summary:")
        print(f"   Concepts: {len(graph_dict['concepts'])}")
        print(f"   Primitives: {len(graph_dict['primitives'])}")
        print(f"\n✨ Domain ready: {domain_dir}")
        return

    # ── SET-ID MODE ──────────────────────────────────────────────────────────
    domain_id = f"zinet-setid-{args.set_id}" if args.set_id else "chinese_characters"
    domain_dir = DOMAINS_ROOT / domain_id
    yaml_path = args.output or (domain_dir / "input" / "graph.yaml")
    html_path = domain_dir / "output" / "graph.html"
    set_ids = [args.set_id] if args.set_id else None

    print(f"Domain: {domain_id}")
    print(f"DB:     {args.db}")
    print(f"Filter: set_id = {args.set_id!r}" if set_ids else "Filter: all active")
    print(f"Output: {yaml_path}\n")

    conn = sqlite3.connect(args.db)

    print("Loading zi metadata…")
    zi_meta = load_zi(conn, set_ids)
    print(f"  {len(zi_meta)} characters")

    if not zi_meta:
        print("No characters found. Check --set-id value.")
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

    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    with open(yaml_path, "w", encoding="utf-8") as fh:
        yaml.dump(
            graph, fh,
            allow_unicode=True,
            default_flow_style=False,
            sort_keys=False,
        )
    print(f"\nWrote {yaml_path}")

    print("\nGenerating graph.html navigator…")
    generate_html(yaml_path, html_path, domain_id)

    print("\nUpdating catalog.json…")
    update_catalog(graph, domain_id, html_path)


if __name__ == "__main__":
    main()
