import { Header } from '../components/Header.js'

function parseBookParams() {
  const hash = window.location.hash.replace(/^#\/book\??/, '')
  const p = new URLSearchParams(hash)
  return {
    domain: p.get('domain') || '',
    target: p.get('target') || '',
    level:  p.get('level')  || 'intro',
    lang:   p.get('lang')   || 'en',
    model:  p.get('model')  || 'gemma4',
  }
}

export async function BookPage(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const { domain, target, level, lang, model } = parseBookParams()

  const main = document.createElement('main')
  main.style.cssText = 'display:flex;height:calc(100vh - var(--header-height));overflow:hidden'
  container.appendChild(main)

  if (!domain || !target) {
    main.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#f8fafc;color:#6b7280">
        <p style="font-size:1.1rem;margin-bottom:8px">No concept selected</p>
        <a href="#/" style="padding:8px 16px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">← Back to Graph</a>
      </div>`
    return
  }

  // Left sidebar
  const sidebar = document.createElement('nav')
  sidebar.style.cssText = [
    'width:220px', 'flex-shrink:0',
    'background:#1e3a5f', 'color:#e8f0fe',
    'padding:20px 14px',
    'display:flex', 'flex-direction:column',
    'overflow-y:auto',
    'font-family:system-ui,sans-serif',
    'border-right:1px solid rgba(255,255,255,0.12)',
  ].join(';')

  sidebar.innerHTML = `
    <a href="#/" style="color:#a8c8f0;margin-bottom:20px;display:block;font-size:.85rem;text-decoration:none">← Back to Graph</a>
    <div style="font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:12px;font-weight:700">Concept Book</div>
    <div style="display:flex;flex-direction:column;gap:10px;font-size:0.82rem">
      <div>
        <div style="color:#90b4e8;font-size:.7rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Phrase</div>
        <div style="color:#e8f0fe;word-break:break-word">${domain}</div>
      </div>
      <div>
        <div style="color:#90b4e8;font-size:.7rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Target</div>
        <div style="color:#e8f0fe;word-break:break-word">${target}</div>
      </div>
      <div>
        <div style="color:#90b4e8;font-size:.7rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Level / Model</div>
        <div style="color:#e8f0fe">${level} · ${model}</div>
      </div>
    </div>
    <div style="margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15);font-size:10px;color:#90b4e8">
      ZiNets Concept Book
    </div>
  `
  main.appendChild(sidebar)

  // Right: iframe with generated book HTML
  const right = document.createElement('div')
  right.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden'
  main.appendChild(right)

  const bookFile = `output/${level}.${lang}/${model}/html/book_${target}.html`
  const src = `${import.meta.env.BASE_URL}domains/${encodeURIComponent(domain)}/${bookFile}`

  const iframe = document.createElement('iframe')
  iframe.src = src
  iframe.style.cssText = 'flex:1;border:none;background:#fff'
  right.appendChild(iframe)

  iframe.addEventListener('error', () => {
    right.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px;color:#6b7280">
        <p style="font-size:1rem;margin-bottom:8px">Book not found</p>
        <p style="font-size:.85rem;color:#9ca3af;margin-bottom:20px">${bookFile}</p>
        <a href="#/" style="padding:8px 16px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">← Back to Graph</a>
      </div>`
  })
}
