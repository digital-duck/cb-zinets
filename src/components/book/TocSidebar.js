// Sidebar TOC section: Compare controls, the contents list, the reviewer
// chat widget (admin, single mode), and the SPL credit line.
import { extractTocItems } from './content.js'
import { makeChatWidget } from './ChatWidget.js'

export function fillTocSection(tocSection, leftFrame, {
  compareChecked,
  compareBtnEnabled,
  skipCacheChecked,
  onCompareToggle,
  onSkipCacheToggle,
  onCompareActivate,
  onConceptClick,
  isAdmin = false,
  chatHistory = [],
  onChatSend = null,
  tocItems = null,
}) {
  // Always clear and render Compare controls first — even when the left frame
  // has placeholder content (no nav.toc), the Compare checkbox/button must
  // remain visible and functional.
  tocSection.innerHTML = ''

  const compareWrap = document.createElement('div')
  compareWrap.style.cssText = 'margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.15)'

  const compareLabel = document.createElement('label')
  compareLabel.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;font-family:system-ui,sans-serif;font-size:0.85rem;color:#e8f0fe;font-weight:600;margin-bottom:8px'
  const chk = document.createElement('input')
  chk.type = 'checkbox'
  chk.checked = compareChecked
  chk.style.cssText = 'width:14px;height:14px;cursor:pointer;accent-color:#60a5fa'
  chk.addEventListener('change', () => onCompareToggle(chk.checked))
  compareLabel.appendChild(chk)
  compareLabel.appendChild(document.createTextNode('Compare'))
  compareWrap.appendChild(compareLabel)

  if (compareChecked) {
    // Row: [↻ fresh checkbox] [Compare ▶ button]
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:6px'

    const skipLabel = document.createElement('label')
    skipLabel.style.cssText = 'display:flex;align-items:center;gap:3px;cursor:pointer;flex-shrink:0;font-family:system-ui,sans-serif;font-size:0.75rem;color:#90b4e8;white-space:nowrap'
    skipLabel.title = 'Skip cache — always run a fresh comparison'
    const skipChk = document.createElement('input')
    skipChk.type = 'checkbox'
    skipChk.checked = skipCacheChecked
    skipChk.style.cssText = 'width:12px;height:12px;cursor:pointer;accent-color:#60a5fa;flex-shrink:0'
    skipChk.addEventListener('change', () => onSkipCacheToggle(skipChk.checked))
    skipLabel.appendChild(skipChk)
    skipLabel.appendChild(document.createTextNode('↻ fresh'))
    row.appendChild(skipLabel)

    const btn = document.createElement('button')
    btn.textContent = 'Compare ▶'
    btn.disabled = !compareBtnEnabled
    btn.style.cssText = [
      'flex:1;padding:6px 10px;font-size:0.8rem;font-weight:600',
      'border-radius:6px;border:none;font-family:system-ui,sans-serif;transition:opacity 0.15s',
      compareBtnEnabled
        ? 'background:#3b82f6;color:#fff;cursor:pointer'
        : 'background:#374151;color:#6b7280;cursor:not-allowed;opacity:0.6',
    ].join(';')
    btn.title = compareBtnEnabled
      ? 'Generate AI comparison of both sections in PANE C'
      : 'Both panes need content before comparing'
    btn.addEventListener('click', () => { if (!btn.disabled) onCompareActivate() })
    row.appendChild(btn)

    compareWrap.appendChild(row)
  }

  tocSection.appendChild(compareWrap)

  // TOC section — persisted items when provided (so browsing into a shared
  // concept page keeps the current book's contents), else the frame's own TOC.
  const items = tocItems ?? extractTocItems(leftFrame)
  if (!items) return

  const heading = document.createElement('div')
  heading.style.cssText = 'font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700'
  heading.textContent = 'Contents'
  tocSection.appendChild(heading)

  const ol = document.createElement('ol')
  ol.style.cssText = 'list-style:decimal inside;padding:0;margin:0;flex:1'
  items.forEach(({ href, label, isTarget }) => {
    const newLi = document.createElement('li')
    newLi.style.cssText = `margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${isTarget ? ';font-weight:700' : ''}`
    const newA = document.createElement('a')
    newA.textContent = label
    newA.href = '#'
    newA.style.cssText = `text-decoration:none;color:${isTarget ? '#fff' : '#a8c8f0'}`
    newA.addEventListener('mouseover', () => { newA.style.color = '#fff' })
    newA.addEventListener('mouseout', () => { newA.style.color = isTarget ? '#fff' : '#a8c8f0' })
    newA.addEventListener('click', e => { e.preventDefault(); onConceptClick(href) })
    newLi.appendChild(newA)
    ol.appendChild(newLi)
  })
  tocSection.appendChild(ol)

  // Reviewer chatbot (admin only, hidden when Compare is on)
  if (isAdmin && !compareChecked && onChatSend) {
    tocSection.appendChild(makeChatWidget(leftFrame, chatHistory, onChatSend))
  }

  const credit = document.createElement('div')
  credit.style.cssText = 'margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif'
  credit.innerHTML = 'Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>'
  tocSection.appendChild(credit)
}
