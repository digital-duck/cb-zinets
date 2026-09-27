import { loadCatalog, matchesQuery } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { GraphViewer } from '../components/GraphViewer.js'
import { BookContent } from './BookContent.js'
import { makeGenerateBar } from '../components/book/GenerateBar.js'
import { canonicalConceptRel as conceptRel, bookRel } from '../lib/paths.js'
import { getContentLang } from './Settings.js'
import { parseLevelLang, parseModel, conceptFromFile } from '../components/book/content.js'

// The consolidated Graph-IDE page: graph on the left, generated content on
// the right, replacing the old separate Graph (`/domain/:id`) and Content
// (`/book?domain=&file=`) pages. `file` is optional — set when arriving via
// a direct book/concept link (Home page tiles, the legacy `/book` route, a
// shared URL) so that page opens pre-selected on the right instead of the
// usual empty "click a node" state.
export async function DomainGraph(container, { id, file: initialFile } = {}) {
  // The cb:graphLoaded/cb:nodeSelected listeners below are added to
  // `window` (GraphViewer dispatches there, not on the iframe/container, so
  // the parent app can hear it) — they must be torn down when navigating to
  // a different domain, otherwise the *previous* domain's listeners (with
  // their own now-stale `panel`/`genBar` closures) keep firing alongside
  // the new ones on every future node click.
  container._abortController?.abort()
  const abortController = new AbortController()
  container._abortController = abortController

  container.innerHTML = ''
  container.className = ''
  const renderKey = Symbol()
  container._renderKey = renderKey

  let domain = null
  let catalog = []
  try {
    catalog = await loadCatalog()
    if (id) domain = catalog.find(d => d.id === id) ?? { id, name: id, has_book: false, books: [], generated_concepts: [], capstone: null }
  } catch (_) {}

  if (container._renderKey !== renderKey) return

  // Inner page wrapper — keeps layout styles off the shared #app container
  const page = document.createElement('div')
  page.style.cssText = 'display:flex;flex-direction:column;height:100vh;overflow:hidden'
  container.appendChild(page)

  page.appendChild(Header({ domainName: domain?.name || '' }))

  // Domain picker bar
  const pickerBar = document.createElement('div')
  pickerBar.className = 'cb-domain-picker-bar'

  const lbl = document.createElement('span')
  lbl.className = 'cb-domain-picker-bar__label'
  lbl.textContent = 'Domain'
  pickerBar.appendChild(lbl)

  // Fuzzy search box (hanzi / pinyin / initials — same matcher as Home and
  // the book browser) filters the dropdown; Enter opens the first match.
  const search = document.createElement('input')
  search.type = 'text'
  search.placeholder = 'Search phrase or pinyin…'
  search.autocomplete = 'off'
  search.className = 'cb-domain-picker-bar__select'
  pickerBar.appendChild(search)

  const sel = document.createElement('select')
  sel.className = 'cb-domain-picker-bar__select'

  function renderOptions() {
    const q = search.value.trim()
    const filtered = q
      ? catalog.filter(d => matchesQuery(d.name || d.id, d.pinyin, d.pinyin_initials, q))
      : catalog
    sel.innerHTML = ''
    const ph = document.createElement('option')
    ph.value = ''
    ph.textContent = filtered.length ? 'Select domain…' : 'No match'
    sel.appendChild(ph)
    ;[...filtered].sort((a, b) => (a.id).localeCompare(b.id, 'zh')).forEach(d => {
      const opt = document.createElement('option')
      opt.value = d.id
      opt.textContent = d.name || d.id
      if (d.id === id) opt.selected = true
      sel.appendChild(opt)
    })
    return filtered
  }

  let filtered = renderOptions()

  search.addEventListener('input', () => { filtered = renderOptions() })
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter' && filtered.length) {
      window.location.hash = `/domain/${encodeURIComponent(filtered[0].id)}`
    }
  })

  function _load() {
    if (sel.value) window.location.hash = `/domain/${encodeURIComponent(sel.value)}`
  }
  sel.addEventListener('change', _load)

  pickerBar.appendChild(sel)

  const loadBtn = document.createElement('button')
  loadBtn.type = 'button'
  loadBtn.className = 'cb-btn cb-btn--primary cb-domain-picker-bar__load'
  loadBtn.textContent = 'Load'
  loadBtn.addEventListener('click', _load)
  pickerBar.appendChild(loadBtn)

  page.appendChild(pickerBar)

  if (!id || !domain) return

  if (domain.source) {
    const attr = document.createElement('div')
    attr.className = 'cb-attribution'
    attr.innerHTML = `Source: <a href="${domain.source.url}" target="_blank">${domain.source.title}</a> by ${domain.source.authors} (${domain.source.license}). ${domain.source.attribution}`
    page.appendChild(attr)
  }

  const level = domain.default_level || 'intro'
  const lang = getContentLang()

  const layout = document.createElement('main')
  layout.className = 'cb-ide-layout'

  const left = document.createElement('div')
  left.className = 'cb-ide-left'
  const initialSplit = parseFloat(localStorage.getItem('cb_ide_split')) || 40
  left.style.flex = `0 0 ${initialSplit}%`
  const graphViewer = GraphViewer(domain, { level, lang })
  left.appendChild(graphViewer)

  const gutter = document.createElement('div')
  gutter.className = 'cb-ide-gutter'
  gutter.title = 'Drag to resize'

  const right = document.createElement('div')
  right.className = 'cb-ide-right'

  // Non-primitive nodes are the same population the old graph-embedded
  // Generate dropdown offered — filled in once the graph reports back via
  // cb:graphLoaded (the node list isn't known until then).
  const genBarSlot = document.createElement('div')
  right.appendChild(genBarSlot)

  // BookContent() clears any inline style on mount and applies `.cb-book-embed`
  // itself (embedded:true) — that class already carries the flex/overflow
  // sizing this slot needs, so nothing has to be set here first.
  const contentSlot = document.createElement('div')
  right.appendChild(contentSlot)

  const panel = BookContent(contentSlot, { domain: id, file: initialFile }, {
    embedded: true,
    graphViewer,
    // A TOC-entry click (as opposed to a real graph click) changes what's
    // displayed without re-anchoring the graph — keep the Generate target
    // in sync with it too, so Generate always applies to whatever's on
    // screen, not whatever node was last clicked on the graph itself.
    onNodeChange: nodeId => genBar?.setTarget(nodeId),
  })

  layout.append(left, gutter, right)
  page.appendChild(layout)
  _wireResize(gutter, left, layout, abortController.signal)

  let genBar = null
  window.addEventListener('cb:graphLoaded', e => {
    if (genBar) return // one graph load per page mount
    // Unlike the base concept-book template, cb-zinets generates a full
    // concept page for primitive characters too (each elemental hanzi gets
    // its own explanation, stroke widget, references) — excluding them here
    // left Generate/Export PDF permanently disabled for any primitive node,
    // even when it already had generated content sitting right there.
    const targets = e.detail.concepts || []
    genBar = makeGenerateBar(id, targets, {
      level, lang,
      onDone: relPath => panel.openFile(relPath),
      // The bar's own Model/Language selects are the single control row for
      // the whole panel (see GenerateBar.js) — changing either re-resolves
      // whatever's currently displayed under the new variant instead of
      // requiring a second, duplicate pair of pickers just for viewing.
      onViewChange: (model, lng) => panel.setViewParams({ model, lang: lng }),
      onRefresh: () => panel.refresh(),
    })
    genBarSlot.appendChild(genBar.bar)
    // Mounted at the bottom of the right column (below the content, not
    // between the controls and the content) — matches the other cb-*
    // concept-books' Generate log placement.
    right.appendChild(genBar.logWrap)

    // Arriving with a file already selected (e.g. a Home page character
    // tile, or any /book?file= deep link) bypasses the graph-click path
    // entirely, so the bar's Model/Language selects would otherwise stay
    // on the site default while the panel displays whatever variant that
    // file actually is — misleading when they don't match (e.g. content
    // panel showing a previously-generated Arabic page while the bar
    // still reads "English"). Sync the bar to the file's real variant
    // instead of the site default, and pre-select its node as the target.
    if (initialFile) {
      const { lang: flang } = parseLevelLang(initialFile)
      const fmodel = parseModel(initialFile)
      genBar.syncView({ model: fmodel, lang: flang })
      genBar.setTarget(conceptFromFile(initialFile))
    }
  }, { signal: abortController.signal })

  // Clicking a node opens its own concept page on the right (same default
  // convention the old inline "Concept Detail" preview used — gemma4 at the
  // domain's default level/language) and pre-selects it in the Generate bar
  // so Generate/PDF apply to whatever's currently open without hunting for
  // it in the dropdown.
  // A real graph click re-anchors the TOC (see BookContent.js `setAnchor`)
  // to this node's own prerequisite path and displays this node's content;
  // it also pre-selects it in the Generate bar so Generate/PDF apply to
  // whatever's currently open without hunting for it in the dropdown.
  window.addEventListener('cb:nodeSelected', e => {
    const { nodeId, node } = e.detail
    panel.setAnchor(nodeId, node)
    const model = genBar?.getModel() ?? 'sonnet'
    const file = nodeId.startsWith('phrase_')
      ? bookRel(level, lang, model, nodeId)
      : conceptRel(level, lang, model, nodeId)
    panel.openFile(file)
    genBar?.setTarget(nodeId)
  }, { signal: abortController.signal })
}

