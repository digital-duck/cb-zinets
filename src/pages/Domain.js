import { loadCatalog } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { GraphViewer } from '../components/GraphViewer.js'
import { getContentLang } from './Settings.js'

export async function Domain(container, { id }) {
  container.innerHTML = ''

  const controller = new AbortController()
  window.addEventListener('hashchange', () => controller.abort(), { once: true, signal: controller.signal })

  let domain = { id, name: id, has_book: false, books: [], generated_concepts: [], capstone: null }
  try {
    const catalog = await loadCatalog()
    domain = catalog.find(d => d.id === id) ?? domain
  } catch (_) {}

  container.appendChild(Header({ domainName: domain.name }))

  if (domain.source) {
    const attr = document.createElement('div')
    attr.className = 'cb-attribution'
    attr.innerHTML = `Source: <a href="${domain.source.url}" target="_blank">${domain.source.title}</a> by ${domain.source.authors} (${domain.source.license}). ${domain.source.attribution}`
    container.appendChild(attr)
  }

  const main = document.createElement('main')
  main.className = 'cb-domain'
  const level = domain.default_level || 'intro'
  const lang = getContentLang()
  main.appendChild(GraphViewer(domain, { level, lang }))
  container.appendChild(main)
}
