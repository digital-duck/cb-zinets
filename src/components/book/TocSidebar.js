// TOC sidebar for the consolidated Graph-IDE content panel: the Contents
// list for whatever node is currently anchored on the graph (see
// BookContent.js `_graphTocItems`), plus the reviewer chatbot for admins.
// Styled to match the other cb-* concept-books' `.cb-ide-toc` (light theme,
// plain list — no numbering, no dark "book browser" chrome left over from
// cb-zinets' original standalone Content page).
import { makeChatWidget } from './ChatWidget.js'

export function fillTocSection(tocSection, leftFrame, {
  tocItems,
  isAdmin = false,
  chatHistory = [],
  onChatSend = null,
  onConceptClick,
}) {
  tocSection.innerHTML = ''

  if (!tocItems || !tocItems.length) {
    tocSection.innerHTML = '<p class="cb-panel__hint">No concepts found on this path.</p>'
    return
  }

  const list = document.createElement('ul')
  list.className = 'cb-ide-toc__list'
  tocItems.forEach(({ href, label, isTarget }) => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = '#'
    a.textContent = label
    if (isTarget) a.className = 'cb-ide-toc__current'
    a.addEventListener('click', e => { e.preventDefault(); onConceptClick(href) })
    li.appendChild(a)
    list.appendChild(li)
  })
  tocSection.appendChild(list)

  if (isAdmin && onChatSend) {
    tocSection.appendChild(makeChatWidget(leftFrame, chatHistory, onChatSend))
  }
}
