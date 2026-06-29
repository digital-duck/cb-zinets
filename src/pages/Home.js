import { Header } from '../components/Header.js'
import { navigate } from '../router.js'

export function Home(container) {
  container.innerHTML = ''
  container._renderKey = Symbol()
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-home cb-phrase-home'
  main.innerHTML = `
    <div class="cb-phrase-input-wrap">
      <div class="cb-phrase-input-row">
        <input
          id="cb-phrase-input"
          class="cb-phrase-input"
          type="text"
          placeholder="例如：守株待兔"
          value=""
          autocomplete="off"
          autofocus
        />
        <button id="cb-phrase-btn" class="cb-phrase-btn">Build Concept Graph</button>
      </div>
      <div id="cb-phrase-error" class="cb-phrase-error" style="display:none"></div>
    </div>
    <div class="cb-welcome">
      <p>Enter a Chinese phrase to <strong>decompose its characters</strong>, build a <strong>concept graph</strong>, and generate <strong>AI-powered learning content</strong>.</p>
      <p class="cb-welcome__license">Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a> · Open source · <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache 2.0</a></p>
    </div>
  `
  container.appendChild(main)

  const input = main.querySelector('#cb-phrase-input')
  const btn = main.querySelector('#cb-phrase-btn')
  const errEl = main.querySelector('#cb-phrase-error')

  async function submit() {
    const phrase = input.value.trim()
    if (!phrase) return

    btn.disabled = true
    btn.textContent = '生成中…'
    errEl.style.display = 'none'

    try {
      const res = await fetch('/api/phrase/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase }),
      })
      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail)
      }
      const { domain_id } = await res.json()
      navigate(`/domain/${encodeURIComponent(domain_id)}`)
    } catch (err) {
      errEl.textContent = `错误：${err.message}`
      errEl.style.display = 'block'
      btn.disabled = false
      btn.textContent = '构建图'
    }
  }

  btn.addEventListener('click', submit)
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit() })
}
