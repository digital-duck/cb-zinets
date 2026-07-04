import { Header } from '../components/Header.js'
import { loadResources } from '../data/resources.js'

function _renderTable(tableWrapEl, resources) {
  tableWrapEl.innerHTML = `
    <table class="cb-resources-table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${resources.map(r => `
          <tr>
            <td><a href="${r.url}" target="_blank" rel="noopener">${r.name}</a></td>
            <td>${r.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

export function Resources(container) {
  container.innerHTML = ''
  container._renderKey = Symbol()
  const renderKey = container._renderKey
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-resources'
  main.innerHTML = `
    <h1>Resources</h1>
    <p>
      Great dictionaries and reference sites for looking up Chinese characters and phrases —
      the same set linked from every concept page, gathered here for quick browsing.
    </p>
    <div id="cb-resources-table-wrap" class="cb-resources-table-wrap">
      <div class="cb-home-empty">Loading…</div>
    </div>
  `
  container.appendChild(main)

  const tableWrapEl = main.querySelector('#cb-resources-table-wrap')

  loadResources().then(resources => {
    if (container._renderKey !== renderKey) return
    _renderTable(tableWrapEl, resources)
  }).catch(() => {
    if (container._renderKey !== renderKey) return
    tableWrapEl.innerHTML = '<div class="cb-home-empty">Failed to load resources.</div>'
  })
}
