(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();const Q={};function W(e,t){Q[e]=t}function le(e){window.location.hash=e}function Ie(){var a,s;const e=window.location.hash.slice(1)||"/",t=e.match(/^\/domain\/([^?]+)/);if(t){(a=Q["/domain/:id"])==null||a.call(Q,{id:decodeURIComponent(t[1])});return}const[n,o]=e.split("?");(s=Q[n])==null||s.call(Q,Object.fromEntries(new URLSearchParams(o||"")))}function rt(){window.addEventListener("hashchange",Ie),Ie()}const Ae={en:{"app.title":"字 ConceptBook","app.tagline":"Learn Chinese characters the LEGO way","nav.about":"About","nav.settings":"Settings","home.subtitle":"Explore the Chinese character graph","home.filter.all":"All","home.filter.level":"Level","card.nodes":"nodes","card.edges":"edges","card.explore":"Explore Concept-Graph","card.read":"Read book","domain.back":"← Back","domain.openFullscreen":"Open fullscreen","about.title":"About 字 ConceptBook",loading:"Loading…"}};let Te=localStorage.getItem("cb-lang")||"en";function Pe(e){return(Ae[Te]||Ae.en)[e]??e}function dt(e){Te=e,localStorage.setItem("cb-lang",e)}function We(){return Te}const Je=[{code:"en",label:"English *"},{code:"zh",label:"中文 (Chinese)"},{code:"es",label:"Español (Spanish)"},{code:"fr",label:"Français (French)"},{code:"de",label:"Deutsch (German)"},{code:"pt",label:"Português (Portuguese)"},{code:"ar",label:"العربية (Arabic)"},{code:"hi",label:"हिन्दी (Hindi)"},{code:"ja",label:"日本語 (Japanese)"},{code:"ko",label:"한국어 (Korean)"}];function pt(){const e=document.createElement("select");e.className="cb-lang-picker",e.title="Content language";const t=We();return Je.forEach(({code:n,label:o})=>{const a=document.createElement("option");a.value=n,a.textContent=o,n===t&&(a.selected=!0),e.appendChild(a)}),e.addEventListener("change",()=>dt(e.value)),e}const Ne="cb_token",qe="cb_user";function Me(){return localStorage.getItem(Ne)}function Ve(e){localStorage.setItem(Ne,e)}function Ye(){localStorage.removeItem(Ne)}function Ze(){try{return JSON.parse(localStorage.getItem(qe)||"null")}catch{return null}}function Qe(e){localStorage.setItem(qe,JSON.stringify(e))}function Xe(){localStorage.removeItem(qe)}function ut(){const e=Me();return e?{"X-CB-Token":e}:{}}async function mt(){const e=Me();if(!e)return null;try{const t=await fetch("/api/auth/me",{headers:{"X-CB-Token":e}});if(t.ok){const n=await t.json();return Qe(n),n}return Ye(),Xe(),null}catch{return null}}function ne({domainName:e=""}={}){const t=document.createElement("header");t.className="cb-header";const n=document.createElement("div");n.className="cb-header__top";const o=document.createElement("a");o.className="cb-header__logo",o.href="#/";const a=document.createElement("img");if(a.className="cb-header__logo-mark",a.src="/cb-zinets/brand/seal-zi-logo.png",a.alt="",o.appendChild(a),o.appendChild(document.createTextNode(Pe("app.title").replace(/^字\s*/,""))),n.appendChild(o),e){const r=document.createElement("span");r.className="cb-header__sep",r.textContent="›",n.appendChild(r);const b=document.createElement("span");b.className="cb-header__domain",b.textContent=e,n.appendChild(b)}const s=document.createElement("span");s.className="cb-header__spacer",n.appendChild(s);const l=document.createElement("nav");l.className="cb-header__nav",l.innerHTML=`<a href="#/graph">Graph</a> <a href="#/book">Content</a> <a href="#/resources">Resources</a> <a href="#/settings">${Pe("nav.settings")}</a> <a href="#/about">About</a>`,n.appendChild(l),n.appendChild(pt());const m=Ze();if(m){const r=document.createElement("span");r.className="cb-header__user",r.textContent=`${m.username} (${m.role})`,n.appendChild(r);const b=document.createElement("button");b.className="cb-btn",b.style.cssText="padding:4px 10px;font-size:.8rem;margin-left:8px",b.textContent="Logout",b.addEventListener("click",async()=>{const x=Me();if(x)try{await fetch("/api/auth/logout",{method:"POST",headers:{"X-CB-Token":x}})}catch{}Ye(),Xe(),window.location.hash="/login"}),n.appendChild(b)}return t.appendChild(n),t}let ie=null;const He=new Map;function he(e,t,n,o){if(e.includes(o))return!0;const a=o.toLowerCase();return!!(t&&t.includes(a)||n&&n.includes(a))}async function be(){try{const e=await fetch("/cb-zinets/domains/catalog.json",{cache:"no-cache"});if(!e.ok)throw new Error(`Failed to load catalog: ${e.status}`);return ie=await e.json(),ie}catch(e){if(ie)return ie;throw e}}async function ht(e){try{const t=await fetch(`/cb-zinets/domains/catalog/${encodeURIComponent(e)}.json`,{cache:"no-cache"});if(!t.ok)throw new Error;const n=await t.json();return He.set(e,n),n}catch{return He.get(e)??null}}function bt(e){return e.name.startsWith("phrase_")}function et(e){return[...e].length===1}function ft(e){const t=new Map;for(const n of e){const o=new Set;for(const a of n.generated_concepts||[]){if(bt(a)||!et(a.name)||o.has(a.name))continue;o.add(a.name);let s=t.get(a.name);s||(s={char:a.name,count:0,domain:n.id,file:a.file,pinyin:a.pinyin},t.set(a.name,s)),s.count+=1}}return[...t.values()].sort((n,o)=>o.count-n.count||n.char.localeCompare(o.char,"zh"))}async function gt(e){try{const t=await fetch("/api/browse/concepts");if(!t.ok)throw new Error;const{concepts:n}=await t.json();return n.filter(o=>!e.has(o.char)).map(o=>({char:o.char,count:0,domain:"",file:o.file,pinyin:null}))}catch{return[]}}function yt(e){return e>=5?"cb-concept-tile--hot":e>=2?"cb-concept-tile--warm":""}function Re(e,t,n){const o=n.trim(),a=o?t.filter(s=>he(s.name,s.pinyin,s.pinyin_initials,o)):t;e.innerHTML=a.length?"":'<div class="cb-home-empty">No phrases match.</div>',a.forEach(s=>{const l=document.createElement("a");l.className="cb-home-link",l.href="#",l.textContent=s.name,l.addEventListener("click",m=>{m.preventDefault(),le(`/domain/${encodeURIComponent(s.id)}`)}),e.appendChild(l)})}function Oe(e,t,n){const o=n.trim(),a=o?t.filter(s=>he(s.char,s.pinyin,null,o)):t;e.innerHTML=a.length?"":'<div class="cb-home-empty">No concepts match.</div>',a.forEach(s=>{const l=document.createElement("button");l.className=`cb-concept-tile ${yt(s.count)}`.trim(),l.title=s.count===0?`${s.char} — standalone concept (no phrase yet)`:`${s.char} — appears in ${s.count} phrase${s.count===1?"":"s"}`;const m=s.count===0?"":`<span class="cb-concept-tile__badge">${s.count}</span>`;l.innerHTML=`<span class="cb-concept-tile__char">${s.char}</span>${m}`,l.addEventListener("click",()=>le(`/book?domain=${encodeURIComponent(s.domain)}&file=${encodeURIComponent(s.file)}`)),e.appendChild(l)})}function vt(e){e.innerHTML="",e._renderKey=Symbol();const t=e._renderKey;e.appendChild(ne());const n=document.createElement("main");n.className="cb-home cb-phrase-home",n.innerHTML=`
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
  `,e.appendChild(n);const o=document.createElement("footer");o.className="cb-home-footer",o.innerHTML='<p class="cb-welcome__license">Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a> · Open source · <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache 2.0</a></p>',e.appendChild(o);const a=n.querySelector("#cb-phrase-input"),s=n.querySelector("#cb-phrase-btn"),l=n.querySelector("#cb-phrase-error"),m=n.querySelector("#cb-phrase-list"),r=n.querySelector("#cb-concept-grid"),b=n.querySelector("#cb-home-search"),x=n.querySelector("#cb-phrase-count"),u=n.querySelector("#cb-concept-count");be().then(async v=>{if(e._renderKey!==t)return;const i=v.filter(g=>!et(g.name||g.id)).map(g=>({id:g.id,name:g.name||g.id,pinyin:g.pinyin,pinyin_initials:g.pinyin_initials})).sort((g,y)=>g.name.localeCompare(y.name,"zh")),h=ft(v),c=await gt(new Set(h.map(g=>g.char)));e._renderKey===t&&(h.push(...c.sort((g,y)=>g.char.localeCompare(y.char,"zh"))),x.textContent=`(${i.length})`,u.textContent=`(${h.length})`,Re(m,i,""),Oe(r,h,""),b.addEventListener("input",()=>{Re(m,i,b.value),Oe(r,h,b.value)}))}).catch(()=>{e._renderKey===t&&(m.innerHTML='<div class="cb-home-empty">Failed to load phrases.</div>',r.innerHTML='<div class="cb-home-empty">Failed to load concepts.</div>')});async function f(){const v=a.value.trim()||b.value.trim();if(v){s.disabled=!0,s.textContent="生成中…",l.style.display="none";try{const i=await fetch("/api/phrase/graph",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phrase:v})});if(!i.ok){const c=await i.text();throw new Error(c)}const{domain_id:h}=await i.json();le(`/domain/${encodeURIComponent(h)}`)}catch(i){l.textContent=`错误：${i.message}`,l.style.display="block",s.disabled=!1,s.textContent="构建图"}}}s.addEventListener("click",f),a.addEventListener("keydown",v=>{v.key==="Enter"&&f()})}const xt=/output\/([^/.]+)\.([^/]+)\/([^/]+)\/html\/(book|concept|phrase)_([^/]+)\.html$/;function fe(e,t,n){return`output/${e}.${t}/${n}/html`}function _t(e,t,n,o){const a=o.startsWith("phrase_")?o:`book_${o}`;return`${fe(e,t,n)}/${a}.html`}function kt(e,t,n,o){return`concepts/${e}.${t}/${n}/concept_${o}.html`}function tt(e){const t=e.match(xt);return t?{level:t[1],language:t[2],model:t[3],kind:t[4],name:decodeURIComponent(t[5])}:null}function Ct(e,t,n,o){return o&&/output\/[^/]+\/[^/]+\/html\//.test(e)?e.replace(/output\/[^/]+\/[^/]+\/html\//,`${fe(t,n,o)}/`):e.replace(/output\/[^/]+\/html\//,`output/${t}.${n}/html/`)}const X=new Map;function nt(e){e.forEach(t=>X.set(t,!0))}function ye(){X.clear()}async function Ee(e){if(X.has(e))return X.get(e);try{const t=await fetch(e);if(!t.ok)return X.set(e,!1),!1;const n=await t.text(),o=n.includes("spl-credit")||n.includes("Generated by");return X.set(e,o),o}catch{return X.set(e,!1),!1}}const wt=[{code:"en",label:"English"},{code:"zh",label:"中文"},{code:"es",label:"Español"},{code:"fr",label:"Français"},{code:"de",label:"Deutsch"},{code:"ja",label:"日本語"},{code:"ko",label:"한국어"},{code:"pt",label:"Português"},{code:"ar",label:"العربية"},{code:"hi",label:"हिन्दी"}],Et=["intro","core","college","research"];function St(e,{level:t="intro",lang:n="en"}={}){const{id:o,books:a=[],generated_concepts:s=[],capstone:l}=e;nt(a.filter(x=>x.file).map(x=>`/cb-zinets/domains/${o}/${x.file}`));const m=document.createElement("div");m.className="cb-graph-viewer";const r=document.createElement("iframe");r.className="cb-graph-viewer__frame";const b=localStorage.getItem("cb_graph_layout")||"compact";return r.src=`/cb-zinets/domains/${o}/output/graph.html?layout=${b}`,r.title=`${o} concept graph`,r.setAttribute("allowfullscreen",""),r.addEventListener("load",()=>{var x;try{const u=r.contentWindow;if(!u)return;u.eval("window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex");const f=(_,C,T)=>`/cb-zinets/domains/${o}/${fe(_,C,T||"gemma4")}/`;u.__cb_CONCEPTS_BASE=f(t,n,"gemma4");const v=(((x=u.__cb_RAW)==null?void 0:x.nodes)||[]).map(_=>({id:_.id,label:_.label,kind:_.kind,tier:_.tier??0}));window.dispatchEvent(new CustomEvent("cb:graphLoaded",{detail:{concepts:v}}));const i=u.handleSelect;u.handleSelect=function(_){var T;i.call(u,_);const C=(T=u.__cb_nodeIndex)==null?void 0:T[_];C&&window.dispatchEvent(new CustomEvent("cb:nodeSelected",{detail:{nodeId:_,node:C}}))},Lt(u,r.contentDocument),$t(u,r.contentDocument,o,a,s,t,n),Tt(u,r.contentDocument,o,l,t,n,a);const h=r.contentDocument,c=["#cb-model-sel","#cb-level-sel","#cb-lang-sel"].map(_=>h.querySelector(_)),g=()=>{const[_,C,T]=c.map(N=>N&&N.value);u.__cb_CONCEPTS_BASE=f(C||t,T||n,_)};c.forEach(_=>_&&_.addEventListener("change",g)),g();const y=_=>{try{const C=_.contentDocument;if(!C||!C.head||C.getElementById("cb-detail-clean"))return;const T=C.createElement("style");T.id="cb-detail-clean",T.textContent="nav.toc{display:none!important}.page{grid-template-columns:1fr!important}main{padding:20px 24px!important;max-width:none!important}",C.head.appendChild(T)}catch{}};new u.MutationObserver(()=>{const _=h.getElementById("concept-iframe");_&&!_._cbCleaned&&(_._cbCleaned=!0,_.addEventListener("load",()=>y(_)),y(_))}).observe(h.body,{childList:!0,subtree:!0}),b==="hierarchical"&&u.network&&u.eval(`
          network.setOptions({ layout: { hierarchical: {
            enabled: true, direction: 'UD', sortMethod: 'directed',
            levelSeparation: 120, nodeSpacing: 180
          }}});
          network.fit({ animation: false });
        `)}catch{}}),m.appendChild(r),m.selectNode=x=>{var u,f;try{(f=(u=r.contentWindow)==null?void 0:u.selectNode)==null||f.call(u,x)}catch{}},m}function Lt(e,t){if(t.querySelector("#cb-sidebar-theme"))return;const n=t.createElement("style");n.id="cb-sidebar-theme",n.textContent=`
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
  `,t.head.appendChild(n);const o=t.querySelector("#path-steps");if(o&&!t.querySelector("#cb-node-legend")){const s=t.createElement("div");s.id="cb-node-legend",s.style.cssText="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0",s.innerHTML=`
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
    `,o.insertAdjacentElement("beforebegin",s)}const a=t.querySelector("#path-sidebar");if(a&&!t.querySelector("#cb-spl-credit")){const s=t.createElement("div");s.id="cb-spl-credit",s.style.cssText="padding:10px 12px;border-top:1px solid rgba(255,255,255,0.1);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif;flex-shrink:0",s.innerHTML='Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>',a.appendChild(s)}}const Be=["flex:1","min-width:0","padding:5px 6px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","font-family:system-ui,sans-serif","box-sizing:border-box"].join(";"),Se=["flex-shrink:0","padding:5px 10px","background:#2563eb","color:#fff","border:none","border-radius:5px","font-size:12px","cursor:pointer","font-family:system-ui,sans-serif"].join(";"),re=Se+";opacity:.4;cursor:default",je="display:flex;gap:6px;align-items:center;margin-bottom:10px",De=["font-size:10px","letter-spacing:.06em","text-transform:uppercase","color:#90b4e8","font-weight:700","margin-bottom:4px"].join(";"),ot="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f",at="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px",de=Ct;function Ue(e,t,n){const o=new Map;for(const a of e){const s=t(a),l=o.get(s);(!l||a.model===n&&l.model!==n)&&o.set(s,a)}return[...o.values()]}function $t(e,t,n,o,a,s,l){const m=t.querySelector("#path-header");if(!m||t.querySelector("#cb-read"))return;const r=Ue(o,c=>c.target,"gemma4").sort((c,g)=>c.target.localeCompare(g.target)),b=Ue(a,c=>c.name,"gemma4").sort((c,g)=>c.label.localeCompare(g.label)),x="margin-top:4px;font-size:11px;color:#fca5a5;display:none",u=r.length>0?`
    <div style="${De}">TOC Index</div>
    <div style="${je}">
      <select id="cb-book-sel" style="${Be}">
        <option value="">Select book…</option>
        ${r.map(c=>{const g=c.target.replace(/_/g," ");return`<option value="${de(c.file,s,l,c.model||"")}" data-orig="${c.file}" data-model="${c.model||""}">${g}</option>`}).join("")}
      </select>
      <button id="cb-book-btn" disabled style="${re}">Open</button>
    </div>
    <div id="cb-book-warn" style="${x}"></div>
  `:"",f=b.length>0?`
    <div style="${De}">Concept</div>
    <div style="${je}">
      <select id="cb-cpt-sel" style="${Be}">
        <option value="">Select concept…</option>
        ${b.map(c=>`<option value="${de(c.file,s,l,c.model||"")}" data-orig="${c.file}" data-model="${c.model||""}">${c.label}</option>`).join("")}
      </select>
      <button id="cb-cpt-btn" disabled style="${re}">Open</button>
    </div>
    <div id="cb-cpt-warn" style="${x}"></div>
  `:"",v=t.createElement("div");v.id="cb-read",v.style.cssText=ot,v.innerHTML=`
    <div style="${at}">Concept Books</div>
    ${u}
    ${f}
  `,m.insertAdjacentElement("afterend",v);function i(c,g){c.textContent=g,c.style.display="block"}function h(c,g){const y=`/cb-zinets/domains/${n}/${c}`;Ee(y).then(_=>{_?window.location.hash=`/book?domain=${n}&file=${encodeURIComponent(c)}`:i(g,"No content available for this level/language combination.")})}if(t.addEventListener("cb:settings-change",({detail:{level:c,lang:g}})=>{v.querySelectorAll("#cb-book-sel option[data-orig]").forEach(y=>{y.value=de(y.dataset.orig,c,g,y.dataset.model)}),v.querySelectorAll("#cb-cpt-sel option[data-orig]").forEach(y=>{y.value=de(y.dataset.orig,c,g,y.dataset.model)}),t.querySelector("#cb-book-warn")&&(t.querySelector("#cb-book-warn").style.display="none"),t.querySelector("#cb-cpt-warn")&&(t.querySelector("#cb-cpt-warn").style.display="none")}),r.length>0){const c=v.querySelector("#cb-book-sel"),g=v.querySelector("#cb-book-btn"),y=v.querySelector("#cb-book-warn");c.addEventListener("change",()=>{g.disabled=!c.value,g.style.cssText=c.value?Se:re,y.style.display="none"}),g.addEventListener("click",()=>{c.value&&h(c.value,y)})}if(b.length>0){const c=v.querySelector("#cb-cpt-sel"),g=v.querySelector("#cb-cpt-btn"),y=v.querySelector("#cb-cpt-warn");c.addEventListener("change",()=>{g.disabled=!c.value,g.style.cssText=c.value?Se:re,y.style.display="none"}),g.addEventListener("click",()=>{c.value&&h(c.value,y)})}}function Tt(e,t,n,o,a,s,l=[]){var N;const m=t.querySelector("#path-header");if(!m||t.querySelector("#cb-gen"))return;const r=["width:100%","padding:5px 8px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","margin-bottom:6px","font-family:system-ui,sans-serif"].join(";"),b=t.createElement("div");b.id="cb-gen",b.style.cssText=ot,b.innerHTML=`
    <div style="${at}">Generate Book</div>
    <select id="cb-target-sel" style="${r}">
      <option value="">Select target concept…</option>
    </select>
    <select id="cb-model-sel" style="${r}">
      <option value="gemma3">gemma3 — local (Ollama)</option>
      <option value="gemma4" selected>gemma4 — local, default (Ollama)</option>
      <option value="sonnet">sonnet — premium (Claude API)</option>
    </select>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <select id="cb-level-sel" style="display:none">
        ${Et.map(E=>`<option value="${E}" ${E===a?"selected":""}>${E.charAt(0).toUpperCase()+E.slice(1)}</option>`).join("")}
      </select>
      <select id="cb-lang-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${wt.map(E=>`<option value="${E.code}" ${E.code===s?"selected":""}>${E.label}</option>`).join("")}
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
  `,m.insertAdjacentElement("afterend",b);const x=b.querySelector("#cb-target-sel"),u=b.querySelector("#cb-model-sel"),f=b.querySelector("#cb-level-sel"),v=b.querySelector("#cb-lang-sel"),i=b.querySelector("#cb-skip-cache"),h=b.querySelector("#cb-gen-btn"),c=b.querySelector("#cb-pdf-btn"),g=b.querySelector("#cb-pdf-result"),y=b.querySelector("#cb-gen-log"),_=b.querySelector("#cb-gen-copy");function C(){t.dispatchEvent(new CustomEvent("cb:settings-change",{detail:{level:f.value,lang:v.value}}))}f.addEventListener("change",C),v.addEventListener("change",C),_.addEventListener("click",()=>{navigator.clipboard.writeText(y.textContent).then(()=>{_.textContent="Copied!",setTimeout(()=>{_.textContent="Copy"},1500)})}),(((N=e.__cb_RAW)==null?void 0:N.nodes)||[]).filter(E=>E.kind!=="primitive").sort((E,q)=>E.label.localeCompare(q.label)).forEach(E=>{const q=t.createElement("option");q.value=E.id,q.textContent=E.label,E.id===o&&(q.selected=!0),x.appendChild(q)}),x.value&&(h.disabled=!1,c.disabled=!1),x.addEventListener("change",()=>{h.disabled=!x.value,c.disabled=!x.value,c.textContent="PDF",c.style.background="#16a34a",g.style.display="none",g.innerHTML=""}),c.addEventListener("click",async()=>{const E=x.value;if(!E)return;const q=f.value,A=v.value,F=u.value;c.disabled=!0,c.textContent="Generating…",c.style.background="#ea580c";try{const U=`/api/pdf?domain=${encodeURIComponent(n)}&target=${encodeURIComponent(E)}&level=${encodeURIComponent(q)}&language=${encodeURIComponent(A)}&model=${encodeURIComponent(F)}`,$=await fetch(U),L=await $.json();if(!$.ok)throw new Error(L.detail||"PDF generation failed");const p=`/cb-zinets/domains/${n}/${L.file}`;c.textContent="PDF ✓",c.disabled=!1,g.innerHTML=`
        <a href="${p}" download
           style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ⬇ Download
        </a>
        <a href="${p}" target="_blank"
           style="flex:1;padding:6px 10px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ↗ Open
        </a>
      `,g.style.display="flex"}catch(U){c.textContent="Error",c.style.background="#dc2626",c.title=U.message,setTimeout(()=>{c.textContent="PDF",c.style.background="#16a34a",c.disabled=!1},3e3)}}),h.addEventListener("click",async()=>{const E=x.value;if(!E)return;const q=u.value,A=f.value,F=v.value,U=i.checked;h.disabled=!0,h.textContent="Queuing…",h.style.background="#ea580c",y.style.display="block",_.style.display="block",y.textContent="";let $;try{const d=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domain:n,target:E,level:A,language:F,model:q,skip_cache:U})});if(!d.ok)throw new Error(`Queue failed: ${d.status}`);$=(await d.json()).task_id,h.textContent="Generating…"}catch(d){y.textContent=`✗ ${d.message}
  Run: bash scripts/start-api.sh`,h.disabled=!1,h.textContent="Retry",h.style.background="#dc2626";return}const L=new e.EventSource(`/api/tasks/${$}/stream`);L.addEventListener("log",d=>{const{message:p}=JSON.parse(d.data);y.textContent+=p+`
`,y.scrollTop=y.scrollHeight}),L.addEventListener("done",d=>{L.close();const p=JSON.parse(d.data),k=f.value,S=v.value,w=p.model||u.value;y.textContent+=`
✓ Done`,h.textContent="Generate",h.style.background="#2563eb",h.disabled=!1;const I=e.document.createElement("div");if(I.style.cssText="display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap",p.log_url){const P=e.document.createElement("a");P.href=p.log_url,P.target="_blank",P.textContent="View log",P.style.cssText="font-size:11px;color:#93c5fd;text-decoration:underline;cursor:pointer;font-family:system-ui,sans-serif;white-space:nowrap",I.appendChild(P)}const B=e.document.createElement("button");B.textContent="Open Book →",B.style.cssText="flex:1;padding:5px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif",B.onclick=()=>{const P=_t(k,S,w,p.target);e.parent.location.hash=`#/book?domain=${p.domain}&file=${encodeURIComponent(P)}`},I.appendChild(B),b.appendChild(I)}),L.addEventListener("gen_error",d=>{L.close(),y.textContent+=`
✗ ${JSON.parse(d.data).message}`,h.disabled=!1,h.textContent="Retry",h.style.background="#dc2626"}),L.onerror=()=>{L.readyState!==e.EventSource.CLOSED&&(L.close(),y.textContent+=`
✗ Connection lost`,h.disabled=!1,h.textContent="Retry",h.style.background="#dc2626")}})}function Nt(){return We()}const ve=[{id:"anthropic",label:"Anthropic"},{id:"gemini",label:"Gemini"},{id:"openai",label:"OpenAI"},{id:"qwen",label:"Qwen"},{id:"z",label:"Z (Zhipu)"},{id:"openrouter",label:"OpenRouter.ai"}],ue={claude_cli:{label:"Claude CLI",models:[{value:"claude-sonnet-4-6",label:"Sonnet 4.6"},{value:"claude-haiku-4-5-20251001",label:"Haiku 4.5"},{value:"claude-opus-4-8",label:"Opus 4.8"}]},openrouter:{label:"OpenRouter",models:[{value:"anthropic/claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{value:"anthropic/claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"anthropic/claude-opus-4-8",label:"Claude Opus 4.8"},{value:"google/gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"google/gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"google/gemini-3.5-flash",label:"Gemini 3.5 Flash"},{value:"openai/gpt-4.1",label:"GPT-4.1"},{value:"openai/gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"openai/o3-mini",label:"o3-mini"},{value:"deepseek/deepseek-r1",label:"DeepSeek R1"},{value:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick"},{value:"z-ai/glm-5.2",label:"GLM 5.2"},{value:"qwen/qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen/qwen3.6-35b-a3b",label:"Qwen 3.6 35B"},{value:"nvidia/nemotron-3-ultra-550b-a55b:free",label:"Nemotron 3 Ultra 550B"},{value:"moonshotai/kimi-k2.6",label:"Kimi 2.6"}]},ollama:{label:"Ollama (local)",models:null}};async function xe(e,t){const n=ue[e.value];if(t.innerHTML="",!n)return;let o=n.models;if(e.value==="ollama"&&!o){try{const a=await fetch("/api/settings/ollama-models");a.ok&&(o=await a.json())}catch{}if(!o||o.length===0){const a=document.createElement("option");a.value="",a.textContent="(ollama not available)",t.appendChild(a);return}ue.ollama.models=o}for(const a of o){const s=document.createElement("option");s.value=a.value,s.textContent=a.label,t.appendChild(s)}}function _e(e){if(e===0)return"never expires";if(e<1)return`${Math.round(e*60)} min`;if(e===1)return"1 hour";if(e<24)return`${e} hours`;const t=e/24;return Number.isInteger(t)?`${t} day${t>1?"s":""}`:`${e} hours`}async function qt(e){e.innerHTML="",e._renderKey=Symbol(),e.appendChild(ne());const t=document.createElement("main");t.className="cb-settings",t.innerHTML=`
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
              ${Object.entries(ue).map(([d,p])=>`<option value="${d}">${p.label}</option>`).join("")}
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
  `,e.appendChild(t);const n=t.querySelectorAll(".cb-settings__tab"),o=t.querySelectorAll("[data-tab-panel]");n.forEach(d=>{d.addEventListener("click",()=>{n.forEach(p=>p.classList.toggle("cb-settings__tab--active",p===d)),o.forEach(p=>{p.style.display=p.dataset.tabPanel===d.dataset.tab?"":"none"})})});const a=t.querySelector("#cb-adapter"),s=t.querySelector("#cb-model"),l=t.querySelector("#cb-settings-save"),m=t.querySelector("#cb-settings-status"),r=t.querySelector("#cb-current-llm");a.addEventListener("change",()=>xe(a,s)),await xe(a,s);const b=t.querySelector("#cb-while-max-iter"),x=t.querySelector("#cb-max-llm-calls"),u=t.querySelector("#cb-max-tokens"),f=t.querySelector("#cb-max-concurrent"),v=t.querySelector("#cb-spl-limits-save"),i=t.querySelector("#cb-spl-limits-status"),h=t.querySelector("#cb-graph-layout"),c=t.querySelector("#cb-graph-layout-save"),g=t.querySelector("#cb-graph-layout-status");h.value=localStorage.getItem("cb_graph_layout")||"compact",c.addEventListener("click",()=>{localStorage.setItem("cb_graph_layout",h.value),g.textContent="Saved — reload the graph page to apply",g.style.color="#16a34a",setTimeout(()=>{g.textContent=""},4e3)});const y=t.querySelector("#cb-cache-ttl"),_=t.querySelector("#cb-cache-ttl-hint"),C=t.querySelector("#cb-cache-save"),T=t.querySelector("#cb-cache-status");y.addEventListener("input",()=>{const d=Number(y.value);_.textContent=isNaN(d)||d<0?"":_e(d)});const N=t.querySelector("#cb-concept-cache-enabled"),E=t.querySelector("#cb-concept-cache-label"),q=t.querySelector("#cb-concept-cache-save"),A=t.querySelector("#cb-concept-cache-status");function F(){const d=N.checked;E.textContent=d?"Enabled":"Disabled",E.style.color=d?"#16a34a":"var(--color-muted)"}N.addEventListener("change",F);const U=t.querySelector("#cb-api-keys-list");U.innerHTML=ve.map(d=>`
    <div class="cb-settings__field" style="margin-bottom:10px">
      <label class="cb-settings__label">${d.label}</label>
      <div class="cb-settings__row">
        <input type="password" class="cb-settings__input" style="flex:1;min-width:200px"
          id="cb-apikey-${d.id}" autocomplete="off" placeholder="Not set">
        <button class="cb-btn" id="cb-apikey-save-${d.id}">Save</button>
        <button class="cb-btn-ghost" id="cb-apikey-clear-${d.id}">Clear</button>
        <span class="cb-settings__status" id="cb-apikey-status-${d.id}"></span>
      </div>
    </div>
  `).join("");try{const d=await fetch("/api/settings/api-keys");if(d.ok){const p=await d.json();for(const k of ve){const S=p[k.id];S!=null&&S.configured&&(t.querySelector(`#cb-apikey-${k.id}`).placeholder=`Configured (${S.masked})`)}}}catch{}for(const d of ve){const p=t.querySelector(`#cb-apikey-${d.id}`),k=t.querySelector(`#cb-apikey-status-${d.id}`);t.querySelector(`#cb-apikey-save-${d.id}`).addEventListener("click",async()=>{const S=p.value.trim();if(!S){k.textContent="Enter a key first",k.style.color="#dc2626",setTimeout(()=>{k.textContent=""},3e3);return}try{const w=await fetch("/api/settings/api-keys",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:d.id,api_key:S})}),I=await w.json();if(!w.ok)throw new Error(I.detail||`HTTP ${w.status}`);p.value="",p.placeholder=`Configured (${I.masked})`,k.textContent="Saved",k.style.color="#16a34a"}catch(w){k.textContent=`Failed: ${w.message}`,k.style.color="#dc2626"}setTimeout(()=>{k.textContent=""},3e3)}),t.querySelector(`#cb-apikey-clear-${d.id}`).addEventListener("click",async()=>{try{const S=await fetch(`/api/settings/api-keys/${d.id}`,{method:"DELETE"});if(!S.ok)throw new Error(`HTTP ${S.status}`);p.value="",p.placeholder="Not set",k.textContent="Cleared",k.style.color="#16a34a"}catch(S){k.textContent=`Failed: ${S.message}`,k.style.color="#dc2626"}setTimeout(()=>{k.textContent=""},3e3)})}const $=t.querySelector("#cb-catalog-sync"),L=t.querySelector("#cb-catalog-sync-status");$.addEventListener("click",async()=>{var d;$.disabled=!0,L.style.color="var(--color-muted)",L.textContent="Syncing…";try{const p=await fetch("/api/catalog/sync",{method:"POST"}),k=await p.json();if(!p.ok||!k.ok)throw new Error(k.detail||`HTTP ${p.status}`);const S=[`${k.scanned} domains scanned`,k.added?`${k.added} added`:null,`${k.refreshed} refreshed`,`${k.books} books`,`${k.concepts} concepts`,k.concepts_without_pinyin?`${k.concepts_without_pinyin} without pinyin`:null,(d=k.default_symlinks)!=null&&d.linked?`${k.default_symlinks.linked} default symlinks created`:null].filter(Boolean);L.style.color="#16a34a",L.textContent=`Synced — ${S.join(", ")}`}catch(p){L.style.color="#dc2626",L.textContent=`Sync failed: ${p.message}`}finally{$.disabled=!1}});try{const d=await fetch("/api/settings");if(d.ok){const p=await d.json();r.textContent=`Current: ${p.llm}`;const[k,...S]=p.llm.split(":"),w=S.join(":");ue[k]&&(a.value=k,await xe(a,s),[...s.options].some(B=>B.value===w)&&(s.value=w)),p.spl_while_max_iter&&(b.value=p.spl_while_max_iter),p.spl_max_llm_calls&&(x.value=p.spl_max_llm_calls),p.spl_max_tokens&&(u.value=p.spl_max_tokens),p.task_max_concurrent&&(f.value=p.task_max_concurrent);const I=Math.round(p.compare_cache_ttl/3600);y.value=I,_.textContent=_e(I),p.use_concept_cache!==void 0&&(N.checked=!!p.use_concept_cache,F())}}catch{m.textContent="API not reachable — run the backend to change settings",m.style.color="#dc2626"}l.addEventListener("click",async()=>{const d=`${a.value}:${s.value}`;try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({llm:d})})).ok?(r.textContent=`Current: ${d}`,m.textContent="Saved",m.style.color="#16a34a"):(m.textContent="Save failed",m.style.color="#dc2626")}catch{m.textContent="API not reachable",m.style.color="#dc2626"}setTimeout(()=>{m.textContent=""},3e3)}),v.addEventListener("click",async()=>{const d=Number(b.value),p=Number(x.value),k=Number(u.value),S=Number(f.value);if(!Number.isInteger(d)||d<1||!Number.isInteger(p)||p<1||!Number.isInteger(k)||k<100||!Number.isInteger(S)||S<1){i.textContent="Enter valid integers (iterations/calls ≥ 1, tokens ≥ 100, parallel ≥ 1)",i.style.color="#dc2626",setTimeout(()=>{i.textContent=""},3e3);return}try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({spl_while_max_iter:d,spl_max_llm_calls:p,spl_max_tokens:k,task_max_concurrent:S})})).ok?(i.textContent="Saved",i.style.color="#16a34a"):(i.textContent="Save failed",i.style.color="#dc2626")}catch{i.textContent="API not reachable",i.style.color="#dc2626"}setTimeout(()=>{i.textContent=""},3e3)}),C.addEventListener("click",async()=>{const d=Number(y.value);if(isNaN(d)||d<0){T.textContent="Enter a valid number ≥ 0",T.style.color="#dc2626",setTimeout(()=>{T.textContent=""},3e3);return}const p=Math.round(d*3600);try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({compare_cache_ttl:p})})).ok?(_.textContent=_e(d),T.textContent="Saved",T.style.color="#16a34a"):(T.textContent="Save failed",T.style.color="#dc2626")}catch{T.textContent="API not reachable",T.style.color="#dc2626"}setTimeout(()=>{T.textContent=""},3e3)}),q.addEventListener("click",async()=>{try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({use_concept_cache:N.checked})})).ok?(A.textContent="Saved",A.style.color="#16a34a"):(A.textContent="Save failed",A.style.color="#dc2626")}catch{A.textContent="API not reachable",A.style.color="#dc2626"}setTimeout(()=>{A.textContent=""},3e3)})}async function st(e,{id:t}={}){e.innerHTML="",e.className="";const n=Symbol();e._renderKey=n;let o=null,a=[];try{a=await be(),t&&(o=a.find(h=>h.id===t)??{id:t,name:t,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(e._renderKey!==n)return;const s=document.createElement("div");s.style.cssText="display:flex;flex-direction:column;height:100vh;overflow:hidden",e.appendChild(s),s.appendChild(ne({domainName:(o==null?void 0:o.name)||""}));const l=document.createElement("div");l.className="cb-domain-picker-bar";const m=document.createElement("span");m.className="cb-domain-picker-bar__label",m.textContent="Domain",l.appendChild(m);const r=document.createElement("input");r.type="text",r.placeholder="Search phrase or pinyin…",r.autocomplete="off",r.className="cb-domain-picker-bar__select",l.appendChild(r);const b=document.createElement("select");b.className="cb-domain-picker-bar__select";function x(){const h=r.value.trim(),c=h?a.filter(y=>he(y.name||y.id,y.pinyin,y.pinyin_initials,h)):a;b.innerHTML="";const g=document.createElement("option");return g.value="",g.textContent=c.length?"Select domain…":"No match",b.appendChild(g),[...c].sort((y,_)=>y.id.localeCompare(_.id,"zh")).forEach(y=>{const _=document.createElement("option");_.value=y.id,_.textContent=y.name||y.id,y.id===t&&(_.selected=!0),b.appendChild(_)}),c}let u=x();if(r.addEventListener("input",()=>{u=x()}),r.addEventListener("keydown",h=>{h.key==="Enter"&&u.length&&(window.location.hash=`/domain/${encodeURIComponent(u[0].id)}`)}),b.addEventListener("change",()=>{b.value&&(window.location.hash=`/domain/${encodeURIComponent(b.value)}`)}),l.appendChild(b),s.appendChild(l),!t||!o)return;if(o.source){const h=document.createElement("div");h.className="cb-attribution",h.innerHTML=`Source: <a href="${o.source.url}" target="_blank">${o.source.title}</a> by ${o.source.authors} (${o.source.license}). ${o.source.attribution}`,s.appendChild(h)}const f=document.createElement("main");f.className="cb-domain";const v=o.default_level||"intro",i=Nt();f.appendChild(St(o,{level:v,lang:i})),s.appendChild(f)}function Mt(e){e.innerHTML="",e._renderKey=Symbol(),e.appendChild(ne());const t=document.createElement("main");t.className="cb-about",t.innerHTML=`
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
  `,e.appendChild(t)}let pe=null;async function zt(){if(pe)return pe;const e=await fetch("/cb-zinets/resources.json",{cache:"no-cache"});if(!e.ok)throw new Error(`Failed to load resources: ${e.status}`);return pe=await e.json(),pe}function It(e,t){e.innerHTML=`
    <table class="cb-resources-table">
      <thead>
        <tr>
          <th>Resource</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${t.map(n=>`
          <tr>
            <td><a href="${n.url}" target="_blank" rel="noopener">${n.name}</a></td>
            <td>${n.description}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}function At(e){e.innerHTML="",e._renderKey=Symbol();const t=e._renderKey;e.appendChild(ne());const n=document.createElement("main");n.className="cb-resources",n.innerHTML=`
    <h1>Resources</h1>
    <p>
      Great dictionaries and reference sites for looking up Chinese characters and phrases.
      Sites marked for concept pages are also linked directly from each character's concept page;
      the remaining entries are general references available here for browsing.
    </p>
    <div id="cb-resources-table-wrap" class="cb-resources-table-wrap">
      <div class="cb-home-empty">Loading…</div>
    </div>
  `,e.appendChild(n);const o=n.querySelector("#cb-resources-table-wrap");zt().then(a=>{e._renderKey===t&&It(o,a)}).catch(()=>{e._renderKey===t&&(o.innerHTML='<div class="cb-home-empty">Failed to load resources.</div>')})}const Pt=["intro","core","college","research"],lt=[{value:"sonnet",label:"sonnet (Claude) *"},{value:"gemma4",label:"gemma4 (Ollama)"},{value:"gemma3",label:"gemma3 (Ollama)"}];function Le(e){const t=tt(e);if(t)return{level:t.level,lang:t.language};const n=e.match(/output\/([^.]+)\.([^/]+)\//);return n?{level:n[1],lang:n[2]}:{level:"college",lang:"en"}}function me(e){var t;return((t=tt(e))==null?void 0:t.model)??""}function D(e){return e.replace(/^.*\//,"")}function Ge(e){return e.startsWith("book_")||e.startsWith("phrase_")}function ct(e){return decodeURIComponent(D(e).replace(/^concept_/,"").replace(/\.html$/,""))}function Ht(e,t,n,o,a){const s=D(t),l=a?fe(n,o,a):`output/${n}.${o}/html`;return`/cb-zinets/domains/${e}/${l}/${s}`}function Rt(e,t){nt(t.map(n=>`/cb-zinets/domains/${encodeURIComponent(e)}/${n.file}`))}function se(e,t,n,o){const a=decodeURIComponent(e).replace(/^(?:concept|book)_/,"").replace(/_/g," ").replace(/\.html$/,"");return`<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${t||"default"}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${o}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${n}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${a}</strong> first via the Concept-Graph page.</p>
  </body></html>`}async function it(e,t,n,o,a){const s=D(t);if(e){const l=Ht(e,t,n,o,a);if(await Ee(l))return l}if(a&&s.startsWith("concept_")){const l=ct(s),m=`/cb-zinets/${kt(n,o,a,l)}`;if(await Ee(m))return m}return null}function $e(e){var t,n;try{const o=(n=(t=e.contentDocument)==null?void 0:t.querySelector("nav.toc"))==null?void 0:n.querySelectorAll("ol li");if(!o||!o.length)return null;const a=[];return o.forEach(s=>{const l=s.querySelector("a");l&&a.push({href:l.getAttribute("href"),label:l.textContent,isTarget:s.classList.contains("toc-target")})}),a.length?a:null}catch{return null}}async function Fe(e,t,n,o,a,s){const l=await it(t,n,o.level,o.lang,o.model);s&&s()||(a&&a(!!l),l?e.src=l:(e.removeAttribute("src"),e.srcdoc=se(D(n),o.model,o.lang,o.level)))}function ke(e){try{const t=e.contentDocument;if(!t)return;const n=t.createElement("style");n.textContent="nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }",t.head.appendChild(n)}catch{}}function Ce(e,t,n){const o=document.createElement("select");return o.className=n,e.forEach(({value:a,label:s})=>{const l=document.createElement("option");l.value=a,l.textContent=s,a===t&&(l.selected=!0),o.appendChild(l)}),o}function we(e,t,n,o){const a=document.createElement("div");if(a.className="cb-book-pane__controls",e){const r=document.createElement("span");r.className="cb-book-pane__label",r.textContent=e,a.appendChild(r)}const s=Ce(lt,t.model,"cb-book-pane__select");s.title="Model",s.addEventListener("change",()=>n("model",s.value)),a.appendChild(s);const l=Ce(Pt.map(r=>({value:r,label:r.charAt(0).toUpperCase()+r.slice(1)})),t.level,"cb-book-pane__select");l.title="Level",l.addEventListener("change",()=>n("level",l.value)),l.style.display="none",a.appendChild(l);const m=Ce(Je.map(r=>({value:r.code,label:r.label})),t.lang,"cb-book-pane__select");if(m.title="Language",m.addEventListener("change",()=>n("lang",m.value)),a.appendChild(m),o){const r=document.createElement("button");r.type="button",r.className="cb-book-pane__refresh",r.title="Refresh — re-check for content that just finished generating",r.textContent="🔄",r.addEventListener("click",o),a.appendChild(r)}return a}function Ot(e,t){const n=document.createElement("div");n.style.cssText="height:5px;background:#d1d5db;cursor:row-resize;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.15s";const o=document.createElement("div");o.style.cssText="width:40px;height:3px;border-radius:2px;background:#9ca3af;pointer-events:none",n.appendChild(o);let a=!1;return n.addEventListener("mouseenter",()=>{a||(n.style.background="#bfdbfe")}),n.addEventListener("mouseleave",()=>{a||(n.style.background="#d1d5db")}),n.addEventListener("mousedown",s=>{s.preventDefault(),a=!0,n.style.background="#93c5fd";const l=document.createElement("div");l.style.cssText="position:fixed;inset:0;z-index:9999;cursor:row-resize",document.body.appendChild(l),document.body.style.userSelect="none";const m=b=>{const x=e();if(!x)return;const u=x.getBoundingClientRect(),f=Math.min(80,Math.max(20,(b.clientY-u.top)/u.height*100));t(f)},r=()=>{a=!1,n.style.background="#d1d5db",document.body.removeChild(l),document.body.style.userSelect="",document.removeEventListener("mousemove",m),document.removeEventListener("mouseup",r)};document.addEventListener("mousemove",m),document.addEventListener("mouseup",r)}),n}function Bt(e,t,n){const o="font-family:system-ui,sans-serif",a=document.createElement("div");a.style.cssText="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.15)";const s=document.createElement("div");s.style.cssText=`font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#90b4e8;margin-bottom:8px;${o};font-weight:700`,s.textContent="💬 Reviewer Chat",a.appendChild(s);const l=document.createElement("div");l.style.cssText="max-height:220px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:6px";function m(){l.innerHTML="",t.forEach(({role:f,text:v})=>{const i=document.createElement("div"),h=f==="user";i.style.cssText=[`font-size:.8rem;line-height:1.4;${o}`,"padding:6px 8px;border-radius:6px;word-break:break-word;white-space:pre-wrap",h?"background:rgba(96,165,250,.18);color:#dbeafe;align-self:flex-end;text-align:right":"background:rgba(255,255,255,.07);color:#e8f0fe;align-self:flex-start"].join(";"),i.textContent=v,l.appendChild(i)}),l.scrollTop=l.scrollHeight}m(),a.appendChild(l);const r=document.createElement("div");r.style.cssText="display:flex;flex-direction:column;gap:6px";const b=document.createElement("textarea");b.rows=4,b.placeholder="Ask about this concept…",b.style.cssText=[`width:100%;box-sizing:border-box;resize:vertical;${o};font-size:.8rem`,"border:1px solid rgba(255,255,255,0.2);border-radius:5px","background:rgba(255,255,255,.06);color:#e8f0fe","padding:5px 7px;outline:none"].join(";");const x=document.createElement("button");x.textContent="Send",x.style.cssText=[`${o};font-size:.75rem;font-weight:600;align-self:flex-end`,"padding:5px 14px;border:none;border-radius:5px","background:#3b82f6;color:#fff;cursor:pointer;white-space:nowrap"].join(";");async function u(){const f=b.value.trim();if(!f||x.disabled)return;b.value="",x.disabled=!0,x.textContent="…";let v="";try{const i=e.contentDocument,h=(i==null?void 0:i.querySelector("main"))||(i==null?void 0:i.body);h&&(v=(h.innerText||"").slice(0,3e3))}catch{}await n(f,v,m),x.disabled=!1,x.textContent="Send",m()}return x.addEventListener("click",u),b.addEventListener("keydown",f=>{f.key==="Enter"&&!f.shiftKey&&(f.preventDefault(),u())}),r.appendChild(b),r.appendChild(x),a.appendChild(r),a}function Ke(e,t,{compareChecked:n,compareBtnEnabled:o,skipCacheChecked:a,onCompareToggle:s,onSkipCacheToggle:l,onCompareActivate:m,onConceptClick:r,isAdmin:b=!1,chatHistory:x=[],onChatSend:u=null,tocItems:f=null}){e.innerHTML="";const v=document.createElement("div");v.style.cssText="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.15)";const i=document.createElement("label");i.style.cssText="display:flex;align-items:center;gap:8px;cursor:pointer;font-family:system-ui,sans-serif;font-size:0.85rem;color:#e8f0fe;font-weight:600;margin-bottom:8px";const h=document.createElement("input");if(h.type="checkbox",h.checked=n,h.style.cssText="width:14px;height:14px;cursor:pointer;accent-color:#60a5fa",h.addEventListener("change",()=>s(h.checked)),i.appendChild(h),i.appendChild(document.createTextNode("Compare")),v.appendChild(i),n){const C=document.createElement("div");C.style.cssText="display:flex;align-items:center;gap:6px";const T=document.createElement("label");T.style.cssText="display:flex;align-items:center;gap:3px;cursor:pointer;flex-shrink:0;font-family:system-ui,sans-serif;font-size:0.75rem;color:#90b4e8;white-space:nowrap",T.title="Skip cache — always run a fresh comparison";const N=document.createElement("input");N.type="checkbox",N.checked=a,N.style.cssText="width:12px;height:12px;cursor:pointer;accent-color:#60a5fa;flex-shrink:0",N.addEventListener("change",()=>l(N.checked)),T.appendChild(N),T.appendChild(document.createTextNode("↻ fresh")),C.appendChild(T);const E=document.createElement("button");E.textContent="Compare ▶",E.disabled=!o,E.style.cssText=["flex:1;padding:6px 10px;font-size:0.8rem;font-weight:600","border-radius:6px;border:none;font-family:system-ui,sans-serif;transition:opacity 0.15s",o?"background:#3b82f6;color:#fff;cursor:pointer":"background:#374151;color:#6b7280;cursor:not-allowed;opacity:0.6"].join(";"),E.title=o?"Generate AI comparison of both sections in PANE C":"Both panes need content before comparing",E.addEventListener("click",()=>{E.disabled||m()}),C.appendChild(E),v.appendChild(C)}e.appendChild(v);const c=f??$e(t);if(!c)return;const g=document.createElement("div");g.style.cssText="font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700",g.textContent="Contents",e.appendChild(g);const y=document.createElement("ol");y.style.cssText="list-style:decimal inside;padding:0;margin:0;flex:1",c.forEach(({href:C,label:T,isTarget:N})=>{const E=document.createElement("li");E.style.cssText=`margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${N?";font-weight:700":""}`;const q=document.createElement("a");q.textContent=T,q.href="#",q.style.cssText=`text-decoration:none;color:${N?"#fff":"#a8c8f0"}`,q.addEventListener("mouseover",()=>{q.style.color="#fff"}),q.addEventListener("mouseout",()=>{q.style.color=N?"#fff":"#a8c8f0"}),q.addEventListener("click",A=>{A.preventDefault(),r(C)}),E.appendChild(q),y.appendChild(E)}),e.appendChild(y),b&&!n&&u&&e.appendChild(Bt(t,x,u));const _=document.createElement("div");_.style.cssText="margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif",_.innerHTML='Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener" style="color:#a8c8f0;text-decoration:underline">SPL</a>',e.appendChild(_)}function jt(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/^## (.+)$/gm,'</p><h3 style="color:#1e3a5f;margin:20px 0 8px;font-size:1rem;font-weight:700">$1</h3><p>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/\n\n/g,'</p><p style="margin:0 0 12px">').replace(/\n/g," ").replace(/^/,'<p style="margin:0 0 12px">').replace(/$/,"</p>").replace(/<p[^>]*><\/p>/g,"").replace(/<p[^>]*>(<h3)/g,"$1").replace(/(<\/h3>)<\/p>/g,"$1")}function Dt(){const e=document.createElement("div");return e.setAttribute("data-pane-c","1"),e.style.cssText=["flex:1","overflow-y:auto","background:#f8fafc","padding:24px 32px","font-family:system-ui,sans-serif","font-size:0.9rem","line-height:1.7","color:#374151"].join(";"),e.innerHTML='<div style="color:#9ca3af;font-size:0.85rem">Click <strong>Compare ▶</strong> to generate an AI comparison of the two sections above.</div>',e}function Ut(e,t,n,o,a,s){const l=ct(t),m=n.model||"default",r=o.model||"default",b=new URLSearchParams({domain:e,concept:l,level_a:n.level,lang_a:n.lang,model_a:n.model,level_b:o.level,lang_b:o.lang,model_b:o.model,skip_cache:s?"1":"0"});a.innerHTML=`
    <div style="display:flex;align-items:center;gap:12px;color:#6b7280;font-size:0.88rem">
      <div style="width:18px;height:18px;border:2px solid #e0e3e8;border-top-color:#3b82f6;border-radius:50%;animation:cb-spin 0.8s linear infinite;flex-shrink:0"></div>
      Comparing <strong style="color:#1e3a5f;margin:0 3px">${m}</strong> vs <strong style="color:#1e3a5f;margin:0 3px">${r}</strong>…
    </div>
    <style>@keyframes cb-spin{to{transform:rotate(360deg)}}</style>`;const x=performance.now(),u=new EventSource(`/api/compare?${b}`);return u.addEventListener("compare_done",f=>{u.close();const v=((performance.now()-x)/1e3).toFixed(1),{comparison:i,from_cache:h}=JSON.parse(f.data),c=h?'<span style="font-size:0.7rem;padding:2px 6px;border-radius:10px;background:#d1fae5;color:#065f46;font-weight:600;flex-shrink:0">cached</span>':"";a.innerHTML=`
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid #e0e3e8">
        <span style="font-size:0.7rem;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;font-weight:700">PANE C — Comparison</span>
        <span style="font-size:0.8rem;color:#374151">
          <strong style="color:#2563eb">${m}</strong> (${n.level}/${n.lang})
          <span style="color:#9ca3af;margin:0 6px">vs</span>
          <strong style="color:#2563eb">${r}</strong> (${o.level}/${o.lang})
        </span>
        ${c}
        <span style="font-size:0.72rem;color:#9ca3af;margin-left:auto">${v}s</span>
      </div>
      <div style="max-width:820px">${jt(i)}</div>`}),u.addEventListener("compare_error",f=>{u.close();const{message:v}=JSON.parse(f.data);a.innerHTML=`<p style="color:#dc2626;font-size:0.88rem"><strong>Comparison failed:</strong> ${v}</p>`}),u.onerror=()=>{u.close(),a.innerHTML='<p style="color:#dc2626;font-size:0.88rem">Connection to comparison service lost.</p>'},u}async function Gt(){if((localStorage.getItem("cb_book_browser_source")||"catalog")==="files")try{const t=await fetch("/api/browse/domains");if(!t.ok)throw new Error;const{domains:n}=await t.json();return n.map(o=>({id:o}))}catch{return[]}try{return(await be()).map(n=>({id:n.id,pinyin:n.pinyin,pinyin_initials:n.pinyin_initials}))}catch{return[]}}async function Ft(e){if((localStorage.getItem("cb_book_browser_source")||"catalog")==="files")try{const n=await fetch(`/api/browse/${encodeURIComponent(e)}`);if(!n.ok)throw new Error;return n.json()}catch{return{books:[],concepts:[]}}try{const o=await ht(e)??await(async()=>(await be()).find(m=>m.id===e)??{})(),a=(o.books||[]).map(l=>{const m=l.target.replace(/_/g," ").trim()||l.target,r=Le(l.file).lang;return{file:l.file,label:r?`${m} (${r})`:m,model:l.model||me(l.file)}}),s=(o.generated_concepts||[]).map(l=>{const m=Le(l.file).lang;return{file:l.file,label:m?`${l.label} (${m})`:l.label,model:l.model||me(l.file)}});return Rt(e,[...a,...s]),{books:a,concepts:s}}catch{return{books:[],concepts:[]}}}function Kt(e,t){const n=document.createElement("nav");n.className="cb-book-nav",n.style.width="260px";const o=document.createElement("div");o.className="cb-book-nav__title",o.textContent="Concept Books",n.appendChild(o);const a=document.createElement("div");a.className="cb-book-nav__toggle";function s($,L){const d=document.createElement("label");d.className="cb-book-nav__src-radio";const p=document.createElement("input");return p.type="radio",p.name="cb-src",p.value=$,d.appendChild(p),d.appendChild(document.createTextNode(L)),{wrap:d,input:p}}const{wrap:l,input:m}=s("catalog","Catalog"),{wrap:r,input:b}=s("files","Files");a.appendChild(l),a.appendChild(r),n.appendChild(a);function x($){const L=document.createElement("div");return L.className="cb-book-nav__label",L.textContent=$,L}n.appendChild(x("Domain"));const u=document.createElement("input");u.type="text",u.placeholder="Search phrase or pinyin…",u.autocomplete="off",u.className="cb-book-nav__select",n.appendChild(u);const f=document.createElement("select");f.className="cb-book-nav__select",n.appendChild(f),n.appendChild(x("Model"));const v=document.createElement("select");v.className="cb-book-nav__select",v.innerHTML='<option value="">— all —</option>',n.appendChild(v),n.appendChild(x("TOC Index"));const i=document.createElement("select");i.className="cb-book-nav__select",n.appendChild(i);const h=document.createElement("button");h.textContent="Open",h.disabled=!0,h.className="cb-book-nav__open",n.appendChild(h);function c(){return localStorage.getItem("cb_book_browser_source")||"catalog"}function g(){const $=c();m.checked=$==="catalog",b.checked=$==="files"}function y(){h.disabled=!f.value||!i.value}let _=[],C=[];function T(){const $=v.value,L=$?_.filter(d=>!d.model||d.model===$):_;i.innerHTML='<option value="">Select book…</option>',L.forEach(d=>{const p=document.createElement("option");p.value=d.file,p.textContent=d.label,d.file===t&&(p.selected=!0),i.appendChild(p)}),y()}function N($){const L=u.value.trim(),d=L?C.filter(p=>he(p.id,p.pinyin,p.pinyin_initials,L)):C;f.innerHTML=`<option value="">${d.length?"Select domain…":"No match"}</option>`,[...d].sort((p,k)=>p.id.localeCompare(k.id,"zh")).forEach(({id:p})=>{const k=document.createElement("option");k.value=p,k.textContent=p,f.appendChild(k)}),$&&d.some(p=>p.id===$)?f.value=$:d.length===1&&(f.value=d[0].id)}async function E($){i.innerHTML='<option value="">Loading…</option>',v.innerHTML='<option value="">Loading…</option>',y();const{books:L,concepts:d}=await Ft($);_=L;const p=new Set;L.forEach(w=>{w.model&&p.add(w.model)}),d.forEach(w=>{w.model&&p.add(w.model)});const k=[...p].sort();v.innerHTML='<option value="">— all —</option>',k.forEach(w=>{const I=document.createElement("option");I.value=w,I.textContent=w,v.appendChild(I)});const S=t?me(t):"";S&&p.has(S)?v.value=S:k.length>0&&(v.value=k[0]),T()}function q(){i.innerHTML='<option value="">—</option>',v.innerHTML='<option value="">— all —</option>',_=[],y()}async function A(){f.innerHTML='<option value="">Loading…</option>',i.innerHTML='<option value="">—</option>',y(),C=await Gt(),N(e),f.value?await E(f.value):y()}g(),m.addEventListener("change",()=>{m.checked&&(localStorage.setItem("cb_book_browser_source","catalog"),A())}),b.addEventListener("change",()=>{b.checked&&(localStorage.setItem("cb_book_browser_source","files"),A())}),u.addEventListener("input",()=>{const $=f.value;N($),f.value!==$&&(f.value?E(f.value):q())}),f.addEventListener("change",()=>{f.value?E(f.value):q()}),v.addEventListener("change",T),i.addEventListener("change",y),h.addEventListener("click",()=>{const $=i.value,L=f.value;$&&L&&(window.location.hash=`/book?domain=${encodeURIComponent(L)}&file=${encodeURIComponent($)}`)});const F=document.createElement("div");F.style.cssText="border-top:1px solid rgba(255,255,255,0.15);margin:10px 0 8px;flex-shrink:0",n.appendChild(F);const U=document.createElement("div");return U.style.cssText="flex:1;overflow-y:auto;min-height:0;display:flex;flex-direction:column",U.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">Open a book to see contents.</div>',n.appendChild(U),n.tocSection=U,A(),n}function Wt(e,t){var p,k;const{domain:n,file:o}=t||{};e.innerHTML="",e._renderKey=Symbol(),e.style.cssText="",e.className="cb-book-page",e.appendChild(ne());const a=document.createElement("div");a.style.cssText="display:flex;flex:1;overflow:hidden",e.appendChild(a);const s=Kt(n||"",o||"");a.appendChild(s);const l=document.createElement("div");if(l.style.cssText="flex:1;display:flex;overflow:hidden;min-width:0",a.appendChild(l),!o)return;const m=Le(o);let r=!1,b=!1,x=!1,u=!1,f=!1,v=60,i=o,h=null,c=null,g=null,y=null,_=null;const C={level:m.level,lang:m.lang,model:me(o)},T=((p=lt.find(S=>S.value&&S.value!==C.model))==null?void 0:p.value)||C.model,N={level:m.level,lang:m.lang,model:T},E=((k=Ze())==null?void 0:k.role)==="admin",q=[];async function A(S,w,I){q.push({role:"user",text:S}),I();try{const B=w?`You are a reviewer assistant for Chinese character concept books.

Current concept page content:
${w}

Help the reviewer understand, critique, and improve the content.`:"You are a reviewer assistant for Chinese character concept books.",P=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",...ut()},body:JSON.stringify({message:S,system:B,history:q.slice(0,-1).map(O=>({role:O.role,text:O.text}))})}),R=await P.json();q.push({role:"assistant",text:P.ok?R.response:`Error: ${R.detail||P.status}`})}catch(B){q.push({role:"assistant",text:`Error: ${B.message}`})}}function F(){h&&(h.close(),h=null)}function U(){return l.querySelector("[data-pane-c]")}function $(){F(),l.innerHTML="",s.tocSection.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">Loading…</div>',y=null,_=null,r?d():L()}function L(){const S=document.createElement("div");S.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0",l.appendChild(S),S.appendChild(we(null,C,(R,O)=>{C[R]=O,P()},()=>{ye(),P()}));const w=document.createElement("iframe");w.style.cssText="flex:1;width:100%;border:none;display:block",S.appendChild(w);let I=!1,B=0;w.addEventListener("load",()=>{var j,K,J,oe,V;if(I)return;try{if((j=w.contentDocument)!=null&&j.querySelector("#app")){I=!0,w.removeAttribute("src"),w.srcdoc=se(D(i),C.model,C.lang,C.level);return}}catch{}try{const H=(J=(K=w.contentWindow)==null?void 0:K.location)==null?void 0:J.href;if(H&&!H.startsWith("about:")){const G=decodeURIComponent(H.replace(/.*\/html\//,""));G&&!G.includes("://")&&G!==D(i)&&(i=i.replace(/[^/]+\.html$/,G))}}catch{}ke(w);const R=D(i),O=$e(w);if(Ge(R)&&O&&(c={file:R,items:O}),g){try{(V=(oe=w.contentDocument)==null?void 0:oe.querySelector(g))==null||V.scrollIntoView()}catch{}g=null}Ke(s.tocSection,w,{compareChecked:!1,compareBtnEnabled:!1,skipCacheChecked:!1,onCompareToggle:H=>{r=H,$()},onSkipCacheToggle:()=>{},onCompareActivate:()=>{},isAdmin:E,chatHistory:q,onChatSend:A,tocItems:c&&R!==c.file?c.items.map(H=>({...H,isTarget:H.href===R})):O,onConceptClick:H=>{var G,z;if(H){if(H.startsWith("#")){if(c&&D(i)!==c.file){i=i.replace(/[^/]+\.html$/,c.file),g=H,P();return}try{(z=(G=w.contentDocument)==null?void 0:G.querySelector(H))==null||z.scrollIntoView({behavior:"smooth"})}catch{}return}i=i.replace(/[^/]+\.html$/,H),P()}}})});function P(){const R=++B;it(n,i,C.level,C.lang,C.model).then(O=>{R===B&&(I=!O,O?w.src=O:(w.removeAttribute("src"),w.srcdoc=se(D(i),C.model,C.lang,C.level)))})}P()}function d(){const S=document.createElement("div");S.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0",l.appendChild(S);const w=document.createElement("div");w.style.cssText="display:flex;flex-shrink:0",S.appendChild(w);const I=we("Pane A",C,(z,M)=>{C[z]=M,V()},()=>{ye(),V()});I.style.flex="1",w.appendChild(I);const B=document.createElement("div");B.style.cssText="width:2px;background:#e0e3e8;flex-shrink:0",w.appendChild(B);const P=we("Pane B",N,(z,M)=>{N[z]=M,G()},()=>{ye(),G()});P.style.flex="1",w.appendChild(P);const R=document.createElement("div");R.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden",S.appendChild(R),y=R;const O=document.createElement("div");O.style.cssText=`flex:0 0 ${b?v+"%":"100%"};display:flex;overflow:hidden;min-height:0`,R.appendChild(O),_=O;const j=document.createElement("iframe");j.style.cssText="flex:1;border:none;display:block;min-width:0",O.appendChild(j),O.appendChild((()=>{const z=document.createElement("div");return z.style.cssText="width:2px;background:#e0e3e8;flex-shrink:0",z})());const K=document.createElement("iframe");if(K.style.cssText="flex:1;border:none;display:block;min-width:0",O.appendChild(K),b){const z=Ot(()=>y,Y=>{v=Y,_&&(_.style.flex=`0 0 ${Y}%`)}),M=document.createElement("div");M.style.cssText="flex-shrink:0;background:#1e3a5f;color:#90b4e8;padding:4px 16px;font-size:0.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px",M.innerHTML="<span>PANE C — AI Comparison</span>",R.appendChild(z),R.appendChild(M),R.appendChild(Dt())}function J(){const z=D(i);Ke(s.tocSection,j,{compareChecked:!0,compareBtnEnabled:x&&u,skipCacheChecked:f,isAdmin:E,chatHistory:q,onChatSend:A,tocItems:c&&z!==c.file?c.items.map(M=>({...M,isTarget:M.href===z})):null,onCompareToggle:M=>{r=M,$()},onSkipCacheToggle:M=>{f=M},onCompareActivate:()=>{b||(b=!0,$());const M=U();M&&(F(),h=Ut(n,i,C,N,M,f))},onConceptClick:M=>{var Y,ae;if(M){if(M.startsWith("#")){if(c&&D(i)!==c.file){i=i.replace(/[^/]+\.html$/,c.file),g=M,V(),G();return}try{(ae=(Y=j.contentDocument)==null?void 0:Y.querySelector(M))==null||ae.scrollIntoView({behavior:"smooth"})}catch{}return}i=i.replace(/[^/]+\.html$/,M),V(),G()}}})}j.addEventListener("load",()=>{var M,Y,ae,ge,ze;try{if((M=j.contentDocument)!=null&&M.querySelector("#app")){x=!1,j.removeAttribute("src"),j.srcdoc=se(D(i),C.model,C.lang,C.level),J();return}}catch{}try{const te=(ae=(Y=j.contentWindow)==null?void 0:Y.location)==null?void 0:ae.href;if(te&&!te.startsWith("about:")){const ce=decodeURIComponent(te.replace(/.*\/html\//,""));ce&&!ce.includes("://")&&ce!==D(i)&&(i=i.replace(/[^/]+\.html$/,ce))}}catch{}ke(j);const z=$e(j);if(Ge(D(i))&&z&&(c={file:D(i),items:z}),g){try{(ze=(ge=j.contentDocument)==null?void 0:ge.querySelector(g))==null||ze.scrollIntoView()}catch{}g=null}J()}),K.addEventListener("load",()=>{var z;try{if((z=K.contentDocument)!=null&&z.querySelector("#app")){u=!1,K.removeAttribute("src"),K.srcdoc=se(D(i),N.model,N.lang,N.level),J();return}}catch{}ke(K)});let oe=0;function V(){const z=++oe;Fe(j,n,i,C,M=>{x=M,J()},()=>z!==oe)}let H=0;function G(){const z=++H;Fe(K,n,i,N,M=>{u=M,J()},()=>z!==H)}V(),G()}$()}function Jt(e,t={}){e.innerHTML="";const n=document.createElement("div");n.style.cssText="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb";const o=document.createElement("div");o.style.cssText=["background:#fff","border:1px solid #e5e7eb","border-radius:8px","padding:40px","width:340px","box-shadow:0 2px 8px rgba(0,0,0,.08)"].join(";"),o.innerHTML=`
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
  `,n.appendChild(o),e.appendChild(n);const a=o.querySelector("#cb-login-user"),s=o.querySelector("#cb-login-pass"),l=o.querySelector("#cb-login-btn"),m=o.querySelector("#cb-login-err"),r=o.querySelector("#cb-login-google-wrap"),b=o.querySelector("#cb-login-google");a.focus(),t.error&&(m.textContent=decodeURIComponent(t.error)),fetch("/api/auth/providers").then(u=>u.ok?u.json():null).then(u=>{u!=null&&u.google&&(r.style.display="")}).catch(()=>{}),b.addEventListener("click",()=>{window.location.href="/api/auth/google/login"});async function x(){m.textContent="",l.disabled=!0,l.textContent="Signing in…";try{const u=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:a.value.trim(),password:s.value})});if(u.ok){const f=await u.json();Ve(f.token),Qe(f.user),window.location.hash="/"}else{const f=await u.json().catch(()=>({}));m.textContent=f.detail||"Login failed"}}catch{m.textContent="Cannot connect to server"}finally{l.disabled=!1,l.textContent="Sign in"}}l.addEventListener("click",x),s.addEventListener("keydown",u=>{u.key==="Enter"&&x()}),a.addEventListener("keydown",u=>{u.key==="Enter"&&s.focus()})}const Z=document.getElementById("app");async function ee(e){{e();return}}W("/",()=>ee(()=>vt(Z)));W("/graph",()=>ee(()=>st(Z,{})));W("/about",()=>ee(()=>Mt(Z)));W("/resources",()=>ee(()=>At(Z)));W("/settings",()=>ee(()=>qt(Z)));W("/domain/:id",e=>ee(()=>st(Z,e)));W("/book",e=>ee(()=>Wt(Z,e)));W("/login",e=>Jt(Z,e));W("/auth/callback",async e=>{e.token?(Ve(e.token),await mt(),le("/")):le("/login")});rt();
