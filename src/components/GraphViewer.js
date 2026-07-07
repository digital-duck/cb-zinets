const _LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
]

const _LEVELS = ['intro', 'core', 'college', 'research']

import { relocalize, variantHtmlDir } from '../lib/paths.js'
import { contentExists, markKnown } from '../lib/contentExists.js'

export function GraphViewer(domain, { level = 'intro', lang = 'en' } = {}) {
  const { id: domainId, books = [], generated_concepts: genConcepts = [], capstone } = domain

  // Catalog is the authority on what exists — seed the shared cache so known
  // books skip the HTTP sniff in _openBook.
  markKnown(books.filter(b => b.file).map(b => `${import.meta.env.BASE_URL}domains/${domainId}/${b.file}`))

  const el = document.createElement('div')
  el.className = 'cb-graph-viewer'

  const frame = document.createElement('iframe')
  frame.className = 'cb-graph-viewer__frame'
  const _graphLayout = localStorage.getItem('cb_graph_layout') || 'compact'
  frame.src = `${import.meta.env.BASE_URL}domains/${domainId}/output/graph.html?layout=${_graphLayout}`
  frame.title = `${domainId} concept graph`
  frame.setAttribute('allowfullscreen', '')

  frame.addEventListener('load', () => {
    try {
      const win = frame.contentWindow
      if (!win) return

      win.eval('window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex')
      // Concept Detail loads the node's page from THIS domain's html dir —
      // the concept_X.html symlinks there resolve to the right
      // (level, language, model) canonical, so the pane always matches the
      // domain being viewed (never another domain's baked TOC).
      const _detailBase = (lvl, lng, mdl) =>
        `${import.meta.env.BASE_URL}domains/${domainId}/${variantHtmlDir(lvl, lng, mdl || 'gemma4')}/`
      win.__cb_CONCEPTS_BASE = _detailBase(level, lang, 'gemma4')

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

      // ── 3. Apply dark sidebar theme ──
      _injectSidebarTheme(win, frame.contentDocument)

      // ── 4. Inject sidebar sections ──
      // Insert Concept Books first (lands after path-header), then Generate
      // (lands between path-header and Concept Books, putting it on top).
      _injectConceptBooksSection(win, frame.contentDocument, domainId, books, genConcepts, level, lang)
      _injectGenerateSection(win, frame.contentDocument, domainId, capstone, level, lang, books)

      // ── 4b. Keep Concept Detail in sync with the model/level/lang pickers ──
      const _doc = frame.contentDocument
      const _pickers = ['#cb-model-sel', '#cb-level-sel', '#cb-lang-sel']
        .map(s => _doc.querySelector(s))
      const _updateDetailBase = () => {
        const [mdl, lvl, lng] = _pickers.map(p => p && p.value)
        win.__cb_CONCEPTS_BASE = _detailBase(lvl || level, lng || lang, mdl)
      }
      _pickers.forEach(p => p && p.addEventListener('change', _updateDetailBase))
      _updateDetailBase()

      // ── 4c. Show only the concept's content in the detail iframe — hide the
      // page's own sidebar TOC (concept pages are shared canonicals; their
      // baked TOC belongs to whichever domain first generated them).
      const _hideNav = ifr => {
        try {
          const d = ifr.contentDocument
          if (!d || !d.head || d.getElementById('cb-detail-clean')) return
          const st = d.createElement('style')
          st.id = 'cb-detail-clean'
          st.textContent = 'nav.toc{display:none!important}' +
            '.page{grid-template-columns:1fr!important}' +
            'main{padding:20px 24px!important;max-width:none!important}'
          d.head.appendChild(st)
        } catch (_) {}
      }
      new win.MutationObserver(() => {
        const ifr = _doc.getElementById('concept-iframe')
        if (ifr && !ifr._cbCleaned) {
          ifr._cbCleaned = true
          ifr.addEventListener('load', () => _hideNav(ifr))
          _hideNav(ifr)
        }
      }).observe(_doc.body, { childList: true, subtree: true })

      // ── 5. Apply graph layout preference (runs after vis.js afterDrawing) ──
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

  return el
}

// ── Sidebar theme ─────────────────────────────────────────────────────────────

function _injectSidebarTheme(win, doc) {
  if (doc.querySelector('#cb-sidebar-theme')) return

  const style = doc.createElement('style')
  style.id = 'cb-sidebar-theme'
  style.textContent = `
    .app { grid-template-columns: 260px 1fr 220px !important; }
    #path-sidebar {
      background: #1e3a5f !important;
      color: #e8f0fe !important;
      border-right-color: rgba(255,255,255,0.12) !important;
    }
    #path-header { border-bottom-color: rgba(255,255,255,0.12) !important; }
    #path-header h1 { color: #90b4e8 !important; }
    #path-header .domain-name { color: #a8c8f0 !important; }
    #path-count { color: #90b4e8 !important; }
    #path-steps .hint { color: #90b4e8 !important; }
    .step-item:hover { background: rgba(255,255,255,0.07) !important; }
    .step-item.active { background: rgba(74,144,217,0.25) !important; border-left-color: #60a5fa !important; }
    .step-item.target { background: rgba(76,175,80,0.18) !important; border-left-color: #4caf50 !important; }
    .step-label { color: #e8f0fe !important; }
    .step-def { color: #90b4e8 !important; }
    .step-num { color: #90b4e8 !important; }
    .step-item.target .step-num { color: #6fcf73 !important; }
    /* Fix node-type badge colors to match the graph */
    .primitive-k { background: #fffde7 !important; color: #795548 !important; }
    .concept-k   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .application-k { background: #fce4ec !important; color: #c62828 !important; }
  `
  doc.head.appendChild(style)

  // Node-type legend injected above #path-steps
  const pathSteps = doc.querySelector('#path-steps')
  if (pathSteps && !doc.querySelector('#cb-node-legend')) {
    const legend = doc.createElement('div')
    legend.id = 'cb-node-legend'
    legend.style.cssText = 'padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0'
    legend.innerHTML = `
      <div style="font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:6px">Node Types</div>
      <div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:8px">
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fffde7;border:1px solid #795548;border-radius:2px;flex-shrink:0"></span>Primitive
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#e8f5e9;border:1px solid #2e7d32;border-radius:50%;flex-shrink:0"></span>Concept
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fce4ec;border:1px solid #c62828;border-radius:2px;flex-shrink:0"></span>Application
        </span>
      </div>
    `
    pathSteps.insertAdjacentElement('beforebegin', legend)
  }

  // "Powered by SPL" footer at the very bottom of the sidebar
  const sidebar = doc.querySelector('#path-sidebar')
  if (sidebar && !doc.querySelector('#cb-spl-credit')) {
    const credit = doc.createElement('div')
    credit.id = 'cb-spl-credit'
    credit.style.cssText = 'padding:10px 12px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif;flex-shrink:0'
    credit.innerHTML = 'Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>'
    sidebar.appendChild(credit)
  }
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const _SEL = [
  'flex:1', 'min-width:0', 'padding:5px 6px',
  'border:1px solid rgba(255,255,255,0.3)', 'border-radius:5px',
  'background:#fff', 'color:#2a2a2a', 'font-size:12px',
  'font-family:system-ui,sans-serif', 'box-sizing:border-box',
].join(';')

const _OPEN_BTN = [
  'flex-shrink:0', 'padding:5px 10px', 'background:#2563eb', 'color:#fff',
  'border:none', 'border-radius:5px', 'font-size:12px', 'cursor:pointer',
  'font-family:system-ui,sans-serif',
].join(';')

const _OPEN_BTN_DIS = _OPEN_BTN + ';opacity:.4;cursor:default'

const _ROW = 'display:flex;gap:6px;align-items:center;margin-bottom:10px'

const _SUB_LABEL = [
  'font-size:10px', 'letter-spacing:.06em', 'text-transform:uppercase',
  'color:#90b4e8', 'font-weight:700', 'margin-bottom:4px',
].join(';')

const _SECTION_BG = 'padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f'

const _SECTION_TITLE = 'font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px'

// ── Concept Books section ─────────────────────────────────────────────────────

const _localizePath = relocalize

// Catalog entries carry one row per (target/concept, model) — e.g. "目" shows
// up once for gemma3, gemma4 and sonnet each. The TOC Index / Concept pickers
// only need one row per target: _localizePath already re-resolves the file to
// whatever model is currently selected, so the model on the kept row is just
// a starting template. Prefer the project's default_model (gemma4, see
// api/config.py) when a target has it, otherwise keep whichever comes first.
function _dedupeByKey(items, keyFn, preferredModel) {
  const byKey = new Map()
  for (const item of items) {
    const key = keyFn(item)
    const existing = byKey.get(key)
    if (!existing || (item.model === preferredModel && existing.model !== preferredModel)) {
      byKey.set(key, item)
    }
  }
  return [...byKey.values()]
}

function _injectConceptBooksSection(win, doc, domainId, books, genConcepts, level, lang) {
  const pathHeader = doc.querySelector('#path-header')
  if (!pathHeader || doc.querySelector('#cb-read')) return

  const sortedBooks = _dedupeByKey(books, b => b.target, 'gemma4')
    .sort((a, b) => a.target.localeCompare(b.target))
  const sortedConcepts = _dedupeByKey(genConcepts, c => c.name, 'gemma4')
    .sort((a, b) => a.label.localeCompare(b.label))

  const _WARN_STYLE = 'margin-top:4px;font-size:11px;color:#fca5a5;display:none'

  const bookRowHtml = sortedBooks.length > 0 ? `
    <div style="${_SUB_LABEL}">TOC Index</div>
    <div style="${_ROW}">
      <select id="cb-book-sel" style="${_SEL}">
        <option value="">Select book…</option>
        ${sortedBooks.map(b => {
          const label = b.target.replace(/_/g, ' ')
          return `<option value="${_localizePath(b.file, level, lang, b.model || '')}" data-orig="${b.file}" data-model="${b.model || ''}">${label}</option>`
        }).join('')}
      </select>
      <button id="cb-book-btn" disabled style="${_OPEN_BTN_DIS}">Open</button>
    </div>
    <div id="cb-book-warn" style="${_WARN_STYLE}"></div>
  ` : ''

  const conceptRowHtml = sortedConcepts.length > 0 ? `
    <div style="${_SUB_LABEL}">Concept</div>
    <div style="${_ROW}">
      <select id="cb-cpt-sel" style="${_SEL}">
        <option value="">Select concept…</option>
        ${sortedConcepts.map(c => {
          return `<option value="${_localizePath(c.file, level, lang, c.model || '')}" data-orig="${c.file}" data-model="${c.model || ''}">${c.label}</option>`
        }).join('')}
      </select>
      <button id="cb-cpt-btn" disabled style="${_OPEN_BTN_DIS}">Open</button>
    </div>
    <div id="cb-cpt-warn" style="${_WARN_STYLE}"></div>
  ` : ''

  const div = doc.createElement('div')
  div.id = 'cb-read'
  div.style.cssText = _SECTION_BG
  div.innerHTML = `
    <div style="${_SECTION_TITLE}">Concept Books</div>
    ${bookRowHtml}
    ${conceptRowHtml}
  `
  pathHeader.insertAdjacentElement('afterend', div)

  function _showWarn(warnEl, msg) {
    warnEl.textContent = msg
    warnEl.style.display = 'block'
  }

  function _openBook(relPath, warnEl) {
    const url = `${import.meta.env.BASE_URL}domains/${domainId}/${relPath}`
    contentExists(url).then(exists => {
      if (exists) {
        window.location.hash = `/book?domain=${domainId}&file=${encodeURIComponent(relPath)}`
      } else {
        _showWarn(warnEl, 'No content available for this level/language combination.')
      }
    })
  }

  // Listen for settings-change events from generate section
  doc.addEventListener('cb:settings-change', ({ detail: { level: lvl, lang: lng } }) => {
    div.querySelectorAll('#cb-book-sel option[data-orig]').forEach(opt => {
      opt.value = _localizePath(opt.dataset.orig, lvl, lng, opt.dataset.model)
    })
    div.querySelectorAll('#cb-cpt-sel option[data-orig]').forEach(opt => {
      opt.value = _localizePath(opt.dataset.orig, lvl, lng, opt.dataset.model)
    })
    if (doc.querySelector('#cb-book-warn')) doc.querySelector('#cb-book-warn').style.display = 'none'
    if (doc.querySelector('#cb-cpt-warn')) doc.querySelector('#cb-cpt-warn').style.display = 'none'
  })

  if (sortedBooks.length > 0) {
    const sel = div.querySelector('#cb-book-sel')
    const btn = div.querySelector('#cb-book-btn')
    const warn = div.querySelector('#cb-book-warn')
    sel.addEventListener('change', () => {
      btn.disabled = !sel.value
      btn.style.cssText = sel.value ? _OPEN_BTN : _OPEN_BTN_DIS
      warn.style.display = 'none'
    })
    btn.addEventListener('click', () => {
      if (!sel.value) return
      _openBook(sel.value, warn)
    })
  }

  if (sortedConcepts.length > 0) {
    const sel = div.querySelector('#cb-cpt-sel')
    const btn = div.querySelector('#cb-cpt-btn')
    const warn = div.querySelector('#cb-cpt-warn')
    sel.addEventListener('change', () => {
      btn.disabled = !sel.value
      btn.style.cssText = sel.value ? _OPEN_BTN : _OPEN_BTN_DIS
      warn.style.display = 'none'
    })
    btn.addEventListener('click', () => {
      if (!sel.value) return
      _openBook(sel.value, warn)
    })
  }
}

// ── Generate Book section ─────────────────────────────────────────────────────

function _injectGenerateSection(win, doc, domainId, capstone, level, lang, books = []) {
  const pathHeader = doc.querySelector('#path-header')
  if (!pathHeader || doc.querySelector('#cb-gen')) return

  const _SEL_FULL = [
    'width:100%', 'padding:5px 8px', 'border:1px solid rgba(255,255,255,0.3)', 'border-radius:5px',
    'background:#fff', 'color:#2a2a2a', 'font-size:12px', 'margin-bottom:6px',
    'font-family:system-ui,sans-serif',
  ].join(';')

  const div = doc.createElement('div')
  div.id = 'cb-gen'
  div.style.cssText = _SECTION_BG

  div.innerHTML = `
    <div style="${_SECTION_TITLE}">Generate Book</div>
    <select id="cb-target-sel" style="${_SEL_FULL}">
      <option value="">Select target concept…</option>
    </select>
    <select id="cb-model-sel" style="${_SEL_FULL}">
      <option value="gemma3">gemma3 — local (Ollama)</option>
      <option value="gemma4" selected>gemma4 — local, default (Ollama)</option>
      <option value="sonnet">sonnet — premium (Claude API)</option>
      <option value="haiku">haiku — fast, premium (Claude API)</option>
      <option value="opus">opus — best quality (Claude API)</option>
    </select>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <select id="cb-level-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${_LEVELS.map(l => `<option value="${l}" ${l === level ? 'selected' : ''}>${l.charAt(0).toUpperCase() + l.slice(1)}</option>`).join('')}
      </select>
      <select id="cb-lang-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${_LANGUAGES.map(l => `<option value="${l.code}" ${l.code === lang ? 'selected' : ''}>${l.label}</option>`).join('')}
      </select>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:11px;color:#90b4e8;margin-bottom:6px;font-family:system-ui,sans-serif;cursor:pointer">
      <input type="checkbox" id="cb-skip-cache"> Skip cache
    </label>
    <div style="display:flex;gap:6px">
      <button id="cb-gen-btn" disabled
        style="flex:1;padding:6px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        Generate
      </button>
      <button id="cb-pdf-btn" disabled
        style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        PDF
      </button>
    </div>
    <div id="cb-pdf-result" style="display:none;gap:6px;margin-top:6px"></div>
    <div style="position:relative">
      <pre id="cb-gen-log"
        style="display:none;margin-top:8px;font-size:10px;line-height:1.5;color:#e8f0fe;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;max-height:160px;overflow-y:auto;white-space:pre-wrap;font-family:Menlo,Consolas,monospace"></pre>
      <button id="cb-gen-copy"
        style="display:none;position:absolute;top:12px;right:4px;padding:2px 8px;font-size:10px;background:#2563eb;border:none;border-radius:3px;cursor:pointer;font-family:system-ui,sans-serif;color:#fff">Copy</button>
    </div>
  `

  pathHeader.insertAdjacentElement('afterend', div)

  const sel = div.querySelector('#cb-target-sel')
  const modelSel = div.querySelector('#cb-model-sel')
  const levelSel = div.querySelector('#cb-level-sel')
  const langSel = div.querySelector('#cb-lang-sel')
  const skipCacheChk = div.querySelector('#cb-skip-cache')
  const btn = div.querySelector('#cb-gen-btn')
  const pdfBtn = div.querySelector('#cb-pdf-btn')
  const pdfResult = div.querySelector('#cb-pdf-result')
  const log = div.querySelector('#cb-gen-log')
  const copyBtn = div.querySelector('#cb-gen-copy')

  // Notify concept books section when level/lang change
  function fireSettingsChange() {
    doc.dispatchEvent(new CustomEvent('cb:settings-change', {
      detail: { level: levelSel.value, lang: langSel.value },
    }))
  }
  levelSel.addEventListener('change', fireSettingsChange)
  langSel.addEventListener('change', fireSettingsChange)

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(log.textContent).then(() => {
      copyBtn.textContent = 'Copied!'
      setTimeout(() => { copyBtn.textContent = 'Copy' }, 1500)
    })
  })

  // Populate target concepts sorted alphabetically
  const sorted = (win.__cb_RAW?.nodes || [])
    .filter(n => n.kind !== 'primitive')
    .sort((a, b) => a.label.localeCompare(b.label))

  sorted.forEach(c => {
    const opt = doc.createElement('option')
    opt.value = c.id
    opt.textContent = c.label
    if (c.id === capstone) opt.selected = true
    sel.appendChild(opt)
  })

  if (sel.value) { btn.disabled = false; pdfBtn.disabled = false }

  sel.addEventListener('change', () => {
    btn.disabled = !sel.value
    pdfBtn.disabled = !sel.value
    pdfBtn.textContent = 'PDF'
    pdfBtn.style.background = '#16a34a'
    pdfResult.style.display = 'none'
    pdfResult.innerHTML = ''
  })

  pdfBtn.addEventListener('click', async () => {
    const target = sel.value
    if (!target) return
    const lvl = levelSel.value
    const lng = langSel.value
    const mdl = modelSel.value

    pdfBtn.disabled = true
    pdfBtn.textContent = 'Generating…'
    pdfBtn.style.background = '#ea580c'

    try {
      const url = `/api/pdf?domain=${encodeURIComponent(domainId)}&target=${encodeURIComponent(target)}&level=${encodeURIComponent(lvl)}&language=${encodeURIComponent(lng)}&model=${encodeURIComponent(mdl)}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) throw new Error(data.detail || 'PDF generation failed')

      const base = import.meta.env.BASE_URL
      const pdfUrl = `${base}domains/${domainId}/${data.file}`

      pdfBtn.textContent = 'PDF ✓'
      pdfBtn.disabled = false
      pdfResult.innerHTML = `
        <a href="${pdfUrl}" download
           style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ⬇ Download
        </a>
        <a href="${pdfUrl}" target="_blank"
           style="flex:1;padding:6px 10px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ↗ Open
        </a>
      `
      pdfResult.style.display = 'flex'
    } catch (err) {
      pdfBtn.textContent = 'Error'
      pdfBtn.style.background = '#dc2626'
      pdfBtn.title = err.message
      setTimeout(() => {
        pdfBtn.textContent = 'PDF'
        pdfBtn.style.background = '#16a34a'
        pdfBtn.disabled = false
      }, 3000)
    }
  })

  btn.addEventListener('click', async () => {
    const target = sel.value
    if (!target) return
    const model = modelSel.value
    const lvl = levelSel.value
    const lng = langSel.value
    const skipCache = skipCacheChk.checked

    btn.disabled = true
    btn.textContent = 'Queuing…'
    btn.style.background = '#ea580c'
    log.style.display = 'block'
    copyBtn.style.display = 'block'
    log.textContent = ''

    let taskId
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainId, target, level: lvl, language: lng, model, skip_cache: skipCache }),
      })
      if (!res.ok) throw new Error(`Queue failed: ${res.status}`)
      const data = await res.json()
      taskId = data.task_id
      btn.textContent = 'Generating…'
    } catch (err) {
      log.textContent = `✗ ${err.message}\n  Run: bash scripts/start-api.sh`
      btn.disabled = false
      btn.textContent = 'Retry'
      btn.style.background = '#dc2626'
      return
    }

    const es = new win.EventSource(`/api/tasks/${taskId}/stream`)

    es.addEventListener('log', e => {
      const { message } = JSON.parse(e.data)
      log.textContent += message + '\n'
      log.scrollTop = log.scrollHeight
    })

    es.addEventListener('done', e => {
      es.close()
      const data = JSON.parse(e.data)
      const lvl = levelSel.value
      const lng = langSel.value
      const mdl = data.model || modelSel.value

      log.textContent += '\n✓ Done'
      btn.textContent = 'Generate'
      btn.style.background = '#2563eb'
      btn.disabled = false

      const bar = win.document.createElement('div')
      bar.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap'

      if (data.log_url) {
        const logLink = win.document.createElement('a')
        logLink.href = data.log_url
        logLink.target = '_blank'
        logLink.textContent = 'View log'
        logLink.style.cssText = 'font-size:11px;color:#93c5fd;text-decoration:underline;cursor:pointer;font-family:system-ui,sans-serif;white-space:nowrap'
        bar.appendChild(logLink)
      }

      const bookBtn = win.document.createElement('button')
      bookBtn.textContent = 'Open Book →'
      bookBtn.style.cssText = 'flex:1;padding:5px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif'
      bookBtn.onclick = () => {
        const relPath = `${variantHtmlDir(lvl, lng, mdl)}/book_${data.target}.html`
        win.parent.location.hash = `#/book?domain=${data.domain}&file=${encodeURIComponent(relPath)}`
      }
      bar.appendChild(bookBtn)
      div.appendChild(bar)
    })

    es.addEventListener('gen_error', e => {
      es.close()
      log.textContent += `\n✗ ${JSON.parse(e.data).message}`
      btn.disabled = false
      btn.textContent = 'Retry'
      btn.style.background = '#dc2626'
    })

    es.onerror = () => {
      if (es.readyState === win.EventSource.CLOSED) return
      es.close()
      log.textContent += '\n✗ Connection lost'
      btn.disabled = false
      btn.textContent = 'Retry'
      btn.style.background = '#dc2626'
    }
  })
}
