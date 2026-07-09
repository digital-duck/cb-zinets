import { getLocale } from '../i18n.js'
import { LANGUAGES } from '../components/LanguagePicker.js'
import { loadCatalog, loadDomainDetail, matchesQuery } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { getStoredUser, authHeaders } from '../services/auth.js'
import { parseVariant, variantHtmlDir, canonicalConceptRel } from '../lib/paths.js'
import { contentExists, markKnown } from '../lib/contentExists.js'

const LEVELS = ['intro', 'core', 'college', 'research']

const MODELS = [
  { value: 'default', label: '— default (sonnet) —' },
  { value: 'gemma3', label: 'gemma3 (Ollama)' },
  { value: 'gemma4', label: 'gemma4 (Ollama)' },
  { value: 'sonnet', label: 'sonnet (Claude)' },
  { value: 'haiku', label: 'haiku (Claude)' },
  { value: 'opus', label: 'opus (Claude)' },
]

function parseLevelLang(file) {
  const v = parseVariant(file)
  if (v) return { level: v.level, lang: v.language }
  // Legacy layout without a model segment
  const m = file.match(/output\/([^.]+)\.([^/]+)\//)
  return m ? { level: m[1], lang: m[2] } : { level: 'college', lang: 'en' }
}

function parseModel(file) {
  return parseVariant(file)?.model ?? ''
}

function conceptFilename(file) {
  return file.replace(/^.*\//, '')
}

function conceptFromFile(file) {
  return decodeURIComponent(conceptFilename(file).replace(/^concept_/, '').replace(/\.html$/, ''))
}

function buildUrl(domain, file, level, lang, model) {
  const fname = conceptFilename(file)
  const dir = model
    ? variantHtmlDir(level, lang, model)
    : `output/${level}.${lang}/html`  // legacy layout without a model segment
  return `${import.meta.env.BASE_URL}domains/${domain}/${dir}/${fname}`
}

function _markKnownUrls(domain, files) {
  markKnown(files.map(f => `${import.meta.env.BASE_URL}domains/${encodeURIComponent(domain)}/${f.file}`))
}

const _checkExists = contentExists

function _notFoundHtml(fname, model, lang, level) {
  const conceptName = decodeURIComponent(fname).replace(/^(?:concept|book)_/, '').replace(/_/g, ' ').replace(/\.html$/, '')
  const modelLabel = model || 'default'
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${modelLabel}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${level}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${lang}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${conceptName}</strong> first via the Concept-Graph page.</p>
  </body></html>`
}

// Resolve a viewable URL for a file: domain-local first, then the shared
// canonical under public/concepts/. Concept pages are keyed on (level, lang,
// model) and shared across domains via symlinks — but a page reached through
// another page's baked TOC may belong to a domain that never symlinked it
// here, and its content still exists canonically. With no domain at all
// (standalone --chars primitives, or any concept opened as a last resort
// without a domain context) domain-local resolution is skipped entirely and
// the canonical page is the only candidate.
async function _resolveContentUrl(domain, file, level, lang, model) {
  const fname = conceptFilename(file)
  if (domain) {
    const url = buildUrl(domain, file, level, lang, model)
    if (await _checkExists(url)) return url
  }
  if (model && fname.startsWith('concept_')) {
    const concept = conceptFromFile(fname)
    const canonical = `${import.meta.env.BASE_URL}${canonicalConceptRel(level, lang, model, concept)}`
    if (await _checkExists(canonical)) return canonical
  }
  return null
}

// Snapshot a frame's own nav.toc into plain data (survives frame navigation)
function _extractTocItems(frame) {
  try {
    const lis = frame.contentDocument?.querySelector('nav.toc')?.querySelectorAll('ol li')
    if (!lis || !lis.length) return null
    const items = []
    lis.forEach(li => {
      const a = li.querySelector('a')
      if (a) items.push({ href: a.getAttribute('href'), label: a.textContent, isTarget: li.classList.contains('toc-target') })
    })
    return items.length ? items : null
  } catch (_) { return null }
}

async function loadFrame(frame, domain, file, state, onContentStatus, isStale) {
  const url = await _resolveContentUrl(domain, file, state.level, state.lang, state.model)
  // A newer reload for this pane may have started (and even finished) while
  // this one was awaiting _resolveContentUrl — discard this one if so,
  // otherwise an out-of-order response clobbers the frame with stale content
  // (dropdown shows the new selection, pane shows the old one's result).
  if (isStale && isStale()) return
  if (onContentStatus) onContentStatus(!!url)
  if (url) {
    frame.src = url
  } else {
    frame.removeAttribute('src')
    frame.srcdoc = _notFoundHtml(conceptFilename(file), state.model, state.lang, state.level)
  }
}

// ── Markdown renderer (for PANE C) ───────────────────────────────────────────

function _mdToHtml(md) {
  const esc = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc
    .replace(/^## (.+)$/gm, '</p><h3 style="color:#1e3a5f;margin:20px 0 8px;font-size:1rem;font-weight:700">$1</h3><p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px">')
    .replace(/\n/g, ' ')
    .replace(/^/, '<p style="margin:0 0 12px">')
    .replace(/$/, '</p>')
    .replace(/<p[^>]*><\/p>/g, '')
    .replace(/<p[^>]*>(<h3)/g, '$1')
    .replace(/(<\/h3>)<\/p>/g, '$1')
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function makeSelect(options, current, cls) {
  const sel = document.createElement('select')
  if (cls) sel.className = cls
  options.forEach(({ value, label }) => {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    if (value === current) opt.selected = true
    sel.appendChild(opt)
  })
  return sel
}

function makeControlRow(label, state, onChange) {
  const row = document.createElement('div')
  row.className = 'cb-book-pane__controls'
  if (label) {
    const lbl = document.createElement('span')
    lbl.className = 'cb-book-pane__label'
    lbl.textContent = label
    row.appendChild(lbl)
  }
  const modelSel = makeSelect(MODELS, state.model, 'cb-book-pane__select')
  modelSel.title = 'Model'
  modelSel.addEventListener('change', () => onChange('model', modelSel.value))
  row.appendChild(modelSel)

  const levelSel = makeSelect(
    LEVELS.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
    state.level, 'cb-book-pane__select'
  )
  levelSel.title = 'Level'
  levelSel.addEventListener('change', () => onChange('level', levelSel.value))
  row.appendChild(levelSel)

  const langSel = makeSelect(
    LANGUAGES.map(l => ({ value: l.code, label: l.label })),
    state.lang, 'cb-book-pane__select'
  )
  langSel.title = 'Language'
  langSel.addEventListener('change', () => onChange('lang', langSel.value))
  row.appendChild(langSel)

  return row
}

// ── Drag-to-resize splitter ───────────────────────────────────────────────────

function makeDragSplitter(getWrapper, onSplitChange) {
  const handle = document.createElement('div')
  handle.style.cssText = 'height:5px;background:#d1d5db;cursor:row-resize;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.15s'

  const grip = document.createElement('div')
  grip.style.cssText = 'width:40px;height:3px;border-radius:2px;background:#9ca3af;pointer-events:none'
  handle.appendChild(grip)

  let dragging = false
  handle.addEventListener('mouseenter', () => { if (!dragging) handle.style.background = '#bfdbfe' })
  handle.addEventListener('mouseleave', () => { if (!dragging) handle.style.background = '#d1d5db' })

  handle.addEventListener('mousedown', e => {
    e.preventDefault()
    dragging = true
    handle.style.background = '#93c5fd'

    // Transparent overlay covering the entire viewport (including iframes) so
    // mousemove/mouseup are received by the parent document even when the
    // cursor drifts into an iframe's browsing context.
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:row-resize'
    document.body.appendChild(overlay)
    document.body.style.userSelect = 'none'

    const onMove = e => {
      const wrapper = getWrapper()
      if (!wrapper) return
      const rect = wrapper.getBoundingClientRect()
      const pct = Math.min(80, Math.max(20, (e.clientY - rect.top) / rect.height * 100))
      onSplitChange(pct)
    }

    const onUp = () => {
      dragging = false
      handle.style.background = '#d1d5db'
      document.body.removeChild(overlay)
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  return handle
}

// ── Reviewer chatbot widget ───────────────────────────────────────────────────

function _makeChatWidget(leftFrame, chatHistory, onChatSend) {
  const S = 'font-family:system-ui,sans-serif'

  const wrap = document.createElement('div')
  wrap.style.cssText = 'margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15)'

  const label = document.createElement('div')
  label.style.cssText = `font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#90b4e8;margin-bottom:8px;${S};font-weight:700`
  label.textContent = '💬 Reviewer Chat'
  wrap.appendChild(label)

  // History display
  const histEl = document.createElement('div')
  histEl.style.cssText = `max-height:220px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:6px`
  function renderHistory() {
    histEl.innerHTML = ''
    chatHistory.forEach(({ role, text }) => {
      const bubble = document.createElement('div')
      const isUser = role === 'user'
      bubble.style.cssText = [
        `font-size:.8rem;line-height:1.4;${S}`,
        `padding:6px 8px;border-radius:6px;word-break:break-word;white-space:pre-wrap`,
        isUser
          ? 'background:rgba(96,165,250,.18);color:#dbeafe;align-self:flex-end;text-align:right'
          : 'background:rgba(255,255,255,.07);color:#e8f0fe;align-self:flex-start',
      ].join(';')
      bubble.textContent = text
      histEl.appendChild(bubble)
    })
    histEl.scrollTop = histEl.scrollHeight
  }
  renderHistory()
  wrap.appendChild(histEl)

  // Input column
  const inputRow = document.createElement('div')
  inputRow.style.cssText = 'display:flex;flex-direction:column;gap:6px'

  const ta = document.createElement('textarea')
  ta.rows = 4
  ta.placeholder = 'Ask about this concept…'
  ta.style.cssText = [
    `width:100%;box-sizing:border-box;resize:vertical;${S};font-size:.8rem`,
    'border:1px solid rgba(255,255,255,0.2);border-radius:5px',
    'background:rgba(255,255,255,.06);color:#e8f0fe',
    'padding:5px 7px;outline:none',
  ].join(';')

  const sendBtn = document.createElement('button')
  sendBtn.textContent = 'Send'
  sendBtn.style.cssText = [
    `${S};font-size:.75rem;font-weight:600;align-self:flex-end`,
    'padding:5px 14px;border:none;border-radius:5px',
    'background:#3b82f6;color:#fff;cursor:pointer;white-space:nowrap',
  ].join(';')

  async function send() {
    const msg = ta.value.trim()
    if (!msg || sendBtn.disabled) return
    ta.value = ''
    sendBtn.disabled = true
    sendBtn.textContent = '…'

    // Extract concept page text for context (best effort)
    let context = ''
    try {
      const doc = leftFrame.contentDocument
      const main = doc?.querySelector('main') || doc?.body
      if (main) context = (main.innerText || '').slice(0, 3000)
    } catch (_) {}

    await onChatSend(msg, context, renderHistory)
    sendBtn.disabled = false
    sendBtn.textContent = 'Send'
    renderHistory()
  }

  sendBtn.addEventListener('click', send)
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } })

  inputRow.appendChild(ta)
  inputRow.appendChild(sendBtn)
  wrap.appendChild(inputRow)

  return wrap
}

