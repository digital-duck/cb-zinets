import { Header } from '../components/Header.js'
import { navigate } from '../router.js'
import { loadCatalog, matchesQuery } from '../data/catalog.js'

// Concept entries whose name is the phrase itself (not a character/primitive)
function _isPhraseConcept(c) {
  return c.name.startsWith('phrase_')
}

// True for a single Chinese character/primitive (excludes multi-glyph
// compound entries like "丿一"). Uses code-point iteration so surrogate-pair
// characters still count as one.
// Looser than the Python twin (spl/tools.py:_is_single_cjk, CJK ranges only) —
// here anything single-glyph belongs in the character grid.
function _isSingleChar(name) {
  return [...name].length === 1
}

// Dedup concepts across all domains, tracking how many distinct phrases
// (domains) each character appears in — the "leverage" signal: learning a
// high-count primitive unlocks the most other phrases.
function _buildConceptIndex(catalog) {
  const byChar = new Map()
  for (const domain of catalog) {
    const seenInThisDomain = new Set()
    for (const c of domain.generated_concepts || []) {
      if (_isPhraseConcept(c) || !_isSingleChar(c.name)) continue
      if (seenInThisDomain.has(c.name)) continue
      seenInThisDomain.add(c.name)
      let entry = byChar.get(c.name)
      if (!entry) {
        entry = { char: c.name, count: 0, domain: domain.id, file: c.file, pinyin: c.pinyin }
        byChar.set(c.name, entry)
      }
      entry.count += 1
    }
  }
  return [...byChar.values()].sort((a, b) => b.count - a.count || a.char.localeCompare(b.char, 'zh'))
}

function _heatClass(count) {
  if (count >= 5) return 'cb-concept-tile--hot'
  if (count >= 2) return 'cb-concept-tile--warm'
  return ''
}

function _renderPhraseList(listEl, phrases, query) {
  const q = query.trim()
  const filtered = q ? phrases.filter(p => matchesQuery(p.name, p.pinyin, p.pinyin_initials, q)) : phrases
  listEl.innerHTML = filtered.length
    ? ''
    : '<div class="cb-home-empty">No phrases match.</div>'
  filtered.forEach(p => {
    const a = document.createElement('a')
    a.className = 'cb-home-link'
    a.href = '#'
    a.textContent = p.name
    a.addEventListener('click', e => { e.preventDefault(); navigate(`/domain/${encodeURIComponent(p.id)}`) })
    listEl.appendChild(a)
  })
}

function _renderConceptGrid(gridEl, concepts, query) {
  const q = query.trim()
  const filtered = q ? concepts.filter(c => matchesQuery(c.char, c.pinyin, null, q)) : concepts
  gridEl.innerHTML = filtered.length
    ? ''
    : '<div class="cb-home-empty">No concepts match.</div>'
  filtered.forEach(c => {
    const tile = document.createElement('button')
    tile.className = `cb-concept-tile ${_heatClass(c.count)}`.trim()
    tile.title = `${c.char} — appears in ${c.count} phrase${c.count === 1 ? '' : 's'}`
    tile.innerHTML = `<span class="cb-concept-tile__char">${c.char}</span><span class="cb-concept-tile__badge">${c.count}</span>`
    tile.addEventListener('click', () => navigate(`/book?domain=${encodeURIComponent(c.domain)}&file=${encodeURIComponent(c.file)}`))
    gridEl.appendChild(tile)
  })
}

