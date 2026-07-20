// Book Content page (the "Content" tab in the UI): orchestrates the nav
// sidebar, single-frame reading mode, and the two-pane Compare mode.
// The building blocks live in src/components/book/.
import { Header } from '../components/Header.js'
import { getStoredUser, authHeaders } from '../services/auth.js'
import {
  MODELS, parseLevelLang, parseModel, conceptFilename, isBookFile,
  notFoundHtml, resolveContentUrl, extractTocItems, hideTocInFrame, loadFrame,
} from '../components/book/content.js'
import { makeControlRow, makeDragSplitter } from '../components/book/controls.js'
import { clearCache as clearContentCache } from '../lib/contentExists.js'
import { fillTocSection } from '../components/book/TocSidebar.js'
import { makePaneCEl, startCompare } from '../components/book/ComparePane.js'
import { makeNavSidebar } from '../components/book/NavSidebar.js'

export function BookContent(container, params) {
  const { domain, file: initialFile } = params || {}

  container.innerHTML = ''
  container._renderKey = Symbol()
  container.style.cssText = ''
  container.className = 'cb-book-page'

  container.appendChild(Header())

  const bodyRow = document.createElement('div')
  bodyRow.style.cssText = 'display:flex;flex:1;overflow:hidden'
  container.appendChild(bodyRow)

  const navEl = makeNavSidebar(domain || '', initialFile || '')
  bodyRow.appendChild(navEl)

  const contentEl = document.createElement('div')
  contentEl.style.cssText = 'flex:1;display:flex;overflow:hidden;min-width:0'
  bodyRow.appendChild(contentEl)

  // domain is optional — a concept opened with no domain context (standalone
  // --chars primitive, or any domain-local lookup that came up empty) falls
  // back to the shared canonical page under public/concepts/ (see
  // resolveContentUrl). A file is still required — there's nothing to show
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

    rightCol.appendChild(makeControlRow(null, p1, (key, val) => { p1[key] = val; reload() }, () => { clearContentCache(); reload() }))

    const frame = document.createElement('iframe')
    frame.style.cssText = 'flex:1;width:100%;border:none;display:block'
    rightCol.appendChild(frame)

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
      const own = extractTocItems(frame)
      if (isBookFile(fname) && own) bookToc = { file: fname, items: own }
      if (pendingAnchor) {
        try { frame.contentDocument?.querySelector(pendingAnchor)?.scrollIntoView() } catch (_) {}
        pendingAnchor = null
      }
      fillTocSection(navEl.tocSection, frame, {
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
      resolveContentUrl(domain, currentFile, p1.level, p1.lang, p1.model).then(url => {
        if (seq !== reqSeq) return
        isSrcdoc = !url
        if (url) { frame.src = url }
        else { frame.removeAttribute('src'); frame.srcdoc = notFoundHtml(conceptFilename(currentFile), p1.model, p1.lang, p1.level) }
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

    const ctrl1 = makeControlRow('Pane A', p1, (key, val) => { p1[key] = val; reloadLeft() }, () => { clearContentCache(); reloadLeft() })
    ctrl1.style.flex = '1'
    controlsRow.appendChild(ctrl1)

    const ctrlDivider = document.createElement('div')
    ctrlDivider.style.cssText = 'width:2px;background:#e0e3e8;flex-shrink:0'
    controlsRow.appendChild(ctrlDivider)

    const ctrl2 = makeControlRow('Pane B', p2, (key, val) => { p2[key] = val; reloadRight() }, () => { clearContentCache(); reloadRight() })
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
      fillTocSection(navEl.tocSection, leftFrame, {
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
        if (leftFrame.contentDocument?.querySelector('#app')) {
          paneAHasContent = false
          leftFrame.removeAttribute('src')
          leftFrame.srcdoc = notFoundHtml(conceptFilename(currentFile), p1.model, p1.lang, p1.level)
          refreshSidebar()
          return
        }
      } catch (_) {}
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
      const own = extractTocItems(leftFrame)
      if (isBookFile(conceptFilename(currentFile)) && own) {
        bookToc = { file: conceptFilename(currentFile), items: own }
      }
      if (pendingAnchor) {
        try { leftFrame.contentDocument?.querySelector(pendingAnchor)?.scrollIntoView() } catch (_) {}
        pendingAnchor = null
      }
      refreshSidebar()
    })

    rightFrame.addEventListener('load', () => {
      try {
        if (rightFrame.contentDocument?.querySelector('#app')) {
          paneBHasContent = false
          rightFrame.removeAttribute('src')
          rightFrame.srcdoc = notFoundHtml(conceptFilename(currentFile), p2.model, p2.lang, p2.level)
          refreshSidebar()
          return
        }
      } catch (_) {}
      hideTocInFrame(rightFrame)
    })

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