// Drag the gutter to resize the graph/content split. Left panel gets an
// explicit flex-basis (%) once dragged; right panel just fills what's left.
//
// Uses Pointer Events + setPointerCapture rather than window-level
// mousemove/mouseup: the left panel contains a cross-document <iframe>
// (the graph), and plain mousemove/mouseup listeners on `window` stop
// firing the instant the cursor moves over that iframe (events go to the
// iframe's own document instead) — which made dragging left "lose" the
// drag partway and drop the mouseup too. Pointer capture redirects all
// pointer events for this pointer to `gutter` regardless of what's
// visually underneath, so it keeps tracking correctly over the iframe.
function _wireResize(gutter, left, layout, signal) {
  const MIN = 0.2
  const MAX = 0.8

  gutter.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    gutter.setPointerCapture(e.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    let lastPct = null
    const onMove = (moveEvent) => {
      const rect = layout.getBoundingClientRect()
      const pct = Math.min(MAX, Math.max(MIN, (moveEvent.clientX - rect.left) / rect.width))
      lastPct = pct
      left.style.flex = `0 0 ${(pct * 100).toFixed(2)}%`
    }
    const onUp = (upEvent) => {
      gutter.releasePointerCapture(upEvent.pointerId)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (lastPct != null) localStorage.setItem('cb_ide_split', (lastPct * 100).toFixed(2))
      gutter.removeEventListener('pointermove', onMove)
      gutter.removeEventListener('pointerup', onUp)
      gutter.removeEventListener('pointercancel', onUp)
    }
    gutter.addEventListener('pointermove', onMove, { signal })
    gutter.addEventListener('pointerup', onUp, { signal })
    gutter.addEventListener('pointercancel', onUp, { signal })
  }, { signal })
}
