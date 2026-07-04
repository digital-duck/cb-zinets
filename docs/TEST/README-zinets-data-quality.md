# ZiNets data quality: whitespace in `zn_zi_part` decomposition columns

*Findings from 2026-07-04, discovered during the char-tools (stroke-order + pronounce
widget) backfill. The master data lives in the ZiNets app
(`~/projects/Proj-ZiNets/zinets_vis`); `db/cb_zinets.sqlite` here is a copy, so any
fix must also land upstream or it returns on the next export.*

## Status (2026-07-04)

- ✅ **cb_zinets fixed end-to-end**: `zn_zi_part` trimmed in the local SQLite copy,
  `cb_concepts` padded rows deduped/renamed, defensive `TRIM()` added to
  `scripts/phrase_decomposer.py` and `.strip()` to `api/routers/phrase.py`,
  padded canonical pages renamed or deduped (62 files), 637 HTML files' links
  patched, 90 symlinks recreated, catalogs cleaned (36 duplicate entries removed),
  and 18 domains' `graph.yaml` + `graph.html` normalized/regenerated (including
  node merges where both padded and clean IDs coexisted). Full audit passes.
- ⬜ **Upstream (zinets_vis master DB) still padded** — fix the 122 cells below via
  the app; until then, re-exports are safe here thanks to the defensive `TRIM()`.

## TL;DR

- The positional decomposition columns of **`zn_zi_part`** (`zi_up`, `zi_mid`,
  `zi_down`, `zi_left`, …) contain hand-entered values padded with stray ASCII
  spaces (U+0020): **122 cells across 116 parent characters** (full list below).
- `zn_zi.zi` itself is clean — zero padded rows.
- The padding is not cosmetic: it leaks into generated concept filenames **and
  silently truncates recursive decomposition**, because a padded part like `␣昏`
  never joins back to the clean `昏` row.

## Symptom that surfaced it

60 concept HTML files under `public/concepts/` have whitespace-padded names
(13 distinct concepts, each appearing in several `intro.{en,zh}/{gemma3,gemma4,sonnet}`
variants), e.g. `concept_艹 .html`, `concept_ 氐.html`:

| padded concept | padding |
|---|---|
| `丶␣` `人␣` `八␣` `去␣` `口␣` `囗␣` `宀␣` `尺␣` `已␣` `艹␣` | trailing space |
| `␣氐` `␣目` | leading space |
| `␣辶␣` | both sides |

These pages were skipped by both the References-row backfill and the char-tools
backfill, because the generator's `_is_single_cjk()` gate (correctly) rejects a
2–3 character string. Only 13 of the 84 distinct padded part values have become
files so far — the rest will leak in as more domains are generated, until the
data is fixed.

## Root cause

`zn_zi_part` stores one row per character with its components in positional
columns. Some cells were entered with leading/trailing spaces. Two code paths
read them without trimming:

1. **`scripts/phrase_decomposer.py`** (~lines 38–72) — the recursive CTE filters
   `WHERE zi_up != ''` etc. but never trims, so padded parts become graph node
   IDs → concept filenames.
2. **`api/routers/phrase.py:378`** — `[c for c in parts_row if c and c.strip()]`
   uses `.strip()` only to filter empties but returns the **untrimmed** value.

### The recursion break (worse than bad filenames)

The CTE joins `d.zi = parts.zi`. A padded part never matches its clean `zn_zi` /
`zn_zi_part` row, so it becomes a false leaf. Concrete example:

```
惛 → 忄 + ␣昏          ← stops here today
昏 → 氏 + 日            ← this level is silently lost
```

Every one of the 122 padded cells potentially cuts off a subtree like this.
Trimming will make existing decomposition graphs deeper/more correct, not just
cleaner-named.

## Full list of rows to fix (122 cells, 116 characters)

To fix manually in the zinets_vis app: look up the **character**, edit the
**column**, remove the space shown as `␣`.