// ── Sidebar population ────────────────────────────────────────────────────────

function _fillTocSection(tocSection, leftFrame, {
  compareChecked,
  compareBtnEnabled,
  skipCacheChecked,
  onCompareToggle,
  onSkipCacheToggle,
  onCompareActivate,
  onConceptClick,
  isAdmin = false,
  chatHistory = [],
  onChatSend = null,
  tocItems = null,
}) {
  // Always clear and render Compare controls first — even when the left frame
  // has placeholder content (no nav.toc), the Compare checkbox/button must
  // remain visible and functional.
  tocSection.innerHTML = ''

  const compareWrap = document.createElement('div')
  compareWrap.style.cssText = 'margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.15)'

  const compareLabel = document.createElement('label')
  compareLabel.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-family:system-ui,sans-serif;font-size:0.85rem;color:#e8f0fe;font-weight:600;margin-bottom:8px'
  const chk = document.createElement('input')
  chk.type = 'checkbox'
  chk.checked = compareChecked
  chk.style.cssText = 'width:14px;height:14px;cursor:pointer;accent-color:#60a5fa'
  chk.addEventListener('change', () => onCompareToggle(chk.checked))
  compareLabel.appendChild(chk)
  compareLabel.appendChild(document.createTextNode('Compare'))
  compareWrap.appendChild(compareLabel)

  if (compareChecked) {
    // Row: [↻ fresh checkbox] [Compare ▶ button]
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:6px'

    const skipLabel = document.createElement('label')
    skipLabel.style.cssText = 'display:flex;align-items:center;gap:3px;cursor:pointer;flex-shrink:0;font-family:system-ui,sans-serif;font-size:0.75rem;color:#90b4e8;white-space:nowrap'
    skipLabel.title = 'Skip cache — always run a fresh comparison'
    const skipChk = document.createElement('input')
    skipChk.type = 'checkbox'
    skipChk.checked = skipCacheChecked
    skipChk.style.cssText = 'width:12px;height:12px;cursor:pointer;accent-color:#60a5fa;flex-shrink:0'
    skipChk.addEventListener('change', () => onSkipCacheToggle(skipChk.checked))
    skipLabel.appendChild(skipChk)
    skipLabel.appendChild(document.createTextNode('↻ fresh'))
    row.appendChild(skipLabel)

    const btn = document.createElement('button')
    btn.textContent = 'Compare ▶'
    btn.disabled = !compareBtnEnabled
    btn.style.cssText = [
      'flex:1;padding:6px 10px;font-size:0.8rem;font-weight:600',
      'border-radius:6px;border:none;font-family:system-ui,sans-serif;transition:opacity 0.15s',
      compareBtnEnabled
        ? 'background:#3b82f6;color:#fff;cursor:pointer'
        : 'background:#374151;color:#6b7280;cursor:not-allowed;opacity:0.6',
    ].join(';')
    btn.title = compareBtnEnabled
      ? 'Generate AI comparison of both sections in PANE C'
      : 'Both panes need content before comparing'
    btn.addEventListener('click', () => { if (!btn.disabled) onCompareActivate() })
    row.appendChild(btn)

    compareWrap.appendChild(row)
  }

  tocSection.appendChild(compareWrap)

  // TOC section — persisted items when provided (so browsing into a shared
  // concept page keeps the current book's contents), else the frame's own TOC.
  const items = tocItems ?? _extractTocItems(leftFrame)
  if (!items) return

  const heading = document.createElement('div')
  heading.style.cssText = 'font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700'
  heading.textContent = 'Contents'
  tocSection.appendChild(heading)

  const ol = document.createElement('ol')
  ol.style.cssText = 'list-style:decimal inside;padding:0;margin:0;flex:1'
  items.forEach(({ href, label, isTarget }) => {
    const newLi = document.createElement('li')
    newLi.style.cssText = `margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${isTarget ? ';font-weight:700' : ''}`
    const newA = document.createElement('a')
    newA.textContent = label
    newA.href = '#'
    newA.style.cssText = `text-decoration:none;color:${isTarget ? '#fff' : '#a8c8f0'}`
    newA.addEventListener('mouseover', () => { newA.style.color = '#fff' })
    newA.addEventListener('mouseout', () => { newA.style.color = isTarget ? '#fff' : '#a8c8f0' })
    newA.addEventListener('click', e => { e.preventDefault(); onConceptClick(href) })
    newLi.appendChild(newA)
    ol.appendChild(newLi)
  })
  tocSection.appendChild(ol)

  // ── Reviewer chatbot (admin only, hidden when Compare is on) ──────────────
  if (isAdmin && !compareChecked && onChatSend) {
    tocSection.appendChild(_makeChatWidget(leftFrame, chatHistory, onChatSend))
  }

  const credit = document.createElement('div')
  credit.style.cssText = 'margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif'
  credit.innerHTML = 'Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>'
  tocSection.appendChild(credit)
}

