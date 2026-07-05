# Quick Start: Phrase Explorer

A "from bricks to house" learning application for Chinese characters through idiomatic phrases.

## What It Does

You enter a phrase or idiom like **"画蛇添足"** and the app:
1. **Decomposes** it into all constituent characters and their components
2. **Builds a 3-tier graph**:
   - **Tier 2**: The phrase itself (application layer)
   - **Tier 1**: The characters in the phrase (concept layer)
   - **Tier 0**: The elemental building blocks (primitive layer)
3. **Displays** an interactive visualization
4. **Allows learning**: Click any node to see definitions, components, pinyin
5. **Links to concept book**: Deep dive into any character

## Setup

### 1. Database (Already in place)
```bash
ls -lh /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite
# Should show: ~3.5M
```

### 2. Install Python Dependencies
```bash
cd /home/papagame/projects/digital-duck/cb_zinets
pip install -r requirements-api.txt
```

### 3. Start API Server
```bash
python -m uvicorn api.app:app --reload --port 8000
```

### 4. Start Frontend (in another terminal)
```bash
cd /home/papagame/projects/digital-duck/cb_zinets
npm install
npm run dev
```

### 5. Open in Browser
```
http://localhost:5173/#/phrase
```

## Usage

### Input Examples
- Single phrases: **画蛇添足**, **守株待兔**, **卧虎藏龙**
- Multiple phrases: **画蛇添足，守株待兔**
- Sentences: **我喜欢学习中文**

### How It Works

```
User Input: "画蛇添足"
    ↓
Character Extraction: [画, 蛇, 添, 足]
    ↓
Recursive Decomposition (using SQL recursive CTE):
  画 → [一, 凵, 田, 十, ...]
  蛇 → [虫, 它, ...]
  添 → [氵, 忝, ...]
  足 → [...]
    ↓
Build 3-Tier Graph:
  Tier 2: phrase_画蛇添足
  Tier 1: 画, 蛇, 添, 足 (+ their components)
  Tier 0: 一, 丨, 口, 木, ... (elemental chars)
    ↓
Visualize & Learn
```

## File Changes Summary

### New Files
- ✨ `scripts/phrase_decomposer.py` — Core decomposition logic
- ✨ `api/routers/phrase.py` — REST API endpoints
- ✨ `src/pages/PhraseExplorer.js` — Main UI page
- 📖 `PHRASE_EXPLORER_GUIDE.md` — Detailed documentation
- 📖 `QUICKSTART.md` — This file

### Modified Files
- 📝 `scripts/zinets_to_graph.py` — Updated DB path to local
- 📝 `api/app.py` — Added phrase router
- 📝 `src/main.js` — Registered PhraseExplorer page
- 📝 `src/components/Header.js` — Added phrase link
- 📝 `src/style.css` — Added phrase explorer styles

## Architecture

```
User Interface
    ↓
PhraseExplorer.js (Vue-like JS component)
    ↓
/api/phrase/decompose (FastAPI endpoint)
    ↓
phrase_decomposer.py (Business logic)
    ↓
cb_zinets.sqlite (Database with recursive CTE queries)
```

## Key Concepts

### Recursive Decomposition
Uses SQL `WITH RECURSIVE` to efficiently traverse the character decomposition tree:

```sql
WITH RECURSIVE decomposition(zi, depth) AS (
  SELECT zi, 0 FROM zn_zi WHERE zi = ?
  UNION ALL
  SELECT comp, d.depth + 1
  FROM decomposition d
  JOIN zn_zi_part parts ON d.zi = parts.zi
  WHERE d.depth < 10
)
SELECT DISTINCT zi, depth FROM decomposition
```

### 3-Tier Learning Model
- **Primitive (Tier 0)**: Building blocks (氵, 木, 口)
- **Concept (Tier 1)**: Learnable characters (画, 蛇)
- **Application (Tier 2)**: Meaningful phrases (画蛇添足)

This mirrors natural language acquisition: learn basic components, then build vocabulary, then form meaningful language.

## API Endpoints

### POST /api/phrase/decompose
Decompose a phrase into 3-tier graph.

**Request:**
```json
{
  "phrase": "画蛇添足",
  "max_depth": 10
}
```

**Response:**
```json
{
  "phrase": "画蛇添足",
  "phrase_id": "phrase_画蛇添足",
  "applications": {
    "phrase_画蛇添足": {
      "text": "画蛇添足",
      "characters": ["画", "蛇", "添", "足"],
      "tier": 2
    }
  },
  "concepts": {
    "画": {
      "symbol": "huà",
      "defines": "to draw",
      "tier": 1,
      "composed_of": ["一", "凵", "田"]
    },
    ...
  },
  "primitives": {
    "一": {
      "symbol": "yī",
      "defines": "one",
      "tier": 0
    },
    ...
  }
}
```

### GET /api/phrase/{phrase_id}/{node_id}/content
Get detailed content for a character node.

**Response:**
```json
{
  "node_id": "画",
  "character": "画",
  "pinyin": "huà",
  "label": "to draw",
  "definition_en": "to draw; picture",
  "definition_cn": "绘画",
  "components": ["一", "凵", "田"],
  "cached_meaning": "AI-generated meaning..."
}
```

## Troubleshooting

### "Database not found"
Check: `ls /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite`

### "API not responding"
1. Check API is running: `python -m uvicorn api.app:app --reload --port 8000`
2. Check frontend is pointing to correct API: should be `http://localhost:8000`

### "No primitives shown"
Some characters may not have decomposition records in the database. This is normal.

## Next Steps

1. ✅ **Try different phrases** — See the graph structure
2. 📚 **Learn from decompositions** — Click nodes for details
3. 🔗 **Link to concept book** — Click "📖 在概念书中查看" button
4. 💾 **Save learning notes** — Future enhancement
5. 🎯 **Create custom phrase lists** — Future enhancement

## Contact & Support

For issues or questions about:
- **Decomposition logic**: See `scripts/phrase_decomposer.py`
- **API design**: See `api/routers/phrase.py`
- **UI/UX**: See `src/pages/PhraseExplorer.js`
- **Database schema**: Check `db/cb_zinets.sqlite` structure

---

**Created**: 2026-06-27  
**Status**: ✅ Fully functional, ready for user testing  
**Next Phase**: User feedback → Refinements → Feature additions
