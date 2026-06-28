import { Header } from '../components/Header.js'
import { t } from '../i18n.js'
import { navigate } from '../router.js'

export async function PhraseExplorer(container) {
  container.innerHTML = ''
  container.appendChild(Header())

  const main = document.createElement('main')
  main.className = 'cb-phrase-explorer'
  container.appendChild(main)

  const inputSection = document.createElement('section')
  inputSection.className = 'cb-phrase-input-section'
  inputSection.innerHTML = `
    <div class="cb-phrase-input-container">
      <h2>从短语开始学习中文</h2>
      <p class="cb-phrase-subtitle">输入一个短语、成语或句子，我们将把它分解为组成部分</p>
      <div class="cb-phrase-input-group">
        <input
          type="text"
          id="phrase-input"
          class="cb-phrase-input"
          placeholder="例如：画蛇添足，守株待兔，卧虎藏龙"
          value=""
        />
        <button id="phrase-decompose-btn" class="cb-btn-primary">分解</button>
      </div>
      <div class="cb-phrase-examples">
        <strong>例子：</strong>
        <span class="cb-phrase-example-tag" data-phrase="画蛇添足">画蛇添足</span>
        <span class="cb-phrase-example-tag" data-phrase="守株待兔">守株待兔</span>
        <span class="cb-phrase-example-tag" data-phrase="卧虎藏龙">卧虎藏龙</span>
        <span class="cb-phrase-example-tag" data-phrase="掩耳盗铃">掩耳盗铃</span>
      </div>
    </div>
  `
  main.appendChild(inputSection)

  const graphSection = document.createElement('section')
  graphSection.className = 'cb-phrase-graph-section'
  graphSection.style.display = 'none'
  graphSection.innerHTML = `
    <div class="cb-phrase-graph-header">
      <h2 id="phrase-title"></h2>
      <button id="phrase-reset-btn" class="cb-btn-secondary">重新开始</button>
    </div>
    <div class="cb-graph-container">
      <div id="graph-canvas" class="cb-graph-canvas"></div>
      <div id="graph-sidebar" class="cb-graph-sidebar">
        <div id="node-details" class="cb-node-details">
          <p>点击图中的节点查看详情</p>
        </div>
      </div>
    </div>
  `
  main.appendChild(graphSection)

  const input = inputSection.querySelector('#phrase-input')
  const decomposeBtn = inputSection.querySelector('#phrase-decompose-btn')
  const resetBtn = graphSection.querySelector('#phrase-reset-btn')

  // Example phrase tags
  inputSection.querySelectorAll('.cb-phrase-example-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      input.value = tag.dataset.phrase
      decomposeBtn.click()
    })
  })

  // Decompose button
  decomposeBtn.addEventListener('click', async () => {
    const phrase = input.value.trim()
    if (!phrase) {
      alert('请输入短语或成语')
      return
    }
    await decomposePhrase(phrase)
  })

  // Reset button
  resetBtn.addEventListener('click', () => {
    graphSection.style.display = 'none'
    inputSection.style.display = 'block'
    input.focus()
  })

  // Enter key to decompose
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') decomposeBtn.click()
  })

  async function decomposePhrase(phrase) {
    inputSection.style.display = 'none'
    graphSection.style.display = 'block'

    const titleEl = graphSection.querySelector('#phrase-title')
    const canvasEl = graphSection.querySelector('#graph-canvas')
    titleEl.textContent = phrase
    canvasEl.innerHTML = '<p class="cb-loading">正在分解...</p>'

    try {
      const response = await fetch('/api/phrase/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase, max_depth: 10 })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const graph = await response.json()
      renderGraph(graph)
    } catch (err) {
      canvasEl.innerHTML = `<p class="cb-error">分解失败: ${err.message}</p>`
    }
  }

  function renderGraph(graph) {
    const canvasEl = graphSection.querySelector('#graph-canvas')
    const detailsEl = graphSection.querySelector('#node-details')

    // Build tier structure
    const tiers = {
      2: [],  // applications
      1: [],  // concepts
      0: []   // primitives
    }

    // Tier 2: Application (the phrase)
    for (const [id, node] of Object.entries(graph.applications)) {
      tiers[2].push({
        id,
        text: node.text,
        tier: 2,
        node
      })
    }

    // Tier 1: Concepts (phrase characters)
    for (const [char, node] of Object.entries(graph.concepts)) {
      tiers[1].push({
        id: char,
        text: char,
        tier: 1,
        symbol: node.symbol,
        defines: node.defines,
        node
      })
    }

    // Tier 0: Primitives
    for (const [char, node] of Object.entries(graph.primitives)) {
      tiers[0].push({
        id: char,
        text: char,
        tier: 0,
        symbol: node.symbol,
        defines: node.defines,
        node
      })
    }

    // Render HTML
    canvasEl.innerHTML = ''

    // Render tiers vertically
    const tiersHTML = `
      <div class="cb-graph-tiers">
        <div class="cb-graph-tier" data-tier="2">
          <h3>应用层 (Tier 2)</h3>
          <div class="cb-tier-nodes">
            ${tiers[2].map(n => `
              <div class="cb-node cb-node--tier2" data-id="${n.id}" data-tier="2">
                <div class="cb-node-text">${n.text}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cb-graph-tier" data-tier="1">
          <h3>概念层 (Tier 1) - ${tiers[1].length} 个字</h3>
          <div class="cb-tier-nodes">
            ${tiers[1].map(n => `
              <div class="cb-node cb-node--tier1" data-id="${n.id}" data-tier="1">
                <div class="cb-node-text">${n.text}</div>
                <div class="cb-node-symbol">${n.symbol}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="cb-graph-tier" data-tier="0">
          <h3>基础层 (Tier 0) - ${tiers[0].length} 个字</h3>
          <div class="cb-tier-nodes">
            ${tiers[0].map(n => `
              <div class="cb-node cb-node--tier0" data-id="${n.id}" data-tier="0">
                <div class="cb-node-text">${n.text}</div>
                <div class="cb-node-symbol">${n.symbol}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `

    canvasEl.innerHTML = tiersHTML

    // Attach click handlers
    canvasEl.querySelectorAll('.cb-node').forEach(nodeEl => {
      nodeEl.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = nodeEl.dataset.id
        const tier = parseInt(nodeEl.dataset.tier)

        // Highlight selected node
        canvasEl.querySelectorAll('.cb-node').forEach(n => n.classList.remove('selected'))
        nodeEl.classList.add('selected')

        // Show details
        if (tier === 2) {
          const appNode = graph.applications[id]
          detailsEl.innerHTML = `
            <div class="cb-node-detail">
              <h3>${appNode.text}</h3>
              <p><strong>类型：</strong> 成语/短语</p>
              <p><strong>组成字：</strong> ${appNode.characters.join('、')}</p>
            </div>
          `
        } else {
          // Load character details
          try {
            const response = await fetch(`/api/phrase/${graph.phrase_id}/${id}/content`)
            if (response.ok) {
              const content = await response.json()
              renderNodeDetails(content, detailsEl, id, graph)
            }
          } catch (err) {
            detailsEl.innerHTML = `<p class="cb-error">加载详情失败</p>`
          }
        }
      })
    })
  }

  function renderNodeDetails(content, detailsEl, nodeId, graph) {
    detailsEl.innerHTML = `
      <div class="cb-node-detail">
        <h3>${content.character}</h3>
        <div class="cb-node-meta">
          <p><strong>拼音：</strong> ${content.pinyin}</p>
          ${content.label ? `<p><strong>标签：</strong> ${content.label}</p>` : ''}
        </div>

        <div class="cb-node-definitions">
          ${content.definition_en ? `
            <div class="cb-definition">
              <strong>英文：</strong> ${content.definition_en}
            </div>
          ` : ''}
          ${content.definition_cn ? `
            <div class="cb-definition">
              <strong>中文：</strong> ${content.definition_cn}
            </div>
          ` : ''}
          ${content.cached_meaning ? `
            <div class="cb-definition">
              <strong>含义：</strong> ${content.cached_meaning}
            </div>
          ` : ''}
        </div>

        ${content.components.length > 0 ? `
          <div class="cb-node-components">
            <h4>组成部分：</h4>
            <div class="cb-components-list">
              ${content.components.map(comp => `
                <span class="cb-component-tag">${comp}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <button class="cb-btn-secondary cb-btn-book" data-node="${nodeId}">
          📖 在概念书中查看
        </button>
      </div>
    `

    // Book button handler
    detailsEl.querySelector('.cb-btn-book')?.addEventListener('click', () => {
      navigate(`/book?domain=chinese_characters&focus=${nodeId}`)
    })
  }
}
