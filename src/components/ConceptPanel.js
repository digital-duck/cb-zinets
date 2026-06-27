export function ConceptPanel(domain, { selectNode, signal, level = 'intro', lang = 'en' } = {}) {
  const el = document.createElement('aside')
  el.className = 'cb-concept-panel'

  function renderEmpty() {
    el.innerHTML = `<p class="cb-panel__hint">Click any node in the graph to see its details.</p>`
  }

  function renderNode(node) {
    const kindCls = `cb-kind--${node.kind}`
    const prereqChips = (node.prereqs || [])
      .map(p => `<button class="cb-prereq-chip" data-id="${p}">${p.replace(/_/g, ' ')}</button>`)
      .join('')
    const bookAnchor = node.id.replace(/_/g, '-')
    const bookUrl = `${import.meta.env.BASE_URL}domains/${domain.id}/output/${level}.${lang}/html/concept_book.html#${bookAnchor}`

    el.innerHTML = `
      <div class="cb-panel__node">
        <div class="cb-panel__node-header">
          <h3 class="cb-panel__title">${node.label}</h3>
          <span class="cb-kind-badge ${kindCls}">${node.kind}</span>
        </div>
        ${node.tier != null ? `<p class="cb-panel__tier">BFS tier ${node.tier}</p>` : ''}

        <p class="cb-panel__defines">${node.defines || ''}</p>

        ${prereqChips ? `
          <div class="cb-panel__section">
            <h4 class="cb-panel__section-title">Prerequisites</h4>
            <div class="cb-panel__prereqs">${prereqChips}</div>
          </div>
        ` : ''}

        ${node.verifier || node.lab ? `
          <div class="cb-panel__section cb-panel__meta-row">
            ${node.verifier ? `<span class="cb-meta">Verifier: <code>${node.verifier}</code></span>` : ''}
            ${node.lab     ? `<span class="cb-meta">Lab: <code>${node.lab}</code></span>`           : ''}
          </div>
        ` : ''}

        ${node.play ? `
          <div class="cb-panel__section">
            <h4 class="cb-panel__section-title">Try it</h4>
            <p class="cb-panel__play">${node.play}</p>
          </div>
        ` : ''}

        ${domain.has_book ? `
          <div class="cb-panel__section">
            <a class="cb-btn cb-btn--sm" href="${bookUrl}" target="_blank" rel="noopener">
              Read in book →
            </a>
          </div>
        ` : ''}
      </div>
    `

    el.querySelectorAll('.cb-prereq-chip').forEach(chip => {
      chip.addEventListener('click', () => selectNode?.(chip.dataset.id))
    })
  }

  window.addEventListener('cb:nodeSelected', e => renderNode(e.detail.node), { signal })

  renderEmpty()
  return el
}
