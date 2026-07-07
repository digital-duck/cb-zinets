"""
Phrase decomposition API endpoints.

Endpoints:
  POST /api/phrase/graph - Generate/load vis.js graph HTML for a phrase
  GET /api/phrase/{node_id}/content - Get detailed content for a node
"""

import hashlib
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlite3
from pathlib import Path

router = APIRouter()

# Database connection
from api.config import settings
DB_PATH = settings.db_path
DOMAINS_ROOT = Path(__file__).parent.parent.parent / "public/domains"


class PhraseRequest(BaseModel):
    """Request to build a graph for a phrase."""

    phrase: str


def _make_domain_id(phrase: str) -> str:
    """Domain ID from a phrase: CJK chars only, hash only when truncated.

    Non-CJK (punctuation, spaces, Latin words like 'idiom') are dropped.
    If ≤10 CJK chars: use as-is (no hash needed).
    If >10 CJK chars: first 10 + '_' + SHA1[:6] to flag truncation.

    Examples:
      "独一无二"              → "独一无二"
      "守株待兔 (idiom)"      → "守株待兔"
      "学而不思则罔，思而不学则殆" → "学而不思则罔思而不_9d76b2"
    """
    cjk = re.sub(r'[^一-鿿㐀-䶿]', '', phrase.strip())
    if len(cjk) <= 10:
        return cjk
    h = hashlib.sha1(cjk.encode()).hexdigest()[:6]
    return f"{cjk[:10]}_{h}"


def _make_app_node_id(phrase: str) -> str:
    """Tier-2 application-node id for a phrase — mirrors zinets_to_graph.py's
    "phrase_" + chars convention.

    Keeping this prefix distinct from any tier-1 concept id matters most for
    single-character phrases: without it, a 1-char phrase (e.g. "餐") gets an
    application id identical to its own concept id, and the second
    add_node() call in concept_graph._load_yaml_graph silently overwrites the
    concept's tier/composed_of — the character never appears to decompose
    (it also self-loops, since "needs" for a 1-char phrase is just the
    character itself).
    """
    from phrase_decomposer import extract_chars
    return "phrase_" + "".join(extract_chars(phrase))


def generate_domain_dynamically(phrase: str, domain_id: str, app_node_id: str):
    """Generate a phrase domain (graph.yaml + graph.html) if it doesn't exist.

    Selection (which characters/components, from phrase decomposition) lives
    in scripts/domain_builder.build_phrase_graph_dict; materialization
    (YAML → HTML, single source of truth) is domain_builder.write_domain —
    the same path scripts/zinets_to_graph.py uses for HSK-tier domains.
    """
    from scripts.domain_builder import build_phrase_graph_dict, write_domain

    conn = sqlite3.connect(DB_PATH)
    try:
        graph_dict = build_phrase_graph_dict(phrase, app_node_id, conn)
    finally:
        conn.close()
    write_domain(domain_id, graph_dict, domain_name=phrase)


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
        domain_id = _make_domain_id(phrase)
        print(f"📝 Phrase: {phrase}  →  domain_id: {domain_id}")

        domain_dir = DOMAINS_ROOT / domain_id
        html_path = domain_dir / "output" / "graph.html"
        yaml_path = domain_dir / "input" / "graph.yaml"

        print(f"📁 Domain dir: {domain_dir}")
        print(f"📄 YAML exists: {yaml_path.exists()}")
        print(f"🎨 HTML exists: {html_path.exists()}")

        app_node_id = _make_app_node_id(phrase)

        # Check if already exists; generate if not
        if html_path.exists() and yaml_path.exists():
            print(f"✅ Domain already exists")
        else:
            print(f"🔨 Generating domain dynamically...")
            generate_domain_dynamically(phrase, domain_id, app_node_id)
            print(f"✅ Generated graph dynamically")

        # Ensure catalog has an entry so mark_book_generated can find it later
        from api.services.catalog_svc import upsert_domain
        upsert_domain(domain_id, app_node_id)

        print(f"📤 Returning domain_id: {domain_id}")
        print(f"{'='*60}\n")

        return {"domain_id": domain_id}

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
            components = [c.strip() for c in parts_row if c and c.strip()]

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
