# STEM approach to learn Chinese

Get started with learning 100+ Chinese idioms via concept-graph

YouTube videos to accompany this web-app.

This is currently a **small demo app**, not a full web portal: the static site ships a fixed, pre-generated baseline — 422 elemental characters across 8 languages and 100+ Chinese idioms across 6 languages — that anyone can read immediately with no setup. Generating content beyond that baseline already works today by supplying your own LLM API key (see **Settings**), and is meant as a preview of the fuller self-serve web-portal deployment planned later, where every learner brings their own key to generate whatever phrase or character they want.

> **Papers**: Wen G. Gong, *ConceptBook: A Graph-First Framework for AI-Generated Curricula*, preprint, July 2026 — [PDF](https://github.com/digital-duck/dd-work/blob/main/docs/spl4ed-paper-arxiv.pdf). This app is a ConceptBook Path A application — Chinese characters and idioms as concept-graphs, elemental characters as primitives — building on prior work decomposing ~6,000 Chinese characters into 422 elemental primitives: Wen G. Gong, *A New Exploration into Chinese Characters: from Simplification to Deeper Understanding*, [arXiv:2502.19428](https://arxiv.org/abs/2502.19428), February 2025.

---

## Multi-language, multi-model ZiNet concept books

Live at **[digital-duck.github.io/cb-zinets](https://digital-duck.github.io/cb-zinets/)** — read-only, static, no backend required. Pick a phrase, then compare it across languages and models directly in the built-in **Compare** view.

Pre-generated baseline content ships with the site — no API key needed to start reading:

- **100+ Chinese idioms (成语)** — one concept book per idiom, generated in 6 languages: English, Chinese, Spanish, French, German, Arabic
- **422 elemental characters** — the primitive building blocks the idioms decompose into, generated in 8 languages (adds Portuguese and Korean)
- Every phrase/character is generated with both **Claude Sonnet 4.6** (proprietary benchmark) and **Gemma4** (open-weights, runs free/local via Ollama) — the two are meant to be compared side by side, not just read independently

Each concept graph shows the character/phrase decomposed into its structural building blocks; every node opens its own concept book (etymology, meaning, usage). Beyond the pre-generated baseline, learners can generate additional concept books on demand by supplying their own LLM API key — see the in-app **About** page for the full model rationale and **Settings** page for bringing your own key.
