(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={};function t(t,n){e[t]=n}function n(e){window.location.hash=e}function r(){let t=window.location.hash.slice(1)||`/`,n=t.match(/^\/domain\/([^?]+)/);if(n){e[`/domain/:id`]?.({id:decodeURIComponent(n[1])});return}let[r,i]=t.split(`?`);e[r]?.(Object.fromEntries(new URLSearchParams(i||``)))}function i(){window.addEventListener(`hashchange`,r),r()}var a={en:{"app.title":`字 ConceptBook`,"app.tagline":`Learn Chinese characters the LEGO way`,"nav.about":`About`,"nav.settings":`Settings`,"home.subtitle":`Explore the Chinese character graph`,"home.filter.all":`All`,"home.filter.level":`Level`,"card.nodes":`nodes`,"card.edges":`edges`,"card.explore":`Explore Concept-Graph`,"card.read":`Read book`,"domain.back":`← Back`,"domain.openFullscreen":`Open fullscreen`,"about.title":`About 字 ConceptBook`,loading:`Loading…`}},o=localStorage.getItem(`cb-lang`)||`en`;function s(e){return(a[o]||a.en)[e]??e}function c(e){o=e,localStorage.setItem(`cb-lang`,e)}function l(){return o}var u=[{code:`en`,label:`English *`},{code:`zh`,label:`中文 (Chinese)`},{code:`es`,label:`Español (Spanish)`},{code:`fr`,label:`Français (French)`},{code:`de`,label:`Deutsch (German)`},{code:`pt`,label:`Português (Portuguese)`},{code:`ar`,label:`العربية (Arabic)`},{code:`hi`,label:`हिन्दी (Hindi)`},{code:`ja`,label:`日本語 (Japanese)`},{code:`ko`,label:`한국어 (Korean)`}];function d(){let e=document.createElement(`select`);e.className=`cb-lang-picker`,e.title=`Content language`;let t=l();return u.forEach(({code:n,label:r})=>{let i=document.createElement(`option`);i.value=n,i.textContent=r,n===t&&(i.selected=!0),e.appendChild(i)}),e.addEventListener(`change`,()=>c(e.value)),e}var f=`cb_token`,p=`cb_user`;function m(){return localStorage.getItem(f)}function h(e){localStorage.setItem(f,e)}function g(){localStorage.removeItem(f)}function _(){try{return JSON.parse(localStorage.getItem(p)||`null`)}catch{return null}}function v(e){localStorage.setItem(p,JSON.stringify(e))}function y(){localStorage.removeItem(p)}function b(){let e=m();return e?{"X-CB-Token":e}:{}}async function x(){let e=m();if(!e)return null;try{let t=await fetch(`/api/auth/me`,{headers:{"X-CB-Token":e}});if(t.ok){let e=await t.json();return v(e),e}return g(),y(),null}catch{return null}}function S({domainName:e=``}={}){let t=document.createElement(`header`);t.className=`cb-header`;let n=document.createElement(`div`);n.className=`cb-header__top`;let r=document.createElement(`a`);r.className=`cb-header__logo`,r.href=`#/`;let i=document.createElement(`img`);if(i.className=`cb-header__logo-mark`,i.src=`/cb-zinets/brand/seal-zi-logo.png`,i.alt=``,r.appendChild(i),r.appendChild(document.createTextNode(s(`app.title`).replace(/^字\s*/,``))),n.appendChild(r),e){let t=document.createElement(`span`);t.className=`cb-header__sep`,t.textContent=`›`,n.appendChild(t);let r=document.createElement(`span`);r.className=`cb-header__domain`,r.textContent=e,n.appendChild(r)}let a=document.createElement(`span`);a.className=`cb-header__spacer`,n.appendChild(a);let o=document.createElement(`nav`);o.className=`cb-header__nav`,o.innerHTML=`<a href="#/graph">Graph</a> <a href="#/book">Content</a> <a href="#/resources">Resources</a> <a href="#/settings">${s(`nav.settings`)}</a> <a href="#/about">About</a>`,n.appendChild(o),n.appendChild(d());let c=_();if(c){let e=document.createElement(`span`);e.className=`cb-header__user`,e.textContent=`${c.username} (${c.role})`,n.appendChild(e);let t=document.createElement(`button`);t.className=`cb-btn`,t.style.cssText=`padding:4px 10px;font-size:.8rem;margin-left:8px`,t.textContent=`Logout`,t.addEventListener(`click`,async()=>{let e=m();if(e)try{await fetch(`/api/auth/logout`,{method:`POST`,headers:{"X-CB-Token":e}})}catch{}g(),y(),window.location.hash=`/login`}),n.appendChild(t)}return t.appendChild(n),t}var C=null,w=new Map;function T(e,t,n,r){if(e.includes(r))return!0;let i=r.toLowerCase();return!!(t&&t.includes(i)||n&&n.includes(i))}async function E(){try{let e=await fetch(`/cb-zinets/domains/catalog.json`,{cache:`no-cache`});if(!e.ok)throw Error(`Failed to load catalog: ${e.status}`);return C=await e.json(),C}catch(e){if(C)return C;throw e}}async function D(e){try{let t=await fetch(`/cb-zinets/domains/catalog/${encodeURIComponent(e)}.json`,{cache:`no-cache`});if(!t.ok)throw Error();let n=await t.json();return w.set(e,n),n}catch{return w.get(e)??null}}function O(e){return e.name.startsWith(`phrase_`)}function k(e){return[...e].length===1}function A(e){let t=new Map;for(let n of e){let e=new Set;for(let r of n.generated_concepts||[]){if(O(r)||!k(r.name)||e.has(r.name))continue;e.add(r.name);let i=t.get(r.name);i||(i={char:r.name,count:0,domain:n.id,file:r.file,pinyin:r.pinyin},t.set(r.name,i)),i.count+=1}}return[...t.values()].sort((e,t)=>t.count-e.count||e.char.localeCompare(t.char,`zh`))}async function j(e){try{let t=await fetch(`/api/browse/concepts`);if(!t.ok)throw Error();let{concepts:n}=await t.json();return n.filter(t=>!e.has(t.char)).map(e=>({char:e.char,count:0,domain:``,file:e.file,pinyin:null}))}catch{return[]}}function M(e){return e>=5?`cb-concept-tile--hot`:e>=2?`cb-concept-tile--warm`:``}function N(e,t,r){let i=r.trim(),a=i?t.filter(e=>T(e.name,e.pinyin,e.pinyin_initials,i)):t;e.innerHTML=a.length?``:`<div class="cb-home-empty">No phrases match.</div>`,a.forEach(t=>{let r=document.createElement(`a`);r.className=`cb-home-link`,r.href=`#`,r.textContent=t.name,r.addEventListener(`click`,e=>{e.preventDefault(),n(`/domain/${encodeURIComponent(t.id)}`)}),e.appendChild(r)})}function P(e,t,r){let i=r.trim(),a=i?t.filter(e=>T(e.char,e.pinyin,null,i)):t;e.innerHTML=a.length?``:`<div class="cb-home-empty">No concepts match.</div>`,a.forEach(t=>{let r=document.createElement(`button`);r.className=`cb-concept-tile ${M(t.count)}`.trim(),r.title=t.count===0?`${t.char} — standalone concept (no phrase yet)`:`${t.char} — appears in ${t.count} phrase${t.count===1?``:`s`}`;let i=t.count===0?``:`<span class="cb-concept-tile__badge">${t.count}</span>`;r.innerHTML=`<span class="cb-concept-tile__char">${t.char}</span>${i}`,r.addEventListener(`click`,()=>n(`/book?domain=${encodeURIComponent(t.domain)}&file=${encodeURIComponent(t.file)}`)),e.appendChild(r)})}function F(e){e.innerHTML=``,e._renderKey=Symbol();let t=e._renderKey;e.appendChild(S());let r=document.createElement(`main`);r.className=`cb-home cb-phrase-home`,r.innerHTML=`
    <div class="cb-welcome" style="margin:0 auto 20px">
      <p style="text-align:center;color:#1e40af;font-weight:500">Explore Chinese characters and phrases through concept graphs<br>Understand structure and semantics with AI-generated explanations in multiple languages</p>
    </div>
    <div class="cb-phrase-input-wrap">
      <div class="cb-phrase-input-row">
        <input
          id="cb-phrase-input"
          class="cb-phrase-input"
          type="text"
          placeholder="例如：不见不散"
          value=""
          autocomplete="off"
          autofocus
        />
        <button id="cb-phrase-btn" class="cb-phrase-btn">Build Concept Graph</button>
        <input id="cb-home-search" class="cb-home-search cb-home-search--inline" type="text" placeholder="Search phrases or pinyin…" autocomplete="off" />
      </div>
      <div id="cb-phrase-error" class="cb-phrase-error" style="display:none"></div>
    </div>
    <div class="cb-home-sections">
      <section class="cb-home-section">
        <div class="cb-home-section__header">
          <h2 class="cb-home-section__title">Phrases <span id="cb-phrase-count" class="cb-home-section__count"></span></h2>
        </div>
        <div id="cb-phrase-list" class="cb-phrase-list"><div class="cb-home-empty">Loading…</div></div>
      </section>
      <section class="cb-home-section">
        <div class="cb-home-section__header">
          <h2 class="cb-home-section__title">Concepts <span id="cb-concept-count" class="cb-home-section__count"></span></h2>
        </div>
        <p class="cb-home-section__hint">Sorted by how many phrases each character unlocks — learn the high-count ones first.</p>
        <div id="cb-concept-grid" class="cb-concept-grid"><div class="cb-home-empty">Loading…</div></div>
      </section>
    </div>
  `,e.appendChild(r);let i=document.createElement(`footer`);i.className=`cb-home-footer`,i.innerHTML=`<p class="cb-welcome__license">Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a> · Open source · <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache 2.0</a></p>`,e.appendChild(i);let a=r.querySelector(`#cb-phrase-input`),o=r.querySelector(`#cb-phrase-btn`),s=r.querySelector(`#cb-phrase-error`),c=r.querySelector(`#cb-phrase-list`),l=r.querySelector(`#cb-concept-grid`),u=r.querySelector(`#cb-home-search`),d=r.querySelector(`#cb-phrase-count`),f=r.querySelector(`#cb-concept-count`);E().then(async n=>{if(e._renderKey!==t)return;let r=n.filter(e=>!k(e.name||e.id)).map(e=>({id:e.id,name:e.name||e.id,pinyin:e.pinyin,pinyin_initials:e.pinyin_initials})).sort((e,t)=>e.name.localeCompare(t.name,`zh`)),i=A(n),a=await j(new Set(i.map(e=>e.char)));e._renderKey===t&&(i.push(...a.sort((e,t)=>e.char.localeCompare(t.char,`zh`))),d.textContent=`(${r.length})`,f.textContent=`(${i.length})`,N(c,r,``),P(l,i,``),u.addEventListener(`input`,()=>{N(c,r,u.value),P(l,i,u.value)}))}).catch(()=>{e._renderKey===t&&(c.innerHTML=`<div class="cb-home-empty">Failed to load phrases.</div>`,l.innerHTML=`<div class="cb-home-empty">Failed to load concepts.</div>`)});async function p(){let e=a.value.trim()||u.value.trim();if(e){o.disabled=!0,o.textContent=`生成中…`,s.style.display=`none`;try{let t=await fetch(`/api/phrase/graph`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({phrase:e})});if(!t.ok){let e=await t.text();throw Error(e)}let{domain_id:r}=await t.json();n(`/domain/${encodeURIComponent(r)}`)}catch(e){s.textContent=`错误：${e.message}`,s.style.display=`block`,o.disabled=!1,o.textContent=`构建图`}}}o.addEventListener(`click`,p),a.addEventListener(`keydown`,e=>{e.key===`Enter`&&p()})}function I(e,t,n){return`output/${e}.${t}/${n}/html`}function ee(e){let t=e.split(`/`);if(t.length<4)return null;let n=t[1]?.match(/^([^.]+)\.(.+)$/);return n?{level:n[1],language:n[2],model:t[2]}:null}function te(e,t,n,r){return`concepts/${e}.${t}/${n}/concept_${r}.html`}function ne(e,t,n,r){return`output/${e}.${t}/${n}/html/book_${r}.html`}function re(e,t,n,r){let i=e.split(`/`);return i.length<5?e:(i[1]=`${t}.${n}`,r&&(i[2]=r),i.join(`/`))}var L=new Map;function R(){L.clear()}function ie(e){for(let t of e)L.set(t,!0)}async function z(e){if(L.has(e))return L.get(e);try{let t=await fetch(e,{headers:{Range:`bytes=0-511`}});if(!t.ok&&t.status!==206)return L.set(e,!1),!1;let n=!(await t.text()).includes(`id="app"`);return L.set(e,n),n}catch{return L.set(e,!1),!1}}var ae=[{code:`en`,label:`English`},{code:`zh`,label:`中文`},{code:`es`,label:`Español`},{code:`fr`,label:`Français`},{code:`de`,label:`Deutsch`},{code:`ja`,label:`日本語`},{code:`ko`,label:`한국어`},{code:`pt`,label:`Português`},{code:`ar`,label:`العربية`},{code:`hi`,label:`हिन्दी`}],oe=[`intro`,`core`,`college`,`research`];function se(e,{level:t=`intro`,lang:n=`en`}={}){let{id:r,books:i=[],generated_concepts:a=[],capstone:o}=e;ie(i.filter(e=>e.file).map(e=>`/cb-zinets/domains/${r}/${e.file}`));let s=document.createElement(`div`);s.className=`cb-graph-viewer`;let c=document.createElement(`iframe`);c.className=`cb-graph-viewer__frame`;let l=localStorage.getItem(`cb_graph_layout`)||`compact`;return c.src=`/cb-zinets/domains/${r}/output/graph.html?layout=${l}`,c.title=`${r} concept graph`,c.setAttribute(`allowfullscreen`,``),c.addEventListener(`load`,()=>{try{let e=c.contentWindow;if(!e)return;e.eval(`window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex`);let s=(e,t,n)=>`/cb-zinets/domains/${r}/${I(e,t,n||`gemma4`)}/`;e.__cb_CONCEPTS_BASE=s(t,n,`gemma4`);let u=(e.__cb_RAW?.nodes||[]).map(e=>({id:e.id,label:e.label,kind:e.kind,tier:e.tier??0}));window.dispatchEvent(new CustomEvent(`cb:graphLoaded`,{detail:{concepts:u}}));let d=e.handleSelect;e.handleSelect=function(t){d.call(e,t);let n=e.__cb_nodeIndex?.[t];n&&window.dispatchEvent(new CustomEvent(`cb:nodeSelected`,{detail:{nodeId:t,node:n}}))},ce(e,c.contentDocument),he(e,c.contentDocument,r,i,a,t,n),ge(e,c.contentDocument,r,o,t,n,i);let f=c.contentDocument,p=[`#cb-model-sel`,`#cb-level-sel`,`#cb-lang-sel`].map(e=>f.querySelector(e)),m=()=>{let[r,i,a]=p.map(e=>e&&e.value);e.__cb_CONCEPTS_BASE=s(i||t,a||n,r)};p.forEach(e=>e&&e.addEventListener(`change`,m)),m();let h=e=>{try{let t=e.contentDocument;if(!t||!t.head||t.getElementById(`cb-detail-clean`))return;let n=t.createElement(`style`);n.id=`cb-detail-clean`,n.textContent=`nav.toc{display:none!important}.page{grid-template-columns:1fr!important}main{padding:20px 24px!important;max-width:none!important}`,t.head.appendChild(n)}catch{}};new e.MutationObserver(()=>{let e=f.getElementById(`concept-iframe`);e&&!e._cbCleaned&&(e._cbCleaned=!0,e.addEventListener(`load`,()=>h(e)),h(e))}).observe(f.body,{childList:!0,subtree:!0}),l===`hierarchical`&&e.network&&e.eval(`
          network.setOptions({ layout: { hierarchical: {
            enabled: true, direction: 'UD', sortMethod: 'directed',
            levelSeparation: 120, nodeSpacing: 180
          }}});
          network.fit({ animation: false });
        `)}catch{}}),s.appendChild(c),s.selectNode=e=>{try{c.contentWindow?.selectNode?.(e)}catch{}},s}function ce(e,t){if(t.querySelector(`#cb-sidebar-theme`))return;let n=t.createElement(`style`);n.id=`cb-sidebar-theme`,n.textContent=`
    .app { grid-template-columns: 260px 1fr 220px !important; }
    #path-sidebar {
      background: #1e3a5f !important;
      color: #e8f0fe !important;
      border-right-color: rgba(255,255,255,0.12) !important;
    }
    #path-header { border-bottom-color: rgba(255,255,255,0.12) !important; }
    #path-header h1 { color: #90b4e8 !important; }
    #path-header .domain-name { color: #a8c8f0 !important; }
    #path-count { color: #90b4e8 !important; }
    #path-steps .hint { color: #90b4e8 !important; }
    .step-item:hover { background: rgba(255,255,255,0.07) !important; }
    .step-item.active { background: rgba(74,144,217,0.25) !important; border-left-color: #60a5fa !important; }
    .step-item.target { background: rgba(76,175,80,0.18) !important; border-left-color: #4caf50 !important; }
    .step-label { color: #e8f0fe !important; }
    .step-def { color: #90b4e8 !important; }
    .step-num { color: #90b4e8 !important; }
    .step-item.target .step-num { color: #6fcf73 !important; }
    /* Fix node-type badge colors to match the graph */
    .primitive-k { background: #fffde7 !important; color: #795548 !important; }
    .concept-k   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .application-k { background: #fce4ec !important; color: #c62828 !important; }
  `,t.head.appendChild(n);let r=t.querySelector(`#path-steps`);if(r&&!t.querySelector(`#cb-node-legend`)){let e=t.createElement(`div`);e.id=`cb-node-legend`,e.style.cssText=`padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0`,e.innerHTML=`
      <div style="font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:6px">Node Types</div>
      <div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:8px">
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fffde7;border:1px solid #795548;border-radius:2px;flex-shrink:0"></span>Primitive
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#e8f5e9;border:1px solid #2e7d32;border-radius:50%;flex-shrink:0"></span>Concept
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fce4ec;border:1px solid #c62828;border-radius:2px;flex-shrink:0"></span>Application
        </span>
      </div>
    `,r.insertAdjacentElement(`beforebegin`,e)}let i=t.querySelector(`#path-sidebar`);if(i&&!t.querySelector(`#cb-spl-credit`)){let e=t.createElement(`div`);e.id=`cb-spl-credit`,e.style.cssText=`padding:10px 12px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif;flex-shrink:0`,e.innerHTML=`Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>`,i.appendChild(e)}}var le=[`flex:1`,`min-width:0`,`padding:5px 6px`,`border:1px solid rgba(255,255,255,0.3)`,`border-radius:5px`,`background:#fff`,`color:#2a2a2a`,`font-size:12px`,`font-family:system-ui,sans-serif`,`box-sizing:border-box`].join(`;`),B=[`flex-shrink:0`,`padding:5px 10px`,`background:#2563eb`,`color:#fff`,`border:none`,`border-radius:5px`,`font-size:12px`,`cursor:pointer`,`font-family:system-ui,sans-serif`].join(`;`),V=B+`;opacity:.4;cursor:default`,ue=`display:flex;gap:6px;align-items:center;margin-bottom:10px`,de=[`font-size:10px`,`letter-spacing:.06em`,`text-transform:uppercase`,`color:#90b4e8`,`font-weight:700`,`margin-bottom:4px`].join(`;`),fe=`padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f`,pe=`font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px`,H=re;function me(e,t,n){let r=new Map;for(let i of e){let e=t(i),a=r.get(e);(!a||i.model===n&&a.model!==n)&&r.set(e,i)}return[...r.values()]}function he(e,t,n,r,i,a,o){let s=t.querySelector(`#path-header`);if(!s||t.querySelector(`#cb-read`))return;let c=me(r,e=>e.target,`gemma4`).sort((e,t)=>e.target.localeCompare(t.target)),l=me(i,e=>e.name,`gemma4`).sort((e,t)=>e.label.localeCompare(t.label)),u=`margin-top:4px;font-size:11px;color:#fca5a5;display:none`,d=c.length>0?`
    <div style="${de}">TOC Index</div>
    <div style="${ue}">
      <select id="cb-book-sel" style="${le}">
        <option value="">Select book…</option>
        ${c.map(e=>{let t=e.target.replace(/_/g,` `);return`<option value="${H(e.file,a,o,e.model||``)}" data-orig="${e.file}" data-model="${e.model||``}">${t}</option>`}).join(``)}
      </select>
      <button id="cb-book-btn" disabled style="${V}">Open</button>
    </div>
    <div id="cb-book-warn" style="${u}"></div>
  `:``,f=l.length>0?`
    <div style="${de}">Concept</div>
    <div style="${ue}">
      <select id="cb-cpt-sel" style="${le}">
        <option value="">Select concept…</option>
        ${l.map(e=>`<option value="${H(e.file,a,o,e.model||``)}" data-orig="${e.file}" data-model="${e.model||``}">${e.label}</option>`).join(``)}
      </select>
      <button id="cb-cpt-btn" disabled style="${V}">Open</button>
    </div>
    <div id="cb-cpt-warn" style="${u}"></div>
  `:``,p=t.createElement(`div`);p.id=`cb-read`,p.style.cssText=fe,p.innerHTML=`
    <div style="${pe}">Concept Books</div>
    ${d}
    ${f}
  `,s.insertAdjacentElement(`afterend`,p);function m(e,t){e.textContent=t,e.style.display=`block`}function h(e,t){z(`/cb-zinets/domains/${n}/${e}`).then(r=>{r?window.location.hash=`/book?domain=${n}&file=${encodeURIComponent(e)}`:m(t,`No content available for this level/language combination.`)})}if(t.addEventListener(`cb:settings-change`,({detail:{level:e,lang:n}})=>{p.querySelectorAll(`#cb-book-sel option[data-orig]`).forEach(t=>{t.value=H(t.dataset.orig,e,n,t.dataset.model)}),p.querySelectorAll(`#cb-cpt-sel option[data-orig]`).forEach(t=>{t.value=H(t.dataset.orig,e,n,t.dataset.model)}),t.querySelector(`#cb-book-warn`)&&(t.querySelector(`#cb-book-warn`).style.display=`none`),t.querySelector(`#cb-cpt-warn`)&&(t.querySelector(`#cb-cpt-warn`).style.display=`none`)}),c.length>0){let e=p.querySelector(`#cb-book-sel`),t=p.querySelector(`#cb-book-btn`),n=p.querySelector(`#cb-book-warn`);e.addEventListener(`change`,()=>{t.disabled=!e.value,t.style.cssText=e.value?B:V,n.style.display=`none`}),t.addEventListener(`click`,()=>{e.value&&h(e.value,n)})}if(l.length>0){let e=p.querySelector(`#cb-cpt-sel`),t=p.querySelector(`#cb-cpt-btn`),n=p.querySelector(`#cb-cpt-warn`);e.addEventListener(`change`,()=>{t.disabled=!e.value,t.style.cssText=e.value?B:V,n.style.display=`none`}),t.addEventListener(`click`,()=>{e.value&&h(e.value,n)})}}function ge(e,t,n,r,i,a,o=[]){let s=t.querySelector(`#path-header`);if(!s||t.querySelector(`#cb-gen`))return;let c=[`width:100%`,`padding:5px 8px`,`border:1px solid rgba(255,255,255,0.3)`,`border-radius:5px`,`background:#fff`,`color:#2a2a2a`,`font-size:12px`,`margin-bottom:6px`,`font-family:system-ui,sans-serif`].join(`;`),l=t.createElement(`div`);l.id=`cb-gen`,l.style.cssText=fe,l.innerHTML=`
    <div style="${pe}">Generate Book</div>
    <select id="cb-target-sel" style="${c}">
      <option value="">Select target concept…</option>
    </select>
    <select id="cb-model-sel" style="${c}">
      <option value="gemma3">gemma3 — local (Ollama)</option>
      <option value="gemma4" selected>gemma4 — local, default (Ollama)</option>
      <option value="sonnet">sonnet — premium (Claude API)</option>
    </select>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <select id="cb-level-sel" style="display:none">
        ${oe.map(e=>`<option value="${e}" ${e===i?`selected`:``}>${e.charAt(0).toUpperCase()+e.slice(1)}</option>`).join(``)}
      </select>
      <select id="cb-lang-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${ae.map(e=>`<option value="${e.code}" ${e.code===a?`selected`:``}>${e.label}</option>`).join(``)}
      </select>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:11px;color:#90b4e8;margin-bottom:6px;font-family:system-ui,sans-serif;cursor:pointer">
      <input type="checkbox" id="cb-skip-cache"> Skip cache
    </label>
    <div style="display:flex;gap:6px">
      <button id="cb-gen-btn" disabled
        style="flex:1;padding:6px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        Generate
      </button>
      <button id="cb-pdf-btn" disabled
        style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        PDF
      </button>
    </div>
    <div id="cb-pdf-result" style="display:none;gap:6px;margin-top:6px"></div>
    <div style="position:relative">
      <pre id="cb-gen-log"
        style="display:none;margin-top:8px;font-size:10px;line-height:1.5;color:#e8f0fe;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;max-height:160px;overflow-y:auto;white-space:pre-wrap;font-family:Menlo,Consolas,monospace"></pre>
      <button id="cb-gen-copy"
        style="display:none;position:absolute;top:12px;right:4px;padding:2px 8px;font-size:10px;background:#2563eb;border:none;border-radius:3px;cursor:pointer;font-family:system-ui,sans-serif;color:#fff">Copy</button>
    </div>
  `,s.insertAdjacentElement(`afterend`,l);let u=l.querySelector(`#cb-target-sel`),d=l.querySelector(`#cb-model-sel`),f=l.querySelector(`#cb-level-sel`),p=l.querySelector(`#cb-lang-sel`),m=l.querySelector(`#cb-skip-cache`),h=l.querySelector(`#cb-gen-btn`),g=l.querySelector(`#cb-pdf-btn`),_=l.querySelector(`#cb-pdf-result`),v=l.querySelector(`#cb-gen-log`),y=l.querySelector(`#cb-gen-copy`);function b(){t.dispatchEvent(new CustomEvent(`cb:settings-change`,{detail:{level:f.value,lang:p.value}}))}f.addEventListener(`change`,b),p.addEventListener(`change`,b),y.addEventListener(`click`,()=>{navigator.clipboard.writeText(v.textContent).then(()=>{y.textContent=`Copied!`,setTimeout(()=>{y.textContent=`Copy`},1500)})}),(e.__cb_RAW?.nodes||[]).filter(e=>e.kind!==`primitive`).sort((e,t)=>e.label.localeCompare(t.label)).forEach(e=>{let n=t.createElement(`option`);n.value=e.id,n.textContent=e.label,e.id===r&&(n.selected=!0),u.appendChild(n)}),u.value&&(h.disabled=!1,g.disabled=!1),u.addEventListener(`change`,()=>{h.disabled=!u.value,g.disabled=!u.value,g.textContent=`PDF`,g.style.background=`#16a34a`,_.style.display=`none`,_.innerHTML=``}),g.addEventListener(`click`,async()=>{let e=u.value;if(!e)return;let t=f.value,r=p.value,i=d.value;g.disabled=!0,g.textContent=`Generating…`,g.style.background=`#ea580c`;try{let a=`/api/pdf?domain=${encodeURIComponent(n)}&target=${encodeURIComponent(e)}&level=${encodeURIComponent(t)}&language=${encodeURIComponent(r)}&model=${encodeURIComponent(i)}`,o=await fetch(a),s=await o.json();if(!o.ok)throw Error(s.detail||`PDF generation failed`);let c=`/cb-zinets/domains/${n}/${s.file}`;g.textContent=`PDF ✓`,g.disabled=!1,_.innerHTML=`
        <a href="${c}" download
           style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ⬇ Download
        </a>
        <a href="${c}" target="_blank"
           style="flex:1;padding:6px 10px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ↗ Open
        </a>
      `,_.style.display=`flex`}catch(e){g.textContent=`Error`,g.style.background=`#dc2626`,g.title=e.message,setTimeout(()=>{g.textContent=`PDF`,g.style.background=`#16a34a`,g.disabled=!1},3e3)}}),h.addEventListener(`click`,async()=>{let t=u.value;if(!t)return;let r=d.value,i=f.value,a=p.value,o=m.checked;h.disabled=!0,h.textContent=`Queuing…`,h.style.background=`#ea580c`,v.style.display=`block`,y.style.display=`block`,v.textContent=``;let s;try{let e=await fetch(`/api/generate`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({domain:n,target:t,level:i,language:a,model:r,skip_cache:o})});if(!e.ok)throw Error(`Queue failed: ${e.status}`);s=(await e.json()).task_id,h.textContent=`Generating…`}catch(e){v.textContent=`✗ ${e.message}\n  Run: bash scripts/start-api.sh`,h.disabled=!1,h.textContent=`Retry`,h.style.background=`#dc2626`;return}let c=new e.EventSource(`/api/tasks/${s}/stream`);c.addEventListener(`log`,e=>{let{message:t}=JSON.parse(e.data);v.textContent+=t+`
`,v.scrollTop=v.scrollHeight}),c.addEventListener(`done`,t=>{c.close();let n=JSON.parse(t.data),r=f.value,i=p.value,a=n.model||d.value;v.textContent+=`
✓ Done`,h.textContent=`Generate`,h.style.background=`#2563eb`,h.disabled=!1;let o=e.document.createElement(`div`);if(o.style.cssText=`display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap`,n.log_url){let t=e.document.createElement(`a`);t.href=n.log_url,t.target=`_blank`,t.textContent=`View log`,t.style.cssText=`font-size:11px;color:#93c5fd;text-decoration:underline;cursor:pointer;font-family:system-ui,sans-serif;white-space:nowrap`,o.appendChild(t)}let s=e.document.createElement(`button`);s.textContent=`Open Book →`,s.style.cssText=`flex:1;padding:5px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif`,s.onclick=()=>{let t=ne(r,i,a,n.target);e.parent.location.hash=`#/book?domain=${n.domain}&file=${encodeURIComponent(t)}`},o.appendChild(s),l.appendChild(o)}),c.addEventListener(`gen_error`,e=>{c.close(),v.textContent+=`\n✗ ${JSON.parse(e.data).message}`,h.disabled=!1,h.textContent=`Retry`,h.style.background=`#dc2626`}),c.onerror=()=>{c.readyState!==e.EventSource.CLOSED&&(c.close(),v.textContent+=`
✗ Connection lost`,h.disabled=!1,h.textContent=`Retry`,h.style.background=`#dc2626`)}})}function _e(){return l()}var U=[{id:`anthropic`,label:`Anthropic`},{id:`gemini`,label:`Gemini`},{id:`openai`,label:`OpenAI`},{id:`qwen`,label:`Qwen`},{id:`z`,label:`Z (Zhipu)`},{id:`openrouter`,label:`OpenRouter.ai`}],W={claude_cli:{label:`Claude CLI`,models:[{value:`claude-sonnet-4-6`,label:`Sonnet 4.6`},{value:`claude-haiku-4-5-20251001`,label:`Haiku 4.5`},{value:`claude-opus-4-8`,label:`Opus 4.8`}]},openrouter:{label:`OpenRouter`,models:[{value:`anthropic/claude-sonnet-4-6`,label:`Claude Sonnet 4.6`},{value:`anthropic/claude-haiku-4-5-20251001`,label:`Claude Haiku 4.5`},{value:`anthropic/claude-opus-4-8`,label:`Claude Opus 4.8`},{value:`google/gemini-2.5-pro`,label:`Gemini 2.5 Pro`},{value:`google/gemini-2.5-flash`,label:`Gemini 2.5 Flash`},{value:`google/gemini-3.5-flash`,label:`Gemini 3.5 Flash`},{value:`openai/gpt-4.1`,label:`GPT-4.1`},{value:`openai/gpt-5.4-mini`,label:`GPT 5.4 Mini`},{value:`openai/o3-mini`,label:`o3-mini`},{value:`deepseek/deepseek-r1`,label:`DeepSeek R1`},{value:`meta-llama/llama-4-maverick`,label:`Llama 4 Maverick`},{value:`z-ai/glm-5.2`,label:`GLM 5.2`},{value:`qwen/qwen3.5-35b-a3b`,label:`Qwen 3.5 35B`},{value:`qwen/qwen3.6-35b-a3b`,label:`Qwen 3.6 35B`},{value:`nvidia/nemotron-3-ultra-550b-a55b:free`,label:`Nemotron 3 Ultra 550B`},{value:`moonshotai/kimi-k2.6`,label:`Kimi 2.6`}]},ollama:{label:`Ollama (local)`,models:null}};async function G(e,t){let n=W[e.value];if(t.innerHTML=``,!n)return;let r=n.models;if(e.value===`ollama`&&!r){try{let e=await fetch(`/api/settings/ollama-models`);e.ok&&(r=await e.json())}catch{}if(!r||r.length===0){let e=document.createElement(`option`);e.value=``,e.textContent=`(ollama not available)`,t.appendChild(e);return}W.ollama.models=r}for(let e of r){let n=document.createElement(`option`);n.value=e.value,n.textContent=e.label,t.appendChild(n)}}function K(e){if(e===0)return`never expires`;if(e<1)return`${Math.round(e*60)} min`;if(e===1)return`1 hour`;if(e<24)return`${e} hours`;let t=e/24;return Number.isInteger(t)?`${t} day${t>1?`s`:``}`:`${e} hours`}async function ve(e){e.innerHTML=``,e._renderKey=Symbol(),e.appendChild(S());let t=document.createElement(`main`);t.className=`cb-settings`,t.innerHTML=`
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
              ${Object.entries(W).map(([e,t])=>`<option value="${e}">${t.label}</option>`).join(``)}
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
          pinyin in search), Sync rebuilds it from the generated content and
          refreshes the "default → sonnet" baseline-model symlinks for any
          newly generated domain/language.
          Idempotent and safe to run anytime, even during generation.
        </p>
        <div class="cb-settings__row" style="margin-top:16px">
          <button id="cb-catalog-sync" class="cb-btn">Sync Catalog</button>
          <span id="cb-catalog-sync-status" class="cb-settings__status"></span>
        </div>
      </section>

    </div>
  `,e.appendChild(t);let n=t.querySelectorAll(`.cb-settings__tab`),r=t.querySelectorAll(`[data-tab-panel]`);n.forEach(e=>{e.addEventListener(`click`,()=>{n.forEach(t=>t.classList.toggle(`cb-settings__tab--active`,t===e)),r.forEach(t=>{t.style.display=t.dataset.tabPanel===e.dataset.tab?``:`none`})})});let i=t.querySelector(`#cb-adapter`),a=t.querySelector(`#cb-model`),o=t.querySelector(`#cb-settings-save`),s=t.querySelector(`#cb-settings-status`),c=t.querySelector(`#cb-current-llm`);i.addEventListener(`change`,()=>G(i,a)),await G(i,a);let l=t.querySelector(`#cb-while-max-iter`),u=t.querySelector(`#cb-max-llm-calls`),d=t.querySelector(`#cb-max-tokens`),f=t.querySelector(`#cb-max-concurrent`),p=t.querySelector(`#cb-spl-limits-save`),m=t.querySelector(`#cb-spl-limits-status`),h=t.querySelector(`#cb-graph-layout`),g=t.querySelector(`#cb-graph-layout-save`),_=t.querySelector(`#cb-graph-layout-status`);h.value=localStorage.getItem(`cb_graph_layout`)||`compact`,g.addEventListener(`click`,()=>{localStorage.setItem(`cb_graph_layout`,h.value),_.textContent=`Saved — reload the graph page to apply`,_.style.color=`#16a34a`,setTimeout(()=>{_.textContent=``},4e3)});let v=t.querySelector(`#cb-cache-ttl`),y=t.querySelector(`#cb-cache-ttl-hint`),b=t.querySelector(`#cb-cache-save`),x=t.querySelector(`#cb-cache-status`);v.addEventListener(`input`,()=>{let e=Number(v.value);y.textContent=isNaN(e)||e<0?``:K(e)});let C=t.querySelector(`#cb-concept-cache-enabled`),w=t.querySelector(`#cb-concept-cache-label`),T=t.querySelector(`#cb-concept-cache-save`),E=t.querySelector(`#cb-concept-cache-status`);function D(){let e=C.checked;w.textContent=e?`Enabled`:`Disabled`,w.style.color=e?`#16a34a`:`var(--color-muted)`}C.addEventListener(`change`,D);let O=t.querySelector(`#cb-api-keys-list`);O.innerHTML=U.map(e=>`
    <div class="cb-settings__field" style="margin-bottom:10px">
      <label class="cb-settings__label">${e.label}</label>
      <div class="cb-settings__row">
        <input type="password" class="cb-settings__input" style="flex:1;min-width:200px"
          id="cb-apikey-${e.id}" autocomplete="off" placeholder="Not set">
        <button class="cb-btn" id="cb-apikey-save-${e.id}">Save</button>
        <button class="cb-btn-ghost" id="cb-apikey-clear-${e.id}">Clear</button>
        <span class="cb-settings__status" id="cb-apikey-status-${e.id}"></span>
      </div>
    </div>
  `).join(``);try{let e=await fetch(`/api/settings/api-keys`);if(e.ok){let n=await e.json();for(let e of U){let r=n[e.id];r?.configured&&(t.querySelector(`#cb-apikey-${e.id}`).placeholder=`Configured (${r.masked})`)}}}catch{}for(let e of U){let n=t.querySelector(`#cb-apikey-${e.id}`),r=t.querySelector(`#cb-apikey-status-${e.id}`);t.querySelector(`#cb-apikey-save-${e.id}`).addEventListener(`click`,async()=>{let t=n.value.trim();if(!t){r.textContent=`Enter a key first`,r.style.color=`#dc2626`,setTimeout(()=>{r.textContent=``},3e3);return}try{let i=await fetch(`/api/settings/api-keys`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({provider:e.id,api_key:t})}),a=await i.json();if(!i.ok)throw Error(a.detail||`HTTP ${i.status}`);n.value=``,n.placeholder=`Configured (${a.masked})`,r.textContent=`Saved`,r.style.color=`#16a34a`}catch(e){r.textContent=`Failed: ${e.message}`,r.style.color=`#dc2626`}setTimeout(()=>{r.textContent=``},3e3)}),t.querySelector(`#cb-apikey-clear-${e.id}`).addEventListener(`click`,async()=>{try{let t=await fetch(`/api/settings/api-keys/${e.id}`,{method:`DELETE`});if(!t.ok)throw Error(`HTTP ${t.status}`);n.value=``,n.placeholder=`Not set`,r.textContent=`Cleared`,r.style.color=`#16a34a`}catch(e){r.textContent=`Failed: ${e.message}`,r.style.color=`#dc2626`}setTimeout(()=>{r.textContent=``},3e3)})}let k=t.querySelector(`#cb-catalog-sync`),A=t.querySelector(`#cb-catalog-sync-status`);k.addEventListener(`click`,async()=>{k.disabled=!0,A.style.color=`var(--color-muted)`,A.textContent=`Syncing…`;try{let e=await fetch(`/api/catalog/sync`,{method:`POST`}),t=await e.json();if(!e.ok||!t.ok)throw Error(t.detail||`HTTP ${e.status}`);let n=[`${t.scanned} domains scanned`,t.added?`${t.added} added`:null,`${t.refreshed} refreshed`,`${t.books} books`,`${t.concepts} concepts`,t.concepts_without_pinyin?`${t.concepts_without_pinyin} without pinyin`:null,t.default_symlinks?.linked?`${t.default_symlinks.linked} default symlinks created`:null].filter(Boolean);A.style.color=`#16a34a`,A.textContent=`Synced — ${n.join(`, `)}`}catch(e){A.style.color=`#dc2626`,A.textContent=`Sync failed: ${e.message}`}finally{k.disabled=!1}});try{let e=await fetch(`/api/settings`);if(e.ok){let t=await e.json();c.textContent=`Current: ${t.llm}`;let[n,...r]=t.llm.split(`:`),o=r.join(`:`);W[n]&&(i.value=n,await G(i,a),[...a.options].some(e=>e.value===o)&&(a.value=o)),t.spl_while_max_iter&&(l.value=t.spl_while_max_iter),t.spl_max_llm_calls&&(u.value=t.spl_max_llm_calls),t.spl_max_tokens&&(d.value=t.spl_max_tokens),t.task_max_concurrent&&(f.value=t.task_max_concurrent);let s=Math.round(t.compare_cache_ttl/3600);v.value=s,y.textContent=K(s),t.use_concept_cache!==void 0&&(C.checked=!!t.use_concept_cache,D())}}catch{s.textContent=`API not reachable — run the backend to change settings`,s.style.color=`#dc2626`}o.addEventListener(`click`,async()=>{let e=`${i.value}:${a.value}`;try{(await fetch(`/api/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({llm:e})})).ok?(c.textContent=`Current: ${e}`,s.textContent=`Saved`,s.style.color=`#16a34a`):(s.textContent=`Save failed`,s.style.color=`#dc2626`)}catch{s.textContent=`API not reachable`,s.style.color=`#dc2626`}setTimeout(()=>{s.textContent=``},3e3)}),p.addEventListener(`click`,async()=>{let e=Number(l.value),t=Number(u.value),n=Number(d.value),r=Number(f.value);if(!Number.isInteger(e)||e<1||!Number.isInteger(t)||t<1||!Number.isInteger(n)||n<100||!Number.isInteger(r)||r<1){m.textContent=`Enter valid integers (iterations/calls ≥ 1, tokens ≥ 100, parallel ≥ 1)`,m.style.color=`#dc2626`,setTimeout(()=>{m.textContent=``},3e3);return}try{(await fetch(`/api/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({spl_while_max_iter:e,spl_max_llm_calls:t,spl_max_tokens:n,task_max_concurrent:r})})).ok?(m.textContent=`Saved`,m.style.color=`#16a34a`):(m.textContent=`Save failed`,m.style.color=`#dc2626`)}catch{m.textContent=`API not reachable`,m.style.color=`#dc2626`}setTimeout(()=>{m.textContent=``},3e3)}),b.addEventListener(`click`,async()=>{let e=Number(v.value);if(isNaN(e)||e<0){x.textContent=`Enter a valid number ≥ 0`,x.style.color=`#dc2626`,setTimeout(()=>{x.textContent=``},3e3);return}let t=Math.round(e*3600);try{(await fetch(`/api/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({compare_cache_ttl:t})})).ok?(y.textContent=K(e),x.textContent=`Saved`,x.style.color=`#16a34a`):(x.textContent=`Save failed`,x.style.color=`#dc2626`)}catch{x.textContent=`API not reachable`,x.style.color=`#dc2626`}setTimeout(()=>{x.textContent=``},3e3)}),T.addEventListener(`click`,async()=>{try{(await fetch(`/api/settings`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify({use_concept_cache:C.checked})})).ok?(E.textContent=`Saved`,E.style.color=`#16a34a`):(E.textContent=`Save failed`,E.style.color=`#dc2626`)}catch{E.textContent=`API not reachable`,E.style.color=`#dc2626`}setTimeout(()=>{E.textContent=``},3e3)})}async function ye(e,{id:t}={}){e.innerHTML=``,e.className=``;let n=Symbol();e._renderKey=n;let r=null,i=[];try{i=await E(),t&&(r=i.find(e=>e.id===t)??{id:t,name:t,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(e._renderKey!==n)return;let a=document.createElement(`div`);a.style.cssText=`display:flex;flex-direction:column;height:100vh;overflow:hidden`,e.appendChild(a),a.appendChild(S({domainName:r?.name||``}));let o=document.createElement(`div`);o.className=`cb-domain-picker-bar`;let s=document.createElement(`span`);s.className=`cb-domain-picker-bar__label`,s.textContent=`Domain`,o.appendChild(s);let c=document.createElement(`input`);c.type=`text`,c.placeholder=`Search phrase or pinyin…`,c.autocomplete=`off`,c.className=`cb-domain-picker-bar__select`,o.appendChild(c);let l=document.createElement(`select`);l.className=`cb-domain-picker-bar__select`;function u(){let e=c.value.trim(),n=e?i.filter(t=>T(t.name||t.id,t.pinyin,t.pinyin_initials,e)):i;l.innerHTML=``;let r=document.createElement(`option`);return r.value=``,r.textContent=n.length?`Select domain…`:`No match`,l.appendChild(r),[...n].sort((e,t)=>e.id.localeCompare(t.id,`zh`)).forEach(e=>{let n=document.createElement(`option`);n.value=e.id,n.textContent=e.name||e.id,e.id===t&&(n.selected=!0),l.appendChild(n)}),n}let d=u();if(c.addEventListener(`input`,()=>{d=u()}),c.addEventListener(`keydown`,e=>{e.key===`Enter`&&d.length&&(window.location.hash=`/domain/${encodeURIComponent(d[0].id)}`)}),l.addEventListener(`change`,()=>{l.value&&(window.location.hash=`/domain/${encodeURIComponent(l.value)}`)}),o.appendChild(l),a.appendChild(o),!t||!r)return;if(r.source){let e=document.createElement(`div`);e.className=`cb-attribution`,e.innerHTML=`Source: <a href="${r.source.url}" target="_blank">${r.source.title}</a> by ${r.source.authors} (${r.source.license}). ${r.source.attribution}`,a.appendChild(e)}let f=document.createElement(`main`);f.className=`cb-domain`;let p=r.default_level||`intro`,m=_e();f.appendChild(se(r,{level:p,lang:m})),a.appendChild(f)}function be(e){e.innerHTML=``,e._renderKey=Symbol(),e.appendChild(S());let t=document.createElement(`main`);t.className=`cb-about`,t.innerHTML=`
    <h1>About ZiNets ConceptBook</h1>
    <p>
      Chinese characters can feel overwhelming — thousands of symbols with no obvious pattern.
      <strong>ZiNets ConceptBook</strong> changes that. Our mission is to simplify the Chinese
      learning experience by revealing the hidden structure inside every character: a small set
      of elemental radicals combine and build meaning, layer by layer, like molecules built from
      atoms. Once you see the pattern, characters stop being random and start making sense.
    </p>
    <p>
      The tool at the center is the <em>concept graph</em> — a visual map that shows how each
      character decomposes into its building blocks and how those blocks connect to others.
      Navigation replaces memorization: follow the graph, and the learning sequence emerges
      naturally.
    </p>

    <h2>How to learn with it</h2>
    <ol>
      <li>Type any Chinese character, word, phrase, or sentence on the home page and click <strong>Build Concept Graph</strong></li>
      <li>Explore the graph — each node is a building block of the input you entered; for a sentence, see how individual characters link together to carry the full meaning (try a line from a classical poem)</li>
      <li>Click any node to open its concept book: etymology, meaning, usage, and examples</li>
      <li>Use the learning path sidebar to follow the sequence from elementals up to the full character</li>
    </ol>

    <h2>Why Chinese characters?</h2>
    <p>
      Chinese characters are not arbitrary — they follow deep structural patterns.
      Mastering a few hundred elemental characters gives you a key that unlocks
      thousands of compound characters by structure alone, the same way knowing chemical
      elements lets you read a molecular formula. ZiNets makes that key visible and learnable
      in a fraction of the time traditional methods require.
    </p>

    <h2>Pre-generated Baseline Content</h2>
    <p>
      This app ships with rich, ready-to-explore content so learners can get started immediately
      — no API key required:
    </p>
    <ul>
      <li>
        <strong>100+ Chinese idioms (成语)</strong> — concept books generated in 6 languages:
        English (EN), Chinese (ZH), Spanish (ES), French (FR), German (DE), Arabic (AR), Korean (KO)
        using <em>Claude Sonnet 4.6</em> and <em>Gemma4</em>.
      </li>
      <li>
        <strong>422 elemental characters</strong> — concept books generated in 8 languages:
        English (EN), Chinese (ZH), Spanish (ES), French (FR), German (DE), Arabic (AR), Korean (KO), Portuguese (PT)
        using <em>Claude Sonnet 4.6</em> and <em>Gemma4</em>.
      </li>
    </ul>
    <p>
      The baseline content is provided as a reference and learning foundation.
      As learners advance on their journey, they can generate concept books for any character,
      word, or phrase <em>outside the baseline scope</em> by supplying their own LLM API token
      in the Settings page — unlocking the full power of the content engine at their own pace.
    </p>

    <h2>Why Claude Sonnet 4.6 and Gemma4 ?</h2>
    <p>
      Two complementary models were chosen deliberately to validate content quality across
      the proprietary/open-source divide:
    </p>
    <ul>
      <li>
        <strong>Claude Sonnet 4.6</strong> (<a href="https://www.anthropic.com" target="_blank" rel="noopener">Anthropic</a>)
        — excels at nuanced multilingual reasoning, cultural context, and etymology. Its deep
        understanding of Chinese characters and idiomatic expressions makes it the benchmark
        for high-quality concept-book content.
      </li>
      <li>
        <strong>Gemma4</strong> (<a href="https://deepmind.google" target="_blank" rel="noopener">Google DeepMind</a>)
        — a capable open-weights model that can be run locally or via free/low-cost APIs.
        Including Gemma4 keeps the baseline accessible and demonstrates that quality concept
        books are achievable without proprietary API costs.
      </li>
    </ul>
    <p>
      The concept book page includes a built-in <strong>Compare</strong> feature — a hidden gem
      worth exploring. Side-by-side comparison works in two dimensions: place two AI models next
      to each other to evaluate content quality, or place two languages next to each other to
      support bilingual learning. Mix and match model and language pairings to find what best
      fits your budget and learning goals.
    </p>

    <h2>The research behind it</h2>
    <p>
      ZiNets ConceptBook grew out of original research published on arXiv:
      <a href="https://arxiv.org/abs/2502.19428" target="_blank" rel="noopener">A New Exploration into Chinese Characters: from Simplification to Deeper Understanding</a>.
      That paper introduced the concept graph model for Chinese characters and validated it as a
      more effective path to character literacy than traditional stroke-order and radical-list
      memorization. Everything in this app — the graph structure, the elemental characters, the
      learning path — traces back to that foundational work.
    </p>

    <h2>The content engine</h2>
    <p>
      All domain graphs and concept-book text are generated by
      <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a>
      — a structured programming language for LLM-driven content generation with math verification.
      concept-book is the web-app layer that hosts and presents what SPL.py produces.
    </p>

    <h2>Open source</h2>
    <p>The following repositories are open source under the Apache 2.0 license:</p>
    <ul>
      <li>
        <a href="https://github.com/digital-duck/cb-zinets" target="_blank" rel="noopener">cb-zinets</a>
        — this app for the Chinese characters use-case
      </li>
      <li>
        <a href="https://github.com/digital-duck/concept-book" target="_blank" rel="noopener">concept-book</a>
        — the core concept-book framework
      </li>
    </ul>
  `,e.appendChild(t)}var q=null;async function xe(){if(q)return q;let e=await fetch(`/cb-zinets/resources.json`,{cache:`no-cache`});if(!e.ok)throw Error(`Failed to load resources: ${e.status}`);return q=await e.json(),q}function Se(e,t){e.innerHTML=`
    <table class="cb-resources-table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${t.map(e=>`
          <tr>
            <td><a href="${e.url}" target="_blank" rel="noopener">${e.name}</a></td>
            <td>${e.description}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
  `}function Ce(e){e.innerHTML=``,e._renderKey=Symbol();let t=e._renderKey;e.appendChild(S());let n=document.createElement(`main`);n.className=`cb-resources`,n.innerHTML=`
    <h1>Resources</h1>
    <p>
      Great dictionaries and reference sites for looking up Chinese characters and phrases.
      Sites marked for concept pages are also linked directly from each character's concept page;
      the remaining entries are general references available here for browsing.
    </p>
    <div id="cb-resources-table-wrap" class="cb-resources-table-wrap">
      <div class="cb-home-empty">Loading…</div>
    </div>
  `,e.appendChild(n);let r=n.querySelector(`#cb-resources-table-wrap`);xe().then(n=>{e._renderKey===t&&Se(r,n)}).catch(()=>{e._renderKey===t&&(r.innerHTML=`<div class="cb-home-empty">Failed to load resources.</div>`)})}var we=[`intro`,`core`,`college`,`research`],Te=[{value:`sonnet`,label:`sonnet (Claude) *`},{value:`gemma4`,label:`gemma4 (Ollama)`},{value:`gemma3`,label:`gemma3 (Ollama)`}];function J(e){let t=ee(e);if(t)return{level:t.level,lang:t.language};let n=e.match(/output\/([^.]+)\.([^/]+)\//);return n?{level:n[1],lang:n[2]}:{level:`college`,lang:`en`}}function Y(e){return ee(e)?.model??``}function X(e){return e.replace(/^.*\//,``)}function Ee(e){return e.startsWith(`book_`)||e.startsWith(`phrase_`)}function De(e){return decodeURIComponent(X(e).replace(/^concept_/,``).replace(/\.html$/,``))}function Oe(e,t,n,r,i){let a=X(t);return`/cb-zinets/domains/${e}/${i?I(n,r,i):`output/${n}.${r}/html`}/${a}`}function ke(e,t){ie(t.map(t=>`/cb-zinets/domains/${encodeURIComponent(e)}/${t.file}`))}function Z(e,t,n,r){let i=decodeURIComponent(e).replace(/^(?:concept|book)_/,``).replace(/_/g,` `).replace(/\.html$/,``);return`<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${t||`default`}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${r}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${n}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${i}</strong> first via the Concept-Graph page.</p>
  </body></html>`}async function Ae(e,t,n,r,i){let a=X(t);if(e){let a=Oe(e,t,n,r,i);if(await z(a))return a}if(i&&a.startsWith(`concept_`)){let e=`/cb-zinets/${te(n,r,i,De(a))}`;if(await z(e))return e}return null}function je(e){try{let t=e.contentDocument?.querySelector(`nav.toc`)?.querySelectorAll(`ol li`);if(!t||!t.length)return null;let n=[];return t.forEach(e=>{let t=e.querySelector(`a`);t&&n.push({href:t.getAttribute(`href`),label:t.textContent,isTarget:e.classList.contains(`toc-target`)})}),n.length?n:null}catch{return null}}async function Me(e,t,n,r,i,a){let o=await Ae(t,n,r.level,r.lang,r.model);a&&a()||(i&&i(!!o),o?e.src=o:(e.removeAttribute(`src`),e.srcdoc=Z(X(n),r.model,r.lang,r.level)))}function Ne(e){try{let t=e.contentDocument;if(!t)return;let n=t.createElement(`style`);n.textContent=`nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }`,t.head.appendChild(n)}catch{}}function Pe(e,t,n){let r=document.createElement(`select`);return n&&(r.className=n),e.forEach(({value:e,label:n})=>{let i=document.createElement(`option`);i.value=e,i.textContent=n,e===t&&(i.selected=!0),r.appendChild(i)}),r}function Fe(e,t,n,r){let i=document.createElement(`div`);if(i.className=`cb-book-pane__controls`,e){let t=document.createElement(`span`);t.className=`cb-book-pane__label`,t.textContent=e,i.appendChild(t)}let a=Pe(Te,t.model,`cb-book-pane__select`);a.title=`Model`,a.addEventListener(`change`,()=>n(`model`,a.value)),i.appendChild(a);let o=Pe(we.map(e=>({value:e,label:e.charAt(0).toUpperCase()+e.slice(1)})),t.level,`cb-book-pane__select`);o.title=`Level`,o.addEventListener(`change`,()=>n(`level`,o.value)),o.style.display=`none`,i.appendChild(o);let s=Pe(u.map(e=>({value:e.code,label:e.label})),t.lang,`cb-book-pane__select`);if(s.title=`Language`,s.addEventListener(`change`,()=>n(`lang`,s.value)),i.appendChild(s),r){let e=document.createElement(`button`);e.type=`button`,e.className=`cb-book-pane__refresh`,e.title=`Refresh — re-check for content that just finished generating`,e.textContent=`🔄`,e.addEventListener(`click`,r),i.appendChild(e)}return i}function Ie(e,t){let n=document.createElement(`div`);n.style.cssText=`height:5px;background:#d1d5db;cursor:row-resize;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.15s`;let r=document.createElement(`div`);r.style.cssText=`width:40px;height:3px;border-radius:2px;background:#9ca3af;pointer-events:none`,n.appendChild(r);let i=!1;return n.addEventListener(`mouseenter`,()=>{i||(n.style.background=`#bfdbfe`)}),n.addEventListener(`mouseleave`,()=>{i||(n.style.background=`#d1d5db`)}),n.addEventListener(`mousedown`,r=>{r.preventDefault(),i=!0,n.style.background=`#93c5fd`;let a=document.createElement(`div`);a.style.cssText=`position:fixed;inset:0;z-index:9999;cursor:row-resize`,document.body.appendChild(a),document.body.style.userSelect=`none`;let o=n=>{let r=e();if(!r)return;let i=r.getBoundingClientRect();t(Math.min(80,Math.max(20,(n.clientY-i.top)/i.height*100)))},s=()=>{i=!1,n.style.background=`#d1d5db`,document.body.removeChild(a),document.body.style.userSelect=``,document.removeEventListener(`mousemove`,o),document.removeEventListener(`mouseup`,s)};document.addEventListener(`mousemove`,o),document.addEventListener(`mouseup`,s)}),n}function Le(e,t,n){let r=`font-family:system-ui,sans-serif`,i=document.createElement(`div`);i.style.cssText=`margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15)`;let a=document.createElement(`div`);a.style.cssText=`font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#90b4e8;margin-bottom:8px;${r};font-weight:700`,a.textContent=`💬 Reviewer Chat`,i.appendChild(a);let o=document.createElement(`div`);o.style.cssText=`max-height:220px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:6px`;function s(){o.innerHTML=``,t.forEach(({role:e,text:t})=>{let n=document.createElement(`div`),i=e===`user`;n.style.cssText=[`font-size:.8rem;line-height:1.4;${r}`,`padding:6px 8px;border-radius:6px;word-break:break-word;white-space:pre-wrap`,i?`background:rgba(96,165,250,.18);color:#dbeafe;align-self:flex-end;text-align:right`:`background:rgba(255,255,255,.07);color:#e8f0fe;align-self:flex-start`].join(`;`),n.textContent=t,o.appendChild(n)}),o.scrollTop=o.scrollHeight}s(),i.appendChild(o);let c=document.createElement(`div`);c.style.cssText=`display:flex;flex-direction:column;gap:6px`;let l=document.createElement(`textarea`);l.rows=4,l.placeholder=`Ask about this concept…`,l.style.cssText=[`width:100%;box-sizing:border-box;resize:vertical;${r};font-size:.8rem`,`border:1px solid rgba(255,255,255,0.2);border-radius:5px`,`background:rgba(255,255,255,.06);color:#e8f0fe`,`padding:5px 7px;outline:none`].join(`;`);let u=document.createElement(`button`);u.textContent=`Send`,u.style.cssText=[`${r};font-size:.75rem;font-weight:600;align-self:flex-end`,`padding:5px 14px;border:none;border-radius:5px`,`background:#3b82f6;color:#fff;cursor:pointer;white-space:nowrap`].join(`;`);async function d(){let t=l.value.trim();if(!t||u.disabled)return;l.value=``,u.disabled=!0,u.textContent=`…`;let r=``;try{let t=e.contentDocument,n=t?.querySelector(`main`)||t?.body;n&&(r=(n.innerText||``).slice(0,3e3))}catch{}await n(t,r,s),u.disabled=!1,u.textContent=`Send`,s()}return u.addEventListener(`click`,d),l.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),d())}),c.appendChild(l),c.appendChild(u),i.appendChild(c),i}function Re(e,t,{compareChecked:n,compareBtnEnabled:r,skipCacheChecked:i,onCompareToggle:a,onSkipCacheToggle:o,onCompareActivate:s,onConceptClick:c,isAdmin:l=!1,chatHistory:u=[],onChatSend:d=null,tocItems:f=null}){e.innerHTML=``;let p=document.createElement(`div`);p.style.cssText=`margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.15)`;let m=document.createElement(`label`);m.style.cssText=`display:flex;align-items:center;gap:8px;cursor:pointer;font-family:system-ui,sans-serif;font-size:0.85rem;color:#e8f0fe;font-weight:600;margin-bottom:8px`;let h=document.createElement(`input`);if(h.type=`checkbox`,h.checked=n,h.style.cssText=`width:14px;height:14px;cursor:pointer;accent-color:#60a5fa`,h.addEventListener(`change`,()=>a(h.checked)),m.appendChild(h),m.appendChild(document.createTextNode(`Compare`)),p.appendChild(m),n){let e=document.createElement(`div`);e.style.cssText=`display:flex;align-items:center;gap:6px`;let t=document.createElement(`label`);t.style.cssText=`display:flex;align-items:center;gap:3px;cursor:pointer;flex-shrink:0;font-family:system-ui,sans-serif;font-size:0.75rem;color:#90b4e8;white-space:nowrap`,t.title=`Skip cache — always run a fresh comparison`;let n=document.createElement(`input`);n.type=`checkbox`,n.checked=i,n.style.cssText=`width:12px;height:12px;cursor:pointer;accent-color:#60a5fa;flex-shrink:0`,n.addEventListener(`change`,()=>o(n.checked)),t.appendChild(n),t.appendChild(document.createTextNode(`↻ fresh`)),e.appendChild(t);let a=document.createElement(`button`);a.textContent=`Compare ▶`,a.disabled=!r,a.style.cssText=[`flex:1;padding:6px 10px;font-size:0.8rem;font-weight:600`,`border-radius:6px;border:none;font-family:system-ui,sans-serif;transition:opacity 0.15s`,r?`background:#3b82f6;color:#fff;cursor:pointer`:`background:#374151;color:#6b7280;cursor:not-allowed;opacity:0.6`].join(`;`),a.title=r?`Generate AI comparison of both sections in PANE C`:`Both panes need content before comparing`,a.addEventListener(`click`,()=>{a.disabled||s()}),e.appendChild(a),p.appendChild(e)}e.appendChild(p);let g=f??je(t);if(!g)return;let _=document.createElement(`div`);_.style.cssText=`font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700`,_.textContent=`Contents`,e.appendChild(_);let v=document.createElement(`ol`);v.style.cssText=`list-style:decimal inside;padding:0;margin:0;flex:1`,g.forEach(({href:e,label:t,isTarget:n})=>{let r=document.createElement(`li`);r.style.cssText=`margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${n?`;font-weight:700`:``}`;let i=document.createElement(`a`);i.textContent=t,i.href=`#`,i.style.cssText=`text-decoration:none;color:${n?`#fff`:`#a8c8f0`}`,i.addEventListener(`mouseover`,()=>{i.style.color=`#fff`}),i.addEventListener(`mouseout`,()=>{i.style.color=n?`#fff`:`#a8c8f0`}),i.addEventListener(`click`,t=>{t.preventDefault(),c(e)}),r.appendChild(i),v.appendChild(r)}),e.appendChild(v),l&&!n&&d&&e.appendChild(Le(t,u,d));let y=document.createElement(`div`);y.style.cssText=`margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif`,y.innerHTML=`Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>`,e.appendChild(y)}function ze(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/^## (.+)$/gm,`</p><h3 style="color:#1e3a5f;margin:20px 0 8px;font-size:1rem;font-weight:700">$1</h3><p>`).replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`).replace(/\*(.+?)\*/g,`<em>$1</em>`).replace(/\n\n/g,`</p><p style="margin:0 0 12px">`).replace(/\n/g,` `).replace(/^/,`<p style="margin:0 0 12px">`).replace(/$/,`</p>`).replace(/<p[^>]*><\/p>/g,``).replace(/<p[^>]*>(<h3)/g,`$1`).replace(/(<\/h3>)<\/p>/g,`$1`)}function Be(){let e=document.createElement(`div`);return e.setAttribute(`data-pane-c`,`1`),e.style.cssText=[`flex:1`,`overflow-y:auto`,`background:#f8fafc`,`padding:24px 32px`,`font-family:system-ui,sans-serif`,`font-size:0.9rem`,`line-height:1.7`,`color:#374151`].join(`;`),e.innerHTML=`<div style="color:#9ca3af;font-size:0.85rem">Click <strong>Compare ▶</strong> to generate an AI comparison of the two sections above.</div>`,e}function Ve(e,t,n,r,i,a){let o=De(t),s=n.model||`default`,c=r.model||`default`,l=new URLSearchParams({domain:e,concept:o,level_a:n.level,lang_a:n.lang,model_a:n.model,level_b:r.level,lang_b:r.lang,model_b:r.model,skip_cache:a?`1`:`0`});i.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;color:#6b7280;font-size:0.88rem">
      <div style="width:18px;height:18px;border:2px solid #e0e3e8;border-top-color:#3b82f6;border-radius:50%;animation:cb-spin 0.8s linear infinite;flex-shrink:0"></div>
      Comparing <strong style="color:#1e3a5f;margin:0 3px">${s}</strong> vs <strong style="color:#1e3a5f;margin:0 3px">${c}</strong>…
    </div>
    <style>@keyframes cb-spin{to{transform:rotate(360deg)}}</style>`;let u=performance.now(),d=new EventSource(`/api/compare?${l}`);return d.addEventListener(`compare_done`,e=>{d.close();let t=((performance.now()-u)/1e3).toFixed(1),{comparison:a,from_cache:o}=JSON.parse(e.data),l=o?`<span style="font-size:0.7rem;padding:2px 6px;border-radius:10px;background:#d1fae5;color:#065f46;font-weight:600;flex-shrink:0">cached</span>`:``;i.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #e0e3e8">
        <span style="font-size:0.7rem;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;font-weight:700">PANE C — Comparison</span>
        <span style="font-size:0.8rem;color:#374151">
          <strong style="color:#2563eb">${s}</strong> (${n.level}/${n.lang})
          <span style="color:#9ca3af;margin:0 6px">vs</span>
          <strong style="color:#2563eb">${c}</strong> (${r.level}/${r.lang})
        </span>
        ${l}
        <span style="font-size:0.72rem;color:#9ca3af;margin-left:auto">${t}s</span>
      </div>
      <div style="max-width:820px">${ze(a)}</div>`}),d.addEventListener(`compare_error`,e=>{d.close();let{message:t}=JSON.parse(e.data);i.innerHTML=`<p style="color:#dc2626;font-size:0.88rem"><strong>Comparison failed:</strong> ${t}</p>`}),d.onerror=()=>{d.close(),i.innerHTML=`<p style="color:#dc2626;font-size:0.88rem">Connection to comparison service lost.</p>`},d}async function He(){if((localStorage.getItem(`cb_book_browser_source`)||`catalog`)===`files`)try{let e=await fetch(`/api/browse/domains`);if(!e.ok)throw Error();let{domains:t}=await e.json();return t.map(e=>({id:e}))}catch{return[]}try{return(await E()).map(e=>({id:e.id,pinyin:e.pinyin,pinyin_initials:e.pinyin_initials}))}catch{return[]}}async function Ue(e){if((localStorage.getItem(`cb_book_browser_source`)||`catalog`)===`files`)try{let t=await fetch(`/api/browse/${encodeURIComponent(e)}`);if(!t.ok)throw Error();return t.json()}catch{return{books:[],concepts:[]}}try{let t=await D(e)??await(async()=>(await E()).find(t=>t.id===e)??{})(),n=(t.books||[]).map(e=>{let t=e.target.replace(/_/g,` `).trim()||e.target,n=J(e.file).lang;return{file:e.file,label:n?`${t} (${n})`:t,model:e.model||Y(e.file)}}),r=(t.generated_concepts||[]).map(e=>{let t=J(e.file).lang;return{file:e.file,label:t?`${e.label} (${t})`:e.label,model:e.model||Y(e.file)}});return ke(e,[...n,...r]),{books:n,concepts:r}}catch{return{books:[],concepts:[]}}}function We(e,t){let n=document.createElement(`nav`);n.className=`cb-book-nav`,n.style.width=`260px`;let r=document.createElement(`div`);r.className=`cb-book-nav__title`,r.textContent=`Concept Books`,n.appendChild(r);let i=document.createElement(`div`);i.className=`cb-book-nav__toggle`;function a(e,t){let n=document.createElement(`label`);n.className=`cb-book-nav__src-radio`;let r=document.createElement(`input`);return r.type=`radio`,r.name=`cb-src`,r.value=e,n.appendChild(r),n.appendChild(document.createTextNode(t)),{wrap:n,input:r}}let{wrap:o,input:s}=a(`catalog`,`Catalog`),{wrap:c,input:l}=a(`files`,`Files`);i.appendChild(o),i.appendChild(c),n.appendChild(i);function u(e){let t=document.createElement(`div`);return t.className=`cb-book-nav__label`,t.textContent=e,t}n.appendChild(u(`Domain`));let d=document.createElement(`input`);d.type=`text`,d.placeholder=`Search phrase or pinyin…`,d.autocomplete=`off`,d.className=`cb-book-nav__select`,n.appendChild(d);let f=document.createElement(`select`);f.className=`cb-book-nav__select`,n.appendChild(f),n.appendChild(u(`Model`));let p=document.createElement(`select`);p.className=`cb-book-nav__select`,p.innerHTML=`<option value="">— all —</option>`,n.appendChild(p),n.appendChild(u(`TOC Index`));let m=document.createElement(`select`);m.className=`cb-book-nav__select`,n.appendChild(m);let h=document.createElement(`button`);h.textContent=`Open`,h.disabled=!0,h.className=`cb-book-nav__open`,n.appendChild(h);function g(){return localStorage.getItem(`cb_book_browser_source`)||`catalog`}function _(){let e=g();s.checked=e===`catalog`,l.checked=e===`files`}function v(){h.disabled=!f.value||!m.value}let y=[],b=[];function x(){let e=p.value,n=e?y.filter(t=>!t.model||t.model===e):y;m.innerHTML=`<option value="">Select book…</option>`,n.forEach(e=>{let n=document.createElement(`option`);n.value=e.file,n.textContent=e.label,e.file===t&&(n.selected=!0),m.appendChild(n)}),v()}function S(e){let t=d.value.trim(),n=t?b.filter(e=>T(e.id,e.pinyin,e.pinyin_initials,t)):b;f.innerHTML=`<option value="">${n.length?`Select domain…`:`No match`}</option>`,[...n].sort((e,t)=>e.id.localeCompare(t.id,`zh`)).forEach(({id:e})=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,f.appendChild(t)}),e&&n.some(t=>t.id===e)?f.value=e:n.length===1&&(f.value=n[0].id)}async function C(e){m.innerHTML=`<option value="">Loading…</option>`,p.innerHTML=`<option value="">Loading…</option>`,v();let{books:n,concepts:r}=await Ue(e);y=n;let i=new Set;n.forEach(e=>{e.model&&i.add(e.model)}),r.forEach(e=>{e.model&&i.add(e.model)});let a=[...i].sort();p.innerHTML=`<option value="">— all —</option>`,a.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,p.appendChild(t)});let o=t?Y(t):``;o&&i.has(o)?p.value=o:a.length>0&&(p.value=a[0]),x()}function w(){m.innerHTML=`<option value="">—</option>`,p.innerHTML=`<option value="">— all —</option>`,y=[],v()}async function E(){f.innerHTML=`<option value="">Loading…</option>`,m.innerHTML=`<option value="">—</option>`,v(),b=await He(),S(e),f.value?await C(f.value):v()}_(),s.addEventListener(`change`,()=>{s.checked&&(localStorage.setItem(`cb_book_browser_source`,`catalog`),E())}),l.addEventListener(`change`,()=>{l.checked&&(localStorage.setItem(`cb_book_browser_source`,`files`),E())}),d.addEventListener(`input`,()=>{let e=f.value;S(e),f.value!==e&&(f.value?C(f.value):w())}),f.addEventListener(`change`,()=>{f.value?C(f.value):w()}),p.addEventListener(`change`,x),m.addEventListener(`change`,v),h.addEventListener(`click`,()=>{let e=m.value,t=f.value;e&&t&&(window.location.hash=`/book?domain=${encodeURIComponent(t)}&file=${encodeURIComponent(e)}`)});let D=document.createElement(`div`);D.style.cssText=`border-top:1px solid rgba(255,255,255,0.15);margin:10px 0 8px;flex-shrink:0`,n.appendChild(D);let O=document.createElement(`div`);return O.style.cssText=`flex:1;overflow-y:auto;min-height:0;display:flex;flex-direction:column`,O.innerHTML=`<div style="color:#90b4e8;font-size:11px;padding:4px 0">Open a book to see contents.</div>`,n.appendChild(O),n.tocSection=O,E(),n}function Ge(e,t){let{domain:n,file:r}=t||{};e.innerHTML=``,e._renderKey=Symbol(),e.style.cssText=``,e.className=`cb-book-page`,e.appendChild(S());let i=document.createElement(`div`);i.style.cssText=`display:flex;flex:1;overflow:hidden`,e.appendChild(i);let a=We(n||``,r||``);i.appendChild(a);let o=document.createElement(`div`);if(o.style.cssText=`flex:1;display:flex;overflow:hidden;min-width:0`,i.appendChild(o),!r)return;let s=J(r),c=!1,l=!1,u=!1,d=!1,f=!1,p=60,m=r,h=null,g=null,v=null,y=null,x=null,C={level:s.level,lang:s.lang,model:Y(r)},w=Te.find(e=>e.value&&e.value!==C.model)?.value||C.model,T={level:s.level,lang:s.lang,model:w},E=_()?.role===`admin`,D=[];async function O(e,t,n){D.push({role:`user`,text:e}),n();try{let n=t?`You are a reviewer assistant for Chinese character concept books.\n\nCurrent concept page content:\n${t}\n\nHelp the reviewer understand, critique, and improve the content.`:`You are a reviewer assistant for Chinese character concept books.`,r=await fetch(`/api/chat`,{method:`POST`,headers:{"Content-Type":`application/json`,...b()},body:JSON.stringify({message:e,system:n,history:D.slice(0,-1).map(e=>({role:e.role,text:e.text}))})}),i=await r.json();D.push({role:`assistant`,text:r.ok?i.response:`Error: ${i.detail||r.status}`})}catch(e){D.push({role:`assistant`,text:`Error: ${e.message}`})}}function k(){h&&=(h.close(),null)}function A(){return o.querySelector(`[data-pane-c]`)}function j(){k(),o.innerHTML=``,a.tocSection.innerHTML=`<div style="color:#90b4e8;font-size:11px;padding:4px 0">Loading…</div>`,y=null,x=null,c?N():M()}function M(){let e=document.createElement(`div`);e.style.cssText=`flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0`,o.appendChild(e),e.appendChild(Fe(null,C,(e,t)=>{C[e]=t,s()},()=>{R(),s()}));let t=document.createElement(`iframe`);t.style.cssText=`flex:1;width:100%;border:none;display:block`,e.appendChild(t);let r=!1,i=0;t.addEventListener(`load`,()=>{if(r)return;try{if(t.contentDocument?.querySelector(`#app`)){r=!0,t.removeAttribute(`src`),t.srcdoc=Z(X(m),C.model,C.lang,C.level);return}}catch{}try{let e=t.contentWindow?.location?.href;if(e&&!e.startsWith(`about:`)){let t=decodeURIComponent(e.replace(/.*\/html\//,``));t&&!t.includes(`://`)&&t!==X(m)&&(m=m.replace(/[^/]+\.html$/,t))}}catch{}Ne(t);let e=X(m),n=je(t);if(Ee(e)&&n&&(g={file:e,items:n}),v){try{t.contentDocument?.querySelector(v)?.scrollIntoView()}catch{}v=null}Re(a.tocSection,t,{compareChecked:!1,compareBtnEnabled:!1,skipCacheChecked:!1,onCompareToggle:e=>{c=e,j()},onSkipCacheToggle:()=>{},onCompareActivate:()=>{},isAdmin:E,chatHistory:D,onChatSend:O,tocItems:g&&e!==g.file?g.items.map(t=>({...t,isTarget:t.href===e})):n,onConceptClick:e=>{if(e){if(e.startsWith(`#`)){if(g&&X(m)!==g.file){m=m.replace(/[^/]+\.html$/,g.file),v=e,s();return}try{t.contentDocument?.querySelector(e)?.scrollIntoView({behavior:`smooth`})}catch{}return}m=m.replace(/[^/]+\.html$/,e),s()}}})});function s(){let e=++i;Ae(n,m,C.level,C.lang,C.model).then(n=>{e===i&&(r=!n,n?t.src=n:(t.removeAttribute(`src`),t.srcdoc=Z(X(m),C.model,C.lang,C.level)))})}s()}function N(){let e=document.createElement(`div`);e.style.cssText=`flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0`,o.appendChild(e);let t=document.createElement(`div`);t.style.cssText=`display:flex;flex-shrink:0`,e.appendChild(t);let r=Fe(`Pane A`,C,(e,t)=>{C[e]=t,P()},()=>{R(),P()});r.style.flex=`1`,t.appendChild(r);let i=document.createElement(`div`);i.style.cssText=`width:2px;background:#e0e3e8;flex-shrink:0`,t.appendChild(i);let s=Fe(`Pane B`,T,(e,t)=>{T[e]=t,I()},()=>{R(),I()});s.style.flex=`1`,t.appendChild(s);let _=document.createElement(`div`);_.style.cssText=`flex:1;display:flex;flex-direction:column;overflow:hidden`,e.appendChild(_),y=_;let b=document.createElement(`div`);b.style.cssText=`flex:0 0 ${l?p+`%`:`100%`};display:flex;overflow:hidden;min-height:0`,_.appendChild(b),x=b;let S=document.createElement(`iframe`);S.style.cssText=`flex:1;border:none;display:block;min-width:0`,b.appendChild(S),b.appendChild((()=>{let e=document.createElement(`div`);return e.style.cssText=`width:2px;background:#e0e3e8;flex-shrink:0`,e})());let w=document.createElement(`iframe`);if(w.style.cssText=`flex:1;border:none;display:block;min-width:0`,b.appendChild(w),l){let e=Ie(()=>y,e=>{p=e,x&&(x.style.flex=`0 0 ${e}%`)}),t=document.createElement(`div`);t.style.cssText=`flex-shrink:0;background:#1e3a5f;color:#90b4e8;padding:4px 16px;font-size:0.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px`,t.innerHTML=`<span>PANE C — AI Comparison</span>`,_.appendChild(e),_.appendChild(t),_.appendChild(Be())}function M(){let e=X(m);Re(a.tocSection,S,{compareChecked:!0,compareBtnEnabled:u&&d,skipCacheChecked:f,isAdmin:E,chatHistory:D,onChatSend:O,tocItems:g&&e!==g.file?g.items.map(t=>({...t,isTarget:t.href===e})):null,onCompareToggle:e=>{c=e,j()},onSkipCacheToggle:e=>{f=e},onCompareActivate:()=>{l||(l=!0,j());let e=A();e&&(k(),h=Ve(n,m,C,T,e,f))},onConceptClick:e=>{if(e){if(e.startsWith(`#`)){if(g&&X(m)!==g.file){m=m.replace(/[^/]+\.html$/,g.file),v=e,P(),I();return}try{S.contentDocument?.querySelector(e)?.scrollIntoView({behavior:`smooth`})}catch{}return}m=m.replace(/[^/]+\.html$/,e),P(),I()}}})}S.addEventListener(`load`,()=>{try{if(S.contentDocument?.querySelector(`#app`)){u=!1,S.removeAttribute(`src`),S.srcdoc=Z(X(m),C.model,C.lang,C.level),M();return}}catch{}try{let e=S.contentWindow?.location?.href;if(e&&!e.startsWith(`about:`)){let t=decodeURIComponent(e.replace(/.*\/html\//,``));t&&!t.includes(`://`)&&t!==X(m)&&(m=m.replace(/[^/]+\.html$/,t))}}catch{}Ne(S);let e=je(S);if(Ee(X(m))&&e&&(g={file:X(m),items:e}),v){try{S.contentDocument?.querySelector(v)?.scrollIntoView()}catch{}v=null}M()}),w.addEventListener(`load`,()=>{try{if(w.contentDocument?.querySelector(`#app`)){d=!1,w.removeAttribute(`src`),w.srcdoc=Z(X(m),T.model,T.lang,T.level),M();return}}catch{}Ne(w)});let N=0;function P(){let e=++N;Me(S,n,m,C,e=>{u=e,M()},()=>e!==N)}let F=0;function I(){let e=++F;Me(w,n,m,T,e=>{d=e,M()},()=>e!==F)}P(),I()}j()}function Ke(e,t={}){e.innerHTML=``;let n=document.createElement(`div`);n.style.cssText=`display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb`;let r=document.createElement(`div`);r.style.cssText=[`background:#fff`,`border:1px solid #e5e7eb`,`border-radius:8px`,`padding:40px`,`width:340px`,`box-shadow:0 2px 8px rgba(0,0,0,.08)`].join(`;`),r.innerHTML=`
    <h1 style="margin:0 0 6px;display:flex;align-items:center;gap:8px;font-size:1.3rem;font-weight:700;color:#111;font-family:system-ui,sans-serif">
      <img src="/cb-zinets/brand/seal-zi-logo.png" alt="" style="height:28px;width:auto;display:block">ConceptBook
    </h1>
    <p style="margin:0 0 28px;font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif">Sign in to continue</p>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Username</label>
      <input id="cb-login-user" type="text" autocomplete="username"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <div style="margin-bottom:24px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Password</label>
      <input id="cb-login-pass" type="password" autocomplete="current-password"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <button id="cb-login-btn" class="cb-btn" style="width:100%;padding:10px;font-size:1rem">Sign in</button>
    <div id="cb-login-google-wrap" style="display:none">
      <div style="display:flex;align-items:center;gap:10px;margin:18px 0;color:#9ca3af;font-size:.8rem;font-family:system-ui,sans-serif">
        <span style="flex:1;height:1px;background:#e5e7eb"></span>or<span style="flex:1;height:1px;background:#e5e7eb"></span>
      </div>
      <button id="cb-login-google" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;font-size:.95rem;font-family:system-ui,sans-serif;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:6px;cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
    </div>
    <div id="cb-login-err" style="margin-top:12px;font-size:.875rem;color:#dc2626;text-align:center;min-height:20px;font-family:system-ui,sans-serif"></div>
  `,n.appendChild(r),e.appendChild(n);let i=r.querySelector(`#cb-login-user`),a=r.querySelector(`#cb-login-pass`),o=r.querySelector(`#cb-login-btn`),s=r.querySelector(`#cb-login-err`),c=r.querySelector(`#cb-login-google-wrap`),l=r.querySelector(`#cb-login-google`);i.focus(),t.error&&(s.textContent=decodeURIComponent(t.error)),fetch(`/api/auth/providers`).then(e=>e.ok?e.json():null).then(e=>{e?.google&&(c.style.display=``)}).catch(()=>{}),l.addEventListener(`click`,()=>{window.location.href=`/api/auth/google/login`});async function u(){s.textContent=``,o.disabled=!0,o.textContent=`Signing in…`;try{let e=await fetch(`/api/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:i.value.trim(),password:a.value})});if(e.ok){let t=await e.json();h(t.token),v(t.user),window.location.hash=`/`}else{let t=await e.json().catch(()=>({}));s.textContent=t.detail||`Login failed`}}catch{s.textContent=`Cannot connect to server`}finally{o.disabled=!1,o.textContent=`Sign in`}}o.addEventListener(`click`,u),a.addEventListener(`keydown`,e=>{e.key===`Enter`&&u()}),i.addEventListener(`keydown`,e=>{e.key===`Enter`&&a.focus()})}var Q=document.getElementById(`app`);async function $(e){e()}t(`/`,()=>$(()=>F(Q))),t(`/graph`,()=>$(()=>ye(Q,{}))),t(`/about`,()=>$(()=>be(Q))),t(`/resources`,()=>$(()=>Ce(Q))),t(`/settings`,()=>$(()=>ve(Q))),t(`/domain/:id`,e=>$(()=>ye(Q,e))),t(`/book`,e=>$(()=>Ge(Q,e))),t(`/login`,e=>Ke(Q,e)),t(`/auth/callback`,async e=>{e.token?(h(e.token),await x(),n(`/`)):n(`/login`)}),i();