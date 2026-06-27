# ZiNets ConceptBook — User Guide

## Why this app exists

Learning Chinese characters by rote memorisation is hard. There are 6,000+ commonly
used characters and no obvious structure to hold them together.

But there *is* structure. Chinese characters work like LEGO:

- A small set of **~422 elemental primitives** (the bricks) — including the 214
  KangXi radicals and a handful of other important pieces.
- A single rule — the **phono-semantic principle (形声字)** — governs over 80% of all
  characters: one brick gives the *meaning* (形), another gives the *sound* (声).

Learn ~200 bricks and this one rule, and thousands of unseen characters become
decodable on sight. That is the claim. `graph_lib.reducible()` machine-checks it:
every character in the graph must trace back to the primitive set.

**ZiNets ConceptBook** makes the LEGO structure navigable:

- The **concept graph** shows every character and its decomposition as an interactive
  network. Click any node to see what it is made of and what it makes.
- **Concept books** are on-demand lessons generated for any character — a structured
  explanation of its bricks, its meaning, its sound, and how to read unseen
  characters that share the same pieces.

---

## What this app is

ZiNets ConceptBook is an interactive learning tool built around a full character
decomposition graph. Here is what it gives you today and where it is heading:

### Today — desktop web-app

A local Vite application you run on your own machine. You can:

- **Navigate** the full Chinese character graph — every character and its bricks,
  rendered as a zoomable, clickable network.
- **Generate concept books on demand** — pick any character, choose a language and
  depth level (intro / core / college / research), and the app writes a structured
  lesson in under a minute.
- **Read and compare** — open books side-by-side across different models or levels
  to find the explanation that works best for you.
- **Export to PDF** — print any concept book for offline study or classroom use.

### Coming next — hosted portal

The same app deployed to GitHub Pages so no local install is needed. Pre-generated
books for the most common characters will be available immediately; on-demand
generation will route to a lightweight cloud API.

### Planned — mobile app

A mobile-first view integrated into the ZiNets portal. Tap any character node in
the interactive network and its concept book opens in a sidebar — the full LEGO
explanation, in your language, on your phone.

---

## Who this is for

- **Foreign language learners (L2)** — the largest audience. If you are studying
  Chinese as a second language, the LEGO approach gives you a systematic entry point
  that rote memorisation never provides. Instead of treating each character as an
  arbitrary symbol to memorise, you learn the ~200 most common bricks first and then
  decode thousands of new characters by recognising their pieces. Concept books are
  available in your own language, so you can read explanations in English, Spanish,
  French, Japanese, or any other supported language while studying Chinese.
- **Heritage learners** who grew up speaking Chinese but never learned to read or
  write systematically — the structural graph fills the gaps that conversational
  exposure leaves.
- **Classroom teachers** who need a free, printable, structurally grounded explanation
  of any character to hand to students.
- **Developers / researchers** building on the ZiNets portal who want to inspect the
  decomposition graph interactively.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| Python ≥ 3.11 in the `spl123` conda env | for the extractor and API |
| Node.js ≥ 18 + npm | for the Vite frontend |
| ZiNets SQLite database | at `~/projects/Proj-ZiNets/zinets_vis/dev_pg/backend/zinets_cache.sqlite` |
| SPL.py runtime | at `~/projects/digital-duck/SPL.py` — needed only for generating concept books |

---

## Setup

### Step 1 — Install frontend dependencies

```bash
cd ~/projects/digital-duck/cb_zinets
npm install
```

### Step 2 — Generate the character graph

Run the extractor to build `graph.yaml` from the ZiNets database.

**Recommended first run — HSK subset (~383 characters, fast to validate):**

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
python scripts/zinets_to_graph.py --set-id 300,100,30,10
```

**Full corpus run (~11,300 characters):**

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
python scripts/zinets_to_graph.py
```

The output is written to:
```
public/domains/chinese_characters/input/graph.yaml
```

### Step 3 — Generate the graph navigator

Convert `graph.yaml` into the interactive `graph.html` file:

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
python scripts/concept_graph.py \
  --domain public/domains/chinese_characters/input/graph.yaml \
  visualize --format html \
  --output public/domains/chinese_characters/output/graph.html
```

### Step 4 — Update the catalog stats

Get the current graph stats:

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
python scripts/concept_graph.py \
  --domain public/domains/chinese_characters/input/graph.yaml \
  stats
```

Then open `public/domains/catalog.json` and update:
- `nodes`, `edges`, `primitives`, `concepts` to match the stats output
- `"has_navigator": true` (you just generated `graph.html`)

### Step 5 — Start the app

**Frontend only (graph exploration, no book generation):**

```bash
cd ~/projects/digital-duck/cb_zinets
npm run dev
# Open http://localhost:5173/cb-zinets/
```

**Full stack (enables on-demand concept book generation):**

```bash
# Terminal 1 — backend
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
pip install -r requirements-api.txt
uvicorn api.app:app --reload --port 8000

# Terminal 2 — frontend
cd ~/projects/digital-duck/cb_zinets
npm run dev
```

---

## Validation

Before generating concept books, verify the graph is structurally sound.

### Quick stats check

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123
python scripts/concept_graph.py \
  --domain public/domains/chinese_characters/input/graph.yaml \
  stats
```

Look for:
- **Acyclic: True** — the graph has no dependency cycles
- **Reducible: True** — every character traces back to the primitive set

### Full pipeline validation (requires concept-book-press)

```bash
cd ~/projects/digital-duck/concept-book-press
python -B -m pipeline.cli validate \
  -i ~/projects/digital-duck/cb_zinets/public/domains/chinese_characters/input/graph.yaml
