"""
Phrase decomposition API endpoints.

Endpoints:
  POST /api/phrase/graph - Generate/load vis.js graph HTML for a phrase
  GET /api/phrase/{node_id}/content - Get detailed content for a node
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
from pathlib import Path
import yaml
import networkx as nx

router = APIRouter()

# Database connection
DB_PATH = Path(__file__).parent.parent.parent / "db/cb_zinets.sqlite"
DOMAINS_ROOT = Path(__file__).parent.parent.parent / "public/domains"


class PhraseRequest(BaseModel):
    """Request to build a graph for a phrase."""

    phrase: str


def generate_domain_dynamically(phrase: str):
    """Generate domain graph dynamically if it doesn't exist."""
    print(f"   🔨 Importing decomposer...")
    from scripts.phrase_decomposer import parse_phrase, decompose_character
    from scripts.concept_graph import _to_html
    print(f"   ✅ Imports successful")

    print(f"   📂 Connecting to DB: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    print(f"   ✅ Connected")

    # Parse phrase and decompose
    print(f"   🔍 Parsing phrase...")
    phrase_chars = parse_phrase(phrase)
    print(f"   ✅ Characters: {phrase_chars}")
    if not phrase_chars:
        raise ValueError("No valid characters found in phrase")

    domain_dir = DOMAINS_ROOT / phrase
    yaml_path = domain_dir / "input" / "graph.yaml"
    html_path = domain_dir / "output" / "graph.html"

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
    domain_dir.mkdir(parents=True, exist_ok=True)
    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    with open(yaml_path, 'w', encoding='utf-8') as f:
        yaml.dump(graph_dict, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

    # Generate vis-network HTML
    print(f"   🎨 Generating HTML with vis-network...")
    from scripts.concept_graph import _to_html
    html = _to_html(nx_graph, domain_name=phrase)
    print(f"   ✅ HTML generated ({len(html)} bytes)")

    print(f"   💾 Writing files...")
    html_path.parent.mkdir(parents=True, exist_ok=True)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"   ✅ Wrote: {html_path}")

    print(f"   ✅ Domain generation complete")
    return graph_dict, html


@router.post("/api/phrase/graph")
def build_phrase_graph_html(req: PhraseRequest):
    """
    Generate/load an interactive vis.js concept graph for a phrase.

    If domain doesn't exist, generates it dynamically.
    Returns HTML as string containing the full interactive graph.
    """
    print(f"\n{'='*60}")
    print(f"🔵 API RECEIVED REQUEST")
    print(f"{'='*60}")

    if not req.phrase or not req.phrase.strip():
        print("❌ Phrase is empty")
        raise HTTPException(status_code=400, detail="Phrase cannot be empty")

    try:
        phrase = req.phrase.strip()
        print(f"📝 Phrase: {phrase}")

        domain_dir = DOMAINS_ROOT / phrase
        html_path = domain_dir / "output" / "graph.html"
        yaml_path = domain_dir / "input" / "graph.yaml"

        print(f"📁 Domain dir: {domain_dir}")
        print(f"📄 YAML exists: {yaml_path.exists()}")
        print(f"🎨 HTML exists: {html_path.exists()}")

        # Check if already exists
        if html_path.exists() and yaml_path.exists():
            print(f"✅ Loading existing domain")
            # Load existing
            with open(yaml_path, 'r', encoding='utf-8') as f:
                graph_data = yaml.safe_load(f)
            with open(html_path, 'r', encoding='utf-8') as f:
                html = f.read()
            print(f"✅ Loaded existing graph")
        else:
            print(f"🔨 Generating domain dynamically...")
            # Generate dynamically
            graph_data, html = generate_domain_dynamically(phrase)
            print(f"✅ Generated graph dynamically")

        phrase_id = "phrase_" + "".join(phrase.replace(" ", "").replace("，", "").replace(",", ""))

        stats = {
            "primitives": len(graph_data.get("primitives", {})),
            "concepts": len(graph_data.get("concepts", {})),
            "applications": len(graph_data.get("applications", {}))
        }
        print(f"📊 Stats: {stats}")
        print(f"📤 Returning HTML ({len(html)} bytes)")
        print(f"{'='*60}\n")

        return {
            "html": html,
            "phrase": phrase,
            "phrase_id": phrase_id,
            "stats": stats
        }

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        raise HTTPException(status_code=500, detail=f"Failed to build graph: {str(e)}")


@router.post("/api/phrase/{node_id}/book")
def generate_concept_book(node_id: str, req: PhraseRequest):
    """
    Generate LLM-based concept book content for a target node.

    TODO: Integrate with LLM provider (Claude, Ollama, etc.)
    For now, returns a placeholder response.
    """
    try:
        # TODO: Call LLM to generate rich content about the target concept
        # This would include etymology, usage examples, mnemonics, etc.
        content = f"""
        # {node_id} (目标节点)

        ## 定义
        Coming soon: LLM-generated detailed concept book content

        ## 来源词组
        {req.phrase}

        ## 用法示例
        * 示例 1
        * 示例 2

        ## 记忆技巧
        * 技巧 1
        * 技巧 2
        """

        return {
            "target": node_id,
            "phrase": req.phrase,
            "content": content,
            "status": "placeholder"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate concept book: {str(e)}")


@router.get("/api/phrase/{node_id}/content")
def get_node_content(node_id: str):
    """
    Get detailed learning content for a node.

    Returns definition, pronunciation, components, etc.
    """
    try:
        conn = sqlite3.connect(DB_PATH)

        # Query character metadata
        cursor = conn.execute(
            """
            SELECT zi, pinyin, zi_en, desc_en, desc_cn
            FROM zn_zi
            WHERE zi = ?
            """,
            (node_id,),
        )
        row = cursor.fetchone()

        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found")

        # Get decomposition info
        cursor = conn.execute(
            """
            SELECT
              zi_left_up, zi_left, zi_left_down,
              zi_up, zi_mid, zi_down,
              zi_right_up, zi_right, zi_right_down,
              zi_mid_out, zi_mid_in
            FROM zn_zi_part
            WHERE zi = ?
            """,
            (node_id,),
        )
        parts_row = cursor.fetchone()

        components = []
        if parts_row:
            components = [c for c in parts_row if c and c.strip()]

        # Get cached meaning
        cursor = conn.execute(
            "SELECT meaning FROM zn_character_cache WHERE character = ?",
            (node_id,),
        )
        cache_row = cursor.fetchone()
        cached_meaning = cache_row[0] if cache_row else ""

        conn.close()

        return {
            "node_id": node_id,
            "character": row[0],
            "pinyin": row[1] or "",
            "label": row[2] or "",
            "definition_en": row[3] or "",
            "definition_cn": row[4] or "",
            "components": components,
            "cached_meaning": cached_meaning,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get node content: {str(e)}")
