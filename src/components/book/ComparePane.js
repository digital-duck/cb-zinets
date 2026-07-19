// PANE C: the AI comparison pane — placeholder element, SSE-driven compare
// run, and the tiny markdown renderer its output uses.
import { conceptFromFile } from './content.js'

function mdToHtml(md) {
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

export function makePaneCEl() {
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

export function startCompare(domain, currentFile, p1, p2, paneCEl, skipCache) {
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
      <div style="max-width:820px">${mdToHtml(comparison)}</div>`
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
