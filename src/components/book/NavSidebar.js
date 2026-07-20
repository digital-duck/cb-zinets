// Left navigation sidebar: source toggle (Catalog/Files), domain search +
// picker, model filter, book picker, and the TOC section container the page
// fills after a book loads.
import { loadCatalog, loadDomainDetail, matchesQuery } from '../../data/catalog.js'
import { parseModel, parseLevelLang, markKnownUrls } from './content.js'

// Returns [{ id, pinyin?, pinyin_initials? }] — pinyin fields power the
// sidebar's fuzzy phrase search (catalog source only; Files source has none).
async function loadDomains() {
  const src = localStorage.getItem('cb_book_browser_source') || 'catalog'
  if (src === 'files') {
    try {
      const r = await fetch('/api/browse/domains')
      if (!r.ok) throw new Error()
      const { domains } = await r.json()
      return domains.map(id => ({ id }))
    } catch (_) { return [] }
  }
  try {
    const catalog = await loadCatalog()
    return catalog.map(d => ({ id: d.id, pinyin: d.pinyin, pinyin_initials: d.pinyin_initials }))
  } catch (_) { return [] }
}

async function loadDomainBooks(domainId) {
  const src = localStorage.getItem('cb_book_browser_source') || 'catalog'
  if (src === 'files') {
    try {
      const r = await fetch(`/api/browse/${encodeURIComponent(domainId)}`)
      if (!r.ok) throw new Error()
      return r.json()
    } catch (_) { return { books: [], concepts: [] } }
  }
  try {
    // Prefer per-domain detail file (smaller, faster); fall back to full catalog
    const detail = await loadDomainDetail(domainId)
    const raw = detail ?? await (async () => {
      const catalog = await loadCatalog()
      return catalog.find(e => e.id === domainId) ?? {}
    })()
    const books = (raw.books || []).map(b => {
      const label = b.target.replace(/_/g, ' ').trim() || b.target
      const lang = parseLevelLang(b.file).lang
      return { file: b.file, label: lang ? `${label} (${lang})` : label, model: b.model || parseModel(b.file) }
    })
    const concepts = (raw.generated_concepts || []).map(c => {
      const lang = parseLevelLang(c.file).lang
      return { file: c.file, label: lang ? `${c.label} (${lang})` : c.label, model: c.model || parseModel(c.file) }
    })
    // Pre-populate existence cache so opening any listed file skips the HTTP check
    markKnownUrls(domainId, [...books, ...concepts])
    return { books, concepts }
  } catch (_) { return { books: [], concepts: [] } }
}

