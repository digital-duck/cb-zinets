# Phrase Explorer: App Architecture (2-Page Model)

## Overview

A streamlined 2-page learning application for Chinese characters through idiomatic phrases.

**Philosophy**: From bricks (primitive characters) to house (idiomatic phrases).

## 3-Page Structure

- Home
- Graph
- Content
- Settings

```
┌─────────────────────────────────────────────┐
│  PAGE 0: Home                               │
│  - Submit a phrase to build concept graph   │
└─────────────────────────────────────────────┘
                    ↓ (direct to /)
┌─────────────────────────────────────────────┐
│  PAGE 1: Concept-Graph Builder & Generator  │
│  ─────────────────────────────────────────  │
│  • User enters phrase/sentence              │
│  • Dynamic decomposition from SQLite        │
│  • Interactive 3-tier visualization         │
│  • Select target node                       │
│  • Generate Concept Book                    │
│                                             │
│  Route: #/ or #/graph                       │
└─────────────────────────────────────────────┘
                    ↓ (on "generate")
┌─────────────────────────────────────────────┐
│  PAGE 2: Concept-Content Book Reader        │
│  ─────────────────────────────────────────  │
│  • Display LLM-generated content            │
│  • Full-page reading experience             │
│  • Navigate back to builder                 │
│                                             │
│  Route: #/book?domain=...&focus=...         │
└─────────────────────────────────────────────┘
```

---

## Page 1: Concept Graph Builder

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  HEADER                                         │
│  [Logo]  [概念图]  [设置]                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  INPUT SECTION (initially visible)              │
│  ┌────────────────────────────────────────┐    │
│  │ 从短语开始学习中文                      │    │
│  │ 输入短语、成语或句子...                  │    │
│  │                                        │    │
│  │ [输入框      ] [构建图]                │    │
│  │ 例子: [画蛇添足] [守株待兔]           │    │
│  └────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘

AFTER DECOMPOSING:

┌─────────────────────────────────────────────────┐
│  GRAPH SECTION (shown after input)              │
│  ┌────────────────────────────────────────┐    │
│  │ 画蛇添足   [📖 生成概念书]  [返回]    │    │
│  │ 概念图 - 从基础到应用                  │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌──────────────────────┬──────────────────┐   │
│  │  GRAPH (3 TIERS)     │  SIDEBAR         │   │
│  │                      │  (Node details)  │   │
│  │  基础层 (Tier 0)     │                  │   │
│  │  [节点] [节点]       │  点击节点查看:   │   │
│  │                      │  拼音             │   │
│  │  概念层 (Tier 1)     │  定义             │   │
│  │  [节点] [节点]       │  组成部分         │   │
│  │                      │  [📖 从此节点开始]│   │
│  │  应用层 (Tier 2)     │                  │   │
│  │  [短语]              │                  │   │
│  └──────────────────────┴──────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### User Flow

**Step 1: Input**
```
User: "画蛇添足"
            ↓
Input field receives text
Click "构建图" or press Enter
```

**Step 2: Graph Display**
```
API decomposes phrase:
  画蛇添足 (Tier 2: application)
    ├─ 画, 蛇, 添, 足 (Tier 1: concepts)
    └─ 一, 虫, 凵, 氵, ... (Tier 0: primitives)
            ↓
Render 3 horizontal tiers with clickable nodes
```

**Step 3: Node Selection**
```
User clicks a character node
            ↓
Node highlights (blue background)
Sidebar shows:
  - Character
  - Pinyin
  - Definition(s)
  - Components
  - Button: "📖 从此节点开始"
```

**Step 4: Generate Concept Book**
```
User clicks "📖 生成概念书"
            ↓
Navigate to /book page with:
  domain=phrase_画蛇添足
  focus=选中的字
```

### Key Components

#### Input Section
- **Text input**: Accepts phrases, sentences, idioms
- **Build button**: Triggers decomposition
- **Example tags**: Quick-access common phrases
- **Handles**:
  - Chinese punctuation (，、；：！？)
  - Western punctuation (,;:!?)
  - Whitespace trimming
  - Empty input validation

#### Graph Display
- **3-tier structure**:
  - Tier 0 (Primitives, bottom): Elemental characters
  - Tier 1 (Concepts, middle): Phrase characters + components
  - Tier 2 (Application, top): The phrase itself
