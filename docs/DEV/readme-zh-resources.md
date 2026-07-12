You have good coverage of dictionaries, etymology, calligraphy, idioms, and search in `digital-duck/cb-zinets/config.yaml`


The gaps I'd suggest filling, given your app's focus on character structure:

Stroke order (visual learning)
- Hanzicraft (hanzicraft.com) — beautiful decomposition tree + animated stroke order per character. Complements your concept graph visually.
  - char_url: https://hanzicraft.com/character/{char}

English-friendly dictionary
- MDBG (mdbg.net) — the most popular CC-CEDICT-based dictionary for English learners; very clean per-character lookup.
  - char_url: https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb={char}

Example sentences in context
- Tatoeba (tatoeba.org) — community-curated sentences with translations; good for seeing characters in real usage.
  - char_url: https://tatoeba.org/en/sentences/search?query={char}&from=cmn&to=eng

Wiktionary (free, surprisingly deep)
- Has etymology, decomposition, multiple regional pronunciations, and classical usage — all free.
  - char_url: https://en.wiktionary.org/wiki/{char}

Of these, Hanzicraft pairs most naturally with cb-zinets since it shows the decomposition tree independently, and learners could cross-check your AI explanation with the visual breakdown. MDBG is the go-to for English-speaking learners and would get the most clicks.
