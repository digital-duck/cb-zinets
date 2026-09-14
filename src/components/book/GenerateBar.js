// Generate/PDF control bar for the consolidated Graph-IDE page's content
// panel. Adapted from GraphViewer.js's old `_injectGenerateSection` (which
// injected the same form into the graph iframe's own sidebar) — same
// queue+SSE-stream API calls, just built as a plain DOM component that lives
// in the right panel instead of being injected cross-document into the
// graph's iframe, and wired to open the finished book in-place via
// `onDone(relPath)` instead of navigating to a separate /book route.
//
// This is also the *only* control row for the panel — its Model/Language
// selects double as the "what am I viewing" selects (see onViewChange),
// so there's no second, duplicate row of the same pickers elsewhere.
import { LANGUAGES } from '../LanguagePicker.js'
import { bookRel, conceptRel } from '../../lib/paths.js'

// A single-hanzi target (any node id that isn't a "phrase_"-prefixed
// application, per cb-zinets' own node-id convention) generated on its own
// must use the backend's kind='concept' pipeline (build_concept_only.spl) —
// kind='book' (the default, used for phrase/application targets) treats
// whatever `target` it's given as the *capstone* of a new book, rendered via
// write_payoff() instead of write_concept_html(), which is what adds the
// stroke-animation/pinyin/pronounce widget (see spl/tools.py
// `_char_tools_span`/`_char_tools_block`, gated on `_is_single_cjk`). A
// single character generated as a book's own target this way would silently
// lose that widget even though the exact same character keeps it when
// generated as a mere *prerequisite* section of some other book.
function _kindFor(target) {
  return /^phrase_/.test(target) || [...target].length > 1 ? 'book' : 'concept'
}

const _MODELS = [
  { value: 'gemma3', label: 'gemma3 — local (Ollama)' },
  { value: 'gemma4', label: 'gemma4 — local, default (Ollama)' },
  { value: 'sonnet', label: 'sonnet — premium (Claude API)' },
]