function hideTocInFrame(frame) {
  try {
    const doc = frame.contentDocument
    if (!doc) return
    const style = doc.createElement('style')
    style.textContent = 'nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }'
    doc.head.appendChild(style)
  } catch (_) {}
}

// ── PANE C ────────────────────────────────────────────────────────────────────

function makePaneCEl() {
  const el = document.createElement('div')
  el.setAttribute('data-pane-c', '1')
  el.style.cssText = [
    'flex:1', 'overflow-y:auto',
    'background:#f8fafc',
    'padding:24px 32px',
    'font-family:system-ui,sans-serif',
    'font-size:0.9rem', 'line-height:1.7', 'color:#374151',
  ].join(';')
  el.innerHTML = '<div style="color:#9ca3af;font-size:0.85rem">Click <strong>Compare ▶</strong> to generate an AI comparison of the two sections above.</div>'
  return el
}

function startCompare(domain, currentFile, p1, p2, paneCEl, skipCache) {
  const concept = conceptFromFile(currentFile)
  const modelA = p1.model || 'default'
  const modelB = p2.model || 'default'

  const params = new URLSearchParams({
    domain, concept,
    level_a: p1.level, lang_a: p1.lang, model_a: p1.model,
    level_b: p2.level, lang_b: p2.lang, model_b: p2.model,
    skip_cache: skipCache ? '1' : '0',
  })

  paneCEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;color:#6b7280;font-size:0.88rem">
      <div style="width:18px;height:18px;border:2px solid #e0e3e8;border-top-color:#3b82f6;border-radius:50%;animation:cb-spin 0.8s linear infinite;flex-shrink:0"></div>
      Comparing <strong style="color:#1e3a5f;margin:0 3px">${modelA}</strong> vs <strong style="color:#1e3a5f;margin:0 3px">${modelB}</strong>…
    </div>
    <style>@keyframes cb-spin{to{transform:rotate(360deg)}}</style>`

  const t0 = performance.now()
  const source = new EventSource(`/api/compare?${params}`)

  source.addEventListener('compare_done', e => {
    source.close()
    const elapsed = ((performance.now() - t0) / 1000).toFixed(1)
    const { comparison, from_cache } = JSON.parse(e.data)
    const cacheTag = from_cache
      ? '<span style="font-size:0.7rem;padding:2px 6px;border-radius:10px;background:#d1fae5;color:#065f46;font-weight:600;flex-shrink:0">cached</span>'
      : ''
    paneCEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #e0e3e8">
        <span style="font-size:0.7rem;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;font-weight:700">PANE C — Comparison</span>
        <span style="font-size:0.8rem;color:#374151">
          <strong style="color:#2563eb">${modelA}</strong> (${p1.level}/${p1.lang})
          <span style="color:#9ca3af;margin:0 6px">vs</span>
          <strong style="color:#2563eb">${modelB}</strong> (${p2.level}/${p2.lang})
        </span>
        ${cacheTag}
        <span style="font-size:0.72rem;color:#9ca3af;margin-left:auto">${elapsed}s</span>
      </div>
      <div style="max-width:820px">${_mdToHtml(comparison)}</div>`
  })

  source.addEventListener('compare_error', e => {
    source.close()
    const { message } = JSON.parse(e.data)
    paneCEl.innerHTML = `<p style="color:#dc2626;font-size:0.88rem"><strong>Comparison failed:</strong> ${message}</p>`
  })

  source.onerror = () => {
    source.close()
    paneCEl.innerHTML = `<p style="color:#dc2626;font-size:0.88rem">Connection to comparison service lost.</p>`
  }

  return source
}

