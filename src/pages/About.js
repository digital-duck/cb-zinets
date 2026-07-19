import { Header } from '../components/Header.js'

export function About(container) {
  container.innerHTML = ''
  container._renderKey = Symbol()
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-about'
  main.innerHTML = `
    <h1>About ZiNets ConceptBook</h1>
    <p>
      Chinese characters can feel overwhelming — thousands of symbols with no obvious pattern.
      <strong>ZiNets ConceptBook</strong> changes that. Our mission is to simplify the Chinese
      learning experience by revealing the hidden structure inside every character: a small set
      of elemental radicals combine and build meaning, layer by layer, like molecules built from
      atoms. Once you see the pattern, characters stop being random and start making sense.
    </p>
    <p>
      The tool at the center is the <em>concept graph</em> — a visual map that shows how each
      character decomposes into its building blocks and how those blocks connect to others.
      Navigation replaces memorization: follow the graph, and the learning sequence emerges
      naturally.
    </p>

    <h2>How to learn with it</h2>
    <ol>
      <li>Type any Chinese character, word, phrase, or sentence on the home page and click <strong>Build Concept Graph</strong></li>
      <li>Explore the graph — each node is a building block of the input you entered; for a sentence, see how individual characters link together to carry the full meaning (try a line from a classical poem)</li>
      <li>Click any node to open its concept book: etymology, meaning, usage, and examples</li>
      <li>Use the learning path sidebar to follow the sequence from elementals up to the full character</li>
    </ol>

    <h2>Why Chinese characters?</h2>
    <p>
      Chinese characters are not arbitrary — they follow deep structural patterns.
      Mastering a few hundred elemental characters gives you a key that unlocks
      thousands of compound characters by structure alone, the same way knowing chemical
      elements lets you read a molecular formula. ZiNets makes that key visible and learnable
      in a fraction of the time traditional methods require.
    </p>

    <h2>Pre-generated Baseline Content</h2>
    <p>
      This app ships with rich, ready-to-explore content so learners can get started immediately
      — no API key required:
    </p>
    <ul>
      <li>
        <strong>100+ Chinese idioms (成语)</strong> — concept books generated in 5 languages:
        English (EN), Chinese (ZH), Spanish (ES), French (FR), German (DE)
        using <em>Claude Sonnet 4.6</em> and <em>Gemma4</em>.
      </li>
      <li>
        <strong>422 elemental characters</strong> — concept books generated in 8 languages:
        English (EN), Chinese (ZH), Spanish (ES), French (FR), German (DE), Portuguese (PT), 
        Korean (KO), Arabic (AR) 
        using <em>Claude Sonnet 4.6</em> and <em>Gemma4</em>.
      </li>
    </ul>
    <p>
      The baseline content is provided as a reference and learning foundation.
      As learners advance on their journey, they can generate concept books for any character,
      word, or phrase <em>outside the baseline scope</em> by supplying their own LLM API token
      in the Settings page — unlocking the full power of the content engine at their own pace.
    </p>

    <h2>Why Claude Sonnet 4.6 and Gemma4 ?</h2>
    <p>
      Two complementary models were chosen deliberately to validate content quality across
      the proprietary/open-source divide:
    </p>
    <ul>
      <li>
        <strong>Claude Sonnet 4.6</strong> (<a href="https://www.anthropic.com" target="_blank" rel="noopener">Anthropic</a>)
        — excels at nuanced multilingual reasoning, cultural context, and etymology. Its deep
        understanding of Chinese characters and idiomatic expressions makes it the benchmark
        for high-quality concept-book content.
      </li>
      <li>
        <strong>Gemma4</strong> (<a href="https://deepmind.google" target="_blank" rel="noopener">Google DeepMind</a>)
        — a capable open-weights model that can be run locally or via free/low-cost APIs.
        Including Gemma4 keeps the baseline accessible and demonstrates that quality concept
        books are achievable without proprietary API costs.
      </li>
    </ul>
    <p>
      The concept book page includes a built-in <strong>Compare</strong> feature — a hidden gem
      worth exploring. Side-by-side comparison works in two dimensions: place two AI models next
      to each other to evaluate content quality, or place two languages next to each other to
      support bilingual learning. Mix and match model and language pairings to find what best
      fits your budget and learning goals.
    </p>

    <h2>The research behind it</h2>
    <p>
      ZiNets ConceptBook grew out of original research published on arXiv:
      <a href="https://arxiv.org/abs/2502.19428" target="_blank" rel="noopener">A New Exploration into Chinese Characters: from Simplification to Deeper Understanding</a>.
      That paper introduced the concept graph model for Chinese characters and validated it as a
      more effective path to character literacy than traditional stroke-order and radical-list
      memorization. Everything in this app — the graph structure, the elemental characters, the
      learning path — traces back to that foundational work.
    </p>

    <h2>The content engine</h2>
    <p>
      All domain graphs and concept-book text are generated by
      <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a>
      — a structured programming language for LLM-driven content generation with math verification.
      concept-book is the web-app layer that hosts and presents what SPL.py produces.
    </p>

    <h2>Open source</h2>
    <p>The following repositories are open source under the Apache 2.0 license:</p>
    <ul>
      <li>
        <a href="https://github.com/digital-duck/cb-zinets" target="_blank" rel="noopener">cb-zinets</a>
        — this app for the Chinese characters use-case
      </li>
      <li>
        <a href="https://github.com/digital-duck/concept-book" target="_blank" rel="noopener">concept-book</a>
        — the core concept-book framework
      </li>
    </ul>
  `
  container.appendChild(main)
}
