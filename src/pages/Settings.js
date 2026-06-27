import { Header } from '../components/Header.js'
import { getLocale } from '../i18n.js'

export function getContentLang() {
  return getLocale()
}

const ADAPTERS = {
  claude_cli: {
    label: 'Claude CLI',
    models: [
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
      { value: 'claude-opus-4-8', label: 'Opus 4.8' },
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    models: [
      { value: 'anthropic/claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'anthropic/claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
      { value: 'anthropic/claude-opus-4-8', label: 'Claude Opus 4.8' },
      { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
      { value: 'openai/o3-mini', label: 'o3-mini' },
      { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
      { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    ],
  },
  ollama: {
    label: 'Ollama (local)',
    models: null,
  },
}

async function populateModels(adapterSel, modelSel) {
  const adapter = ADAPTERS[adapterSel.value]
  modelSel.innerHTML = ''
  if (!adapter) return

  let models = adapter.models
  if (adapterSel.value === 'ollama' && !models) {
    try {
      const res = await fetch('/api/settings/ollama-models')
      if (res.ok) models = await res.json()
    } catch (_) {}
    if (!models || models.length === 0) {
      const opt = document.createElement('option')
      opt.value = ''
      opt.textContent = '(ollama not available)'
      modelSel.appendChild(opt)
      return
    }
    ADAPTERS.ollama.models = models
  }

  for (const m of models) {
    const opt = document.createElement('option')
    opt.value = m.value
    opt.textContent = m.label
    modelSel.appendChild(opt)
  }
}

export async function Settings(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-settings'
  main.innerHTML = `
    <h2>Settings</h2>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">LLM</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">Adapter</label>
          <select id="cb-adapter" class="cb-settings__select">
            ${Object.entries(ADAPTERS).map(([k, v]) =>
              `<option value="${k}">${v.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="cb-settings__field cb-settings__field--grow">
          <label class="cb-settings__label">Model</label>
          <select id="cb-model" class="cb-settings__select"></select>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-settings-save" class="cb-btn">Save</button>
        <span id="cb-settings-status" class="cb-settings__status"></span>
      </div>
      <div class="cb-settings__current" id="cb-current-llm"></div>
    </section>
  `
  container.appendChild(main)

  const adapterSel = main.querySelector('#cb-adapter')
  const modelSel = main.querySelector('#cb-model')
  const saveBtn = main.querySelector('#cb-settings-save')
  const status = main.querySelector('#cb-settings-status')
  const currentLlm = main.querySelector('#cb-current-llm')

  adapterSel.addEventListener('change', () => populateModels(adapterSel, modelSel))
  await populateModels(adapterSel, modelSel)

  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()
      currentLlm.textContent = `Current: ${data.llm}`
      const [adapter, ...modelParts] = data.llm.split(':')
      const model = modelParts.join(':')
      if (ADAPTERS[adapter]) {
        adapterSel.value = adapter
        await populateModels(adapterSel, modelSel)
        if ([...modelSel.options].some(o => o.value === model)) {
          modelSel.value = model
        }
      }
    }
  } catch (_) {
    status.textContent = 'API not reachable — run the backend to change settings'
    status.style.color = '#dc2626'
  }

  saveBtn.addEventListener('click', async () => {
    const llm = `${adapterSel.value}:${modelSel.value}`
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llm }),
      })
      if (res.ok) {
        currentLlm.textContent = `Current: ${llm}`
        status.textContent = 'Saved'
        status.style.color = '#16a34a'
      } else {
        status.textContent = 'Save failed'
        status.style.color = '#dc2626'
      }
    } catch (_) {
      status.textContent = 'API not reachable'
      status.style.color = '#dc2626'
    }
    setTimeout(() => { status.textContent = '' }, 3000)
  })
}
