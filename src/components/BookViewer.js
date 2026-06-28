export function BookViewer(domainId, { level = 'intro', lang = 'en' } = {}) {
  const el = document.createElement('div')
  el.className = 'cb-book-viewer'

  const src = `${import.meta.env.BASE_URL}domains/${domainId}/output/${level}.${lang}/html/concept_book.html`
  const frame = document.createElement('iframe')
  frame.className = 'cb-book-viewer__frame'
  frame.src = src
  frame.title = `${domainId} concept book`

  el.appendChild(frame)
  return el
}
