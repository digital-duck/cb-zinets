# Comprehension Is Compression

*Why a twenty-byte equation embarrasses a trillion-parameter model — a physicist's cheerful poke at the AGI hype, by way of Chinese idioms.*

---

## A cow, a lute, and a lossy encoder

There is a Chinese idiom, 对牛弹琴 — "playing the lute to a cow." Four characters. On the surface it is an absurd little scene: a musician performs; the cow chews on, unmoved. Underneath, it compresses an entire category of human experience — wasted eloquence on an audience that cannot receive it — into four syllables that have survived roughly two thousand years of retelling without version control, checksums, or a single backup server.

Nobody designed this. No committee optimized the encoding. The idiom survived because it compresses well: a vivid scene, a fixed four-beat rhythm, an internal 2+2 parallelism that resists corruption in oral transmission. Units of language that compress meaning tightly *and* carry their own retrieval cue — rhyme, rhythm, a funny picture — are the ones that outlive the generations that spoke them. Natural language has been running an evolutionary compression contest for millennia, and idioms are its hall of fame.

Hold that thought. We'll need it when we get to the trillion parameters.

## The ladder

Chinese makes the mechanism unusually visible, because the compression operates at every scale and leaves fossils at each rung:

```
scene → pictograph → character → idiom → verse/poem → equation
```

- **Scene → pictograph.** The bronze-age form of 漢 (hàn, as in 汉字, Chinese characters) is a picture: a hand reaching into a river toward a fish. A lived moment, compressed into strokes.
- **Pictograph → character.** Radicals and phonetic components snap together like bricks. 湖 (lake), 海 (sea), and 漢 all share the water radical 氵— the compression scheme is compositional, and it shows its work.
- **Character → idiom.** Four characters encode a whole story with a moral: 井底之蛙, "the frog at the bottom of the well," is a complete parable about narrow-mindedness in the space of a PIN code.
- **Idiom → verse.** Buddhist 偈 (gāthā) stanzas used fixed meter and parallel lines so teachings could survive centuries of purely oral relay. The rhythm is a memory container; the meaning is the cargo. Poems work the same way — rhyme is not decoration, it is error-correction.
- **Verse → equation.** And at the top of the ladder, the compression champion of all human activity: physics.

Each rung trades surface detail for reach. And each rung was climbed by human brains doing something no one had named yet.

## The top rung, and the scoreboard

Gregory Chaitin, one of the founders of algorithmic information theory, put the whole idea in three words: **comprehension is compression**. A theory is exactly as good as it is shorter than the data it explains. The formal version is Kolmogorov complexity — the best explanation of a dataset is its shortest program. (Marcus Hutter took it seriously enough to fund a long-running prize that treats compressing Wikipedia as a proxy for intelligence itself; Jürgen Schmidhuber has argued for decades that discovery *is* finding shorter descriptions.)

By that scoreboard, look at what physics has done: F = ma, in twenty bytes, covers every trajectory of every projectile, planet, and pendulum that has ever moved. Maxwell's four lines cover every radio wave, every color, every reflection in every mirror. E = mc², Schrödinger's equation, Dirac's equation — each a line or less, each covering an unbounded slice of reality. (The full scoreboard, ten equations spanning two and a half centuries, is in the **Appendix** — because once you start this list, stopping at five requires discipline and stopping at ten requires force.)

Note the time span: compression at this level does not happen overnight. Each line stands on the ones before it, the way an idiom stands on its characters.

The compression ratio is effectively infinite: finite symbols, unbounded phenomena — including phenomena that hadn't been measured when the equation was written down. That last part is the tell. Dirac's equation didn't just fit the data Dirac had; it kept working on data nobody had. That is the difference between compression that *memorizes* and compression that *understands*.

## Now, about that trillion-parameter model

A large language model fits approximately all of humanity's text using hundreds of billions of parameters. This is genuinely impressive engineering, and it is genuinely compression — terabytes of text distilled into gigabytes of weights that can regenerate the patterns.

But put it on the same scoreboard:

- **An LLM:** terabytes in → gigabytes of parameters out. Compression ratio: maybe two or three orders of magnitude. Extrapolation outside the training distribution: unreliable, politely put.
- **A human brain, running on about twenty watts:** all observed motion in → **F = ma** out. Twenty bytes. Predictive reach: centuries, and counting, including regimes no human had ever observed.

The gap between a trillion parameters and twenty bytes is not an engineering gap that the next training run will close. It is the gap between *fitting* and *understanding* — between a model that has memorized the world's shadows and a mind that found the light source. When an AI looks at the world and hands back something as short, as beautiful, and as *unreasonably* predictive as E = mc², the AGI conversation will deserve its capital letters. Until then, we have built a very large idiom-memorizer that has not yet coined an idiom.

