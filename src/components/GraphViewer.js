import { markKnown } from '../lib/contentExists.js'

// Graph-only viewer for the consolidated Graph-IDE page (graph left, content
// right — see pages/DomainGraph.js). Renders graph.html in an iframe with
// its own chrome (learning-path sidebar, explanation panel, in-iframe
// recenter button) suppressed — the parent app supplies its own top bar
// (search + Zoom + Re-Center) and the Notes drawer is relaid out below the
// graph as a resizable pane — while keeping the click → cb:nodeSelected
// bridge. Mirrors cb-chemistry-ide's GraphViewer.js (the origin of this
// pattern), adapted for cb-zinets' `books` catalog shape and graph layout
// query param.
export function GraphViewer(domain, { level = 'intro', lang = 'en' } = {}) {
  const { id: domainId, books = [], generated_concepts: genConcepts = [] } = domain

  // Catalog is the authority on what exists — seed the shared cache so known
  // books skip the HTTP sniff in the content panel.
  markKnown(books.filter(b => b.file).map(b => `${import.meta.env.BASE_URL}domains/${domainId}/${b.file}`))

  // graph.html's own node data has no pinyin field (that only lives in the
  // catalog's generated_concepts) — index it by node id so search can match
  // "san" against 散 the same way the Home/domain-picker search already
  // matches pinyin against a domain name.
  const _pinyinByNode = new Map()
  genConcepts.forEach(c => {
    if (c.name && c.pinyin && !_pinyinByNode.has(c.name)) _pinyinByNode.set(c.name, c.pinyin.toLowerCase())
  })

  const el = document.createElement('div')
  el.className = 'cb-graph-viewer'

  // ── Top bar: search (left) + Zoom/Re-Center (right) ─────────────────────
  const topBar = document.createElement('div')
  topBar.className = 'cb-graph-topbar'

  const searchWrap = document.createElement('div')
  searchWrap.className = 'cb-graph-topbar__search'
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.placeholder = 'Search character or pinyin…'
  searchInput.className = 'cb-graph-topbar__input'
  const searchBtn = document.createElement('button')
  searchBtn.type = 'button'
  searchBtn.textContent = 'Search'
  searchBtn.className = 'cb-btn cb-graph-topbar__search-btn'
  searchWrap.append(searchInput, searchBtn)

  const viewControls = document.createElement('div')
  viewControls.className = 'cb-graph-topbar__view-controls'

  const zoomOutBtn = document.createElement('button')
  zoomOutBtn.type = 'button'
  zoomOutBtn.textContent = 'Zoom −'
  zoomOutBtn.title = 'Zoom out'
  zoomOutBtn.className = 'cb-btn cb-graph-topbar__zoom'

  const zoomInBtn = document.createElement('button')
  zoomInBtn.type = 'button'
  zoomInBtn.textContent = 'Zoom +'
  zoomInBtn.title = 'Zoom in'
  zoomInBtn.className = 'cb-btn cb-graph-topbar__zoom'

  const recenterBtn = document.createElement('button')
  recenterBtn.type = 'button'
  recenterBtn.textContent = 'Re-Center'
  recenterBtn.className = 'cb-btn cb-graph-topbar__recenter'

  viewControls.append(zoomOutBtn, zoomInBtn, recenterBtn)
  topBar.append(searchWrap, viewControls)
  el.appendChild(topBar)

  const frame = document.createElement('iframe')
  frame.className = 'cb-graph-viewer__frame'
  const _graphLayout = localStorage.getItem('cb_graph_layout') || 'compact'
  frame.src = `${import.meta.env.BASE_URL}domains/${domainId}/output/graph.html?layout=${_graphLayout}`
  frame.title = `${domainId} concept graph`
  frame.setAttribute('allowfullscreen', '')

  function _doSearch() {
    const q = searchInput.value.trim().toLowerCase()
    if (!q) return
    const win = frame.contentWindow
    const nodes = win?.__cb_RAW?.nodes || []
    const match = nodes.find(n =>
      n.label.toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q) ||
      _pinyinByNode.get(n.id)?.includes(q)
    )
    searchInput.classList.remove('cb-graph-topbar__input--notfound')
    if (match) {
      win.selectNode?.(match.id)
      win.__cb_network?.focus?.(match.id, { scale: 1, animation: { duration: 400, easingFunction: 'easeInOutQuad' } })
    } else {
      searchInput.classList.add('cb-graph-topbar__input--notfound')
      setTimeout(() => searchInput.classList.remove('cb-graph-topbar__input--notfound'), 1200)
    }
  }
  searchBtn.addEventListener('click', _doSearch)
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); _doSearch() }
  })
  recenterBtn.addEventListener('click', () => {
    try { frame.contentWindow?.reCenterGraph?.() } catch (_) {}
  })
  const _ZOOM_MIN = 0.1
  const _ZOOM_MAX = 4
  function _zoom(factor) {
    try {
      const net = frame.contentWindow?.__cb_network
      if (!net) return
      const scale = Math.min(_ZOOM_MAX, Math.max(_ZOOM_MIN, net.getScale() * factor))
      net.moveTo({
        scale,
        animation: { duration: 150, easingFunction: 'easeInOutQuad' },
      })
    } catch (_) {}
  }
  zoomInBtn.addEventListener('click', () => _zoom(1.25))
  zoomOutBtn.addEventListener('click', () => _zoom(0.8))

  frame.addEventListener('load', () => {
    try {
      const win = frame.contentWindow
      if (!win) return

      win.eval('window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex; window.__cb_network = network')

      // ── 1. Broadcast concept list to parent ──
      const concepts = (win.__cb_RAW?.nodes || []).map(n => ({
        id: n.id, label: n.label, kind: n.kind, tier: n.tier ?? 0,
      }))
      window.dispatchEvent(new CustomEvent('cb:graphLoaded', { detail: { concepts } }))

      // ── 2. Patch handleSelect → emit cb:nodeSelected ──
      const _orig = win.handleSelect
      win.handleSelect = function (nodeId) {
        _orig.call(win, nodeId)
        const node = win.__cb_nodeIndex?.[nodeId]
        if (node) {
          window.dispatchEvent(new CustomEvent('cb:nodeSelected', { detail: { nodeId, node } }))
        }
      }

      // ── 3. Hide the learning-path/explanation chrome + in-iframe recenter
      // button (superseded by the top bar above), relay out Notes ──
      _injectLayout(frame.contentDocument)

      // ── 4. Apply graph layout preference (runs after vis.js afterDrawing) ──
      if (_graphLayout === 'hierarchical' && win.network) {
        win.eval(`
          network.setOptions({ layout: { hierarchical: {
            enabled: true, direction: 'UD', sortMethod: 'directed',
            levelSeparation: 120, nodeSpacing: 180
          }}});
          network.fit({ animation: false });
        `)
      }
    } catch (_) { /* cross-origin safety */ }
  })

  el.appendChild(frame)

  el.selectNode = (nodeId) => {
    try { frame.contentWindow?.selectNode?.(nodeId) } catch (_) {}
  }

  // Returns { nodeId, node, path: [{id,label,kind}, ...] } for the given
  // node, reusing graph.html's own getAncestors()/nodeIndex (same-origin)
  // instead of reimplementing prerequisite-walking in the parent app.
  el.getPath = (nodeId) => {
    try {
      const win = frame.contentWindow
      const node = win?.__cb_nodeIndex?.[nodeId]
      if (!node) return null
      const ancestorIds = win.getAncestors ? [...win.getAncestors(nodeId)] : []
      const path = ancestorIds.map(id => win.__cb_nodeIndex[id]).filter(Boolean)
      return { nodeId, node, path }
    } catch (_) { return null }
  }

  return el
}

