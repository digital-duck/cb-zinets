import { loadCatalog, matchesQuery } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { GraphViewer } from '../components/GraphViewer.js'
import { getContentLang } from './Settings.js'

export async function Domain(container, { id } = {}) {
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

  sel.addEventListener('change', () => {
    if (sel.value) window.location.hash = `/domain/${encodeURIComponent(sel.value)}`
  })

  pickerBar.appendChild(sel)
  page.appendChild(pickerBar)

  if (!id || !domain) return

  if (domain.source) {
    const attr = document.createElement('div')
    attr.className = 'cb-attribution'
    attr.innerHTML = `Source: <a href="${domain.source.url}" target="_blank">${domain.source.title}</a> by ${domain.source.authors} (${domain.source.license}). ${domain.source.attribution}`
    page.appendChild(attr)
  }

  const main = document.createElement('main')
  main.className = 'cb-domain'
  const level = domain.default_level || 'intro'
  const lang = getContentLang()
  main.appendChild(GraphViewer(domain, { level, lang }))
  page.appendChild(main)
}