And to be fair to the machines: coining the idiom is *hard*. It took natural language millennia of evolutionary A/B testing to produce 对牛弹琴, and it took five of the brightest minds humanity has produced across three centuries to write the five lines in the table above — **Newton**, who compressed all motion, from a falling apple to an orbiting moon, into three laws; **Maxwell**, who unified electricity, magnetism, and light itself into four; **Einstein**, who folded energy, mass, space, and time into each other with a single equals sign; **Schrödinger**, who wrote the one line all of chemistry evolves by; and **Dirac**, whose line was so compressed it contained particles nobody had ever seen. Five minds, five lines, three hundred years. The bar at the top of the ladder is not "generate plausible text." The bar is Newton, Einstein, and Dirac.

## The punchline is pedagogical

Here is the satisfying twist: the same scoreboard explains why some ways of learning work and others don't.

A student who memorizes 对牛弹琴 as four arbitrary syllables holds gigabytes-of-parameters knowledge — brittle, unreachable, gone by next Tuesday. A student who *sees the compression* — the cow, the lute, the wasted music, the 2+2 rhythm that carried it across twenty centuries — holds F = ma knowledge. It decompresses on demand. It generalizes. It predicts the meaning of idioms they have never seen, because they have learned the encoding scheme, not the ciphertext.

Compression is understanding, in both directions: it is how knowledge was built, and it is the only way knowledge is truly acquired. Everything else is inference at temperature zero over somebody else's weights.

---

*This essay grew out of the design notes for [Hanzi Bricks / 五湖四海学汉字](learn-chinese-idioms.md), a video series that teaches Chinese characters through the compression structure of idioms — on the theory that the best way to learn a compressed language is to watch it decompress.*

**Names worth looking up:** Gregory Chaitin (algorithmic information theory, "comprehension is compression"); Andrey Kolmogorov (Kolmogorov complexity); Ray Solomonoff (universal induction); Marcus Hutter (the Hutter Prize — compression as an intelligence test); Jürgen Schmidhuber (discovery as data compression); Claude Shannon (who started it all, and whose first name is a happy coincidence).

---

## Appendix — The Scoreboard, in Chronological Order

Ten compressions, two and a half centuries. The first five are the classics from the essay; the second five are the compressions *behind* the compressions — the ones that either generate the others or compress the very ideas of information and knowledge.

| Compression | Year | Size | What it covers |
|---|---|---|---|
| **F = ma** (Newton) | 1687 | ~20 bytes | Every trajectory of every projectile, planet, and pendulum that has ever moved |
| **δS = 0**, the principle of least action (Euler, Lagrange, Hamilton) | 1744–1833 | one line | The meta-compression: Newton's laws, Maxwell's equations, and — via Feynman's path integral — all of quantum field theory are *derivable* from this single variational statement |
| **Maxwell's equations** | 1865 | four lines | Every radio wave, every color, every reflection in every mirror |
| **S = k log W** (Boltzmann) | 1877 | five symbols | The bridge between microscopic chaos and macroscopic order — and the direct ancestor of Shannon's information entropy, i.e., the physics of information itself. Engraved on his tombstone |
| **E = hν** (Planck) | 1900 | four symbols | The quantum itself — energy comes in discrete packets; the crack in classical physics that the next three rows poured through |
| **E = mc²** (Einstein) | 1905 | a handful of symbols | The energy content of all matter, from starlight to reactors |
| **Noether's theorem** | 1915 | one theorem | Every conservation law at once: symmetry implies conservation. One statement generates infinitely many laws — the best compression ratio on this list |
| **Schrödinger's equation** | 1926 | one line | The evolution of every quantum system, i.e., chemistry |
| **Δx·Δp ≥ ħ/2** (Heisenberg) | 1927 | six symbols | A compression of what *cannot* be known — the universe's own limit on measurement, stated in one inequality |
| **Dirac's equation** | 1928 | one line | The relativistic electron — plus antimatter, *predicted before anyone observed it* |

Two footnotes to the scoreboard:

- **Symmetry, conservation, invariance** — Noether's row deserves an extra beat: these three words are the same idea seen from three angles. A symmetry is a transformation that leaves the physics *invariant*, and Noether proved that every such invariance forces a *conservation* law. It is the physics version of what this essay says about idioms — the fixed, invariant shell (four characters, 2+2 meter) is precisely what lets the content survive transformation across dialects and centuries. Invariance is what makes transmission lossless.
- **The mathematician's entry** — if physics owns this scoreboard, mathematics owns its mic-drop: **e^iπ + 1 = 0** (Euler's identity), which links five fundamental constants — e, i, π, 1, 0 — in seven symbols with nothing left over. No phenomena, no apparatus, no universe required; pure structure compressing pure structure. Physicists write the shortest descriptions of the world; Euler wrote the shortest description of mathematics itself.

The list is not exhaustive, and cannot be — that is rather the point. Ten rows already span 241 years of the brightest minds humanity has produced, each standing on the rows above. No overnight training run appears anywhere in the table.