// `targets`: [{id, label}] — non-primitive nodes, same population the old
// sidebar dropdown used (kind !== 'primitive'). Returns
// `{ bar, logWrap, setTarget }` — `bar` is the controls row (mount at the
// top of the panel), `logWrap` is the Generate log panel (mount at the
// *bottom* of the panel, below the content — matching the other cb-*
// concept-books — since it's shown/hidden independently of the row).
export function makeGenerateBar(domainId, targets, { level = 'intro', lang = 'en', onDone, onViewChange, onRefresh } = {}) {
  const bar = document.createElement('div')
  bar.className = 'cb-gen-bar cb-gen-bar__row'

  // The target is set from the graph (bar.setTarget, called on node click) —
  // no need for a visible picker duplicating that same selection here; kept
  // as a plain (hidden) <select> so the rest of this component's logic
  // (which reads targetSel.value) doesn't need to change.
  const targetSel = document.createElement('select')
  targetSel.className = 'cb-gen-bar__select cb-gen-bar__target'
  targetSel.style.display = 'none'
  targetSel.innerHTML = '<option value="">Select target to generate…</option>'
  ;[...targets].sort((a, b) => a.label.localeCompare(b.label)).forEach(t => {
    const opt = document.createElement('option')
    opt.value = t.id
    opt.textContent = t.label
    targetSel.appendChild(opt)
  })
  bar.appendChild(targetSel)

  const modelSel = document.createElement('select')
  modelSel.className = 'cb-gen-bar__select'
  _MODELS.forEach(m => {
    const opt = document.createElement('option')
    opt.value = m.value
    opt.textContent = m.label
    if (m.value === 'gemma4') opt.selected = true
    modelSel.appendChild(opt)
  })
  bar.appendChild(modelSel)

  const langSel = document.createElement('select')
  langSel.className = 'cb-gen-bar__select'
  LANGUAGES.forEach(l => {
    const opt = document.createElement('option')
    opt.value = l.code
    opt.textContent = l.label
    if (l.code === lang) opt.selected = true
    langSel.appendChild(opt)
  })
  bar.appendChild(langSel)

  if (onViewChange) {
    modelSel.addEventListener('change', () => onViewChange(modelSel.value, langSel.value))
    langSel.addEventListener('change', () => onViewChange(modelSel.value, langSel.value))
  }

  const refreshBtn = document.createElement('button')
  refreshBtn.type = 'button'
  refreshBtn.className = 'cb-book-pane__refresh'
  refreshBtn.title = 'Refresh — re-check for content that just finished generating'
  refreshBtn.textContent = '🔄'
  if (onRefresh) refreshBtn.addEventListener('click', onRefresh)
  bar.appendChild(refreshBtn)

  const genBtn = document.createElement('button')
  genBtn.type = 'button'
  genBtn.className = 'cb-btn cb-btn--primary'
  genBtn.textContent = 'Generate'
  genBtn.disabled = true
  bar.appendChild(genBtn)

  const skipCacheLbl = document.createElement('label')
  skipCacheLbl.className = 'cb-gen-bar__skip-cache'
  const skipCacheChk = document.createElement('input')
  skipCacheChk.type = 'checkbox'
  skipCacheLbl.appendChild(skipCacheChk)
  skipCacheLbl.appendChild(document.createTextNode('Skip cache'))
  bar.appendChild(skipCacheLbl)

  const pdfBtn = document.createElement('button')
  pdfBtn.type = 'button'
  pdfBtn.className = 'cb-btn cb-gen-bar__pdf-btn'
  pdfBtn.textContent = 'Export PDF'
  pdfBtn.disabled = true
  bar.appendChild(pdfBtn)

  const logWrap = document.createElement('div')
  logWrap.className = 'cb-ide-log-wrap'
  logWrap.style.display = 'none'
  const log = document.createElement('pre')
  log.className = 'cb-ide-log'
  const copyBtn = document.createElement('button')
  copyBtn.type = 'button'
  copyBtn.className = 'cb-ide-log-copy'
  copyBtn.textContent = 'Copy'
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(log.textContent).then(() => {
      copyBtn.textContent = 'Copied!'
      setTimeout(() => { copyBtn.textContent = 'Copy' }, 1500)
    })
  })
  logWrap.append(log, copyBtn)

  targetSel.addEventListener('change', () => {
    genBtn.disabled = !targetSel.value
    pdfBtn.disabled = !targetSel.value
    pdfBtn.textContent = 'Export PDF'
  })

  // Selects a target from outside (e.g. the graph node the user just
  // clicked) without requiring them to also find it in this dropdown.
  bar.setTarget = (nodeId) => {
    if (![...targetSel.options].some(o => o.value === nodeId)) return
    targetSel.value = nodeId
    genBtn.disabled = false
    pdfBtn.disabled = false
  }

  // Reflects the Model/Language selects to match content that's already
  // on screen (e.g. a deep-linked file opened via a Home page tile or a
  // /book?file= link, whose variant may not match the site's default
  // language) — sets the selects only, without calling onViewChange
  // (which would re-resolve/reload content that's already showing).
  bar.syncView = ({ model, lang } = {}) => {
    if (model && [...modelSel.options].some(o => o.value === model)) modelSel.value = model
    if (lang && [...langSel.options].some(o => o.value === lang)) langSel.value = lang
  }

  // Single click generates the PDF and hands it straight to the browser
  // (new tab — the browser's own viewer/download control takes it from
  // there), same as the other cb-* concept-books — no separate
  // Download/Open buttons to click through afterward.
  pdfBtn.addEventListener('click', async () => {
    const target = targetSel.value
    if (!target) return
    const lvl = level
    const lng = langSel.value
    const mdl = modelSel.value

    pdfBtn.disabled = true
    pdfBtn.textContent = 'Generating…'

    try {
      const url = `/api/pdf?domain=${encodeURIComponent(domainId)}&target=${encodeURIComponent(target)}&level=${encodeURIComponent(lvl)}&language=${encodeURIComponent(lng)}&model=${encodeURIComponent(mdl)}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'PDF generation failed')

      const pdfUrl = `${import.meta.env.BASE_URL}domains/${domainId}/${data.file}`
      pdfBtn.textContent = 'Export PDF ✓'
      pdfBtn.disabled = false
      window.open(pdfUrl, '_blank', 'noopener')
    } catch (err) {
      pdfBtn.textContent = 'Error'
      pdfBtn.title = err.message
      setTimeout(() => { pdfBtn.textContent = 'Export PDF'; pdfBtn.disabled = false }, 3000)
    }
  })

  genBtn.addEventListener('click', async () => {
    const target = targetSel.value
    if (!target) return
    const model = modelSel.value
    const lvl = level
    const lng = langSel.value
    const skipCache = skipCacheChk.checked
    const kind = _kindFor(target)

    genBtn.disabled = true
    genBtn.textContent = 'Queuing…'
    logWrap.style.display = 'block'
    log.textContent = ''

    let taskId
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainId, target, level: lvl, language: lng, model, skip_cache: skipCache, kind }),
      })
      if (!res.ok) throw new Error(`Queue failed: ${res.status}`)
      const data = await res.json()
      taskId = data.task_id
      genBtn.textContent = 'Generating…'
    } catch (err) {
      log.textContent = `✗ ${err.message}\n  Run: bash scripts/start-api.sh`
      genBtn.disabled = false
      genBtn.textContent = 'Retry'
      return
    }

    const es = new EventSource(`/api/tasks/${taskId}/stream`)

    es.addEventListener('log', e => {
      const { message } = JSON.parse(e.data)
      log.textContent += message + '\n'
      log.scrollTop = log.scrollHeight
    })

    es.addEventListener('done', e => {
      es.close()
      const data = JSON.parse(e.data)
      const mdl = data.model || model

      log.textContent += '\n✓ Done'
      genBtn.textContent = 'Generate'
      genBtn.disabled = false

      if (onDone) {
        // kind='concept' writes straight to the shared canonical concepts
        // dir, not a domain-local output dir — conceptRel() still produces
        // the right *domain-shaped* path for openFile()/resolveContentUrl()
        // to parse level/lang/model out of; the canonical-fallback lookup
        // already built into resolveContentUrl() finds the actual file.
        onDone(kind === 'concept' ? conceptRel(lvl, lng, mdl, data.target) : bookRel(lvl, lng, mdl, data.target))
      }
    })

    es.addEventListener('gen_error', e => {
      es.close()
      log.textContent += `\n✗ ${JSON.parse(e.data).message}`
      genBtn.disabled = false
      genBtn.textContent = 'Retry'
    })

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return
      es.close()
      log.textContent += '\n✗ Connection lost'
      genBtn.disabled = false
      genBtn.textContent = 'Retry'
    }
  })

  return { bar, logWrap, setTarget: bar.setTarget, syncView: bar.syncView }
}
