import { loadCatalog } from '../data/catalog.js'
import { DomainCard } from '../components/DomainCard.js'
import { Header } from '../components/Header.js'
import { t } from '../i18n.js'

export async function Home(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-home'
  main.innerHTML = `<p class="cb-loading">${t('loading')}</p>`
  container.appendChild(main)

  let catalog
  try {
    catalog = await loadCatalog()
  } catch (err) {
    main.innerHTML = `<p class="cb-error">Could not load domains. ${err.message}</p>`
    return
  }

  const allTags = [...new Set(catalog.flatMap(d => d.tags))].sort()
  const allLevels = ['intro', 'core', 'college', 'research']
  let activeTag = 'all'
  let activeLevel = 'all'

  function render() {
    let filtered = catalog
    if (activeTag !== 'all') filtered = filtered.filter(d => d.tags.includes(activeTag))
    if (activeLevel !== 'all') filtered = filtered.filter(d => d.default_level === activeLevel)

    main.innerHTML = `
      <div class="cb-home__hero">
        <p class="cb-home__subtitle">${t('home.subtitle')}</p>
      </div>
      <div class="cb-home__filters">
        <span class="cb-filter-group">
          <span class="cb-filter-label">Subject</span>
          <button class="cb-filter-btn ${activeTag === 'all' ? 'active' : ''}" data-tag="all">All</button>
          ${allTags.map(t_ =>
            `<button class="cb-filter-btn ${activeTag === t_ ? 'active' : ''}" data-tag="${t_}">${t_}</button>`
          ).join('')}
        </span>
        <span class="cb-filter-right">
          <span class="cb-filter-label">Level</span>
          <select class="cb-level-select" id="cb-level-filter">
            <option value="all" ${activeLevel === 'all' ? 'selected' : ''}>All</option>
            ${allLevels.map(l =>
              `<option value="${l}" ${activeLevel === l ? 'selected' : ''}>${l.charAt(0).toUpperCase() + l.slice(1)}</option>`
            ).join('')}
          </select>
        </span>
      </div>
      <div class="cb-card-grid"></div>
    `

    const grid = main.querySelector('.cb-card-grid')
    filtered.forEach(domain => grid.appendChild(DomainCard(domain)))

    main.querySelectorAll('.cb-filter-btn[data-tag]').forEach(btn => {
      btn.addEventListener('click', () => { activeTag = btn.dataset.tag; render() })
    })
    main.querySelector('#cb-level-filter').addEventListener('change', e => {
      activeLevel = e.target.value; render()
    })
  }

  render()
}