// ── Layout: hide path/explain panels + in-iframe recenter button, split
// graph/Notes as a fixed-by-default-but-resizable 80/20 pane ──────────────

function _injectLayout(doc) {
  if (doc.querySelector('#cb-ide-layout')) return

  const style = doc.createElement('style')
  style.id = 'cb-ide-layout'
  style.textContent = `
    #path-sidebar, #explain-panel, .graph-recenter-btn { display: none !important; }
    .app {
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
    }
    #graph-panel { flex: 0 0 80%; min-height: 0; border-bottom: none !important; }
    #notes-sidebar {
      flex: 1;
      min-height: 0;
      width: 100% !important;
      border-left: none !important;
      border-top: 1px solid rgba(0,0,0,0.12) !important;
      overflow-y: auto !important;
      display: flex;
      flex-direction: column;
    }
    /* One-line entry — leaves more room for the notes history list below,
       instead of the default fixed 100px textarea. */
    #notes-textarea {
      flex: 0 0 auto !important;
      height: 32px !important;
      padding: 6px 12px !important;
    }
    .cb-notes-gutter {
      height: 6px; flex-shrink: 0; cursor: row-resize;
      background: rgba(0,0,0,0.1); touch-action: none;
      transition: background 0.15s;
    }
    .cb-notes-gutter:hover, .cb-notes-gutter:active { background: #60a5fa; }
  `
  doc.head.appendChild(style)

  const graphPanel = doc.querySelector('#graph-panel')
  const notesSidebar = doc.querySelector('#notes-sidebar')
  const app = doc.querySelector('.app')
  if (graphPanel && notesSidebar && app && !doc.querySelector('.cb-notes-gutter')) {
    const gutter = doc.createElement('div')
    gutter.className = 'cb-notes-gutter'
    gutter.title = 'Drag to resize'
    graphPanel.insertAdjacentElement('afterend', gutter)
    _wireVerticalResize(gutter, graphPanel, app)
  }
}

// Drag the gutter to resize the graph/Notes split within the iframe's own
// document — safe to use plain pointer capture here (no cross-document
// concerns) since both panes and the gutter live in the same document.
function _wireVerticalResize(gutter, graphPanel, app) {
  const MIN = 0.3
  const MAX = 0.92

  gutter.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    gutter.setPointerCapture(e.pointerId)

    const onMove = (moveEvent) => {
      const rect = app.getBoundingClientRect()
      const pct = Math.min(MAX, Math.max(MIN, (moveEvent.clientY - rect.top) / rect.height))
      graphPanel.style.flex = `0 0 ${(pct * 100).toFixed(2)}%`
    }
    const onUp = (upEvent) => {
      gutter.releasePointerCapture(upEvent.pointerId)
      gutter.removeEventListener('pointermove', onMove)
      gutter.removeEventListener('pointerup', onUp)
      gutter.removeEventListener('pointercancel', onUp)
    }
    gutter.addEventListener('pointermove', onMove)
    gutter.addEventListener('pointerup', onUp)
    gutter.addEventListener('pointercancel', onUp)
  })
}