export function Home(container) {
  container.innerHTML = ''
  container._renderKey = Symbol()
  const renderKey = container._renderKey
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-home cb-phrase-home'
  main.innerHTML = `
    <div class="cb-welcome" style="margin:0 auto 20px">
      <p>Enter a Chinese phrase to <strong>decompose its characters</strong>, build a <strong>concept graph</strong>, and generate <strong>AI-powered learning content</strong>.</p>
    </div>
    <div class="cb-phrase-input-wrap">
      <div class="cb-phrase-input-row">
        <input
          id="cb-phrase-input"
          class="cb-phrase-input"
          type="text"
          placeholder="例如：不见不散"
          value=""
          autocomplete="off"
          autofocus
        />
        <button id="cb-phrase-btn" class="cb-phrase-btn">Build Concept Graph</button>
        <input id="cb-home-search" class="cb-home-search cb-home-search--inline" type="text" placeholder="Search phrases or pinyin…" autocomplete="off" />
      </div>
      <div id="cb-phrase-error" class="cb-phrase-error" style="display:none"></div>
    </div>
    <div class="cb-home-sections">
      <section class="cb-home-section">
        <div class="cb-home-section__header">
          <h2 class="cb-home-section__title">Phrases <span id="cb-phrase-count" class="cb-home-section__count"></span></h2>
        </div>
        <div id="cb-phrase-list" class="cb-phrase-list"><div class="cb-home-empty">Loading…</div></div>
      </section>
      <section class="cb-home-section">
        <div class="cb-home-section__header">
          <h2 class="cb-home-section__title">Concepts <span id="cb-concept-count" class="cb-home-section__count"></span></h2>
        </div>
        <p class="cb-home-section__hint">Sorted by how many phrases each character unlocks — learn the high-count ones first.</p>
        <div id="cb-concept-grid" class="cb-concept-grid"><div class="cb-home-empty">Loading…</div></div>
      </section>
    </div>
  `
  container.appendChild(main)

  const footer = document.createElement('footer')
  footer.className = 'cb-home-footer'
  footer.innerHTML = `<p class="cb-welcome__license">Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a> · Open source · <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache 2.0</a></p>`
  container.appendChild(footer)

  const input = main.querySelector('#cb-phrase-input')
  const btn = main.querySelector('#cb-phrase-btn')
  const errEl = main.querySelector('#cb-phrase-error')

  const phraseListEl = main.querySelector('#cb-phrase-list')
  const conceptGridEl = main.querySelector('#cb-concept-grid')
  const homeSearchEl = main.querySelector('#cb-home-search')
  const phraseCountEl = main.querySelector('#cb-phrase-count')
  const conceptCountEl = main.querySelector('#cb-concept-count')

  loadCatalog().then(catalog => {
    if (container._renderKey !== renderKey) return

    const phrases = catalog
      .map(d => ({ id: d.id, name: d.name || d.id, pinyin: d.pinyin, pinyin_initials: d.pinyin_initials }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    const concepts = _buildConceptIndex(catalog)

    phraseCountEl.textContent = `(${phrases.length})`
    conceptCountEl.textContent = `(${concepts.length})`

    _renderPhraseList(phraseListEl, phrases, '')
    _renderConceptGrid(conceptGridEl, concepts, '')

    homeSearchEl.addEventListener('input', () => {
      _renderPhraseList(phraseListEl, phrases, homeSearchEl.value)
      _renderConceptGrid(conceptGridEl, concepts, homeSearchEl.value)
    })
  }).catch(() => {
    if (container._renderKey !== renderKey) return
    phraseListEl.innerHTML = '<div class="cb-home-empty">Failed to load phrases.</div>'
    conceptGridEl.innerHTML = '<div class="cb-home-empty">Failed to load concepts.</div>'
  })

  async function submit() {
    const phrase = input.value.trim()
    if (!phrase) return

    btn.disabled = true
    btn.textContent = '生成中…'
    errEl.style.display = 'none'

    try {
      const res = await fetch('/api/phrase/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail)
      }
      const { domain_id } = await res.json()
      navigate(`/domain/${encodeURIComponent(domain_id)}`)
    } catch (err) {
      errEl.textContent = `错误：${err.message}`
      errEl.style.display = 'block'
      btn.disabled = false
      btn.textContent = '构建图'
    }
  }

  btn.addEventListener('click', submit)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit() })
}
