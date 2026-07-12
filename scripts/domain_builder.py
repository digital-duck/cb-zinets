"""Single materialization path for a domain: graph dict → graph.yaml → graph.html.

Two producers used to write domains independently and drifted:
  - scripts/zinets_to_graph.py (HSK-tier batch CLI)
  - api/routers/phrase.py:generate_domain_dynamically (per-phrase, on demand)

The phrase route additionally hand-built an nx.DiGraph alongside the YAML
dict, so graph.yaml and graph.html could disagree. Now graph.yaml is the only
source of truth: every producer builds a plain graph dict (its own data
source, its own logic) and calls write_domain(), which dumps the YAML and
derives the HTML from that same file via concept_graph's loader.

Armature rule: producers differ in what they select; how a domain is
materialized is bone, and lives here once.
"""
from __future__ import annotations

import importlib.util
import sqlite3
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))  # sibling imports under uvicorn
ROOT = Path(__file__).resolve().parent.parent
DOMAINS_ROOT = ROOT / "public" / "domains"


def _concept_graph():
    """Import scripts/concept_graph.py by path (works from CLI and uvicorn)."""
    cg_path = Path(__file__).parent / "concept_graph.py"
    spec = importlib.util.spec_from_file_location("concept_graph", cg_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load concept_graph from {cg_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def write_domain(domain_id: str, graph_dict: dict, domain_name: str | None = None) -> Path:
    """Write input/graph.yaml, then derive output/graph.html from it.

    Returns the domain directory. graph.html is always rendered from the
    just-written YAML, never from a parallel in-memory graph.
    """
    domain_dir = DOMAINS_ROOT / domain_id
    yaml_path = domain_dir / "input" / "graph.yaml"
    html_path = domain_dir / "output" / "graph.html"

    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    with open(yaml_path, "w", encoding="utf-8") as f:
        yaml.dump(graph_dict, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

    mod = _concept_graph()
    graph = mod._load_yaml_graph(yaml_path)
    html = mod._to_html(graph, domain_name=domain_name or domain_id)
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(html, encoding="utf-8")
    print(f"  Wrote graph.yaml + graph.html ({graph.number_of_nodes()} nodes) → {domain_dir}")
    return domain_dir


def build_phrase_graph_dict(phrase: str, app_node_id: str, conn: sqlite3.Connection) -> dict:
    """Graph dict for a phrase domain: each character decomposed to primitives.

    The phrase itself is the application node, keyed by app_node_id — callers
    keep their own convention (the API route uses the domain id; the CLI uses
    'phrase_' + chars, which downstream book/concept filenames depend on).
    Characters become concepts (decomposable) or primitives (atomic);
    intermediate components carry their own composed_of, so the derived graph
    wires sub-component edges (e.g. 田→甲→单) with no second pass.
    """
    from phrase_decomposer import parse_phrase, extract_chars, decompose_character

    full_chars = extract_chars(phrase)       # preserves repeats, e.g. 不见不散
    phrase_chars = parse_phrase(phrase)      # deduped, for decomposition only
    if not phrase_chars:
        raise ValueError("No valid characters found in phrase")

    # Single-character input: the character itself is the top node — no phrase
    # wrapper needed or wanted. A phrase_ application node would be confusing
    # in the graph and misleading in generated concept books.
    is_single_char = len(phrase_chars) == 1

    graph_dict: dict = {
        "domain": phrase,
        "primitives": {},
        "concepts": {},
        "applications": {} if is_single_char else {
            app_node_id: {"text": phrase, "needs": full_chars, "defines": phrase, "tier": 2},
        },
    }

    def _meta(zi: str) -> tuple[str, str, str]:
        row = conn.execute(
            "SELECT pinyin, zi_en, desc_en, desc_cn FROM zn_zi WHERE zi = ?", (zi,)
        ).fetchone()
        if not row:
            return "", zi, ""
        return row[0] or "", row[1] or zi, (row[2] or row[3] or "")

    def _add_node(zi: str, composed_of: list[str]) -> None:
        pinyin, label, defines = _meta(zi)
        if composed_of:
            graph_dict["concepts"].setdefault(zi, {
                "symbol": pinyin, "defines": defines, "tier": 1,
                "label": label, "composed_of": composed_of,
            })
        else:
            graph_dict["primitives"].setdefault(zi, {
                "symbol": pinyin, "defines": defines, "tier": 0, "label": label,
            })

    seen: set[str] = set()
    for char in phrase_chars:
        decomp = decompose_character(char, conn, 10)
        _add_node(char, [c for c, d in decomp.items() if d == 1 and c != char])
        seen.add(char)
        for component in decomp:
            if component == char or component in seen:
                continue
            seen.add(component)
            comp_decomp = decompose_character(component, conn, 1)
            _add_node(component, [c for c, d in comp_decomp.items() if d == 1 and c != component])

    return graph_dict
