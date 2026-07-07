import { Header } from '../components/Header.js'
import { getLocale } from '../i18n.js'

export function getContentLang() {
  return getLocale()
}

// Mirrors api/services/api_keys_svc.py PROVIDERS — id must match the backend.
const API_KEY_PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'qwen', label: 'Qwen' },
  { id: 'z', label: 'Z (Zhipu)' },
  { id: 'openrouter', label: 'OpenRouter.ai' },
]

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
      { value: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
      { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
      { value: 'openai/gpt-5.4-mini', label: 'GPT 5.4 Mini' },
      { value: 'openai/o3-mini', label: 'o3-mini' },
      { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
      { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
      { value: 'z-ai/glm-5.2', label: 'GLM 5.2' },
      { value: 'qwen/qwen3.5-35b-a3b', label: 'Qwen 3.5 35B' },
      { value: 'qwen/qwen3.6-35b-a3b', label: 'Qwen 3.6 35B' },
      { value: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra 550B' },
      { value: 'moonshotai/kimi-k2.6', label: 'Kimi 2.6' },
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

function ttlHint(hours) {
  if (hours === 0) return 'never expires'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours === 1) return '1 hour'
  if (hours < 24) return `${hours} hours`
  const days = hours / 24
  return Number.isInteger(days) ? `${days} day${days > 1 ? 's' : ''}` : `${hours} hours`
}

export async function Settings(container) {
  container.innerHTML = ''
  container._renderKey = Symbol()
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-settings'
  main.innerHTML = `
    <h2>Settings</h2>

    <div class="cb-settings__tabs">
      <button class="cb-settings__tab cb-settings__tab--active" data-tab="app">App-specific</button>
      <button class="cb-settings__tab" data-tab="llm">LLM Model</button>
    </div>

    <div class="cb-settings__grid" data-tab-panel="llm" style="display:none">

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">SPL Adapter and Model Configuration</div>
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

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">SPL Execution Limits</div>
        <div class="cb-settings__pair">
          <div class="cb-settings__field">
            <label class="cb-settings__label">While Max Iterations</label>
            <input id="cb-while-max-iter" type="number" min="1" step="1" value="50"
              class="cb-settings__select" style="width:100px"
              title="SPL_WHILE_MAX_ITER — max loop iterations before abort (default 15).">
          </div>
          <div class="cb-settings__field">
            <label class="cb-settings__label">Max LLM Calls</label>
            <input id="cb-max-llm-calls" type="number" min="1" step="1" value="50"
              class="cb-settings__select" style="width:100px"
              title="SPL_MAX_LLM_CALLS — max LLM GENERATE calls per workflow run.">
          </div>
          <div class="cb-settings__field">
            <label class="cb-settings__label">Max Tokens / LLM Call</label>
            <input id="cb-max-tokens" type="number" min="100" step="100" value="4000"
              class="cb-settings__select" style="width:100px"
              title="--max-tokens passed to spl3 — max output tokens per LLM GENERATE call. SPL.py default is 1000 (causes truncation); 4000 recommended.">
          </div>
          <div class="cb-settings__field">
            <label class="cb-settings__label">Parallel Tasks</label>
            <input id="cb-max-concurrent" type="number" min="1" max="8" step="1" value="2"
              class="cb-settings__select" style="width:80px"
              title="Max concurrent spl3 generation jobs. 1 = serial, 2 = sonnet + gemma3 simultaneously.">
          </div>
        </div>
        <div class="cb-settings__row" style="margin-top:16px">
          <button id="cb-spl-limits-save" class="cb-btn">Save</button>
          <span id="cb-spl-limits-status" class="cb-settings__status"></span>
        </div>
      </section>

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">LLM API Keys</div>
        <p class="cb-settings__desc">
          Stored in a local .env file (never committed to git) and applied to
          generation jobs immediately — no restart needed. Keys are
          write-only: once saved, only a masked preview is ever shown again.
        </p>
        <div id="cb-api-keys-list"></div>
      </section>

    </div>

    <div class="cb-settings__grid" data-tab-panel="app">

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">Graph Layout</div>
        <div class="cb-settings__pair">
          <div class="cb-settings__field">
            <label class="cb-settings__label">Layout style</label>
            <select id="cb-graph-layout" class="cb-settings__select">
              <option value="compact">Compact Grid (current default)</option>
              <option value="hierarchical">Hierarchical DAG (tier-based tree)</option>
            </select>
          </div>
        </div>
        <div class="cb-settings__row" style="margin-top:16px">
          <button id="cb-graph-layout-save" class="cb-btn">Save</button>
          <span id="cb-graph-layout-status" class="cb-settings__status"></span>
        </div>
      </section>

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">AI Semantic Compare Cache</div>
        <div class="cb-settings__pair">
          <div class="cb-settings__field">
            <label class="cb-settings__label">TTL (hours)</label>
            <input id="cb-cache-ttl" type="number" min="0" step="1" value="24"
              class="cb-settings__select" style="width:100px"
              title="How long a cached comparison result is reused. 0 = never expire.">
          </div>
          <div class="cb-settings__field" style="align-self:flex-end;padding-bottom:4px">
            <span id="cb-cache-ttl-hint" style="font-size:0.82rem;color:#6b7280"></span>
          </div>
        </div>
        <div class="cb-settings__row" style="margin-top:16px">
          <button id="cb-cache-save" class="cb-btn">Save</button>
          <span id="cb-cache-status" class="cb-settings__status"></span>
        </div>
      </section>

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">Concept Cache</div>
        <p class="cb-settings__desc">
          Stores generated concept sections in SQLite so the same concept is only
          sent to the LLM once, regardless of which domain requests it.
          Cache key: (concept, level, language, model).
        </p>
        <div class="cb-settings__toggle-row">
          <label class="cb-toggle" for="cb-concept-cache-enabled">
            <input type="checkbox" id="cb-concept-cache-enabled">
            <span class="cb-toggle__slider"></span>
          </label>
          <span id="cb-concept-cache-label" class="cb-toggle__label">Disabled</span>
        </div>
        <div class="cb-settings__row" style="margin-top:16px">
          <button id="cb-concept-cache-save" class="cb-btn">Save</button>
          <span id="cb-concept-cache-status" class="cb-settings__status"></span>
        </div>
      </section>

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">Catalog Sync</div>
        <p class="cb-settings__desc">
          The catalog powers Home search and the domain pickers. It is updated
          automatically after every generation, but if it ever drifts from
          what's on disk (interrupted batch runs, hand-edited files, missing
          pinyin in search), Sync rebuilds it from the generated content.
          Idempotent and safe to run anytime, even during generation.
        </p>
        <div class="cb-settings__row" style="margin-top:16px">
          <button id="cb-catalog-sync" class="cb-btn">Sync Catalog</button>
          <span id="cb-catalog-sync-status" class="cb-settings__status"></span>
        </div>
      </section>

    </div>
  `
  container.appendChild(main)

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabButtons = main.querySelectorAll('.cb-settings__tab')
  const tabPanels = main.querySelectorAll('[data-tab-panel]')
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.toggle('cb-settings__tab--active', b === btn))
      tabPanels.forEach(p => {
        p.style.display = p.dataset.tabPanel === btn.dataset.tab ? '' : 'none'
      })
    })
  })

  // ── LLM section ────────────────────────────────────────────────────────────
  const adapterSel = main.querySelector('#cb-adapter')
  const modelSel = main.querySelector('#cb-model')
  const saveBtn = main.querySelector('#cb-settings-save')
  const status = main.querySelector('#cb-settings-status')
  const currentLlm = main.querySelector('#cb-current-llm')

  adapterSel.addEventListener('change', () => populateModels(adapterSel, modelSel))
  await populateModels(adapterSel, modelSel)

  // ── SPL Limits section ─────────────────────────────────────────────────────
  const whileMaxIterInput = main.querySelector('#cb-while-max-iter')
  const maxLlmCallsInput = main.querySelector('#cb-max-llm-calls')
  const maxTokensInput = main.querySelector('#cb-max-tokens')
  const maxConcurrentInput = main.querySelector('#cb-max-concurrent')
  const splLimitsSaveBtn = main.querySelector('#cb-spl-limits-save')
  const splLimitsStatus = main.querySelector('#cb-spl-limits-status')

  // ── Graph Layout section ───────────────────────────────────────────────────
  const graphLayoutSel = main.querySelector('#cb-graph-layout')
  const graphLayoutSaveBtn = main.querySelector('#cb-graph-layout-save')
  const graphLayoutStatus = main.querySelector('#cb-graph-layout-status')
  graphLayoutSel.value = localStorage.getItem('cb_graph_layout') || 'compact'
  graphLayoutSaveBtn.addEventListener('click', () => {
    localStorage.setItem('cb_graph_layout', graphLayoutSel.value)
    graphLayoutStatus.textContent = 'Saved — reload the graph page to apply'
    graphLayoutStatus.style.color = '#16a34a'
    setTimeout(() => { graphLayoutStatus.textContent = '' }, 4000)
  })

  // ── Compare Cache section ──────────────────────────────────────────────────
  const ttlInput = main.querySelector('#cb-cache-ttl')
  const ttlHintEl = main.querySelector('#cb-cache-ttl-hint')
  const cacheSaveBtn = main.querySelector('#cb-cache-save')
  const cacheStatus = main.querySelector('#cb-cache-status')

  ttlInput.addEventListener('input', () => {
    const h = Number(ttlInput.value)
    ttlHintEl.textContent = isNaN(h) || h < 0 ? '' : ttlHint(h)
  })

  // ── Concept Cache section ──────────────────────────────────────────────────
  const conceptCacheToggle = main.querySelector('#cb-concept-cache-enabled')
  const conceptCacheLabel = main.querySelector('#cb-concept-cache-label')
  const conceptCacheSaveBtn = main.querySelector('#cb-concept-cache-save')
  const conceptCacheStatus = main.querySelector('#cb-concept-cache-status')

  function updateConceptCacheLabel() {
    const on = conceptCacheToggle.checked
    conceptCacheLabel.textContent = on ? 'Enabled' : 'Disabled'
    conceptCacheLabel.style.color = on ? '#16a34a' : 'var(--color-muted)'
  }
  conceptCacheToggle.addEventListener('change', updateConceptCacheLabel)

  // ── LLM API Keys section ───────────────────────────────────────────────────
  const apiKeysListEl = main.querySelector('#cb-api-keys-list')
  apiKeysListEl.innerHTML = API_KEY_PROVIDERS.map(p => `
    <div class="cb-settings__field" style="margin-bottom:10px">
      <label class="cb-settings__label">${p.label}</label>
      <div class="cb-settings__row">
        <input type="password" class="cb-settings__input" style="flex:1;min-width:200px"
          id="cb-apikey-${p.id}" autocomplete="off" placeholder="Not set">
        <button class="cb-btn" id="cb-apikey-save-${p.id}">Save</button>
        <button class="cb-btn-ghost" id="cb-apikey-clear-${p.id}">Clear</button>
        <span class="cb-settings__status" id="cb-apikey-status-${p.id}"></span>
      </div>
    </div>
  `).join('')

  try {
    const res = await fetch('/api/settings/api-keys')
    if (res.ok) {
      const data = await res.json()
      for (const p of API_KEY_PROVIDERS) {
        const st = data[p.id]
        if (st?.configured) {
          main.querySelector(`#cb-apikey-${p.id}`).placeholder = `Configured (${st.masked})`
        }
      }
    }
  } catch (_) { /* API not reachable — rows just show "Not set" */ }

  for (const p of API_KEY_PROVIDERS) {
    const input = main.querySelector(`#cb-apikey-${p.id}`)
    const statusEl = main.querySelector(`#cb-apikey-status-${p.id}`)

    main.querySelector(`#cb-apikey-save-${p.id}`).addEventListener('click', async () => {
      const value = input.value.trim()
      if (!value) {
        statusEl.textContent = 'Enter a key first'
        statusEl.style.color = '#dc2626'
        setTimeout(() => { statusEl.textContent = '' }, 3000)
        return
      }
      try {
        const res = await fetch('/api/settings/api-keys', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: p.id, api_key: value }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
        input.value = ''
        input.placeholder = `Configured (${data.masked})`
        statusEl.textContent = 'Saved'
        statusEl.style.color = '#16a34a'
      } catch (e) {
        statusEl.textContent = `Failed: ${e.message}`
        statusEl.style.color = '#dc2626'
      }
      setTimeout(() => { statusEl.textContent = '' }, 3000)
    })

    main.querySelector(`#cb-apikey-clear-${p.id}`).addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/settings/api-keys/${p.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        input.value = ''
        input.placeholder = 'Not set'
        statusEl.textContent = 'Cleared'
        statusEl.style.color = '#16a34a'
      } catch (e) {
        statusEl.textContent = `Failed: ${e.message}`
        statusEl.style.color = '#dc2626'
      }
      setTimeout(() => { statusEl.textContent = '' }, 3000)
    })
  }

  // ── Catalog Sync section ───────────────────────────────────────────────────
  const catalogSyncBtn = main.querySelector('#cb-catalog-sync')
  const catalogSyncStatus = main.querySelector('#cb-catalog-sync-status')

  catalogSyncBtn.addEventListener('click', async () => {
    catalogSyncBtn.disabled = true
    catalogSyncStatus.style.color = 'var(--color-muted)'
    catalogSyncStatus.textContent = 'Syncing…'
    try {
      const res = await fetch('/api/catalog/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.detail || `HTTP ${res.status}`)
      const parts = [
        `${data.scanned} domains scanned`,
        data.added ? `${data.added} added` : null,
        `${data.refreshed} refreshed`,
        `${data.books} books`,
        `${data.concepts} concepts`,
        data.concepts_without_pinyin ? `${data.concepts_without_pinyin} without pinyin` : null,
      ].filter(Boolean)
      catalogSyncStatus.style.color = '#16a34a'
      catalogSyncStatus.textContent = `Synced — ${parts.join(', ')}`
    } catch (e) {
      catalogSyncStatus.style.color = '#dc2626'
      catalogSyncStatus.textContent = `Sync failed: ${e.message}`
    } finally {
      catalogSyncBtn.disabled = false
    }
  })

  // ── Load current settings ──────────────────────────────────────────────────
  try {
    const res = await fetch('/api/settings')
    if (res.ok) {
      const data = await res.json()

      // LLM
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

      // SPL limits
      if (data.spl_while_max_iter) whileMaxIterInput.value = data.spl_while_max_iter
      if (data.spl_max_llm_calls) maxLlmCallsInput.value = data.spl_max_llm_calls
      if (data.spl_max_tokens) maxTokensInput.value = data.spl_max_tokens
      if (data.task_max_concurrent) maxConcurrentInput.value = data.task_max_concurrent

      // Compare Cache TTL — server stores seconds, UI shows hours
      const hours = Math.round(data.compare_cache_ttl / 3600)
      ttlInput.value = hours
      ttlHintEl.textContent = ttlHint(hours)

      // Concept Cache toggle
      if (data.use_concept_cache !== undefined) {
        conceptCacheToggle.checked = !!data.use_concept_cache
        updateConceptCacheLabel()
      }
    }
  } catch (_) {
    status.textContent = 'API not reachable — run the backend to change settings'
    status.style.color = '#dc2626'
  }

  // ── Save LLM ───────────────────────────────────────────────────────────────
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

  // ── Save SPL Limits ────────────────────────────────────────────────────────
  splLimitsSaveBtn.addEventListener('click', async () => {
    const whileMaxIter = Number(whileMaxIterInput.value)
    const maxLlmCalls = Number(maxLlmCallsInput.value)
    const maxTokens = Number(maxTokensInput.value)
    const maxConcurrent = Number(maxConcurrentInput.value)
    if (!Number.isInteger(whileMaxIter) || whileMaxIter < 1 || !Number.isInteger(maxLlmCalls) || maxLlmCalls < 1 || !Number.isInteger(maxTokens) || maxTokens < 100 || !Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
      splLimitsStatus.textContent = 'Enter valid integers (iterations/calls ≥ 1, tokens ≥ 100, parallel ≥ 1)'
      splLimitsStatus.style.color = '#dc2626'
      setTimeout(() => { splLimitsStatus.textContent = '' }, 3000)
      return
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spl_while_max_iter: whileMaxIter, spl_max_llm_calls: maxLlmCalls, spl_max_tokens: maxTokens, task_max_concurrent: maxConcurrent }),
      })
      if (res.ok) {
        splLimitsStatus.textContent = 'Saved'
        splLimitsStatus.style.color = '#16a34a'
      } else {
        splLimitsStatus.textContent = 'Save failed'
        splLimitsStatus.style.color = '#dc2626'
      }
    } catch (_) {
      splLimitsStatus.textContent = 'API not reachable'
      splLimitsStatus.style.color = '#dc2626'
    }
    setTimeout(() => { splLimitsStatus.textContent = '' }, 3000)
  })

  // ── Save Compare Cache TTL ─────────────────────────────────────────────────
  cacheSaveBtn.addEventListener('click', async () => {
    const hours = Number(ttlInput.value)
    if (isNaN(hours) || hours < 0) {
      cacheStatus.textContent = 'Enter a valid number ≥ 0'
      cacheStatus.style.color = '#dc2626'
      setTimeout(() => { cacheStatus.textContent = '' }, 3000)
      return
    }
    const seconds = Math.round(hours * 3600)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compare_cache_ttl: seconds }),
      })
      if (res.ok) {
        ttlHintEl.textContent = ttlHint(hours)
        cacheStatus.textContent = 'Saved'
        cacheStatus.style.color = '#16a34a'
      } else {
        cacheStatus.textContent = 'Save failed'
        cacheStatus.style.color = '#dc2626'
      }
    } catch (_) {
      cacheStatus.textContent = 'API not reachable'
      cacheStatus.style.color = '#dc2626'
    }
    setTimeout(() => { cacheStatus.textContent = '' }, 3000)
  })

  // ── Save Concept Cache ─────────────────────────────────────────────────────
  conceptCacheSaveBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_concept_cache: conceptCacheToggle.checked }),
      })
      if (res.ok) {
        conceptCacheStatus.textContent = 'Saved'
        conceptCacheStatus.style.color = '#16a34a'
      } else {
        conceptCacheStatus.textContent = 'Save failed'
        conceptCacheStatus.style.color = '#dc2626'
      }
    } catch (_) {
      conceptCacheStatus.textContent = 'API not reachable'
      conceptCacheStatus.style.color = '#dc2626'
    }
    setTimeout(() => { conceptCacheStatus.textContent = '' }, 3000)
  })
}
