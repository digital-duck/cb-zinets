# Phrase Explorer: 从短语学习中文

A learning application that decomposes Chinese idiomatic phrases and sentences into a 3-tier concept graph, enabling learners to understand how characters are built from primitive elements.

## Architecture

### 3-Tier Learning Structure

```
Tier 2 (Application)  →  Phrases/Idioms
         ↓              "画蛇添足" (over-elaboration)
         
Tier 1 (Concept)      →  Characters + Components
         ↓              画, 蛇, 添, 足
                        + 一, 虫, 氵, 田, etc.
         
Tier 0 (Primitive)    →  Elemental Characters
                       丶, 丨, 口, 木, etc.
```

### Philosophy: "From Bricks to House"
- **Bricks (Tier 0)**: Elemental characters (氵, 木, 口, etc.)
- **Building Blocks (Tier 1)**: Composed characters that make up the phrase
- **House (Tier 2)**: The complete phrase/idiom with meaning

## Components

### Backend

#### 1. **phrase_decomposer.py** — Core Decomposition Engine
Located: `scripts/phrase_decomposer.py`

Key functions:
- `decompose_character(zi, conn, max_depth)` — Recursively get all parts of a character
- `parse_phrase(phrase)` — Extract characters from phrases (handles punctuation)
- `decompose_phrase(phrase, conn)` — Decompose all characters in a phrase
- `build_phrase_graph(phrase, conn)` — Create the 3-tier graph structure

Uses **recursive SQL CTE** to efficiently traverse the `zn_zi_part` table:
```sql
WITH RECURSIVE decomposition(zi, depth) AS (
  SELECT zi, 0 FROM zn_zi WHERE zi = ?
  UNION ALL
  SELECT comp, d.depth + 1
  FROM decomposition d
  JOIN zn_zi_part_unpivoted parts ON d.zi = parts.zi
  WHERE d.depth < max_depth
)
SELECT DISTINCT zi, depth FROM decomposition
```

#### 2. **API Router** — REST Endpoints
Located: `api/routers/phrase.py`

Endpoints:
- `POST /api/phrase/decompose` — Decompose a phrase
  - Request: `{"phrase": "画蛇添足", "max_depth": 10}`
  - Response: `{phrase_id, applications, concepts, primitives}`

- `GET /api/phrase/{phrase_id}/{node_id}/content` — Get character details
  - Returns: pinyin, definition, components, cached meaning

### Frontend

#### 1. **PhraseExplorer Page** — Main Interface
Located: `src/pages/PhraseExplorer.js`

Features:
- **Input Section**: User enters phrase/idiom
- **Graph Display**: 3-tier visualization
  - Clickable nodes
  - Color-coded by tier
- **Sidebar**: Node details on selection
- **Integration**: Links to ConceptBook page

#### 2. **Styles**
Located: `src/style.css` (appended with `.cb-phrase-*` classes)

Color scheme:
- **Tier 2 (Applications)**: Accent blue (主色)
- **Tier 1 (Concepts)**: Light blue (#3b82f6)
- **Tier 0 (Primitives)**: Neutral gray (default)

#### 3. **Navigation**
- Header includes "短语学习" (Phrase Learning) link
- Routes via hash: `#/phrase`

## Usage Flow

### Example: 学习 "画蛇添足"

1. **User Input**
   ```
   Input: "画蛇添足"
   ```

2. **Decomposition**
   - Character extraction: [画, 蛇, 添, 足]
   - For each character, recursively fetch all parts
   - Build 3-tier graph

3. **Visualization**
   ```
   Tier 2 (Applications):
   ┌──────────────┐
   │  画蛇添足    │  (the idiom)
   └──────────────┘
   
   Tier 1 (Concepts):
   ┌────┬────┬────┬────┐
   │ 画 │ 蛇 │ 添 │ 足 │  (phrase characters)
   └────┴────┴────┴────┘
   ┌────┬────┬────┬────┬─────┐
   │ 凵 │ 虫 │ 氵 │ 田 │ ... │  (their components)
   └────┴────┴────┴────┴─────┘
   
   Tier 0 (Primitives):
   ┌──┬──┬──┬──┬──┬──┐
   │丶│丨│口│木│一│十│  (elemental)
   └──┴──┴──┴──┴──┴──┘
   ```

4. **Learning**
   - Click any node to see:
     - Pinyin (拼音)
     - Definition (英文和中文)
     - Components (组成部分)
     - LLM-generated meanings (AI含义)
   - Link to ConceptBook for deeper study

## Database Schema

Uses three existing tables:
- `zn_zi` — Character metadata (pinyin, definitions, labels)
- `zn_zi_part` — Decomposition relationships (11 positional slots)
- `zn_character_cache` — LLM-generated meanings (fallback definitions)

## File Structure

```
cb_zinets/
├── db/
│   └── cb_zinets.sqlite          # Local database
├── scripts/
│   ├── zinets_to_graph.py        # (updated: local DB path)
│   └── phrase_decomposer.py      # NEW: phrase decomposition
├── api/
│   ├── app.py                    # (updated: added phrase router)
│   └── routers/
│       └── phrase.py             # NEW: API endpoints
└── src/
    ├── main.js                   # (updated: added PhraseExplorer route)
    ├── pages/
    │   └── PhraseExplorer.js     # NEW: main UI page
    ├── components/
    │   └── Header.js             # (updated: added phrase link)
    └── style.css                 # (updated: added phrase styles)
```

## Development Commands

### Run API
```bash
cd /home/papagame/projects/digital-duck/cb_zinets
python -m pip install -r requirements-api.txt
python -m uvicorn api.app:app --reload --port 8000
```

### Run Frontend (Vite dev server)
```bash
npm run dev
# Visit http://localhost:5173/#/phrase
```

### Test Decomposition
```bash
python scripts/phrase_decomposer.py
```

## Examples to Try

1. **画蛇添足** — Over-elaboration
2. **守株待兔** — Waiting for a windfall
3. **卧虎藏龙** — Hidden talents
4. **掩耳盗铃** — Deceiving oneself
5. **开门见山** — Straight to the point
6. **临危不惧** — Fearless in danger

## Future Enhancements

- [ ] Phrase etymology and cultural background
- [ ] Example sentences for each character
- [ ] Audio pronunciation
- [ ] Handwriting animation (showing stroke order)
- [ ] Difficulty level estimation
- [ ] Spaced repetition quiz integration
- [ ] User notes and bookmarks
- [ ] Social sharing (compare decompositions)

## Notes

- Database path is now local: `db/cb_zinets.sqlite`
- API is CORS-enabled for frontend integration
- Supports up to 10 levels of recursive decomposition (configurable)
- Handles Chinese and Western punctuation
- Deduplicates characters in phrases
