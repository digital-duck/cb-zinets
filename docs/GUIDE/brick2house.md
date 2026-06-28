# Phrase Explorer: "From Bricks to House" Testing Guide

A comprehensive guide to testing the Phrase Explorer application — a Chinese learning tool that decomposes idiomatic phrases into 3-tier concept graphs.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Setup & Installation](#setup--installation)
3. [Test Scenarios](#test-scenarios)
4. [API Testing](#api-testing)
5. [Frontend Testing](#frontend-testing)
6. [User Experience Testing](#user-experience-testing)
7. [Edge Cases & Error Handling](#edge-cases--error-handling)
8. [Performance Testing](#performance-testing)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 30-Second Setup
```bash
# Terminal 1: API Server
cd /home/papagame/projects/digital-duck/cb_zinets
python -m uvicorn api.app:app --reload --port 8000

# Terminal 2: Frontend (in another window)
npm run dev

# Browser
http://localhost:5173/#/phrase
```

### Try These Phrases
- 画蛇添足 (over-elaboration)
- 守株待兔 (waiting for a windfall)
- 卧虎藏龙 (hidden talents)

---

## Setup & Installation

### Prerequisites
```bash
# Python 3.8+
python3 --version

# Node.js 16+
node --version
npm --version

# SQLite (usually built-in)
sqlite3 --version
```

### Step 1: Verify Database
```bash
ls -lh /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite
# Should show ~3.5M file

# Test database connection
sqlite3 /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite "SELECT COUNT(*) FROM zn_zi;"
# Should return a number > 1000
```

### Step 2: Install Python Dependencies
```bash
cd /home/papagame/projects/digital-duck/cb_zinets
pip install fastapi uvicorn pydantic pyyaml

# Verify installations
python3 -c "import fastapi, uvicorn, pydantic; print('✅ All dependencies installed')"
```

### Step 3: Verify Script Imports
```bash
cd /home/papagame/projects/digital-duck/cb_zinets
python3 -c "from scripts.phrase_decomposer import build_phrase_graph; print('✅ Decomposer module loads')"
python3 -c "from api.routers.phrase import router; print('✅ API router loads')"
```

### Step 4: Start Services
```bash
# Terminal 1: API Server
cd /home/papagame/projects/digital-duck/cb_zinets
python -m uvicorn api.app:app --reload --port 8000
# Expected output: "Uvicorn running on http://0.0.0.0:8000"

# Terminal 2: Frontend Dev Server
cd /home/papagame/projects/digital-duck/cb_zinets
npm run dev
# Expected output: "Local: http://localhost:5173"
```

### Step 5: Verify Running Services
```bash
# Test API health
curl http://localhost:8000/api/domains
# Should return JSON

# Test frontend
curl http://localhost:5173
# Should return HTML
```

---

## Test Scenarios

### Scenario 1: Basic Phrase Decomposition ✅

**Objective**: Verify that a phrase is correctly decomposed into 3 tiers

**Test Case**: `画蛇添足`

**Steps**:
1. Open http://localhost:5173/#/phrase
2. Click input field
3. Type: `画蛇添足`
4. Click "分解" button

**Expected Results**:
- ✅ Graph appears with 3 tiers
- ✅ Tier 2 (Applications): 1 node showing "画蛇添足"
- ✅ Tier 1 (Concepts): 4 nodes (画, 蛇, 添, 足) + components
- ✅ Tier 0 (Primitives): 20+ nodes showing basic elements
- ✅ No errors in browser console

**Verification**:
```javascript
// In browser console
document.querySelectorAll('.cb-node--tier2').length  // Should be 1
document.querySelectorAll('.cb-node--tier1').length  // Should be > 4
document.querySelectorAll('.cb-node--tier0').length  // Should be 20+
```

---

### Scenario 2: Multiple Phrases ✅

**Objective**: Verify handling of multiple phrases

**Test Case**: `画蛇添足，守株待兔`

**Steps**:
1. Clear input field
2. Type: `画蛇添足，守株待兔`
3. Click "分解"

**Expected Results**:
- ✅ Only the full string is treated as one phrase
- ✅ Punctuation is handled correctly
- ✅ Result shows all 8 unique characters (画, 蛇, 添, 足, 守, 株, 待, 兔)
- ✅ Graph combines decompositions

**Verification**:
```javascript
// Check Tier 1 count
document.querySelectorAll('.cb-node--tier1').length  // Should include both phrases' characters
```

---

### Scenario 3: Node Details Display ✅

**Objective**: Verify that clicking a node shows correct information

**Test Case**: Click on "画" node in graph

**Steps**:
1. From "画蛇添足" decomposition, click "画" node
2. Observe sidebar

**Expected Results**:
- ✅ Node is highlighted (blue background)
- ✅ Sidebar shows:
  - Character: 画
  - Pinyin: huà
  - Definition(s): "to draw; to paint"
  - Components: one or more (shown as tags)
- ✅ "📖 在概念书中查看" button is visible

**Verification**:
```javascript
// Check selected state
document.querySelector('.cb-node.selected')  // Should show selected node
document.querySelector('.cb-node-detail h3').textContent  // Should show character
```

---

### Scenario 4: Link to Concept Book ✅

**Objective**: Verify integration with ConceptBook

**Test Case**: Click "📖 在概念书中查看" button

**Steps**:
1. Decompose a phrase (e.g., "画蛇添足")
2. Click on a character node (e.g., "画")
3. Click "📖 在概念书中查看" button

**Expected Results**:
- ✅ Navigation to ConceptBook page occurs
- ✅ URL changes to `#/book?domain=chinese_characters&focus=画`
- ✅ Character is highlighted/focused in concept book
- ✅ No errors

---

### Scenario 5: Example Phrase Tags ✅

**Objective**: Verify quick-access phrase examples

**Test Case**: Click example tag

**Steps**:
1. On phrase explorer main page, see example tags below input
2. Click "守株待兔" tag

**Expected Results**:
- ✅ Input field is populated with "守株待兔"
- ✅ Decomposition occurs automatically
- ✅ Graph appears without additional clicks

---

### Scenario 6: Reset Button ✅

**Objective**: Verify reset functionality

**Test Case**: Click "重新开始"

**Steps**:
1. Decompose a phrase
2. Click "重新开始" button

**Expected Results**:
- ✅ Graph section is hidden
- ✅ Input section reappears
- ✅ Input field is cleared (or retains previous value)
- ✅ Focus returns to input field

---

## API Testing

### Test 1: Decompose Endpoint

**Endpoint**: `POST /api/phrase/decompose`

**Test Command**:
```bash
curl -X POST http://localhost:8000/api/phrase/decompose \
  -H "Content-Type: application/json" \
  -d '{"phrase": "画蛇添足", "max_depth": 10}' \
  | python -m json.tool
```

**Expected Response**:
```json
{
  "phrase": "画蛇添足",
  "phrase_id": "phrase_画蛇添足",
  "applications": {
    "phrase_画蛇添足": {
      "text": "画蛇添足",
      "characters": ["画", "蛇", "添", "足"],
      "defines": "",
      "tier": 2
    }
  },
  "concepts": {
    "画": {
      "symbol": "huà",
      "defines": "to draw; to paint",
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

**Checks**:
- ✅ Status code: 200
- ✅ Response is valid JSON
- ✅ All three tiers present
- ✅ Tier 2 contains 1 application
- ✅ Tier 1 contains phrase characters
- ✅ Tier 0 contains primitives
- ✅ No null/undefined values

---

### Test 2: Character Details Endpoint

**Endpoint**: `GET /api/phrase/{phrase_id}/{node_id}/content`

**Test Command**:
```bash
curl http://localhost:8000/api/phrase/phrase_画蛇添足/画/content \
  | python -m json.tool
```

**Expected Response**:
```json
{
  "node_id": "画",
  "character": "画",
  "pinyin": "huà",
  "label": "to draw",
  "definition_en": "to draw; picture",
  "definition_cn": "绘画",
  "components": ["一", "凵", "田"],
  "cached_meaning": "..."
}
```

**Checks**:
- ✅ Status code: 200
- ✅ All fields present
- ✅ Pinyin is correctly formatted
- ✅ Components are non-empty list
- ✅ No HTML in definitions

---

### Test 3: Error Handling - Empty Phrase

**Test Command**:
```bash
curl -X POST http://localhost:8000/api/phrase/decompose \
  -H "Content-Type: application/json" \
  -d '{"phrase": "", "max_depth": 10}'
```

**Expected Response**:
- ✅ Status code: 400
- ✅ Error message: "Phrase cannot be empty"

---

### Test 4: Error Handling - Invalid JSON

**Test Command**:
```bash
curl -X POST http://localhost:8000/api/phrase/decompose \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected Response**:
- ✅ Status code: 422
- ✅ Validation error message

---

### Test 5: Performance - Large max_depth

**Test Command**:
```bash
time curl -X POST http://localhost:8000/api/phrase/decompose \
  -H "Content-Type: application/json" \
  -d '{"phrase": "画蛇添足", "max_depth": 20}'
```

**Expected Results**:
- ✅ Response time < 500ms
- ✅ No timeout errors
- ✅ Result is correct (deeper than necessary but valid)

---

## Frontend Testing

### Test 1: Page Load

**Steps**:
1. Open http://localhost:5173/#/phrase
2. Wait for page to fully load

**Expected**:
- ✅ No console errors
- ✅ Header visible with "短语学习" link
- ✅ Input section visible
- ✅ Example phrases visible
- ✅ "分解" button enabled
- ✅ Layout is responsive

---

### Test 2: Keyboard Navigation

**Steps**:
1. Open phrase explorer
2. Type: `卧虎藏龙`
3. Press Enter (instead of clicking button)

**Expected**:
- ✅ Decomposition occurs same as button click
- ✅ Graph appears

---

### Test 3: Input Validation

**Steps**:
1. Leave input field empty
2. Click "分解"

**Expected**:
- ✅ Alert appears: "请输入短语或成语"
- ✅ No API call is made
- ✅ Graph section doesn't appear

---

### Test 4: Graph Scrolling

**Test Case**: Large phrase with many nodes

**Steps**:
1. Decompose a phrase that produces 50+ nodes
2. Try scrolling within the graph area

**Expected**:
- ✅ Graph area has scrollbar
- ✅ Scrolling smooth and responsive
- ✅ All nodes accessible

---

### Test 5: Sidebar Scrolling

**Test Case**: Character with many components

**Steps**:
1. Decompose a phrase
2. Click on character with many components
3. Try scrolling sidebar

**Expected**:
- ✅ Sidebar has scrollbar if content overflows
- ✅ Content is readable
- ✅ Button stays accessible

---

### Test 6: Mobile Responsiveness

**Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Select various device sizes (iPhone, iPad, etc.)
4. Navigate through all features

**Expected - iPhone (375px)**:
- ✅ Input field spans full width
- ✅ Button wraps to next line or shrinks appropriately
- ✅ Graph and sidebar stack vertically
- ✅ All content readable without scrolling sideways

**Expected - iPad (768px)**:
- ✅ Layout adjusts to tablet size
- ✅ Two-column layout if space allows

---

## User Experience Testing

### Test 1: First Time User

**Scenario**: New user coming to the app

**Steps**:
1. Open http://localhost:5173/#/phrase
2. Read instructions (if any)
3. Click example phrase
4. Explore graph
5. Click node
6. Read sidebar

**Questions to Answer**:
- ✅ Is it immediately obvious what to do?
- ✅ Are the example phrases helpful?
- ✅ Is the graph visualization clear?
- ✅ Can you understand the 3-tier structure?
- ✅ Are the definitions helpful?
- ✅ Would you want to learn more?

---

### Test 2: Learning Path

**Scenario**: User learning from decomposition

**Steps**:
1. Enter "开门见山"
2. Understand why: 开 (open) + 门 (door) + 见 (see) + 山 (mountain) = straight to the point
3. Click "山" (mountain)
4. See its components (山 is a primitive)
5. Click "开" (open)
6. See its components and definition

**Verification**:
- ✅ User can trace meaning from primitives to phrase
- ✅ Structure reinforces understanding
- ✅ Learning feels natural and intuitive

---

### Test 3: Repeated Use

**Scenario**: User trying multiple phrases

**Steps**:
1. Decompose "画蛇添足"
2. Click "重新开始"
3. Click example "守株待兔"
4. Click "重新开始"
5. Type custom phrase "临危不惧"

**Verification**:
- ✅ Reset works reliably
- ✅ No lag or performance issues
- ✅ Consistent behavior

---

## Edge Cases & Error Handling

### Test 1: Single Character Input

**Input**: `木`

**Expected**:
- ✅ Tier 1 contains just "木"
- ✅ Tier 0 shows that 木 is primitive (no further decomposition)
- ✅ No error

---

### Test 2: Non-Chinese Characters

**Input**: `hello`

**Expected**:
- ✅ No characters extracted
- ✅ Empty graph or appropriate message
- ✅ No crash

---

### Test 3: Mixed Chinese and English

**Input**: `我爱ABC中文`

**Expected**:
- ✅ Only Chinese characters processed: 我, 爱, 中, 文
- ✅ English characters ignored
- ✅ Graph shows Chinese decomposition

---

### Test 4: Punctuation Only

**Input**: `，、；：！？`

**Expected**:
- ✅ No characters extracted
- ✅ Alert: "请输入短语或成语"
- ✅ No graph displayed

---

### Test 5: Repeated Characters

**Input**: `哈哈哈哈哈`

**Expected**:
- ✅ Graph shows "哈" once (deduplicated)
- ✅ Tier 1 has 1 concept node
- ✅ No duplication

---

### Test 6: Very Long Input

**Input**: `我们应该学习中文以便更好地理解中国文化和历史`

**Expected**:
- ✅ All unique characters are decomposed
- ✅ Graph is large but still navigable
- ✅ No timeout
- ✅ Response time < 1 second

---

### Test 7: Character Not in Database

**Input**: `㐀` (rare/obscure character)

**Expected**:
- ✅ Graceful handling (skip or show error)
- ✅ No crash
- ✅ Other characters still decompose

---

## Performance Testing

### Test 1: Response Time

**Metric**: API response time for decomposition

**Test**:
```bash
# Measure response time
time curl -X POST http://localhost:8000/api/phrase/decompose \
  -H "Content-Type: application/json" \
  -d '{"phrase": "画蛇添足", "max_depth": 10}' > /dev/null
```

**Target**:
- ✅ < 200ms for typical phrase (4 characters)
- ✅ < 500ms for long phrase (10+ characters)

---

### Test 2: UI Render Time

**Metric**: Time from API response to visible graph

**Test**:
```javascript
// In browser console
const start = performance.now()
// [decompose phrase]
// Wait for graph to render
const end = performance.now()
console.log(`Render time: ${end - start}ms`)
```

**Target**:
- ✅ < 100ms for UI render

---

### Test 3: Memory Usage

**Steps**:
1. Open DevTools → Memory tab
2. Take heap snapshot (baseline)
3. Decompose 10 different phrases
4. Take another heap snapshot

**Expected**:
- ✅ No memory leaks
- ✅ Memory stable after garbage collection
- ✅ No significant growth

---

### Test 4: Network Requests

**Steps**:
1. Open DevTools → Network tab
2. Decompose phrase

**Expected**:
- ✅ Exactly 1 POST request to `/api/phrase/decompose`
- ✅ Payload < 1KB
- ✅ Response < 20KB
- ✅ No unnecessary requests

---

## Troubleshooting

### Issue: "Cannot find module 'phrase_decomposer'"

**Cause**: Python path not set correctly

**Solution**:
```bash
cd /home/papagame/projects/digital-duck/cb_zinets
python -m uvicorn api.app:app --reload --port 8000
# Must run from project root
```

---

### Issue: "Database file not found"

**Cause**: Wrong database path

**Solution**:
```bash
# Verify database exists
ls -lh /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite

# Check path in phrase_decomposer.py
grep "DB_PATH" scripts/phrase_decomposer.py
```

---

### Issue: CORS error in browser console

**Cause**: Frontend and API on different ports

**Verify**:
- ✅ API running on http://localhost:8000
- ✅ Frontend running on http://localhost:5173
- ✅ Both URLs correct in code

---

### Issue: Graph not displaying

**Cause**: API might be returning error

**Diagnose**:
```javascript
// In browser console, check network response
fetch('/api/phrase/decompose', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({phrase: '画蛇添足', max_depth: 10})
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e))
```

---

### Issue: Slow response times

**Cause**: Database queries taking too long

**Check**:
```bash
# Test database responsiveness
sqlite3 /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite \
  "SELECT COUNT(*) FROM zn_zi;" 
# Should be instant

# Check if indices exist
sqlite3 /home/papagame/projects/digital-duck/cb_zinets/db/cb_zinets.sqlite \
  "SELECT name FROM sqlite_master WHERE type='index';"
```

---

## Sign-Off Checklist

Use this checklist when testing is complete:

```
Core Functionality
  ☐ Basic decomposition works (画蛇添足)
  ☐ Multiple phrases handled correctly
  ☐ Node details display correctly
  ☐ Reset button works
  ☐ Link to concept book works

API
  ☐ POST /phrase/decompose returns valid JSON
  ☐ GET /phrase/{id}/{node}/content returns correct data
  ☐ Error handling for empty phrases
  ☐ Response time < 200ms

Frontend
  ☐ Page loads without errors
  ☐ Keyboard navigation works
  ☐ Mobile responsive
  ☐ Graph scrolling smooth
  ☐ No console errors

UX
  ☐ First-time user understands flow
  ☐ Example phrases helpful
  ☐ 3-tier structure is clear
  ☐ Learning is intuitive

Performance
  ☐ API response < 200ms
  ☐ UI renders < 100ms
  ☐ No memory leaks
  ☐ Network efficient

Edge Cases
  ☐ Single character input
  ☐ Mixed Chinese/English
  ☐ Very long input
  ☐ Special characters/punctuation
  ☐ Repeated characters deduplicated

Overall
  ☐ All tests passed
  ☐ No critical bugs
  ☐ Ready for user testing
```

---

## Test Report Template

```markdown
# Phrase Explorer Test Report

**Date**: [DATE]
**Tester**: [NAME]
**Environment**: [OS, Python version, Node version]

## Summary
- Tests Passed: X/Y
- Critical Issues: X
- Minor Issues: X
- Status: [READY FOR RELEASE / NEEDS FIXES]

## Key Findings
- [Finding 1]
- [Finding 2]

## Issues Found
| Priority | Issue | Reproduction | Status |
|----------|-------|--------------|--------|
| Critical | ... | ... | OPEN |
| Medium   | ... | ... | OPEN |
| Low      | ... | ... | OPEN |

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Tester Sign-Off
- Date: [DATE]
- Name: [NAME]
- Status: [APPROVED / NEEDS REVISION]
```

---

**Testing Guide Created**: 2026-06-27  
**Status**: Ready for QA testing  
**Questions?**: See PHRASE_EXPLORER_GUIDE.md or QUICKSTART.md
