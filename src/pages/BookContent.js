// Book Content page: the right panel of the consolidated Graph-IDE page —
// a TOC sidebar (built from the graph's own prerequisite path, see
// _graphTocItems) plus a single content frame. Compare mode and the
// Catalog/Files/Domain/Model picker chrome that the original standalone
// cb-zinets Content page had are gone — node selection happens on the
// graph now, and there's exactly one place (GenerateBar.js's Model/Language
// selects) to control what variant is shown.
import { Header } from '../components/Header.js'
import { getStoredUser, authHeaders } from '../services/auth.js'
import {
  parseLevelLang, parseModel, conceptFilename, conceptFromFile,
  notFoundHtml, resolveContentUrl, hideTocInFrame,
} from '../components/book/content.js'
import { clearCache as clearContentCache } from '../lib/contentExists.js'
import { fillTocSection } from '../components/book/TocSidebar.js'
import { canonicalConceptRel as conceptRel } from '../lib/paths.js'

// TOC entry prefix by node kind — matches the emoji convention used for the
// same purpose in the base template's ContentPanel.js: applications and
// primitives are the minority worth flagging, plain concept nodes (the
// majority) get no tag.
const _TOC_KIND_TAG = { application: '🌸', primitive: '🌱' }

// `embedded`: true when mounted as the right panel of the consolidated
// Graph-IDE page (pages/DomainGraph.js) rather than as its own full-page
// route — skips the page-level <Header> (the caller already has one) and
// the 100vh-assuming `.cb-book-page` class. Returns `{ openFile(file),
// setAnchor(nodeId, node), setViewParams({model, lang}), refresh() }` so the
// caller can change what's shown in place (e.g. when a graph node is
// clicked, or the top Model/Language selects change) without remounting the
// graph alongside it. `graphViewer`: the TOC is built from the graph's own
// prerequisite path (see _graphTocItems) instead of parsing the content
// page's own embedded nav.toc — the same approach cb-chemistry-ide's
// ContentPanel.js uses, since a bare concept_*.html page (as opposed to a
// book_*.html TOC-index page) has no nav.toc of its own to extract.
export function BookContent(container, params, { embedded = false, graphViewer = null, onNodeChange = null } = {}) {
  const { domain, file: initialFile } = params || {}

  container.innerHTML = ''
  container._renderKey = Symbol()
  container.style.cssText = ''
  container.className = embedded ? 'cb-book-embed' : 'cb-book-page'

  if (!embedded) container.appendChild(Header())

  const bodyRow = document.createElement('div')
  bodyRow.className = 'cb-ide-body'
  container.appendChild(bodyRow)

  const navEl = _makeTocNav()
  bodyRow.appendChild(navEl)

  const contentEl = document.createElement('div')
  contentEl.className = 'cb-ide-content'
  bodyRow.appendChild(contentEl)

  // domain is optional — a concept opened with no domain context (standalone
  // --chars primitive, or any domain-local lookup that came up empty) falls
  // back to the shared canonical page under public/concepts/ (see
  // resolveContentUrl). A file is still required — there's nothing to show
  // without one; the embedded empty state (below) covers that instead of
  // bailing out, since `openFile()` may still be called later.
  const parsed = parseLevelLang(initialFile || '')
  let currentFile = initialFile
  // The node clicked in the *graph* — defines the TOC's scope (its
  // prerequisite path) and stays fixed while browsing the TOC.
  let anchorNodeId = null
  let anchorNode = null

  const p1 = { level: parsed.level, lang: parsed.lang, model: parseModel(initialFile || '') }

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

  // Builds TOC entries from the graph's own prerequisite path for the
  // current anchor node (graph.html's getAncestors(), via graphViewer.getPath)
  // plus the anchor itself — deduped, sorted alphabetically — instead of
  // parsing whatever nav.toc happens to be embedded in the currently
  // displayed page.
  function _graphTocItems() {
    if (!graphViewer || !anchorNodeId) return null
    const pathInfo = graphViewer.getPath(anchorNodeId)
    const candidates = [...(pathInfo?.path || []), anchorNode].filter(Boolean)
    const seen = new Set()
    const nodes = candidates.filter(n => !seen.has(n.id) && seen.add(n.id)).sort((a, b) => a.label.localeCompare(b.label))
    const curId = conceptFromFile(conceptFilename(currentFile || ''))
    return nodes.map(n => {
      const tag = _TOC_KIND_TAG[n.kind]
      const fname = conceptFilename(conceptRel(p1.level, p1.lang, p1.model || 'gemma4', n.id))
      return { href: fname, label: tag ? `${tag} ${n.label}` : n.label, isTarget: n.id === curId }
    })
  }

  function render() {
    contentEl.innerHTML = ''
    navEl.tocSection.innerHTML = '<p class="cb-panel__hint">Loading…</p>'

    const frame = document.createElement('iframe')
    frame.className = 'cb-ide-content__frame'
    contentEl.appendChild(frame)

    let isSrcdoc = false
    let reqSeq = 0

    frame.addEventListener('load', () => {
      if (isSrcdoc) return
      // Second-layer defence: if the SPA shell loaded instead of a concept page,
      // replace it with the "not found" placeholder immediately.
      try {
        if (frame.contentDocument?.querySelector('#app')) {
          isSrcdoc = true
          frame.removeAttribute('src')
          frame.srcdoc = notFoundHtml(conceptFilename(currentFile), p1.model, p1.lang, p1.level)
          return
        }
      } catch (_) {}
      hideTocInFrame(frame)
      fillTocSection(navEl.tocSection, frame, {
        isAdmin,
        chatHistory,
        onChatSend,
        tocItems: _graphTocItems(),
        onConceptClick: href => {
          if (!href) return
          currentFile = currentFile.replace(/[^/]+\.html$/, href)
          // TOC clicks change the displayed node without going through a
          // graph click — tell the caller so it can keep the Generate
          // target (GenerateBar.js's targetSel) pointed at whatever's now
          // actually shown, not whatever node was last clicked on the graph.
          if (onNodeChange) onNodeChange(conceptFromFile(href))
          reload()
        },
      })
    })

    function reload() {
      const seq = ++reqSeq
      resolveContentUrl(domain, currentFile, p1.level, p1.lang, p1.model).then(url => {
        if (seq !== reqSeq) return
        isSrcdoc = !url
        if (url) { frame.src = url }
        else { frame.removeAttribute('src'); frame.srcdoc = notFoundHtml(conceptFilename(currentFile), p1.model, p1.lang, p1.level) }
      })
    }

    reload()
  }

  // Changes what's displayed in place — e.g. the consolidated Graph-IDE page
  // calls this when the user clicks a graph node, reusing this same mounted
  // instance (and its nav sidebar, chat history) instead of remounting the
  // whole right panel.
  function openFile(file) {
    if (!file) return
    currentFile = file
    // reload()/resolveContentUrl resolve off p1 (level/lang/model), not off
    // currentFile's own path — keep the controls (and the TOC hrefs built
    // from them) in sync with whatever variant the new file actually is,
    // otherwise a stale p1 from browsing a *different* file/variant
    // silently resolves the new file under the wrong level/lang/model.
    const np = parseLevelLang(file)
    p1.level = np.level
    p1.lang = np.lang
    const nm = parseModel(file)
    if (nm) p1.model = nm
    render()
  }

  // Re-anchors the TOC to a node clicked in the graph — its own prerequisite
  // path defines what the TOC shows next time it's (re)rendered. Called
  // before openFile() so the TOC is already anchored to the new node by the
  // time the frame's `load` handler renders it.
  function setAnchor(nodeId, node) {
    anchorNodeId = nodeId
    anchorNode = node
  }

  // Called when the top Model/Language selects change — re-resolves
  // whatever's currently displayed under the new variant, keeping the same
  // node (unlike openFile, which also changes *which* node is shown).
  function setViewParams({ model, lang } = {}) {
    if (model !== undefined) p1.model = model
    if (lang !== undefined) p1.lang = lang
    if (currentFile) render()
  }

  // Re-checks for content that just finished generating out of band, without
  // changing what node/variant is selected.
  function refresh() {
    clearContentCache()
    if (currentFile) render()
  }

  if (initialFile) {
    render()
  } else if (embedded) {
    contentEl.innerHTML = '<p class="cb-panel__hint">Click any node in the graph to see its content.</p>'
  }

  return { openFile, setAnchor, setViewParams, refresh }
}

// TOC-only sidebar for the Graph-IDE content panel — the `.cb-ide-toc` shell
// + the `tocSection` slot that fillTocSection() renders into (the current
// book's Contents list + the reviewer chat for admins).
function _makeTocNav() {
  const nav = document.createElement('nav')
  nav.className = 'cb-ide-toc'

  const tocSection = document.createElement('div')
  tocSection.className = 'cb-ide-toc__section'
  tocSection.innerHTML = '<p class="cb-panel__hint">Select a node in the graph to see its contents.</p>'
  nav.appendChild(tocSection)
  nav.tocSection = tocSection

  return nav
}