| # | character | column | current value | fixed |
|---|---|---|---|---|
| 1 | 严 | zi_mid | `亚␣` | `亚` |
| 2 | 买 | zi_up | `乛␣` | `乛` |
| 3 | 他 | zi_mid | `␣也` | `也` |
| 4 | 低 | zi_mid | `␣氐` | `氐` |
| 5 | 兵 | zi_mid | `丘␣` | `丘` |
| 6 | 军 | zi_up | `冖␣` | `冖` |
| 7 | 击 | zi_up | `二␣` | `二` |
| 8 | 划 | zi_mid | `␣戈` | `戈` |
| 9 | 利 | zi_mid | `禾␣` | `禾` |
| 10 | 别 | zi_mid | `另␣` | `另` |
| 11 | 剔 | zi_mid | `易␣` | `易` |
| 12 | 劫 | zi_right | `␣力` | `力` |
| 13 | 劳 | zi_down | `␣力` | `力` |
| 14 | 劳 | zi_up | `艹␣` | `艹` |
| 15 | 危 | zi_up | `␣厃` | `厃` |
| 16 | 即 | zi_mid | `艮␣` | `艮` |
| 17 | 却 | zi_mid | `去␣` | `去` |
| 18 | 县 | zi_mid | `且␣` | `且` |
| 19 | 叮 | zi_mid | `␣丁` | `丁` |
| 20 | 君 | zi_down | `␣口` | `口` |
| 21 | 吴 | zi_up | `口␣` | `口` |
| 22 | 吵 | zi_mid | `␣少` | `少` |
| 23 | 呆 | zi_up | `口␣` | `口` |
| 24 | 员 | zi_up | `口␣` | `口` |
| 25 | 因 | zi_mid | `囗␣` | `囗` |
| 26 | 困 | zi_mid | `囗␣` | `囗` |
| 27 | 围 | zi_mid | `囗␣` | `囗` |
| 28 | 坚 | zi_right_up | `又␣` | `又` |
| 29 | 坝 | zi_right | `␣贝` | `贝` |
| 30 | 坟 | zi_right | `␣文` | `文` |
| 31 | 壳 | zi_up | `士␣` | `士` |
| 32 | 失 | zi_mid | `␣夫` | `夫` |
| 33 | 妈 | zi_mid | `␣马` | `马` |
| 34 | 字 | zi_up | `宀␣` | `宀` |
| 35 | 安 | zi_up | `宀␣` | `宀` |
| 36 | 寻 | zi_down | `␣寸` | `寸` |
| 37 | 导 | zi_down | `␣寸` | `寸` |
| 38 | 尘 | zi_up | `小␣` | `小` |
| 39 | 尽 | zi_mid | `尺␣` | `尺` |
| 40 | 层 | zi_up | `尸␣` | `尸` |
| 41 | 岁 | zi_down | `␣夕` | `夕` |
| 42 | 岔 | zi_up | `分␣` | `分` |
| 43 | 岗 | zi_down | `␣冈` | `冈` |
| 44 | 巡 | zi_left_down | `辶␣` | `辶` |
| 45 | 巩 | zi_right | `␣凡` | `凡` |
| 46 | 并 | zi_up | `丷␣` | `丷` |
| 47 | 庄 | zi_up | `广␣` | `广` |
| 48 | 庆 | zi_mid | `␣大` | `大` |
| 49 | 库 | zi_up | `广␣` | `广` |
| 50 | 异 | zi_up | `已␣` | `已` |
| 51 | 弄 | zi_up | `王␣` | `王` |
| 52 | 志 | zi_down | `␣心` | `心` |
| 53 | 惛 | zi_mid | `␣昏` | `昏` |
| 54 | 戏 | zi_right | `␣戈` | `戈` |
| 55 | 找 | zi_mid | `␣戈` | `戈` |
| 56 | 抄 | zi_mid | `␣少` | `少` |
| 57 | 抓 | zi_mid | `␣爪` | `爪` |
| 58 | 折 | zi_mid | `␣斤` | `斤` |
| 59 | 抛 | zi_right | `力␣` | `力` |
| 60 | 护 | zi_mid | `␣户` | `户` |
| 61 | 朵 | zi_up | `几␣` | `几` |
| 62 | 杆 | zi_mid | `␣干` | `干` |
| 63 | 杏 | zi_up | `木␣` | `木` |
| 64 | 束 | zi_mid_in | `␣口` | `口` |
| 65 | 比 | zi_right | `匕␣` | `匕` |
| 66 | 毕 | zi_up | `比␣` | `比` |
| 67 | 汁 | zi_mid | `␣十` | `十` |
| 68 | 求 | zi_up | `一␣` | `一` |
| 69 | 池 | zi_mid | `␣也` | `也` |
| 70 | 滕 | zi_down | `水␣` | `水` |
| 71 | 漦 | zi_mid | `␣厂` | `厂` |
| 72 | 灭 | zi_mid | `␣火` | `火` |
| 73 | 灭 | zi_up | `一␣` | `一` |
| 74 | 灰 | zi_mid | `␣火` | `火` |
| 75 | 灿 | zi_mid | `␣山` | `山` |
| 76 | 烈 | zi_mid | `列␣` | `列` |
| 77 | 烝 | zi_down | `␣灬` | `灬` |
| 78 | 熙 | zi_down | `␣灬` | `灬` |
| 79 | 犛 | zi_mid | `␣厂` | `厂` |
| 80 | 疗 | zi_left_up | `␣疒` | `疒` |
| 81 | 眞 | zi_mid | `␣目` | `目` |
| 82 | 眞 | zi_up | `匕␣` | `匕` |
| 83 | 眷 | zi_up | `丷␣` | `丷` |
| 84 | 矛 | zi_mid_out | `␣丿` | `丿` |
| 85 | 红 | zi_mid | `␣工` | `工` |
| 86 | 细 | zi_left | `纟␣` | `纟` |
| 87 | 肖 | zi_down | `␣月` | `月` |
| 88 | 背 | zi_down | `␣月` | `月` |
| 89 | 胤 | zi_down | `␣月` | `月` |
| 90 | 胥 | zi_down | `␣月` | `月` |
| 91 | 自 | zi_mid | `␣目` | `目` |
| 92 | 良 | zi_up | `丶␣` | `丶` |
| 93 | 芦 | zi_up | `艹␣` | `艹` |
| 94 | 芬 | zi_up | `艹␣` | `艹` |
| 95 | 花 | zi_up | `艹␣` | `艹` |
| 96 | 芹 | zi_up | `艹␣` | `艹` |
| 97 | 苍 | zi_up | `艹␣` | `艹` |
| 98 | 苏 | zi_mid | `␣办` | `办` |
| 99 | 薻 | zi_up | `␣艹` | `艹` |
| 100 | 虫 | zi_mid | `口␣` | `口` |
| 101 | 蚩 | zi_up | `山␣` | `山` |
| 102 | 蠜 | zi_left_up | `木␣` | `木` |
| 103 | 蠜 | zi_right_up | `木␣` | `木` |
| 104 | 褱 | zi_mid | `衣␣` | `衣` |
| 105 | 访 | zi_mid | `␣方` | `方` |
| 106 | 谷 | zi_mid | `人␣` | `人` |
| 107 | 谷 | zi_up | `八␣` | `八` |
| 108 | 贡 | zi_up | `工␣` | `工` |
| 109 | 边 | zi_left_down | `␣辶` | `辶` |
| 110 | 达 | zi_left_down | `辶␣` | `辶` |
| 111 | 迁 | zi_left_down | `␣辶` | `辶` |
| 112 | 运 | zi_left_down | `␣辶` | `辶` |
| 113 | 运 | zi_mid | `␣云` | `云` |
| 114 | 进 | zi_mid | `␣井` | `井` |
| 115 | 远 | zi_left_down | `␣辶␣` | `辶` |
| 116 | 违 | zi_left_down | `辶␣` | `辶` |
| 117 | 连 | zi_left_down | `辶␣` | `辶` |
| 118 | 迟 | zi_mid | `␣尺` | `尺` |
| 119 | 间 | zi_mid | `门␣` | `门` |
| 120 | 阳 | zi_mid | `␣日` | `日` |
| 121 | 阵 | zi_mid | `␣车` | `车` |
| 122 | 麦 | zi_down | `␣夂` | `夂` |