```

**Common issues and fixes:**

| Error | Cause | Fix |
|---|---|---|
| `composed_of` references a missing node | component not in active set | re-run without `--set-id`, or add the character manually to `graph.yaml` |
| Cycle detected | data inconsistency in `zn_zi_part` | inspect the cycle; patch `graph.yaml` to break it by removing the circular `composed_of` entry |
| Empty `defines` warnings | character has no description | acceptable — the SPL pipeline works with empty `defines`; fill in later |

---

## Using the app

### Exploring the concept graph

1. Open `http://localhost:5173/cb-zinets/`
2. Click **Explore Concept-Graph** on the Chinese Characters card.
3. The vis.js network loads. Nodes are colour-coded:
   - **Yellow rectangles** = primitives (the LEGO bricks, tier 0)
   - **Green ellipses** = concepts (composed characters, tier ≥ 1)
   - **Red rectangles** = applications (phrases — empty until Step 5 of the roadmap)
4. Click any node. The left sidebar shows the **learning path** — the ordered
   sequence of nodes you must understand to reach the clicked character.
5. The **tier** number tells you how many layers of composition separate the
   character from the primitive floor. 人 is tier 0; 休 (person + tree = rest) is
   tier 1; a character composed of two tier-1 characters is tier 2.

### Generating a concept book for a character

Requires the full stack (both terminals from Setup Step 5).

1. In the graph view, click the character you want to learn.
2. In the left sidebar, open **Generate Book**.
3. Select the character from the dropdown.
4. Choose a **level** — start with **intro** for a concise explanation.
5. Choose a **language** — English (`en`) or Chinese (`zh`).
6. Choose a **model** — `gemma4` (local, fast) or `sonnet` (Claude, higher quality).
7. Click **Generate**. A streaming log shows progress.
8. When done, the page reloads. Open **Concept Books → Concept** and select the
   character to read its book.

### What a concept book contains

A concept book for a character covers:

- **Prerequisites** — each brick in the learning path, explained from the ground up.
- **Composition rule** — whether the character uses semantic stacking (会意, meaning
  = combination of brick meanings) or the phono-semantic rule (形声, one brick for
  meaning + one brick for sound).
- **Memory hook** — a short visual story linking bricks to the full meaning.
- **Practice** — predict meanings of related characters that share the same bricks
  before looking them up.

### Comparing books across models or levels

1. Open any concept book.
2. Check **Compare** in the left sidebar.
3. Pane A and Pane B each have independent model / level / language selectors.
4. Click **Compare ▶** to generate an AI analysis of the differences in Pane C.

This is useful for evaluating quality across models before deciding which to use
for bulk generation.

---

## Generating books in bulk

Once you have validated the graph and generated a few books manually, use
`scripts/batch_generate.py` (from the concept-book toolchain) for bulk generation:

```bash
conda activate spl123
python ~/projects/digital-duck/concept-book/scripts/batch_generate.py \
  --domain chinese_characters \
  --level intro \
  --language en \
  --domains-dir ~/projects/digital-duck/cb_zinets/public/domains
```

This streams through every concept node and generates a book for each. Expect
several minutes for the HSK subset and several hours for the full 6,000+ corpus.

---

## Regenerating after a database update

When the ZiNets database changes (new characters, updated decompositions):

```bash
cd ~/projects/digital-duck/cb_zinets
conda activate spl123

# 1. Regenerate graph.yaml
python scripts/zinets_to_graph.py --set-id 300,100,30,10

# 2. Regenerate graph.html
python scripts/concept_graph.py \
  --domain public/domains/chinese_characters/input/graph.yaml \
  visualize --format html \
  --output public/domains/chinese_characters/output/graph.html

# 3. Update catalog.json stats manually

# 4. Re-generate concept books for changed characters (or run bulk generation)
```

Previously generated concept books are **not** automatically invalidated. If a
character's decomposition changed, re-generate its book manually via the UI.

---

## Configuration

Set these in a `.env` file at the repo root or export before starting the API:

| Variable | Default | Purpose |
|---|---|---|
| `CB_SPL_DIR` | `~/projects/digital-duck/SPL.py` | SPL.py root directory |
| `CB_PUBLIC_DOMAINS` | `./public/domains` | domain data root |
| `CB_LLM` | `claude_cli:claude-sonnet-4-6` | LLM adapter:model (changeable in Settings UI) |
| `CB_DEFAULT_MODEL` | `gemma4` | default model shown in Generate dropdown |

---

## Troubleshooting

**`graph.html` is blank or shows no nodes**
: The `graph.yaml` path may be wrong or the file is empty. Confirm
  `zinets_to_graph.py` completed and `graph.yaml` is non-empty, then re-run
  `concept_graph.py`.

**Frontend shows a blank page**
: Open the browser console. If `catalog.json` fails to load, confirm
  `public/domains/catalog.json` exists and is valid JSON.

**Generate button is greyed out**
: The backend is not running. Start
  `uvicorn api.app:app --reload --port 8000` in a separate terminal.

**`spl3: command not found`**
: The `spl123` conda environment is not active.
  Run `conda activate spl123` before starting the API.

**Concept books generated in English; I want Chinese**
: Select `中文` from the language picker in the header, then use Generate with
  language set to `zh`, or open a book already generated with `--language zh`.

**Character renders as a box (□) in the graph**
: The character is a non-standalone graphical component (a primitive that exists
  only as part of other characters, not as a Unicode codepoint your OS font
  covers). This is a known limitation — see the design doc §7.
