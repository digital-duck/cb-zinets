// Variant parsing, content-URL resolution, and iframe plumbing for the
// Book Content page. Extracted from pages/BookContent.js (né BookPage.js).
import { parseVariant, variantHtmlDir, canonicalConceptRel } from '../../lib/paths.js'
import { contentExists, markKnown } from '../../lib/contentExists.js'

export const LEVELS = ['intro', 'core', 'college', 'research']

export const MODELS = [
  { value: 'sonnet', label: 'sonnet (Claude) *' },
  { value: 'gemma4', label: 'gemma4 (Ollama)' },
  { value: 'gemma3', label: 'gemma3 (Ollama)' },
]

export function parseLevelLang(file) {
  const v = parseVariant(file)
  if (v) return { level: v.level, lang: v.language }
  // Legacy layout without a model segment
  const m = file.match(/output\/([^.]+)\.([^/]+)\//)
  return m ? { level: m[1], lang: m[2] } : { level: 'college', lang: 'en' }
}

export function parseModel(file) {
  return parseVariant(file)?.model ?? ''
}

export function conceptFilename(file) {
  return file.replace(/^.*\//, '')
}

// A book-level page is either "book_{target}.html" or, for phrase targets
// (which skip the redundant "book_" prefix — see bookRel), "phrase_{...}.html".
export function isBookFile(fname) {
  return fname.startsWith('book_') || fname.startsWith('phrase_')
}

export function conceptFromFile(file) {
  return decodeURIComponent(conceptFilename(file).replace(/^concept_/, '').replace(/\.html$/, ''))
}

export function buildUrl(domain, file, level, lang, model) {
  const fname = conceptFilename(file)
  const dir = model
    ? variantHtmlDir(level, lang, model)
    : `output/${level}.${lang}/html`  // legacy layout without a model segment
  return `${import.meta.env.BASE_URL}domains/${domain}/${dir}/${fname}`
}

export function markKnownUrls(domain, files) {
  markKnown(files.map(f => `${import.meta.env.BASE_URL}domains/${encodeURIComponent(domain)}/${f.file}`))
}

export function notFoundHtml(fname, model, lang, level) {
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
export async function resolveContentUrl(domain, file, level, lang, model) {
  const fname = conceptFilename(file)
  if (domain) {
    const url = buildUrl(domain, file, level, lang, model)
    if (await contentExists(url)) return url
  }
  if (model && fname.startsWith('concept_')) {
    const concept = conceptFromFile(fname)
    const canonical = `${import.meta.env.BASE_URL}${canonicalConceptRel(level, lang, model, concept)}`
    if (await contentExists(canonical)) return canonical
  }
  return null
}

// Snapshot a frame's own nav.toc into plain data (survives frame navigation)
export function extractTocItems(frame) {
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

export async function loadFrame(frame, domain, file, state, onContentStatus, isStale) {
  const url = await resolveContentUrl(domain, file, state.level, state.lang, state.model)
  // A newer reload for this pane may have started (and even finished) while
  // this one was awaiting resolveContentUrl — discard this one if so,
  // otherwise an out-of-order response clobbers the frame with stale content
  // (dropdown shows the new selection, pane shows the old one's result).
  if (isStale && isStale()) return
  if (onContentStatus) onContentStatus(!!url)
  if (url) {
    frame.src = url
  } else {
    frame.removeAttribute('src')
    frame.srcdoc = notFoundHtml(conceptFilename(file), state.model, state.lang, state.level)
  }
}

export function hideTocInFrame(frame) {
  try {
    const doc = frame.contentDocument
    if (!doc) return
    const style = doc.createElement('style')
    style.textContent = 'nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }'
    doc.head.appendChild(style)
  } catch (_) {}
}