- **Styling by tier**:
  - Tier 2: Bold blue (#2563eb)
  - Tier 1: Light blue (#3b82f6)
  - Tier 0: Neutral gray
- **Interactive**:
  - Click to select
  - Hover for visual feedback
  - Sidebar updates on selection

#### Sidebar
- **Shows selected node details**:
  - Character (large display)
  - Pinyin (pronunciation)
  - Definitions (English & Chinese)
  - Components (list of child parts)
  - Cached LLM meanings
- **Button to jump to Concept Book**

---

## Page 2: Concept Book Reader

### Layout

```
┌──────────────────────────────────────────────┐
│  HEADER                                      │
└──────────────────────────────────────────────┘
│                                              │
│  CONCEPT BOOK CONTENT                        │
│  (iframe or HTML rendering)                  │
│                                              │
│  All LLM-generated content for the node      │
│  - Definitions                               │
│  - Etymology                                 │
│  - Examples                                  │
│  - Related characters                        │
│  - Full decomposition tree                   │
│                                              │
│  [← Back to Graph]                          │
│                                              │
└──────────────────────────────────────────────┘
```

### Parameters

```
URL: #/book?domain=phrase_画蛇添足&focus=画

domain: phrase_画蛇添足  (the selected phrase/domain)
focus:  画              (the specific node to read about)
```

### Behavior

- Opens the concept book for the phrase domain
- Focuses on the selected character
- Shows all available LLM-generated content
- Can navigate back to graph builder

---

## Data Flow

### Complete User Journey

```
1. USER ENTERS APP
   └─ Route: #/
   └─ Page: ConceptGraphBuilder
   
2. USER INPUTS PHRASE
   └─ "画蛇添足"
   └─ Click "构建图" or Enter
   
3. API DECOMPOSES
   └─ POST /api/phrase/decompose
   └─ Input: {phrase: "画蛇添足", max_depth: 10}
   └─ Process: Recursive SQL CTE on zn_zi_part
   └─ Output: 3-tier graph JSON
   
4. GRAPH RENDERS
   └─ Tier 2: phrase_画蛇添足 [1 node]
   └─ Tier 1: 画, 蛇, 添, 足 + components [20+ nodes]
   └─ Tier 0: Primitives [8+ nodes]
   
5. USER SELECTS NODE
   └─ Click "画"
   └─ GET /api/phrase/phrase_画蛇添足/画/content
   └─ Sidebar shows: pinyin, definitions, components
   
6. USER GENERATES BOOK
   └─ Click "📖 生成概念书"
   └─ Navigate to: #/book?domain=phrase_画蛇添足&focus=画
   
7. CONCEPT BOOK DISPLAYS
   └─ Route: #/book
   └─ Page: BookPage
   └─ Content: LLM-generated full entry for 画
   
8. USER RETURNS
   └─ Click "← Back" or navigate to #/graph
   └─ Returns to Concept Graph Builder
```

---

## File Structure

```
src/
├── pages/
│   ├── ConceptGraphBuilder.js  ← Page 1 (NEW)
│   ├── BookPage.js            ← Page 2 (existing)
│   ├── Settings.js            ← Settings (optional)
│   └── [removed: Home, Domain, PhraseExplorer]
├── components/
│   └── Header.js              ← Updated nav
├── main.js                    ← Updated routes
├── router.js                  ← (unchanged)
├── style.css                  ← Updated selectors
└── i18n.js                    ← (unchanged)

api/
├── routers/
│   └── phrase.py              ← Decomposition endpoints
├── app.py                     ← FastAPI app
└── services/                  ← (existing services)

scripts/
└── phrase_decomposer.py       ← Core logic

db/
└── cb_zinets.sqlite           ← Local database
```

---

## Routes

| Route | Page | Purpose |
|-------|------|---------|
| `#/` | ConceptGraphBuilder | Main builder page (default) |
| `#/graph` | ConceptGraphBuilder | Explicit builder route |
| `#/book?domain=...&focus=...` | BookPage | Concept book reader |
| `#/settings` | Settings | App settings (optional) |

---

## API Endpoints

### 1. Decompose Phrase
```
POST /api/phrase/decompose
```

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
  "applications": { ... },      // Tier 2
  "concepts": { ... },          // Tier 1
  "primitives": { ... }         // Tier 0
}
```

### 2. Get Character Content
```
GET /api/phrase/{phrase_id}/{node_id}/content
```

**Response:**
```json
{
  "node_id": "画",
  "character": "画",
  "pinyin": "huà",
  "definition_en": "to draw",
  "definition_cn": "绘画",
  "components": ["一", "凵", "田"],
  "cached_meaning": "..."
}
```

---

## Removed Features

| Feature | Was In | Reason |
|---------|--------|--------|
| Landing/Home | Formerly `/` | Direct to action (graph builder) |
| Domain Browser | Was on Home | Not needed - phrases are dynamic |
| Domain Explorer | Was separate | Merged into graph builder |
| About page | Was in nav | Optional - can be re-added |

---

## Why 2 Pages?

### Streamlined UX
- ✅ **No landing page overhead** — Users go straight to building
- ✅ **Clear purpose** — Two distinct tasks: build (page 1) → read (page 2)
- ✅ **Focused workflow** — No distraction, immediate action

### Content Flow
1. **Build phase** — User creates personalized domain via input
2. **Generate phase** — Select node and generate book
3. **Read phase** — Explore LLM content in depth

### Technical Benefits
- ✅ Simpler navigation
- ✅ Fewer page components to maintain
- ✅ Clearer state management
- ✅ Better mobile experience

---

## Configuration

### Entry Point
```javascript
// src/main.js
register('/', (params) => ConceptGraphBuilder(app, params))
```

Default route points directly to builder.

### Navigation
```html
<!-- Header: Only 概念图 and 设置 -->
<nav>
  <a href="#/graph">概念图</a>
  <a href="#/settings">设置</a>
</nav>
```

---

## Future Enhancements

- [ ] Phrase history (recent decompositions)
- [ ] Saved phrases (bookmarks)
- [ ] Custom phrase lists
- [ ] Spaced repetition quiz
- [ ] Social sharing (decomposition diagrams)
- [ ] Multi-language UI support
- [ ] Dark mode toggle
- [ ] Stroke order visualization

---

**Architecture Version**: 2.0 (2-Page Model)  
**Status**: Production Ready  
**Last Updated**: 2026-06-27