Characters with **two** padded cells (edit both when you open them in the app):
劳, 灭, 眞, 蠜, 谷, 运. Highest-frequency padded parts: `艹␣` (6×), `辶` variants
(9× across 边达迁运远违连巡), `␣月` (4×), `口␣`/`␣口` (6×), `囗␣` (3×), `␣戈` (3×).

### One-shot SQL alternative (if manual editing is too tedious)

```sql
UPDATE zn_zi_part SET
  zi_left_up    = trim(zi_left_up),
  zi_left       = trim(zi_left),
  zi_left_down  = trim(zi_left_down),
  zi_up         = trim(zi_up),
  zi_mid        = trim(zi_mid),
  zi_down       = trim(zi_down),
  zi_right_up   = trim(zi_right_up),
  zi_right      = trim(zi_right),
  zi_right_down = trim(zi_right_down),
  zi_mid_out    = trim(zi_mid_out),
  zi_mid_in     = trim(zi_mid_in);
```

### Re-audit query (should return 0 after the fix)

```sql
SELECT count(*) FROM (
  SELECT zi_left_up AS p FROM zn_zi_part UNION ALL SELECT zi_left FROM zn_zi_part UNION ALL
  SELECT zi_left_down FROM zn_zi_part UNION ALL SELECT zi_up FROM zn_zi_part UNION ALL
  SELECT zi_mid FROM zn_zi_part UNION ALL SELECT zi_down FROM zn_zi_part UNION ALL
  SELECT zi_right_up FROM zn_zi_part UNION ALL SELECT zi_right FROM zn_zi_part UNION ALL
  SELECT zi_right_down FROM zn_zi_part UNION ALL SELECT zi_mid_out FROM zn_zi_part UNION ALL
  SELECT zi_mid_in FROM zn_zi_part
) WHERE p IS NOT NULL AND p != '' AND p != trim(p);
```