export function makeNavSidebar(initialDomain, initialFile) {
  const nav = document.createElement('nav')
  nav.className = 'cb-book-nav'
  nav.style.width = '260px'

  const h = document.createElement('div')
  h.className = 'cb-book-nav__title'
  h.textContent = 'Concept Books'
  nav.appendChild(h)

  const toggleRow = document.createElement('div')
  toggleRow.className = 'cb-book-nav__toggle'

  function _makeRadio(value, label) {
    const wrap = document.createElement('label')
    wrap.className = 'cb-book-nav__src-radio'
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'cb-src'
    input.value = value
    wrap.appendChild(input)
    wrap.appendChild(document.createTextNode(label))
    return { wrap, input }
  }

  const { wrap: catWrap, input: catRadio } = _makeRadio('catalog', 'Catalog')
  const { wrap: filesWrap, input: filesRadio } = _makeRadio('files', 'Files')
  toggleRow.appendChild(catWrap)
  toggleRow.appendChild(filesWrap)
  nav.appendChild(toggleRow)

  function _lbl(text) {
    const d = document.createElement('div')
    d.className = 'cb-book-nav__label'
    d.textContent = text
    return d
  }

  nav.appendChild(_lbl('Domain'))
  const domainSearch = document.createElement('input')
  domainSearch.type = 'text'
  domainSearch.placeholder = 'Search phrase or pinyin…'
  domainSearch.autocomplete = 'off'
  domainSearch.className = 'cb-book-nav__select'
  nav.appendChild(domainSearch)
  const domainSel = document.createElement('select')
  domainSel.className = 'cb-book-nav__select'
  nav.appendChild(domainSel)

  nav.appendChild(_lbl('Model'))
  const modelSel = document.createElement('select')
  modelSel.className = 'cb-book-nav__select'
  modelSel.innerHTML = '<option value="">— all —</option>'
  nav.appendChild(modelSel)

  nav.appendChild(_lbl('TOC Index'))
  const bookSel = document.createElement('select')
  bookSel.className = 'cb-book-nav__select'
  nav.appendChild(bookSel)

  const openBtn = document.createElement('button')
  openBtn.textContent = 'Open'
  openBtn.disabled = true
  openBtn.className = 'cb-book-nav__open'
  nav.appendChild(openBtn)

  function _src() { return localStorage.getItem('cb_book_browser_source') || 'catalog' }

  function _updateToggle() {
    const s = _src()
    catRadio.checked = s === 'catalog'
    filesRadio.checked = s === 'files'
  }

  function _updateOpen() {
    openBtn.disabled = !domainSel.value || !bookSel.value
  }

  let _allBooks = []
  let _allConcepts = []
  let _allDomains = []

  function _applyModelFilter() {
    const m = modelSel.value
    const filteredBooks = m ? _allBooks.filter(b => !b.model || b.model === m) : _allBooks
    bookSel.innerHTML = '<option value="">Select book…</option>'
    filteredBooks.forEach(b => {
      const o = document.createElement('option')
      o.value = b.file; o.textContent = b.label
      if (b.file === initialFile) o.selected = true
      bookSel.appendChild(o)
    })
    _updateOpen()
  }

  // Rebuild the Domain dropdown from _allDomains, filtered by the fuzzy
  // search box (hanzi / pinyin / initials — same matcher as Home search).
  // `preferred` keeps a selection alive across refilters when still visible.
  function _renderDomainOptions(preferred) {
    const q = domainSearch.value.trim()
    const filtered = q
      ? _allDomains.filter(d => matchesQuery(d.id, d.pinyin, d.pinyin_initials, q))
      : _allDomains
    domainSel.innerHTML = `<option value="">${filtered.length ? 'Select domain…' : 'No match'}</option>`
    ;[...filtered].sort((a, b) => a.id.localeCompare(b.id, 'zh')).forEach(({ id }) => {
      const o = document.createElement('option')
      o.value = id; o.textContent = id
      domainSel.appendChild(o)
    })
    if (preferred && filtered.some(d => d.id === preferred)) domainSel.value = preferred
    else if (filtered.length === 1) domainSel.value = filtered[0].id
  }

  async function _fillBooks(domainId) {
    bookSel.innerHTML = '<option value="">Loading…</option>'
    modelSel.innerHTML = '<option value="">Loading…</option>'
    _updateOpen()
    const { books, concepts } = await loadDomainBooks(domainId)
    _allBooks = books
    _allConcepts = concepts

    // Populate model dropdown with unique models found in this domain
    const modelSet = new Set()
    books.forEach(b => { if (b.model) modelSet.add(b.model) })
    concepts.forEach(c => { if (c.model) modelSet.add(c.model) })
    const sortedModels = [...modelSet].sort()
    modelSel.innerHTML = '<option value="">— all —</option>'
    sortedModels.forEach(m => {
      const o = document.createElement('option')
      o.value = m; o.textContent = m
      modelSel.appendChild(o)
    })
    // Auto-select the model from initialFile if present, else first available
    const fileModel = initialFile ? parseModel(initialFile) : ''
    if (fileModel && modelSet.has(fileModel)) modelSel.value = fileModel
    else if (sortedModels.length > 0) modelSel.value = sortedModels[0]

    _applyModelFilter()
  }

  function _resetBooks() {
    bookSel.innerHTML = '<option value="">—</option>'
    modelSel.innerHTML = '<option value="">— all —</option>'
    _allBooks = []
    _allConcepts = []
    _updateOpen()
  }

  async function _fillDomains() {
    domainSel.innerHTML = '<option value="">Loading…</option>'
    bookSel.innerHTML = '<option value="">—</option>'
    _updateOpen()
    _allDomains = await loadDomains()
    _renderDomainOptions(initialDomain)
    if (domainSel.value) await _fillBooks(domainSel.value)
    else _updateOpen()
  }

  _updateToggle()

  catRadio.addEventListener('change', () => {
    if (catRadio.checked) { localStorage.setItem('cb_book_browser_source', 'catalog'); _fillDomains() }
  })
  filesRadio.addEventListener('change', () => {
    if (filesRadio.checked) { localStorage.setItem('cb_book_browser_source', 'files'); _fillDomains() }
  })
  domainSearch.addEventListener('input', () => {
    const before = domainSel.value
    _renderDomainOptions(before)
    if (domainSel.value !== before) {
      if (domainSel.value) _fillBooks(domainSel.value)
      else _resetBooks()
    }
  })
  domainSel.addEventListener('change', () => {
    if (domainSel.value) _fillBooks(domainSel.value)
    else _resetBooks()
  })
  modelSel.addEventListener('change', _applyModelFilter)
  bookSel.addEventListener('change', _updateOpen)
  openBtn.addEventListener('click', () => {
    const file = bookSel.value
    const d = domainSel.value
    if (file && d) window.location.hash = `/book?domain=${encodeURIComponent(d)}&file=${encodeURIComponent(file)}`
  })

  // Separator between picker and TOC
  const tocSep = document.createElement('div')
  tocSep.style.cssText = 'border-top:1px solid rgba(255,255,255,0.15);margin:10px 0 8px;flex-shrink:0'
  nav.appendChild(tocSep)

  const tocSection = document.createElement('div')
  tocSection.style.cssText = 'flex:1;overflow-y:auto;min-height:0;display:flex;flex-direction:column'
  tocSection.innerHTML = '<div style="color:#90b4e8;font-size:11px;padding:4px 0">Open a book to see contents.</div>'
  nav.appendChild(tocSection)
  nav.tocSection = tocSection

  _fillDomains()
  return nav
}
