# Learn Chinese Through Idioms — YouTube Series & cb_zinets Demo Plan

**Channel name (EN):** *Hanzi Bricks*
**Channel name (CN):** 五湖四海学汉字

**Series subtitle:** *Learn Chinese from Stories in History*

**Taglines:**
- 五湖四海学汉字 — *People from every corner of the world, learning Chinese characters*
- 五湖四海学中文 — *Learning Chinese, from every corner of the world* (Claude's original, kept for its geographic poetry)

**Series intro line (2026-07-02, user's joke — use as the cold open for the pilot episode and/or recurring intro bumper):**

> In English, there are 4-letter words. In Chinese, there are 4-character idioms. But these carry no negative connotation — instead, each one tells a meaningful story from daily life, or hides its meaning in plain sight.

---

## Why Metaphor, Why Pictographs (2026-07-02)

The intro line above is not just a joke — it names the mechanic the whole series runs on, and the reason a student would otherwise be puzzled by an idiom like **对牛弹琴** ("play the lute to a cow"): why would a cow and a lute be paired at all? The answer is that the pairing is never arbitrary. It is compression, working at every layer of the language at once:

- **Pictograph → character**: a vivid scene (a hand reaching into a river, in the bronze form of 汉 documented below) compresses into a single stroke-pattern
- **Character → idiom**: several characters compress into a four-character scene (a cow, indifferent, beside a lute) that stands for a whole situation (wasted effort on someone who can't appreciate it)
- **Idiom → insight**: the surface story is rarely the destination — it is a mnemonic *vehicle* for something deeper, the same way a 偈 (Buddhist verse stanza) uses rhyme and meter not for decoration but so the teaching survives in memory long after the words that carried it are forgotten

This is the same compression the cb_zinets concept graph makes visible structurally — a character node radiating out to the idioms built from it is the network form of the same thing a 偈 does temporally: pack meaning into a small, rhythmic, memorable unit so it propagates.

**Production implication:** every episode's "cold open" (see the per-episode template below) should show the literal, surface-level scene *first, without explanation* — let it be strange or funny on its own — before revealing that the scene is a vehicle for something else. That reveal, not the vocabulary, is the actual payoff of the episode.

---

## 偈 and the Rhythm of Idioms (2026-07-02)

A 偈 (jì, from Sanskrit *gāthā*) is a Buddhist verse stanza — lines of fixed, matched length (most often four or five characters, occasionally seven), usually arranged in pairs or quatrains with parallel grammatical structure and tonal balance. It exists in that form for a practical reason, not an aesthetic one: monks transmitted teachings orally for centuries before they were written down, and a fixed meter with internal parallelism is dramatically easier to memorize, chant, and pass on intact than free prose. The rhythm is a memory container; the teaching is the cargo.

The four-character idiom (成语) runs on the identical mechanic, just compressed one step further — from a multi-line stanza down to a single fixed-length unit:

- **Fixed length as scaffolding** — nearly every idiom in `phrases.txt` is exactly four characters (承前启后, 手忙脚乱, 各有千秋…), the same discipline a 偈's matched line-length imposes. The fixed count is not decorative; it is what makes the phrase chantable and instantly recognizable as *a unit* rather than an ordinary sentence.
- **Internal parallelism (对仗)** — many idioms split 2+2 into a mirrored pair, echoing a 偈's paired lines: 承**上**启**下** (continue what's above, open what's below), 前**仆**后**继** (those in front fall, those behind carry on), water/animal idioms like 鸡**飞**狗**跳**, 龙**争**虎**斗**-type pairings. The parallel structure lets the second half rhyme semantically with the first even without end-rhyme.
- **Tonal balance** — classical Chinese prosody alternates level (平) and oblique (仄) tones across a line for a reason: the alternation is what makes a phrase pleasant to chant rather than recite. Many idioms preserve this alternation across their four syllables, a residue of the same prosodic instinct that shaped 偈 and 诗 (shi poetry) alike.
- **Compression enables propagation** — a 偈 survives centuries of oral transmission because its rhythm resists corruption; a 成语 survives millennia the same way, jumping from classical text into daily speech precisely because its fixed rhythmic shell is stable enough to carry a much older, much longer story inside four syllables.

**Production implication:** narration for each episode should read the idiom itself with its natural rhythmic beat before translating it — let viewers hear the 2+2 (or parallel) cadence, the same way a 偈 is meant to be chanted rather than silently read. This turns the recurring "hook" moment (0:00–0:45 in the per-episode template) into an auditory anchor as well as a visual one — viewers remember the idiom's *sound* the way they remember its picture.

---

## The Compression Ladder (2026-07-02)

Pulling the last two sections together: pictograph, character, idiom, 偈, and poem are not five different phenomena — they are the same operation applied at five increasing scales.

```
scene  →  pictograph  →  character  →  idiom (成语)  →  偈 / poem
(lived    (compressed    (radical +    (4 characters,   (matched lines,
 moment)   into a         phonetic      2+2 parallelism,  rhyme/meter,
           stroke-form)   compose)      tonal balance)     theme beneath
                                                            surface story)
```

At every rung, the same two things happen together:

1. **A larger, richer thing is compressed into a smaller, fixed-shape unit** — a scene into a stroke pattern, characters into a four-syllable phrase, a teaching into a quatrain
2. **The fixed shape carries its own memory aid — rhythm, rhyme, or visual symmetry — so the unit survives transmission intact**, and a listener who only holds onto the *shape* (the sound of the four beats, the silhouette of the character) can later recover the *meaning* it was built to carry

This is not a technique someone invented and applied to Chinese — it is what natural language does on its own, unsupervised, over centuries of use, because units that compress well and carry their own retrieval cue are the ones that survive being spoken, copied, and taught across generations. Every other section in this document (对牛弹琴's cow-and-lute pairing, the 汉/汗 water-effort pun, 偈 meter, the idiom's 2+2 parallelism) is one rung of this same ladder, observed from a different angle.

**Transmission, across time and across space.** The word "transmission" is doing double duty here, and both halves are already in the project's DNA. Across *time*, it is the 偈 — a monk's chant surviving a thousand years of oral relay intact because its meter resists corruption. Across *space*, it is 五湖四海 — the same four-character unit understood identically in Beijing and Taipei, and learnable fresh in São Paulo, because its fixed shape crosses borders without degrading. The channel tagline and the Buddhist stanza are the spatial and temporal halves of one phenomenon. And the CS vocabulary fits so naturally — compression, transmission, error-resistance — not because we are imposing engineering metaphors on language, but because information theory formalized (in decades) constraints that natural language had already been solving (over millennia). Humans built maximally survivable encodings without ever naming the problem; a physicist would say the language found the optimum before anyone wrote down the equation.

---

## The Top Rung: Equations (2026-07-02)

If language compresses experience, mathematics compresses language, and physics compresses the universe. The ladder from the previous section has a natural top rung:

```
scene → pictograph → character → idiom → 偈 / poem → equation
```

Gregory Chaitin's algorithmic information theory makes this precise — *comprehension is compression*: a theory's power is measured by how much shorter it is than the data it explains (formally, Kolmogorov complexity: the best explanation of a dataset is its shortest program). Mathematics itself climbs this ladder internally — numbers compress into number theory, patterns into theorems, arguments into symbols.

But physics is the compression champion, and it is not close:

- **F = ma** — maybe twenty bytes; compresses every trajectory of every projectile, planet, and pendulum that has ever moved
- **E = mc²** — a handful of symbols; compresses the energy content of all matter, from starlight to reactors
- **Maxwell's equations** — four lines; compress every radio wave, every color, every reflection in every mirror
- **Dirac's equation** — one line; and the eerie part — it kept working on data it had never seen, predicting antimatter before anyone observed it. That is the difference between compression that *memorizes* and compression that *understands*

The compression ratio of a physics equation is effectively infinite: finite symbols, unbounded phenomena, including phenomena not yet measured when the equation was written.

**Which puts today's AI hype in proportion.** A large language model fits the world's text with hundreds of billions of parameters — a compression, yes, but a shallow one: terabytes in, still-gigabytes out, and it extrapolates unreliably outside what it has seen. Compare that to a human brain — running on roughly twenty watts — that compressed all motion into F = ma, in a few bytes, with predictive reach across centuries and into phenomena unobserved at the time of writing. Until an AI can look at the world and hand back an equation that beautiful and that short, "AGI" has a long way to go. The gap between a trillion parameters and twenty bytes is not an engineering gap; it is the gap between fitting and understanding — the same gap, at the top of the ladder, that separates memorizing an idiom's four characters from seeing the story compressed inside them.

That symmetry is the quiet thesis of this whole series: a student who *sees the compression* — in 对牛弹琴, in 汉/汗, in F = ma — owns the knowledge in a way no amount of memorization can reach. Teaching characters through their compression structure is not a gimmick; it is the only method that matches how the knowledge was actually built.

**Why this matters for the series, concretely:** the cb_zinets concept graph is not a separate metaphor bolted onto the language for teaching purposes — it is a direct visualization of the same compression ladder the language already built for itself. A character node radiating out to the idioms that reuse it *is* rung 3→4 of the ladder, rendered as a picture instead of experienced as centuries of oral history. That is the deepest reason the graph "clicks" for viewers: it is not an analogy for how the idioms work, it is a picture of how they actually work.

---

## From New Concept English to ConceptBook — the Round-Trip Pedagogy (2026-07-04)

### The lineage

A generation of Chinese college students learned English from one book: L.G. Alexander's *New Concept English* (新概念英语) — carefully sequenced lessons in which every new text quietly reused the patterns of the ones before it, so that grammar was never taught as rules but absorbed as structure. **ConceptBook is that book's deliberate descendant**, with the name to prove it: keep "concept," replace the fixed page with a living graph, and replace the author's hand-built sequencing with an AI that can generate a lesson for any node on demand. ConceptBook is a concept-based, graph-first language-learning platform — what NCE did implicitly through sequencing, the concept graph does explicitly through structure.

### The round-trip: training → inference

The pedagogy is, quite literally, an auto-regressor — the learner's brain is the model being trained:

```
TRAINING (small curated set)              INFERENCE (the open language)
~100 idioms (docs/TEST/phrases-utube.txt)
   decompose → characters → primitives        unseen character?
   compose   ← characters ← primitives   →    decode it from known parts
        (encode)      (decode)                 unseen idiom? half-read it
                                               on first sight
```

- **Encode** — decomposition: idiom → characters → primitives. This is comprehension-as-compression, the ladder climbed downward.
- **Decode** — composition: primitives → characters → idioms. The same ladder climbed back up. The round trip is what turns recognition into ownership: a learner who can *rebuild* 忙 from 忄+亡 owns it in a way no flashcard can give.
- **Training set, not syllabus** — the ~100 phrases are not the content to be memorized; they are the minimal corpus through which the learner internalizes the *building algorithm*. The idioms are chosen so the primitives recur (numbers, animals, body parts, elements…) exactly the way a good training set covers its feature space.
- **Inference** — the payoff is everything *not* in the list: the learner meets an unseen character or idiom and decodes it from known parts. That moment — not the 100th idiom — is what the whole platform is for.

This is a STEM approach to language: from a limited dataset, learn the generative rules, then apply them to unseen cases. The brute-force alternative — memorizing thousands of characters as unrelated tokens — is training without generalization: all fitting, no understanding, the same gap called out at the top of the compression ladder above.

### STEM, read three ways (2026-07-04)

The positioning line — **ConceptBook: a STEM approach to Chinese learning** — passes the same layered-naming test as 五湖四海学汉字 and Hanzi Bricks. One word, three readings:

1. **The method** — Science, Technology, Engineering, Math: decompose, recompose, generalize from a small dataset. The pedagogy described above.
2. **The substance** — the English word *stem*, as in **stem cell**: the undifferentiated, pluripotent core that can become any specialized cell. That is precisely what an elemental character is — 忄 differentiates into 忙, 怕, 情, 想, 忘…; 木 into 林, 森, 果, 枯, 杏… The radicals are the stem cells of the language. The botanical reading works too: the stem from which all branches grow — and Chinese already names its own units this way, 字根 ("character *roots*") and 部首. Even the English term completes the pun: "radical," the standard word for 部首, comes from Latin *radix* — root. English and Chinese independently reached for the same plant metaphor to name the same generative unit.
3. **The audience** — STEM learners: the engineers, scientists, and students who will recognize their own method in a language course that finally works the way their field does.

Surface meaning, structural meaning, audience meaning — the name is doing the same triple duty the platform teaches.

### Multi-level encoding — semantic all the way down

The encode step is not one operation but a stack of them, and — this is what makes Chinese unique among major languages — **every level of the stack carries meaning**:

```
phrase (成语)      →   characters        →   elemental characters / radicals
手忙脚乱               手 忙 脚 乱             忙 = 忄 (heart) + 亡 (lose/perish)
"hands busy,           each one a              "a heart racing toward loss" —
 feet in chaos"        standalone word          busy-ness, etymologically
```

Decompose an English word and you get letters — units of sound, not meaning; morphology helps (*un-break-able*) but the decomposition bottoms out in phonetics after a level or two. Decompose a Chinese phrase and you get characters that are themselves words; decompose the characters and you get elemental characters and radicals that are themselves concepts — 氵 water, 忄 heart, 宀 roof, 木 wood. The tree is **semantic all the way down**. This is why the concept graph works for Chinese in a way it could not for an alphabetic language: every node at every level is a meaningful, reusable unit, so the graph is dense with edges a learner can actually traverse.

And that is why the real deliverable is not vocabulary. A learner trained on the round trip doesn't just *see* a new character or phrase — they reflexively **decompose it into elements they know, then re-compose it to check the reading**. Decompose and re-compose: analysis and synthesis, the two strokes of the scientific method. Reduce the phenomenon to its elements, understand the elements, rebuild the phenomenon from them, and test the model by whether the reconstruction matches what you observe. Learning hanzi this way is literally training a person to **think like a scientist** — and the reflex transfers, because it is the same move on any composite system: a molecule and its functional groups, a proof and its lemmas, a codebase and its modules. The language happens to be the most elegant training ground for it, because it is the one system humans built that stays meaningful at every level of decomposition.

### 举一反三 — Confucius states few-shot learning, 500 BC

The thesis has a name, and the name is already in the curriculum. In the *Analects* (论语·述而), Confucius says:

> 举一隅不以三隅反，则不复也。
> *"If I hold up one corner and the student cannot come back with the other three, I do not repeat the lesson."*

That is 举一反三 — "raise one, infer three" — and it is few-shot generalization stated two and a half millennia before machine learning named it. Confucius refuses to teach by exhaustive enumeration; he demands that the student learn the *pattern* from one example and generate the rest. Note where the idiom sits: **in the Numbers category of `phrases-utube.txt` itself.** The training set contains its own thesis statement — the curriculum teaches the idiom that explains how the curriculum works.

### The taxonomy is the worldview

The categories in `phrases-utube.txt` (revised 2026-07-04 — Animals, Human: Body & Behavior, Plant, Numbers, 5-Elements, Space: Directions & Position, Time: The Four Seasons) are not arbitrary semantic bins. They are classical Chinese ontology — the culture's own way of organizing reality:

- **5-Elements (五行)** — metal, wood, water, fire, earth was ancient China's basis set for *everything*: directions, colors, seasons, organs, and virtues were all mapped onto the five phases. A category of 水/火/土/金/木 idioms is teaching correlative cosmology, not just vocabulary.
- **Time: The Four Seasons** — 春生夏长，秋收冬藏 ("spring births, summer grows, autumn harvests, winter stores" — in the list, straight from the *Shiji*) is the agricultural-cosmological cycle that structured the Chinese year, calendar, and economy.
- **Numbers** — 一 through 十 plus 百/千/万 carry numerological weight (六神无主's six organ-spirits, already glossed in the Appendix) far beyond counting.
- **Body, Animals, Plant** — the oldest pictographic inventory: the world as a farmer, herder, and physician actually saw it.

So a learner absorbing these categories is inheriting **the way of thinking that generated the characters in the first place** — the priors, not just the tokens. This is the deepest sense in which the platform teaches *language* and not vocabulary: the taxonomy transmits the culture's compression scheme, and the idioms are its worked examples.

### Sentiment is an annotation layer — the animal hierarchy (2026-07-04)

Look at the Animals category in `phrases-utube.txt` and count the sentiment: roughly **eleven of seventeen idioms are negative** — 对牛弹琴 (an audience too dumb to appreciate), 呆若木鸡, 鸡犬不宁, 井底之蛙, 画蛇添足, 守株待兔, 鼠目寸光, 马马虎虎, 叶公好龙 (hypocrisy), 杀鸡儆猴 (intimidation), 人怕出名猪怕壮 (the pig is fattened for slaughter) — and other categories add 胆小如鼠 and 狼心狗肺. This is no accident of selection. It is the same annotation English carries when calling a person "an animal" is an insult: both cultures run on the **Great Chain of Being** metaphor — humans above animals — so mapping a human onto an animal is a *demotion*, and the idiom inherits the contempt.

But the annotation is finer than blanket negativity — it is a **status hierarchy among the animals themselves**:

- **The despised tier** — farmyard and vermin: 鸡 chicken, 狗 dog, 鼠 rat, 猪 pig, 蛙 frog, 蛇 snake, and the dull 牛 and lost 羊. These carry carelessness, cowardice, chaos, narrowness, treachery. English agrees almost animal-for-animal: *pig, rat, snake, chicken(-hearted), dog*.
- **The noble tier** — 马, the military-aristocratic animal (马到成功, 车水马龙: success and prosperity), and 龙, the imperial one (生龙活虎, 卧虎藏龙: vitality and hidden greatness). English grants the same courtesy to its own noble beasts — *lionhearted, eagle-eyed*.
- **The instructive middle** — animals as neutral teachers in cautionary fables: 亡羊补牢 (mend the pen), 笨鸟先飞 (the "clumsy bird" flies first — self-deprecating diligence), 飞禽走兽 (plain taxonomy).

One genuine cross-cultural flip sits at the top: **龙**. In Chinese it is imperial and auspicious — parents hope for dragon-year babies; in the West the dragon is the monster the hero slays. Same animal, opposite annotation — proof that the sentiment layer is *cultural annotation*, not anything about the animals themselves.

For the learner, this means the taxonomy carries **two payloads at once**: the composition rules (how 鸡犬不宁 is built) and the value system (what invoking a chicken *means*). A vocabulary list teaches neither; the concept graph teaches the first; the idioms' sentiment polarity teaches the second — and it comes with a practical usage warning built in: animal comparisons in Chinese are as loaded as in English, and calling someone 猪 or 狗 lands exactly as badly as its English counterpart.

**Production implication:** Season B (Animal Kingdom) should surface the hierarchy explicitly — a recurring "animal court" graphic ranking each episode's animal from 龙 down to 鼠 would give the season its visual motif *and* teach the sentiment layer viewers need to avoid real-world offense. The 龙 East-West flip is a natural season-finale hook for a global audience.

**Production implication:** the season capstone episodes (roster below) should end with a literal *inference test* — put an idiom on screen that the series has never covered, built entirely from primitives the season taught, and give viewers five silent seconds to decode it before the reveal. That on-camera moment of successful generalization — 举一反三, performed by the viewer — is the series' strongest possible proof of method, and no competing vocabulary channel can replicate it.

---

## On the Channel Name — Hanzi Bricks (2026-06-30)

English and Chinese names are optimized separately rather than translated 1:1 — the Chinese
tagline 五湖四海学汉字 carries poetic/etymological layers (see below) that don't survive
translation, so the English name instead captures the pedagogical mechanic directly: characters
as building blocks that snap together into idioms, matching the "bricks to house" framing
already used in `QUICKSTART.md`.

Naming path:
1. **"Hanzi Unlocked"** — pragmatic first pick, matches the episode payoff structure ("today
   you learned N characters, they unlock these idioms you already know"). Strong but safe.
2. **"Hanzi Lego"** — more creative, same building-blocks metaphor, immediately visual. Rejected
   over trademark risk — LEGO is aggressively protected and known to pursue unaffiliated channels
   using the name.
3. **"Hanzi Bricks"** — the keeper. Same visual punch as "Hanzi Lego" with zero trademark
   exposure. Echoes the naming pattern of **Databricks**: pairing a plain technical noun ("data" /
   "hanzi") with "bricks" turns a generic building-blocks metaphor into an ownable, credible brand
   name rather than a throwaway pun.

---

## YouTube Video Series

**Concept:** Each episode starts with a memorable, often funny idiom as the hook, then unpacks the primitive building blocks (numbers, animals, body parts, directions, seasons, elements) inside it using the cb_zinets concept graph. Viewers learn characters without realising it — the idiom is the story, the primitives are the payoff.

**Format:** 1 clip per idiom, 5–10 minutes each. As the idiom list grows toward ~90–100 entries (see `docs/TEST/phrases.txt`), this is planned as a multi-season series rather than one flat episode list — see [[project-idiom-dimensions]] for the six selection dimensions (space, time, body, numbers, animals, measurement) that now double as the season structure below.

---

### Director's Note — Producing at This Scale

Ninety 5–10 minute episodes is a real production, not a hobby playlist. Three decisions make it tractable:

1. **The pipeline already writes the first draft.** `batch_gen_phrase.py` (via `claude_cli:sonnet` / `ollama:gemma3` / `gemma4`) generates the origin story and concept graph for every idiom before a human touches it. The director's job is *editing that draft into a shooting script*, not researching each idiom from scratch.
2. **The camera move is data, not art.** The cb_zinets concept graph (`public/domains/.../output/graph.html`) has deterministic node coordinates per generation run. The "zoom into a primitive, watch it radiate to other idioms" shot can be scripted once (headless-browser pan/zoom, e.g. Puppeteer/Playwright driving the static HTML) and reused for every episode by swapping the target node — not hand-keyframed 90 times.
3. **Seasons, not one long list.** Grouping by primitive dimension (below) means each season has its own recurring visual motif (a color, an icon, a stinger) and its own capstone/review episode — this also lets you release and promote in batches instead of committing to a 90-episode arc up front.

---

### Per-Episode Script Template (5–10 min)

| Time | Beat | Notes |
|------|------|-------|
| 0:00–0:45 | **Cold open hook** | Show the idiom's literal image before any explanation — let it be funny/strange on its own (e.g. "a cow listening to a lute") |
| 0:45–2:00 | **Origin story** | Dramatize the history/lore behind the idiom — pull straight from the batch-gen story output, trimmed to spoken pace |
| 2:00–4:30 | **Character breakdown** | Walk each character in the idiom — pictograph origin, radical, stroke-order animation |
| 4:30–6:30 | **Primitive zoom** | Pick ONE character, pan the cb_zinets graph outward to idioms already covered in the series — this is the recurring "network effect" shot from the director's note above |
| 6:30–7:30 | **Modern usage** | One contemporary example sentence / everyday scenario |
| 7:30–8:00 | **Payoff recap** | "Today you learned N characters. They unlock these idioms you already know…" |
| 8:00–8:30 | **CTA + next-episode tease** | Subscribe card + one-line hook for the next idiom in the season |

Shorter/simpler idioms (single clear origin, 2–3 unseen characters) can cut the modern-usage beat and land at 5–6 min. Season capstones (see roster below) extend the payoff/recap beat into a full network review and can run 10–12 min.

**Worked example — Ep. "呆若木鸡" (Season B: Animal Kingdom):**
- 0:00 Cold open: a wooden chicken, motionless, and a crowd of rival roosters fleeing at the sight of it
- 0:45 Story: the Zhuangzi tale of the rooster trainer, refining a fighting bird until it achieves such perfect stillness that no opponent dares approach
- 2:00 Characters: 呆 (dull/still), 若 (as if), 木 (wood), 鸡 (chicken) — 木 and 鸡 already seeded from other Season B idioms
- 4:30 Zoom on 木: radiates out to 枯木逢春 (Season E) and 画蛇添足's brushwork motif — cross-season teaser
- 6:30 Modern usage: someone frozen in shock at a surprise party
- 7:30 Recap: "4 characters down. You now also recognize 木 and can half-read 枯木逢春 from Season E."
- 8:00 CTA: tease 狼心狗肺, next in Season B

---

### Season Roster

> **Note (2026-07-04):** the curriculum file has evolved — `docs/TEST/phrases-utube.txt` now organizes ~100 idioms into eight culture-rooted categories (Animals, Human: Body & Behavior, Plant, Numbers, 5-Elements, Space, Time: The Four Seasons, Misc; see "The taxonomy is the worldview" above). The roster below still reflects the earlier six-dimension cut of `phrases.txt`; re-cut the seasons against the new file before locking the production order — the Plant and 5-Elements categories in particular are new/expanded.

Seasons follow the six selection dimensions from [[project-idiom-dimensions]]. Idioms marked (✝) reinforce more than one dimension and get referenced across seasons in the "zoom" beat, matching the existing cross-links already written up in the Appendix (e.g. 九牛二虎之力 bridging 牛 and 虎).

| Season | Theme | Idioms |
|--------|-------|--------|
| **A — Numbers, the Spine** | 一 through 十 as recurring building blocks | 独一无二, 一心一意, 一路平安, 一举两得, 一见钟情, 一分为二, 以一当十, 一往无前✝, 三心二意, 七上八下✝, 九死一生, 九牛一毛, 九牛二虎之力, 六神无主, 五湖四海, 十全十美, 千方百计, 乱七八糟 |
| **B — Animal Kingdom** | Oldest pictographs, most memorable images | 对牛弹琴, 马马虎虎, 亡羊补牢, 卧虎藏龙, 井底之蛙, 画蛇添足, 马到成功, 狗急跳墙, 鸡飞狗跳, 鸡犬不宁, 呆若木鸡, 狼心狗肺 |
| **C — Body & Behavior** | Body-part radicals, physical comedy | 眼高手低, 手忙脚乱, 目瞪口呆, 口是心非, 没头没脑, 垂头丧气, 耳目一新, 才气过人 |
| **D — Space: Directions & Position** | 左右/东西南北/前后/上下/远近 | 左思右想, 左右为难, 左右逢源, 东奔西走, 走南闯北, 不相上下, 承上启下, 承前启后, 空前绝后, 前仆后继, 前功尽弃, 一往无前✝, 后来居上, 后会有期, 前因后果, 七上八下✝, 登高望远, 低三下四 |
| **E — Time: The Four Seasons** | 春夏秋冬 as a natural cycle | 春暖花开, 枯木逢春, 妙手回春, 雨后春笋, 春生夏长，秋收冬藏, 各有千秋, 平分秋色, 日新月异, 天长地久, 争分夺秒 |
| **F — Elements: Water, Fire, Mountain** | 水火山 as physical/moral forces | 无中生有, 水落石出, 火上加油, 水火不容, 山珍海味, 高山流水, 高傲自大, 卷土重来 |
| **G — Wisdom & Character (Capstone)** | Abstract/moral idioms, harder to bucket — closes the series by pulling primitives from every prior season | 金口玉言, 人山人海, 不见不散, 众所周知, 不可思议, 出人意料, 雄心勃勃, 废寝忘食, 熟能生巧, 显而易见, 学而不思则罔思而不学, 解放 |

Suggested air order: A → B → C → D → E → F → G, so numbers (easiest, most reused primitive) seed the whole series first, and Season G's abstract idioms land last, once viewers have enough of a character inventory to recognize the primitives buried inside them.

---

### Production Pipeline (Director's Checklist)

1. **Script draft** — run `batch_gen_phrase.py` for the idiom (already the practice per `docs/TEST/readme-regen.md`), pull the generated story + concept graph
2. **Shooting script** — trim the generated story to the timed beats above; flag which primitive gets the "zoom" shot and which prior-season idiom it should pan toward
3. **Visual assets** — stroke-order animation per new character (link out to hanziyuan.net data, already the reference source used in concept panels), one illustration for the cold-open image, graph pan/zoom captured from the static `graph.html` via headless browser automation
4. **Voice** — either a consistent recorded narrator, or TTS (e.g. edge-tts/ElevenLabs) reading the trimmed script for a consistent series voice across ~90 episodes
5. **Edit template** — fixed intro bumper (Hanzi Bricks logo + 五湖四海学汉字 tagline), lower-third for pinyin/English gloss, fixed outro card with "characters unlocked" tally + subscribe CTA
6. **Thumbnail/SEO template** — large hanzi + one-line English hook + a small primitive icon signaling the season (e.g. a paw print for Season B); title format `IDIOM (pinyin) — meaning | Learn N Chinese Characters`
7. **Cadence** — releasing one season at a time (8–18 episodes) with a season trailer, rather than committing to all ~90 up front, keeps the series adjustable as `phrases.txt` keeps growing

---

### Why This Works Pedagogically

- **Idioms as memory anchors** — a funny image (cow listening to a lute, horse-horse-tiger-tiger) is far more memorable than a vocabulary list
- **Primitives as leverage** — learning 一 once unlocks many idioms in Season A alone. The network effect is visible directly in the cb_zinets graph, and is the recurring "zoom" shot every episode
- **Six near-orthogonal dimensions as the spine** — numbers, animals, body, space, time, elements — cover the primitive character inventory before Season G's abstract idioms require composing across all of them
- **Animals and body parts as pictograms** — 马, 牛, 虎, 羊, 龙, 手, 目, 口 are among the oldest pictographic characters; showing their ancient forms makes the visual memory stick
- **Offline-friendly** — the static cb_zinets export means viewers can download the concept books and study without internet

**Target audience:** Global learners, overseas Chinese reconnecting with the language, Chinese school students, anyone who has watched a kung-fu movie and wondered what the characters mean.

---

## On the Tagline — A Deep Reading (2026-06-30)

### Claude's original: 五湖四海学中文

Generated instinctively during a conversation about the platform's global ambition. The layers noticed at the time:

- **Geographic paradox** — 五湖四海 (periphery, all corners of the world) + 中 (center, Middle Kingdom). People from the four seas converging to learn the language of the center. Periphery flowing toward center — which is also what the cb_zinets concept graph looks like visually.
- **学 carries Confucian weight** — opens the Analects: 学而时习之. Not a casual word.
- **文 vs 汉** — 中文 uses 文 (writing, culture, civilization), more inclusive than 汉 (Han ethnicity).
- **五四 hidden inside** — the numbers 五 and 四 sit at the front of the tagline, echoing 五四运动 (May Fourth Movement, 1919), the great cultural awakening that debated the future of Chinese writing.
- **4+3 cadence** — classical Chinese poetic rhythm, lands naturally.

### Revised tagline: 五湖四海学汉字

The user's refinement — switching 中文 to 汉字 — sharpens the focus to what ZiNets actually studies: the characters themselves, not the spoken language. It also removes any geopolitical sensitivity around 中 (Middle Kingdom). And it revealed new pattern layers:

**The 五四 / 湖海汉 / 学字 regrouping:**

```
五 四
湖 海 汉
学 字
```

- **五四** — the May Fourth echo surfaces cleanly as a visual pair
- **湖海汉** — all three share the water radical 氵:
  - 湖 = 氵+ 胡 (lake)
  - 海 = 氵+ 每 (sea)
  - 漢/汉 = 氵+ 堇/又 (Han)

  The idiom 五湖四海 is literally about water, and 汉 secretly carries the same element. The tagline is a water poem without announcing it.

- **学字** — the deepest gem. Both share the same structural bones:
  - 字 = 宀 (roof) + 子 (child) — a character is a child given shelter, born into form
  - 学 = 爻 (patterns) + 冖 (cover) + 子 (child) — a child under a roof, learning patterns

  Both are *a child under a roof*. 字 is the character being born; 学 is the child learning it. Two sides of the same act — creation and comprehension. A mini ZiNets demonstration in two characters: visually similar, semantically related, etymologically kin.

### The deepest layer: 漢 and 汗

The traditional form 漢 (vs simplified 汉) reveals further depth:

- 漢 = 氵(water) + 堇 — where 堇 carries connotations of hardship, constraint, difficult terrain
- **汗** (hàn, sweat) = 氵+ 干 — same pronunciation, same water radical, same hard effort
- 漢 and 汗 are homophones: both pronounced *hàn* (4th tone)

So embedded in the very name 汉字 is the idea that **learning Chinese characters is hard work — it makes you sweat (汗)**. The water in 漢 is not a river, it is perspiration.

This is the cb_zinets promise, stated in the etymology of its own subject matter:

> **五湖四海学汉字** — *People from every corner of the world, learning Chinese characters — and sweating less doing it.*

---

## The Bronze Form of 漢 — A Scene by the River (2026-06-30)

No oracle bone form exists for 漢. The earliest known form is the bronze script (金文), and it tells a vivid story.

![Bronze form of 漢](TEST/汉.png)

Reading the bronze form top to bottom:

- **Top** — an oval body enclosed by radiating strokes: a **fish**, or possibly an egg/bird body with fins or feathers splaying outward
- **Top right** — a branching vertical form: a **bird** (隹, short-tailed bird), wings visible in the strokes
- **Middle** — downward-reaching strokes: a **hand or arm**, grasping toward the water below
- **Bottom** — three wavy horizontal lines: unmistakably **water** (水/氵), the river itself

The full picture: **a person reaching into a river to catch fish or snatch a bird**. A primal act of effort, skill, and struggle at the water's edge. Not easy. This is where the hardship lives — not in abstract etymology, but in the lived image of someone working hard by the water.

The simplified modern 汉 = 氵+ 又 (hand/again) still carries that reaching hand into water, if you know to look.

And 汗 (sweat, hàn) = 氵+ 干 — the same water, felt from the inside.

The three forms tell one story: reaching into the river (漢), the river itself (氵), the sweat it costs (汗).

---

## Uncle Hanzi — Richard Sears (汉字叔叔)

Richard Sears is an American software engineer who survived a heart attack in 1994 and spent the next decade of his savings and his life digitizing over 50,000 ancient character forms — oracle bone (甲骨文), bronze (金文), and seal script (篆文) — and publishing them all at **hanziyuan.net** for free, for anyone in the world.

He moved to China. He learned the language as a foreigner with no formal training in classical Chinese. He ended up knowing more about the ancient forms of characters than most native scholars. The Chinese internet embraced him warmly and gave him the name **汉字叔叔** — Uncle Hanzi.

His story is a direct inspiration for the ZiNets project. The parallel is not incidental:

| | Richard Sears | ZiNets |
|---|---|---|
| Lens | Outsider (American) | Outsider (physicist) |
| Tool | Database of ancient forms | Graph/network of compositions |
| Mission | Make etymology accessible | Make structure learnable |
| Conviction | Characters have hidden logic | Characters are a composition network |
| Audience | The whole world, for free | 五湖四海 |

Both share the same root belief: Chinese characters are not an overwhelming inventory to memorize — they are a system to understand. Reveal the system, and the overwhelm dissolves.

cb_zinets already links to hanziyuan.net in every single-character concept panel's reference row. That is not a coincidence. It is lineage.

---

## References

- https://www.chineseconverter.com/en/convert/chinese-chengyu-idiom-lookup
- https://www.thechairmansbao.com/blog/chengyu-chinese-idioms/
- https://hanziyuan.net/ — Richard Sears (汉字叔叔), ancient character form database

---

## Appendix — Common Chinese Idioms

| Idiom   | Pinyin | Description |
|---------|--------|-------------|
| 独一无二 | Dú yī wú'èr | The meaning of this idiom is "unique and unmatched", "unrivalled". |
| 一举两得 | Yī jǔ liǎng dé | We all know the saying in English "to kill two birds with one stone", that is do one thing but get two benefits, and this Chinese expression is very similar in meaning. The literal translation is "one act two gains". This idiom comes from a story about a village that was being terrorised by two tigers. |
| 一见钟情 | Yī jiàn zhōng qíng | This Chinese idiom translates into "love at first sight" and is mostly used to describe romantic love between two people. However, you could also use it to describe a thing you love the first time you see it. |
| 一心一意 | Yī xīn yī yì | Literally, this means "one heart, one mind". It can be used in a variety of contexts but most commonly in a romantic sense. For example, you could use this Chinese expression if you wanted to say that you loved someone with all your heart. |
| 一丝不苟 | Yī sī bù gǒu | This can be a good quality to have in the workplace because it means being meticulous in your work and paying attention to details. |
| 一路平安 | Yī lù píng'ān | This chengyu is a way to wish people a safe journey, particularly if they are travelling some distance. It literally means "journey safe and peaceful". It is a little more sophisticated than other bon voyage expressions because it is a quote from a Ming Dynasty poet, Fan Yiyi. |
| 三心二意 | Sān xīn èr yì | Still on the subject of love and romance, this is another idiom used for matters of the heart. However it is almost the antonym of 一心一意; it means "three hearts, two minds" or to be unfocused and not know what you want. So in matters of the heart and romance, it implies that you aren't really committed to the relationship. |
| 显而易见 | Xiǎn'ér yì jiàn | This high-usage Chinese expression means "obvious" or "clear to see". The phrase implies that the truth is readily apparent if you have a clear mind and an unbiased perspective. Although you may not hear it often in everyday conversation, you will certainly come across it in debates, formal presentations, essays, and written arguments. |
| 众所周知 | Zhòng suǒ zhōu zhī | Another high-frequency chengyu meaning "it is well-known that…" or "everybody knows that…". It is a favourite rhetorical device of high school students when introducing arguments in essays. It can also sometimes have a negative connotation, as in something being self-explanatory. |
| 前所未有 | Qián suǒ wèi yǒu | This idiom meaning 'unprecedented' or "never happened before" is also relatively high-frequency – it regularly appears on lists of Top 10 Commonly Used Chengyu in News broadcasts. It comes from a poem by Tang Dynasty writer Du Fu where he describes the unprecedented severity of a snowstorm. |
| 不可思议 | Bù kě sī yì | This Chinese idiom was originally a Buddhist term describing those mysteries of the universe that can't be explained. So it means "unbelievable" or "inconceivable". |
| 千方百计 | Qiān fang bǎi jì | The meaning of this Chinese idiom is literally "a thousand ways, a hundred plans", and so it means "to do everything possible". This is one of the chengyu you might come across on an HSK word list. It is believed to originate from a Confucian encyclopedia in which the scholar, Zhu Xi, discusses the ways to catch a thief. |
| 先发制人 | Xiān fā zhì rén | A frequently used Chinese idiom that translates to "pre-emptive strike" or "take the initiative to subdue the enemy". Its literal meaning is something like "first attack the people…", and it derives from a historical event at the end of the Qin Dynasty. Like many chengyu, there's a long and intricate story behind it. |
| 乱七八糟 | Luàn qī bā zāo | This relatively common saying is used to describe something disorganised and messy. On first reading, the literal meaning "chaotic seven, eight bad" makes no sense at all. However, it is based on two actual historical events. The "chaotic seven" refers to the chaotic period in Chinese history when seven kingdoms revolted against the Han Dynasty in 154BC. The "eight bad" refers to another rebellion five hundred years later. |
| 脱颖而出 | Tuō yǐng'ér chū | The meaning of this expression is "talent or skill comes to the fore". It comes from an old story from the Warring States period. The chengyu is comparing a capable person to an awl in a cloth bag. Even though it is inside the bag, everyone can see the sharp point sticking out – like talent, it is hard to keep hidden. |
| 马马虎虎 | Mǎmǎ hǔhǔ | This Chinese idiom is a popular one for foreigners to learn because it is so simple to remember (literally "horse horse tiger tiger"). It can sound a bit old-fashioned, more likely to be used by the older generation. Its main meaning is "careless" or "sloppy" but is now also used to mean "so-so" or "passable". |
| 出人意料 | Chū rén yì liào | This Chinese idiom means "unexpected" or literally "beyond people's expectations". |
| 忠言逆耳 | Zhōng yán nì'ěr | This has the meaning of "faithful words offend the ear", in other words: the truth hurts. |
| 理所当然 | Lǐ suǒ dāng rán | A not uncommon chengyu, it means "as it should be" or "naturally". |
| 雄心勃勃 | Xióng xīn bóbó | Some of the most common Chinese idioms are those that describe personality types. This means "ambitious" (literally "mighty heart and exuberant"). Although in English 'ambitious' can sometimes have a negative meaning, this Chinese idiom generally has a positive connotation. |
| 能者多劳 | Néng zhě duō láo | Here's a handy saying for work: "capable people should do more of the work". You can use this when delegating a task you don't want to do because you're flattering the person while fobbing off the work to them! |
| 埋头苦干 | Mái tóu kǔ gàn | This idiom is used to describe working hard and with deep concentration and means "to bury oneself in work" or "up to one's neck in work". It literally means "head down, working hard". |
| 废寝忘食 | Fèi qǐn wàng shí | Another idiom to describe "hard-working", this chengyu literally means "fail to sleep, forget to eat", or one is working so hard they have no time to eat and sleep. |
| 胸有成竹 | Xiōng yǒu chéng zhú | This chengyu has the meaning of gaining confidence by being well-prepared for something, and by having a well-thought-out plan in mind. It comes from the story of the painter who observed bamboo for many years, at all times of the day, in all seasons and types of weather, so he was then able to paint a bamboo scene without draft sketches. |
| 半途而废 | Bàn tú'ér fèi | Hopefully, you won't need this Chinese idiom to talk about your work because its literal translation is "halfway but fail", or "to give up when the job is only half done". It comes from the story of a man who had a tendency to begin things but would give up halfway. |
| 卧虎藏龙 | Wò hǔ cáng lóng | Everyone knows the Chinese movie Crouching Tiger, Hidden Dragon. But did you know the title actually comes from a Chinese idiom? It is from a Northern Zhou dynasty poem and has come to be used to describe people or things with hidden talents, waiting to be discovered. |
| 入乡随俗 | Rù xiāng suí sú | The literal meaning of this chengyu is "when you enter another region, follow the customs there", or as we would say in English "when in Rome do as the Romans do". In the original story, two merchant brothers travelled to a remote town where the local customs were backward and unrefined. |
| 掘墓鞭尸 | Jué mù biān shī | This Chinese idiom is a bit macabre because it translates as "digging up graves and whipping corpses"! It comes from an incident from the Warring States Period of Chinese history. The king had exiled one of his generals while also having the general's father and brother put to death. |
| 熟能生巧 | Shú néng shēng qiǎo | Let's finish with a Chinese idiom that can be used to keep you motivated while you learn Chinese. This chengyu is from a tale about an archer displaying his skills in front of a crowd of admirers. Everyone applauded his skill except for one old man who wasn't impressed. This chengyu can be translated as "practice makes perfect". |
| 守株待兔 | Shǒu zhū dāi tù | Lit. "guard the tree, wait for the rabbit". This idiom refers to expecting easy gain or hoping for something to happen without effort. It describes someone who relies on luck or chance rather than taking action. |
| 画蛇添足 | Huà shé tiān zú | Lit. "draw a snake and add feet to it". This idiom means to do something unnecessary or counterproductive; to gild the lily or go too far. It originates from a story about a man who drew a snake and then added feet to it, ruining the artwork. |
| 井底之蛙 | Jǐng dǐ zhī wā | Lit. "the frog at the bottom of the well". This idiom describes someone who is narrow-minded or has limited knowledge of the world. It comes from a story about a frog that lived in a well and thought the small circle of sky above was the entire world. |
| 对牛弹琴 | Duì niú tán qín | Lit. "play the lute to a cow". This idiom means to waste one's effort on someone who cannot appreciate it. It describes the futility of trying to reason with someone who lacks understanding or appreciation for your efforts. |
| 亡羊补牢 | Wáng yáng bǔ láo | Lit. "the sheep is lost, repair the pen". This idiom means to make amends after a loss or to correct something after it has gone wrong. It emphasizes that it is still worthwhile to take preventive measures even if some damage has already occurred. |
| 马到成功 | Mǎ dào chéng gōng | Lit. "the horse arrives, success is achieved". This idiom means guaranteed success or immediate success. It is often used as an expression of encouragement or congratulations, wishing someone swift achievement of their goals. |
| 学而不思则罔，思而不学则殆 | Xué'ér búsī zé wǎng, sī'ér búxué zé dài | This is a famous quote from Confucius meaning "To learn without thinking is futile; to think without learning is dangerous." It emphasizes the importance of balancing learning with reflection and contemplation. This wisdom is fundamental to Chinese educational philosophy and remains highly relevant today. |
| 五湖四海 | Wǔ hú sì hǎi | Lit. "five lakes and four seas". This idiom means people from all corners of the world, or all over the land. It describes a diverse gathering from every region and embodies the spirit of welcoming everyone regardless of origin. A fitting spirit for a Chinese learning platform aimed at a global audience. |
| 六神无主 | Liù shén wú zhǔ | Lit. "the six spirits have no master". The six spirits (六神) are the divine guardians of the six vital organs in Chinese traditional medicine — heart, lungs, liver, kidneys, spleen, and gallbladder. When all six are in chaos with no one in charge, a person is utterly flustered and cannot think straight. Used to describe a state of panic, confusion, or being completely at a loss. Adds 六 to the number building blocks: 一二三四五六七八… |
| 九牛二虎之力 | Jiǔ niú èr hǔ zhī lì | Lit. "the strength of nine oxen and two tigers". Means to use every last ounce of effort — a herculean, superhuman exertion. Bridges the animal primitives 牛 (ox, from 对牛弹琴) and 虎 (tiger, from 卧虎藏龙) into one idiom. The ultimate crossover in the series. |
| 九牛一毛 | Jiǔ niú yī máo | Lit. "one hair from nine cows". Means a drop in the ocean — utterly insignificant compared to the whole. Origin: Sima Qian, imprisoned and castrated by Emperor Wu of Han, wrote in a letter to his friend Ren An that his own suffering was "one hair from nine cows" compared to the great martyrs of history. He chose to live in disgrace in order to finish the Shiji (Records of the Grand Historian), China's first comprehensive history. One of the most moving stories in Chinese literature. |
| 九死一生 | Jiǔ sǐ yī shēng | Lit. "nine deaths, one life". Means a hairbreadth escape from death, surviving against all odds. Origin: from Qu Yuan's epic poem Li Sao (离骚, "Encountering Sorrow"): "Though I face nine deaths, I have no regrets." Qu Yuan was a loyal minister exiled by his king; he eventually drowned himself in the Miluo River on the 5th day of the 5th lunar month — the origin of the Dragon Boat Festival (端午节). |
| 以一当十 | Yǐ yī dāng shí | Lit. "one against ten". Means one person matching ten opponents — great courage, skill, or efficiency. Connects back to 一 (the simplest character) now carrying the weight of ten. A warrior idiom that also works as a metaphor for mastery: one who truly understands a system can do what ten who merely memorise cannot. |
| 十全十美 | Shí quán shí měi | Lit. "ten complete, ten beautiful". Means perfect in every way, nothing lacking. Origin: Emperor Qianlong of the Qing Dynasty celebrated his ten major military victories as 十全武功 and styled himself the 十全老人 — the "Ten Complete Old Man". The phrase escaped imperial ego and became everyday Chinese for flawless perfection. |
| 一分为二 | Yī fēn wéi èr | Lit. "one divides into two". From Maoist dialectical materialism — everything contains two opposing aspects (contradictions). In everyday use: look at both sides of a problem, acknowledge both the good and the bad. Its counterpart is 合二为一 (two merges into one). So basic it is almost a logical axiom in Chinese philosophical speech. |
| 无中生有 | Wú zhōng shēng yǒu | Lit. "something arises from nothing". Means to fabricate a lie or rumor out of thin air, groundless slander. Echoes Laozi's Daodejing cosmology (有生于无, "being arises from non-being"), repurposed as an idiom for baseless fabrication. |
| 日新月异 | Rì xīn yuè yì | Lit. "new every day, different every month". Means rapid, constant progress — developing by leaps and bounds. Commonly used to describe fast-changing technology or a fast-developing city. |
| 天长地久 | Tiān cháng dì jiǔ | Lit. "sky long-lasting, earth enduring". Means as everlasting as heaven and earth — often used for eternal love or lifelong friendship. From Laozi's Daodejing, ch. 7. |
| 争分夺秒 | Zhēng fēn duó miǎo | Lit. "fight for minutes, seize seconds". Means racing against time, making every second count. |
| 水落石出 | Shuǐ luò shí chū | Lit. "water recedes, stones emerge". Means the truth comes to light. From Su Shi's essay 后赤壁赋 (Second Ode on the Red Cliff). |
| 火上加油 | Huǒ shàng jiā yóu | Lit. "add oil to the fire". Means to aggravate a situation, add fuel to the flames. |
| 卷土重来 | Juǎn tǔ chóng lái | Lit. "roll up the dust and come again". Means to make a comeback after a defeat. From a Tang poem by Du Mu reflecting on Xiang Yu's final battle. |
| 狗急跳墙 | Gǒu jí tiào qiáng | Lit. "a cornered dog jumps the wall". Means a desperate person will resort to extreme, reckless measures. |
| 鸡飞狗跳 | Jī fēi gǒu tiào | Lit. "chickens fly, dogs leap". Means chaos and pandemonium, everything thrown into disorder. |
| 水火不容 | Shuǐ huǒ bù róng | Lit. "water and fire cannot tolerate each other". Means two things or people are fundamentally incompatible. |
| 金口玉言 | Jīn kǒu yù yán | Lit. "golden mouth, jade words". Means words of unquestionable authority — a promise that must be honored. Historically used for emperors; often ironic or playful in modern usage. |
| 耳目一新 | Ěr mù yī xīn | Lit. "ears and eyes refreshed". Means a refreshing change — everything looks and sounds new. |
| 手忙脚乱 | Shǒu máng jiǎo luàn | Lit. "hands busy, feet in chaos". Means flustered, frantically scrambling to keep up. |
| 目瞪口呆 | Mù dèng kǒu dāi | Lit. "eyes wide open, mouth agape". Means dumbstruck, stunned into silence. |
| 口是心非 | Kǒu shì xīn fēi | Lit. "mouth says yes, heart says no". Means hypocritical — saying one thing while meaning another. |
| 鸡犬不宁 | Jī quǎn bù níng | Lit. "chickens and dogs have no peace". Means great disturbance, everything in an uproar. From Liu Zongyuan's essay 捕蛇者说 (The Snake Catcher). |
| 呆若木鸡 | Dāi ruò mù jī | Lit. "dumb as a wooden chicken". Means stunned motionless, dumbfounded. From a story in Zhuangzi about training a fighting rooster to achieve such perfect stillness that rivals flee at the sight of it. |
| 狼心狗肺 | Láng xīn gǒu fèi | Lit. "wolf's heart, dog's lungs". Means cruel and ungrateful, utterly heartless. |
| 人山人海 | Rén shān rén hǎi | Lit. "people mountain, people sea". Means a huge crowd, a sea of people. |
| 没头没脑 | Méi tóu méi nǎo | Lit. "no head, no brain". Means without rhyme or reason — an abrupt remark or action with no clear context. |
| 垂头丧气 | Chuí tóu sàng qì | Lit. "hanging head, dispirited energy". Means dejected, crestfallen, downcast. |
| 不见不散 | Bú jiàn bú sàn | Lit. "won't leave until we see each other". Means "be there or be square" — a firm commitment to meet, waiting until the other arrives no matter what. |
| 山珍海味 | Shān zhēn hǎi wèi | Lit. "mountain delicacies, sea flavors". Means a sumptuous feast of rare and exotic foods. |
| 才气过人 | Cái qì guò rén | Lit. "talent and spirit surpassing others". Means exceptionally talented, outstanding ability that stands above the crowd. |
