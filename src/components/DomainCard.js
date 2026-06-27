import { t } from '../i18n.js'
import { navigate } from '../router.js'

export function DomainCard(domain) {
  const el = document.createElement('article')
  el.className = 'cb-card'

  const tags = (domain.tags || [])
    .map(tag => `<span class="cb-tag" data-tag="${tag}">${tag}</span>`)
    .join('')

  el.innerHTML = `
    <div class="cb-card__header">
      <h2 class="cb-card__title">${domain.name}</h2>
      <div class="cb-card__tags">${tags}</div>
    </div>
    <p class="cb-card__stats">${domain.nodes} nodes · ${domain.edges} edges · ${domain.primitives} primitives</p>
    <p class="cb-card__desc">${domain.description}</p>
    <div class="cb-card__actions">
      <button class="cb-btn cb-btn--primary js-explore" ${!domain.has_navigator ? 'disabled' : ''}>
        ${t('card.explore')}
      </button>
      <span class="cb-book-indicator" title="${domain.has_book ? 'Book available' : ''}">${domain.has_book ? '📖' : ''}</span>
    </div>
  `

  el.querySelector('.js-explore').addEventListener('click', () => {
    navigate(`/domain/${domain.id}`)
  })

  return el
}
