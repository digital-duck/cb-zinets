import { Header } from '../components/Header.js'

export async function GraphBuilder(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-graph-builder-page'
  main.innerHTML = `
    <div class="cb-input-bar">
      <div class="cb-input-container">
        <input
          type="text"
          id="phrase-input"
          class="cb-phrase-input"
          placeholder="输入短语、成语或句子... 例如：画蛇添足，守株待兔，卧虎藏龙"
          value="守株待兔"
          autocomplete="off"
        />
        <button id="build-btn" class="cb-build-btn">构建图</button>
      </div>
    </div>
    <div id="graph-output" class="cb-graph-output" style="display:none;"></div>
  `
  container.appendChild(main)

  const inputBar = main.querySelector('.cb-input-bar')
  const graphContainer = main.querySelector('#graph-output')
  const input = main.querySelector('#phrase-input')
  const buildBtn = main.querySelector('#build-btn')

  buildBtn.addEventListener('click', async () => {
    const phrase = input.value.trim()
    if (!phrase) { alert('请输入短语或成语'); return }
    await buildGraph(phrase)
  })

  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') buildBtn.click() })

  async function buildGraph(phrase) {
    inputBar.style.display = 'none'
    graphContainer.style.display = 'block'
    graphContainer.innerHTML = '<div style="padding:40px;text-align:center;color:#999;font-size:16px">正在构建概念图...</div>'

    try {
      const response = await fetch('/api/phrase/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      })
      if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`)

      const data = await response.json()

      graphContainer.innerHTML = ''
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'width:100%;height:100%;border:none;display:block'
      graphContainer.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(data.html)
      iframeDoc.close()

      // Back button
      const backBtn = document.createElement('button')
      backBtn.textContent = '← 返回'
      backBtn.style.cssText = 'position:fixed;top:80px;right:20px;padding:10px 20px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;z-index:1000;font-weight:600'
      backBtn.addEventListener('click', () => {
        backBtn.remove()
        inputBar.style.display = 'block'
        graphContainer.style.display = 'none'
        graphContainer.innerHTML = ''
        input.focus()
      })
      document.body.appendChild(backBtn)

      // Inject generate section after a short delay for the vis-network to initialise
      setTimeout(() => _injectGenerateSection(iframe.contentWindow, iframeDoc, phrase, data.phrase_id), 400)

    } catch (err) {
      graphContainer.innerHTML = `
        <div style="padding:40px;text-align:center">
          <div style="color:#d32f2f;font-size:16px;margin-bottom:12px">构建失败</div>
          <pre style="color:#666;font-size:13px;text-align:left;max-width:600px;margin:0 auto 16px;white-space:pre-wrap">${err.message}</pre>
          <button onclick="location.reload()" style="padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer">重新加载</button>
        </div>`
    }
  }
}

function _injectGenerateSection(win, doc, phrase, phraseId) {
  const pathHeader = doc.querySelector('#path-header')
  if (!pathHeader || doc.querySelector('#cb-gen')) return

  const _BG   = 'padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f'
  const _TITLE = 'font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px'
  const _SEL   = 'width:100%;padding:5px 8px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;margin-bottom:6px;font-family:system-ui,sans-serif'

  const div = doc.createElement('div')
  div.id = 'cb-gen'
  div.style.cssText = _BG
  div.innerHTML = `
    <div style="${_TITLE}">Generate Concept Book</div>
    <select id="cb-target-sel" style="${_SEL}">
      <option value="">Select target concept…</option>
    </select>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px">
      <select id="cb-level-sel" style="flex:1;${_SEL}margin-bottom:0">
        <option value="intro">Intro</option>
        <option value="core">Core</option>
        <option value="college">College</option>
        <option value="research">Research</option>
      </select>
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#90b4e8;white-space:nowrap">
        <input type="checkbox" id="cb-skip-cache" style="margin:0"> Skip cache
      </label>
    </div>
    <button id="cb-gen-btn" disabled
      style="width:100%;padding:6px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif;margin-bottom:6px">
      Generate
    </button>
    <div id="cb-gen-log" style="font-size:10px;color:#90b4e8;max-height:80px;overflow-y:auto;display:none;word-break:break-all"></div>
  `
  pathHeader.insertAdjacentElement('afterend', div)

  const sel   = doc.querySelector('#cb-target-sel')
  const lvl   = doc.querySelector('#cb-level-sel')
  const skip  = doc.querySelector('#cb-skip-cache')
  const btn   = doc.querySelector('#cb-gen-btn')
  const log   = doc.querySelector('#cb-gen-log')

  // Populate non-primitive targets
  const nodes = (win.__cb_RAW?.nodes || []).filter(n => n.kind !== 'primitive')
  nodes.sort((a, b) => a.label.localeCompare(b.label))
  nodes.forEach(n => {
    const opt = doc.createElement('option')
    opt.value = n.id
    opt.textContent = n.label || n.id
    // Pre-select phrase node if present
    if (n.kind === 'application') opt.selected = true
    sel.appendChild(opt)
  })
  if (sel.value) btn.disabled = false

  sel.addEventListener('change', () => { btn.disabled = !sel.value })

  btn.addEventListener('click', () => {
    const target = sel.value
    if (!target) return
    btn.disabled = true
    btn.textContent = 'Generating…'
    log.style.display = 'block'
    log.textContent = ''

    const params = new URLSearchParams({
      domain: phrase,
      target,
      level: lvl.value,
      language: 'en',
      model: 'gemma4',
      skip_cache: skip.checked ? 'true' : 'false',
    })
    const es = new win.EventSource(`/api/generate?${params}`)

    es.addEventListener('log', e => {
      const msg = JSON.parse(e.data).message || ''
      log.textContent += msg + '\n'
      log.scrollTop = log.scrollHeight
    })

    es.addEventListener('done', () => {
      es.close()
      btn.textContent = 'Done ✓'
      btn.style.background = '#16a34a'
      // Navigate parent window to book page
      const bookHash = `#/book?domain=${encodeURIComponent(phrase)}&target=${encodeURIComponent(target)}&level=${lvl.value}&lang=en&model=gemma4`
      win.parent.location.hash = bookHash
    })

    es.addEventListener('gen_error', e => {
      es.close()
      btn.disabled = false
      btn.textContent = 'Error — retry'
      btn.style.background = '#dc2626'
      log.textContent += '\n[ERROR] ' + (JSON.parse(e.data).message || 'unknown')
    })

    es.onerror = () => {
      es.close()
      btn.disabled = false
      btn.textContent = 'Connection lost — retry'
      btn.style.background = '#dc2626'
    }
  })
}