## Remediation plan

1. ⬜ **Fix upstream** (zinets_vis app / its master DB) — this repo's SQLite is
   a copy; fixing only here regresses on the next export. Use the 122-row table
   above, or the one-shot `UPDATE`, then the re-audit query.
2. ✅ **One-time `UPDATE … trim(…)`** on `db/cb_zinets.sqlite`, plus `cb_concepts`
   cleanup (8 padded rows deleted where a clean twin existed, 2 renamed).
3. ✅ **Defensive trim in code** so future imports can't regress:
   - `scripts/phrase_decomposer.py` CTE: each part column wrapped in `TRIM(...)`.
   - `api/routers/phrase.py`: components now return `c.strip()`.
   Verified: `decompose_character('惛')` now reaches 氏/日 at depth 2.
4. ✅ **Generated files fixed** (rename/patch rather than regenerate — the old
   domains use `phrase_`-prefixed application nodes that the current generator
   no longer emits, so regeneration would have broken existing books):
   - 62 padded canonical pages: 46 deleted (clean twin existed), 16 renamed with
     title/h1/TOC patched + References row and char-tools widget added.
   - 637 HTML files' `concept_…` links and TOC labels patched; 90 domain-side
     symlinks recreated with clean names (18 dropped as duplicates).
   - `catalog.json` + 20 per-domain catalogs: names/labels/file paths trimmed,
     36 duplicate entries removed.
   - 18 domains' `graph.yaml` normalized (padded/clean node collisions merged in
     前因后果, 呆若木鸡, 废寝忘食, 目瞪口呆) and `graph.html` regenerated from the
     fixed yaml via `scripts/concept_graph._to_html`.

Note: existing books were built from the old (truncated) decompositions; domains
regenerated in the future will automatically pick up the recovered subtrees
(e.g. 惛 → 昏 → 氏日).

## Verification checklist (spot-check samples per fix category)

*Added 2026-07-04 for manual review. Every path below was verified to exist (or be
gone, for deletions) right after the fix ran. Check off as you confirm.*

### 1. Canonical pages — 16 renamed / 46 deleted

Renamed (padded → clean; expect: clean h1 `🌱 去`, stroke-order widget + 🔊 in the
title line, References row at the bottom, no stray space in `<title>`):

- [ ] `public/concepts/intro.zh/gemma3/concept_去.html` (was `concept_去␣.html`)
- [ ] `public/concepts/intro.zh/gemma3/concept_氐.html` (was `concept_␣氐.html`)
- [ ] `public/concepts/intro.zh/gemma3/concept_尺.html`
- [ ] `public/concepts/intro.en/gemma3/concept_已.html`
- [ ] `public/concepts/intro.en/sonnet/concept_去.html`

Deleted (padded twin removed because a clean file already existed; expect: only the
clean file remains in the directory):

- [ ] `public/concepts/intro.en/gemma3/` — `concept_␣氐.html` gone, `concept_氐.html` present
- [ ] `public/concepts/intro.en/gemma3/` — `concept_口␣.html` gone, `concept_口.html` present
- [ ] `public/concepts/intro.zh/gemma3/` — `concept_␣目.html` gone, `concept_目.html` present
- [ ] `public/concepts/intro.en/gemma4/` — `concept_艹␣.html` gone, `concept_艹.html` present
- [ ] `public/concepts/intro.zh/sonnet/` — `concept_␣辶␣.html` gone, `concept_辶.html` present

Quick command: `ls public/concepts/intro.en/gemma3/ | grep -E '氐|口|艹'` — no
filenames with spaces.

### 2. HTML link/label patches — 637 files

Expect: sidebar TOC links point at clean names (`href="concept_去.html"`), no
`concept_去␣.html`-style hrefs anywhere, TOC label text clean:

