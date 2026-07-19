// Reviewer chatbot widget (admin only) — lives at the bottom of the TOC
// sidebar in single mode.
export function makeChatWidget(leftFrame, chatHistory, onChatSend) {
  const S = 'font-family:system-ui,sans-serif'

  const wrap = document.createElement('div')
  wrap.style.cssText = 'margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15)'

  const label = document.createElement('div')
  label.style.cssText = `font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#90b4e8;margin-bottom:8px;${S};font-weight:700`
  label.textContent = '💬 Reviewer Chat'
  wrap.appendChild(label)

  // History display
  const histEl = document.createElement('div')
  histEl.style.cssText = `max-height:220px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:6px`
  function renderHistory() {
    histEl.innerHTML = ''
    chatHistory.forEach(({ role, text }) => {
      const bubble = document.createElement('div')
      const isUser = role === 'user'
      bubble.style.cssText = [
        `font-size:.8rem;line-height:1.4;${S}`,
        `padding:6px 8px;border-radius:6px;word-break:break-word;white-space:pre-wrap`,
        isUser
          ? 'background:rgba(96,165,250,.18);color:#dbeafe;align-self:flex-end;text-align:right'
          : 'background:rgba(255,255,255,.07);color:#e8f0fe;align-self:flex-start',
      ].join(';')
      bubble.textContent = text
      histEl.appendChild(bubble)
    })
    histEl.scrollTop = histEl.scrollHeight
  }
  renderHistory()
  wrap.appendChild(histEl)

  // Input column
  const inputRow = document.createElement('div')
  inputRow.style.cssText = 'display:flex;flex-direction:column;gap:6px'

  const ta = document.createElement('textarea')
  ta.rows = 4
  ta.placeholder = 'Ask about this concept…'
  ta.style.cssText = [
    `width:100%;box-sizing:border-box;resize:vertical;${S};font-size:.8rem`,
    'border:1px solid rgba(255,255,255,0.2);border-radius:5px',
    'background:rgba(255,255,255,.06);color:#e8f0fe',
    'padding:5px 7px;outline:none',
  ].join(';')

  const sendBtn = document.createElement('button')
  sendBtn.textContent = 'Send'
  sendBtn.style.cssText = [
    `${S};font-size:.75rem;font-weight:600;align-self:flex-end`,
    'padding:5px 14px;border:none;border-radius:5px',
    'background:#3b82f6;color:#fff;cursor:pointer;white-space:nowrap',
  ].join(';')

  async function send() {
    const msg = ta.value.trim()
    if (!msg || sendBtn.disabled) return
    ta.value = ''
    sendBtn.disabled = true
    sendBtn.textContent = '…'

    // Extract concept page text for context (best effort)
    let context = ''
    try {
      const doc = leftFrame.contentDocument
      const main = doc?.querySelector('main') || doc?.body
      if (main) context = (main.innerText || '').slice(0, 3000)
    } catch (_) {}

    await onChatSend(msg, context, renderHistory)
    sendBtn.disabled = false
    sendBtn.textContent = 'Send'
    renderHistory()
  }

  sendBtn.addEventListener('click', send)
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } })

  inputRow.appendChild(ta)
  inputRow.appendChild(sendBtn)
  wrap.appendChild(inputRow)

  return wrap
}