// ── Nav sidebar data loaders ──────────────────────────────────────────────────

// Returns [{ id, pinyin?, pinyin_initials? }] — pinyin fields power the
// sidebar's fuzzy phrase search (catalog source only; Files source has none).
async function _loadDomains() {
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

async function _loadDomainBooks(domainId) {
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
    const books = (raw.books || []).map(b => ({ file: b.file, label: b.target.replace(/_/g, ' ').trim() || b.target, model: b.model || parseModel(b.file) }))
    const concepts = (raw.generated_concepts || []).map(c => ({ file: c.file, label: c.label, model: c.model || parseModel(c.file) }))
    // Pre-populate existence cache so opening any listed file skips the HTTP check
    _markKnownUrls(domainId, [...books, ...concepts])
    return { books, concepts }
  } catch (_) { return { books: [], concepts: [] } }
}

function _makeNavSidebar(initialDomain, initialFile) {
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
    const { books, concepts } = await _loadDomainBooks(domainId)
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
    _allDomains = await _loadDomains()
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

// ── Page ──────────────────────────────────────────────────────────────────────

export function BookPage(container, params) {
  const { domain, file: initialFile } = params || {}

  container.innerHTML = ''
  container._renderKey = Symbol()
  container.style.cssText = ''
  container.className = 'cb-book-page'

  container.appendChild(Header())

  const bodyRow = document.createElement('div')
  bodyRow.style.cssText = 'display:flex;flex:1;overflow:hidden'
  container.appendChild(bodyRow)

  const navEl = _makeNavSidebar(domain || '', initialFile || '')
  bodyRow.appendChild(navEl)

  const contentEl = document.createElement('div')
  contentEl.style.cssText = 'flex:1;display:flex;overflow:hidden;min-width:0'
  bodyRow.appendChild(contentEl)

  // domain is optional — a concept opened with no domain context (standalone
  // --chars primitive, or any domain-local lookup that came up empty) falls
  // back to the shared canonical page under public/concepts/ (see
  // _resolveContentUrl). A file is still required — there's nothing to show
  // without one.
  if (!initialFile) return

  const parsed = parseLevelLang(initialFile)
  let compareMode = false
  let compareTriggered = false
  let paneAHasContent = false
  let paneBHasContent = false
  let skipCache = false
  let splitPct = 60
  let currentFile = initialFile
  let compareSource = null
  // Book TOC snapshot { file, items } — kept while browsing concept pages so
  // the sidebar always shows the opened book's contents, not the (possibly
  // cross-domain) TOC baked into a shared canonical concept page.
  let bookToc = null
  let pendingAnchor = null

  // The resizeWrapper reference is kept so the drag handler can measure it
  let resizeWrapperEl = null
  // The top section reference so we can update its flex-basis on drag
  let topSectionEl = null

  const p1 = { level: parsed.level, lang: parsed.lang, model: parseModel(initialFile) }
  // Default p2 to a different model so PANE B has a valid file path from the start
  const _p2DefaultModel = MODELS.find(m => m.value && m.value !== p1.model)?.value || p1.model
  const p2 = { level: parsed.level, lang: parsed.lang, model: _p2DefaultModel }

  const isAdmin = getStoredUser()?.role === 'admin'
  const chatHistory = []

  async function onChatSend(msg, context, rerender) {
    chatHistory.push({ role: 'user', text: msg })
    rerender()
    try {
      const system = context
        ? `You are a reviewer assistant for Chinese character concept books.\n\nCurrent concept page content:\n${context}\n\nHelp the reviewer understand, critique, and improve the content.`
        : 'You are a reviewer assistant for Chinese character concept books.'
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          message: msg,
          system,
          history: chatHistory.slice(0, -1).map(h => ({ role: h.role, text: h.text })),
        }),
      })
      const data = await res.json()
      chatHistory.push({ role: 'assistant', text: res.ok ? data.response : `Error: ${data.detail || res.status}` })
    } catch (e) {
      chatHistory.push({ role: 'assistant', text: `Error: ${e.message}` })
    }
  }

  function cancelCompare() {
    if (compareSource) { compareSource.close(); compareSource = null }
  }

  // Finds PANE C in current DOM (works across re-renders)
  function getPaneC() {
    return contentEl.querySelector('[data-pane-c]')
  }

  function render() {
    cancelCompare()
    contentEl.innerHTML = ''
    navEl.tocSection.innerHTML = '<div style="color:#90b4e8;font-size:11px;padding:4px 0">Loading…</div>'
    resizeWrapperEl = null
    topSectionEl = null
    compareMode ? renderCompare() : renderSingle()
  }

  // ── Single mode ──────────────────────────────────────────────────────────

  function renderSingle() {
    const rightCol = document.createElement('div')
    rightCol.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0'
    contentEl.appendChild(rightCol)

    rightCol.appendChild(makeControlRow(null, p1, (key, val) => { p1[key] = val; reload() }))

    const frame = document.createElement('iframe')
    frame.style.cssText = 'flex:1;width:100%;border:none;display:block'
    rightCol.appendChild(frame)

    let isSrcdoc = false
    let reqSeq = 0

    frame.addEventListener('load', () => {
      if (isSrcdoc) return
      try {
        const href = frame.contentWindow?.location?.href
        if (href && !href.startsWith('about:')) {
          const fname = decodeURIComponent(href.replace(/.*\/html\//, ''))
          if (fname && !fname.includes('://') && fname !== conceptFilename(currentFile)) {
            currentFile = currentFile.replace(/[^/]+\.html$/, fname)
          }
        }
      } catch (_) {}
      hideTocInFrame(frame)
      const fname = conceptFilename(currentFile)
      const own = _extractTocItems(frame)
      if (fname.startsWith('book_') && own) bookToc = { file: fname, items: own }
      if (pendingAnchor) {
        try { frame.contentDocument?.querySelector(pendingAnchor)?.scrollIntoView() } catch (_) {}
        pendingAnchor = null
      }
      _fillTocSection(navEl.tocSection, frame, {
        compareChecked: false,
        compareBtnEnabled: false,
        skipCacheChecked: false,
        onCompareToggle: checked => { compareMode = checked; render() },
        onSkipCacheToggle: () => {},
        onCompareActivate: () => {},
        isAdmin,
        chatHistory,
        onChatSend,
        tocItems: bookToc && fname !== bookToc.file
          ? bookToc.items.map(it => ({ ...it, isTarget: it.href === fname }))
          : own,
        onConceptClick: href => {
          if (!href) return
          if (href.startsWith('#')) {
            // In-book anchor (phrase/payoff section): if we've browsed away to
            // a concept page, return to the book first, then scroll.
            if (bookToc && conceptFilename(currentFile) !== bookToc.file) {
              currentFile = currentFile.replace(/[^/]+\.html$/, bookToc.file)
              pendingAnchor = href
              reload()
              return
            }
            try { frame.contentDocument?.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }) } catch (_) {}
            return
          }
          currentFile = currentFile.replace(/[^/]+\.html$/, href)
          reload()
        },
      })
    })

    function reload() {
      const seq = ++reqSeq
      _resolveContentUrl(domain, currentFile, p1.level, p1.lang, p1.model).then(url => {
        if (seq !== reqSeq) return
        isSrcdoc = !url
        if (url) { frame.src = url }
        else { frame.removeAttribute('src'); frame.srcdoc = _notFoundHtml(conceptFilename(currentFile), p1.model, p1.lang, p1.level) }
      })
    }

    reload()
  }

  // ── Compare mode ─────────────────────────────────────────────────────────

  function renderCompare() {
    const mainArea = document.createElement('div')
    mainArea.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0'
    contentEl.appendChild(mainArea)

    // Controls row
    const controlsRow = document.createElement('div')
    controlsRow.style.cssText = 'display:flex;flex-shrink:0'
    mainArea.appendChild(controlsRow)

    const ctrl1 = makeControlRow('Pane A', p1, (key, val) => { p1[key] = val; reloadLeft() })
    ctrl1.style.flex = '1'
    controlsRow.appendChild(ctrl1)

    const ctrlDivider = document.createElement('div')
    ctrlDivider.style.cssText = 'width:2px;background:#e0e3e8;flex-shrink:0'
    controlsRow.appendChild(ctrlDivider)

    const ctrl2 = makeControlRow('Pane B', p2, (key, val) => { p2[key] = val; reloadRight() })
    ctrl2.style.flex = '1'
    controlsRow.appendChild(ctrl2)

    // Resizable wrapper: top (frames) + optional drag handle + PANE C
    const resizeWrapper = document.createElement('div')
    resizeWrapper.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden'
    mainArea.appendChild(resizeWrapper)
    resizeWrapperEl = resizeWrapper

    // Top section: PANE A | PANE B frames
    const topSection = document.createElement('div')
    topSection.style.cssText = `flex:0 0 ${compareTriggered ? splitPct + '%' : '100%'};display:flex;overflow:hidden;min-height:0`
    resizeWrapper.appendChild(topSection)
    topSectionEl = topSection

    const leftFrame = document.createElement('iframe')
    leftFrame.style.cssText = 'flex:1;border:none;display:block;min-width:0'
    topSection.appendChild(leftFrame)

    topSection.appendChild((() => {
      const d = document.createElement('div')
      d.style.cssText = 'width:2px;background:#e0e3e8;flex-shrink:0'
      return d
    })())

    const rightFrame = document.createElement('iframe')
    rightFrame.style.cssText = 'flex:1;border:none;display:block;min-width:0'
    topSection.appendChild(rightFrame)

    // Drag handle + PANE C — only after Compare button is clicked
    if (compareTriggered) {
      const dragHandle = makeDragSplitter(
        () => resizeWrapperEl,
        pct => {
          splitPct = pct
          if (topSectionEl) topSectionEl.style.flex = `0 0 ${pct}%`
        }
      )
      // Visually separate PANE C with a label strip
      const paneCHeader = document.createElement('div')
      paneCHeader.style.cssText = 'flex-shrink:0;background:#1e3a5f;color:#90b4e8;padding:4px 16px;font-size:0.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px'
      paneCHeader.innerHTML = '<span>PANE C — AI Comparison</span>'

      resizeWrapper.appendChild(dragHandle)
      resizeWrapper.appendChild(paneCHeader)
      resizeWrapper.appendChild(makePaneCEl())
    }

    // Sidebar refresh — rebuilds the Compare button state
    function refreshSidebar() {
      const fname = conceptFilename(currentFile)
      _fillTocSection(navEl.tocSection, leftFrame, {
        compareChecked: true,
        compareBtnEnabled: paneAHasContent && paneBHasContent,
        skipCacheChecked: skipCache,
        isAdmin,
        chatHistory,
        onChatSend,
        tocItems: bookToc && fname !== bookToc.file
          ? bookToc.items.map(it => ({ ...it, isTarget: it.href === fname }))
          : null,
        onCompareToggle: checked => { compareMode = checked; render() },
        onSkipCacheToggle: val => { skipCache = val },
        onCompareActivate: () => {
          if (!compareTriggered) {
            compareTriggered = true
            render()
            // render() is synchronous; PANE C is now in the DOM
          }
          const pC = getPaneC()
          if (pC) {
            cancelCompare()
            compareSource = startCompare(domain, currentFile, p1, p2, pC, skipCache)
          }
        },
        onConceptClick: href => {
          if (!href) return
          if (href.startsWith('#')) {
            if (bookToc && conceptFilename(currentFile) !== bookToc.file) {
              currentFile = currentFile.replace(/[^/]+\.html$/, bookToc.file)
              pendingAnchor = href
              reloadLeft()
              reloadRight()
              return
            }
            try { leftFrame.contentDocument?.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }) } catch (_) {}
            return
          }
          currentFile = currentFile.replace(/[^/]+\.html$/, href)
          reloadLeft()
          reloadRight()
        },
      })
    }

    leftFrame.addEventListener('load', () => {
      try {
        const href = leftFrame.contentWindow?.location?.href
        if (href && !href.startsWith('about:')) {
          const fname = decodeURIComponent(href.replace(/.*\/html\//, ''))
          if (fname && !fname.includes('://') && fname !== conceptFilename(currentFile)) {
            currentFile = currentFile.replace(/[^/]+\.html$/, fname)
          }
        }
      } catch (_) {}
      hideTocInFrame(leftFrame)
      const own = _extractTocItems(leftFrame)
      if (conceptFilename(currentFile).startsWith('book_') && own) {
        bookToc = { file: conceptFilename(currentFile), items: own }
      }
      if (pendingAnchor) {
        try { leftFrame.contentDocument?.querySelector(pendingAnchor)?.scrollIntoView() } catch (_) {}
        pendingAnchor = null
      }
      refreshSidebar()
    })

    rightFrame.addEventListener('load', () => { hideTocInFrame(rightFrame) })

    let leftReqSeq = 0
    function reloadLeft() {
      const seq = ++leftReqSeq
      loadFrame(leftFrame, domain, currentFile, p1, hasContent => {
        paneAHasContent = hasContent
        refreshSidebar()
      }, () => seq !== leftReqSeq)
    }

    let rightReqSeq = 0
    function reloadRight() {
      const seq = ++rightReqSeq
      loadFrame(rightFrame, domain, currentFile, p2, hasContent => {
        paneBHasContent = hasContent
        refreshSidebar()
      }, () => seq !== rightReqSeq)
    }

    reloadLeft()
    reloadRight()
  }

  render()
}