- [ ] `public/concepts/intro.zh/gemma3/concept_乱.html` (links 去)
- [ ] `public/concepts/intro.zh/gemma3/concept_却.html` (links 去)
- [ ] `public/concepts/intro.zh/gemma3/concept_乚.html` (links 去)
- [ ] `public/concepts/intro.zh/gemma3/concept_phrase_手忙脚乱.html` (links 去)
- [ ] `public/concepts/intro.zh/sonnet/concept_phrase_低三下四.html` (links 氐)
- [ ] `public/concepts/intro.zh/sonnet/concept_phrase_眼高手低.html` (links 氐)
- [ ] `public/concepts/intro.zh/sonnet/concept_phrase_井底之蛙.html` (links 口)
- [ ] `public/concepts/intro.en/gemma3/concept_phrase_呆若木鸡.html` (links 口/艹)
- [ ] `public/concepts/intro.en/gemma3/concept_phrase_水落石出.html` (links 艹)
- [ ] `public/concepts/intro.en/gemma3/concept_phrase_卧虎藏龙.html` (links 艹)

Quick command: `grep -rl 'concept_去 .html\|concept_ 氐.html' public/` — empty.

### 3. Symlinks — 72 recreated clean / 18 dropped as duplicates

Expect: symlink exists under the clean name, resolves to a clean canonical (open in
browser via the domain page — widget and References row show up):

- [ ] `public/domains/手忙脚乱/output/intro.zh/gemma3/html/concept_去.html`
- [ ] `public/domains/前功尽弃/output/intro.zh/gemma3/html/concept_尺.html`
- [ ] `public/domains/日新月异/output/intro.zh/gemma3/html/concept_已.html`
- [ ] `public/domains/低三下四/output/intro.zh/gemma3/html/concept_氐.html`
- [ ] `public/domains/眼高手低/output/intro.zh/gemma3/html/concept_氐.html`
- [ ] `public/domains/春暖花开/output/intro.zh/gemma3/html/concept_艹.html`
- [ ] `public/domains/登高望远/output/intro.zh/gemma3/html/concept_辶.html`
- [ ] `public/domains/一路平安/output/intro.zh/gemma3/html/concept_宀.html`
- [ ] `public/domains/水火不容/output/intro.zh/gemma3/html/concept_八.html`
- [ ] `public/domains/目瞪口呆/output/intro.zh/gemma3/html/concept_口.html`

Quick command: `find public/domains -name 'concept_*.html' -xtype l` (broken links) — empty.

### 4. Catalogs — catalog.json + 20 per-domain files, 36 entries deduped

Expect: `generated_concepts[].name/label` have no spaces; `file` paths use clean
names; no duplicate (name, model) pairs:

- [ ] catalog.json → `手忙脚乱` has concept `去` (was `去␣`)
- [ ] catalog.json → `前功尽弃` has concept `尺`
- [ ] catalog.json → `日新月异` has concept `已`
- [ ] catalog.json → `低三下四` has concept `氐`, file `…/concept_氐.html`
- [ ] catalog.json → `眼高手低` has concept `氐`
- [ ] catalog.json → `春暖花开` has concept `艹`
- [ ] catalog.json → `登高望远` has concept `辶`
- [ ] catalog.json → `水火不容` has concepts `人` and `八`
- [ ] catalog.json → `高傲自大` has concept `目`
- [ ] `public/domains/catalog/呆若木鸡.json` — exactly one `口` entry per model (was 口 + 口␣)

Quick command: `python3 -c "import json;[print(c['name']) for d in json.load(open('public/domains/catalog.json')) for c in d.get('generated_concepts',[]) if c['name']!=c['name'].strip()]"` — no output.

### 5. graph.yaml normalized + graph.html regenerated — 18 domains

Merge domains (had BOTH padded and clean IDs; expect: single merged node, yaml
parses, graph renders in browser with no duplicate/space-padded nodes):

- [ ] `public/domains/前因后果/` (merged 囗)
- [ ] `public/domains/呆若木鸡/` (merged 口)
- [ ] `public/domains/废寝忘食/` (merged 丶)
- [ ] `public/domains/目瞪口呆/` (merged 口)

Simple-rename domains (expect: clean node IDs, graph renders):

- [ ] `public/domains/低三下四/` (氐)
- [ ] `public/domains/手忙脚乱/` (去)
- [ ] `public/domains/登高望远/` (辶)
- [ ] `public/domains/眼高手低/` (氐)
- [ ] `public/domains/水火不容/` (人, 八)
- [ ] `public/domains/春暖花开/` (艹)

Quick command: `grep -l "' \|^  ' " public/domains/*/input/graph.yaml` — empty; and
open `public/domains/呆若木鸡/output/graph.html` — one 口 node, graph loads without
vis.js duplicate-id errors.
