(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function n(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(a){if(a.ep)return;a.ep=!0;const s=n(a);fetch(a.href,s)}})();const B={};function O(e,t){B[e]=t}function U(e){window.location.hash=e}function he(){var a,s;const e=window.location.hash.slice(1)||"/",t=e.match(/^\/domain\/([^?]+)/);if(t){(a=B["/domain/:id"])==null||a.call(B,{id:decodeURIComponent(t[1])});return}const[n,o]=e.split("?");(s=B[n])==null||s.call(B,Object.fromEntries(new URLSearchParams(o||"")))}function Ie(){window.addEventListener("hashchange",he),he()}const be={en:{"app.title":"字 ConceptBook","app.tagline":"Learn Chinese characters the LEGO way","nav.about":"About","nav.settings":"Settings","home.subtitle":"Explore the Chinese character graph","home.filter.all":"All","home.filter.level":"Level","card.nodes":"nodes","card.edges":"edges","card.explore":"Explore Concept-Graph","card.read":"Read book","domain.back":"← Back","domain.openFullscreen":"Open fullscreen","about.title":"About 字 ConceptBook",loading:"Loading…"}};let se=localStorage.getItem("cb-lang")||"en";function ge(e){return(be[se]||be.en)[e]??e}function qe(e){se=e,localStorage.setItem("cb-lang",e)}function xe(){return se}const Ce=[{code:"en",label:"English *"},{code:"zh",label:"中文 (Chinese)"},{code:"es",label:"Español (Spanish)"},{code:"fr",label:"Français (French)"},{code:"de",label:"Deutsch (German)"},{code:"pt",label:"Português (Portuguese)"},{code:"ar",label:"العربية (Arabic)"},{code:"hi",label:"हिन्दी (Hindi)"},{code:"ja",label:"日本語 (Japanese)"},{code:"ko",label:"한국어 (Korean)"}];function Pe(){const e=document.createElement("select");e.className="cb-lang-picker",e.title="Content language";const t=xe();return Ce.forEach(({code:n,label:o})=>{const a=document.createElement("option");a.value=n,a.textContent=o,n===t&&(a.selected=!0),e.appendChild(a)}),e.addEventListener("change",()=>qe(e.value)),e}const ce="cb_token",ie="cb_user";function le(){return localStorage.getItem(ce)}function re(e){localStorage.setItem(ce,e)}function we(){localStorage.removeItem(ce)}function ke(){try{return JSON.parse(localStorage.getItem(ie)||"null")}catch{return null}}function de(e){localStorage.setItem(ie,JSON.stringify(e))}function Ee(){localStorage.removeItem(ie)}function Ae(){const e=le();return e?{"X-CB-Token":e}:{}}async function ze(){const e=le();if(!e)return null;try{const t=await fetch("/api/auth/me",{headers:{"X-CB-Token":e}});if(t.ok){const n=await t.json();return de(n),n}return we(),Ee(),null}catch{return null}}function F({domainName:e=""}={}){const t=document.createElement("header");t.className="cb-header";const n=document.createElement("div");n.className="cb-header__top";const o=document.createElement("a");o.className="cb-header__logo",o.href="#/";const a=document.createElement("img");if(a.className="cb-header__logo-mark",a.src="/cb-zinets/brand/seal-zi-logo.png",a.alt="",o.appendChild(a),o.appendChild(document.createTextNode(ge("app.title").replace(/^字\s*/,""))),n.appendChild(o),e){const p=document.createElement("span");p.className="cb-header__sep",p.textContent="›",n.appendChild(p);const r=document.createElement("span");r.className="cb-header__domain",r.textContent=e,n.appendChild(r)}const s=document.createElement("span");s.className="cb-header__spacer",n.appendChild(s);const i=document.createElement("nav");i.className="cb-header__nav",i.innerHTML=`<a href="#/graph">Graph</a> <a href="#/resources">Resources</a> <a href="#/settings">${ge("nav.settings")}</a> <a href="#/about">About</a>`,n.appendChild(i),n.appendChild(Pe());const c=ke();if(c){const p=document.createElement("span");p.className="cb-header__user",p.textContent=`${c.username} (${c.role})`,n.appendChild(p);const r=document.createElement("button");r.className="cb-btn",r.style.cssText="padding:4px 10px;font-size:.8rem;margin-left:8px",r.textContent="Logout",r.addEventListener("click",async()=>{const l=le();if(l)try{await fetch("/api/auth/logout",{method:"POST",headers:{"X-CB-Token":l}})}catch{}we(),Ee(),window.location.hash="/login"}),n.appendChild(r)}return t.appendChild(n),t}let J=null;function pe(e,t,n,o){if(e.includes(o))return!0;const a=o.toLowerCase();return!!(t&&t.includes(a)||n&&n.includes(a))}async function Se(){try{const e=await fetch("/cb-zinets/domains/catalog.json",{cache:"no-cache"});if(!e.ok)throw new Error(`Failed to load catalog: ${e.status}`);return J=await e.json(),J}catch(e){if(J)return J;throw e}}function Oe(e){return e.name.startsWith("phrase_")}function Le(e){return[...e].length===1}function He(e){const t=new Map;for(const n of e){const o=new Set;for(const a of n.generated_concepts||[]){if(Oe(a)||!Le(a.name)||o.has(a.name))continue;o.add(a.name);let s=t.get(a.name);s||(s={char:a.name,count:0,domain:n.id,file:a.file,pinyin:a.pinyin},t.set(a.name,s)),s.count+=1}}return[...t.values()].sort((n,o)=>o.count-n.count||n.char.localeCompare(o.char,"zh"))}async function Re(e){try{const t=await fetch("/api/browse/concepts");if(!t.ok)throw new Error;const{concepts:n}=await t.json();return n.filter(o=>!e.has(o.char)).map(o=>({char:o.char,count:0,domain:"",file:o.file,pinyin:null}))}catch{return[]}}function Be(e){return e>=5?"cb-concept-tile--hot":e>=2?"cb-concept-tile--warm":""}function fe(e,t,n){const o=n.trim(),a=o?t.filter(s=>pe(s.name,s.pinyin,s.pinyin_initials,o)):t;e.innerHTML=a.length?"":'<div class="cb-home-empty">No phrases match.</div>',a.forEach(s=>{const i=document.createElement("a");i.className="cb-home-link",i.href="#",i.textContent=s.name,i.addEventListener("click",c=>{c.preventDefault(),U(`/domain/${encodeURIComponent(s.id)}`)}),e.appendChild(i)})}function ye(e,t,n){const o=n.trim(),a=o?t.filter(s=>pe(s.char,s.pinyin,null,o)):t;e.innerHTML=a.length?"":'<div class="cb-home-empty">No concepts match.</div>',a.forEach(s=>{const i=document.createElement("button");i.className=`cb-concept-tile ${Be(s.count)}`.trim(),i.title=s.count===0?`${s.char} — standalone concept (no phrase yet)`:`${s.char} — appears in ${s.count} phrase${s.count===1?"":"s"}`;const c=s.count===0?"":`<span class="cb-concept-tile__badge">${s.count}</span>`;i.innerHTML=`<span class="cb-concept-tile__char">${s.char}</span>${c}`,i.addEventListener("click",()=>U(`/book?domain=${encodeURIComponent(s.domain)}&file=${encodeURIComponent(s.file)}`)),e.appendChild(i)})}function je(e){e.innerHTML="",e._renderKey=Symbol();const t=e._renderKey;e.appendChild(F());const n=document.createElement("main");n.className="cb-home cb-phrase-home",n.innerHTML=`
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
  `,e.appendChild(n);const o=document.createElement("footer");o.className="cb-home-footer",o.innerHTML='<p class="cb-welcome__license">Powered by <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL</a> · Open source · <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener">Apache 2.0</a></p>',e.appendChild(o);const a=n.querySelector("#cb-phrase-input"),s=n.querySelector("#cb-phrase-btn"),i=n.querySelector("#cb-phrase-error"),c=n.querySelector("#cb-phrase-list"),p=n.querySelector("#cb-concept-grid"),r=n.querySelector("#cb-home-search"),l=n.querySelector("#cb-phrase-count"),u=n.querySelector("#cb-concept-count");Se().then(async v=>{if(e._renderKey!==t)return;const h=v.filter(L=>!Le(L.name||L.id)).map(L=>({id:L.id,name:L.name||L.id,pinyin:L.pinyin,pinyin_initials:L.pinyin_initials})).sort((L,q)=>L.name.localeCompare(q.name,"zh")),_=He(v),T=await Re(new Set(_.map(L=>L.char)));e._renderKey===t&&(_.push(...T.sort((L,q)=>L.char.localeCompare(q.char,"zh"))),l.textContent=`(${h.length})`,u.textContent=`(${_.length})`,fe(c,h,""),ye(p,_,""),r.addEventListener("input",()=>{fe(c,h,r.value),ye(p,_,r.value)}))}).catch(()=>{e._renderKey===t&&(c.innerHTML='<div class="cb-home-empty">Failed to load phrases.</div>',p.innerHTML='<div class="cb-home-empty">Failed to load concepts.</div>')});async function m(){const v=a.value.trim()||r.value.trim();if(v){s.disabled=!0,s.textContent="生成中…",i.style.display="none";try{const h=await fetch("/api/phrase/graph",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phrase:v})});if(!h.ok){const T=await h.text();throw new Error(T)}const{domain_id:_}=await h.json();U(`/domain/${encodeURIComponent(_)}`)}catch(h){i.textContent=`错误：${h.message}`,i.style.display="block",s.disabled=!1,s.textContent="构建图"}}}s.addEventListener("click",m),a.addEventListener("keydown",v=>{v.key==="Enter"&&m()})}const j=new Map;function Te(){j.clear()}function Ge(e){for(const t of e)j.set(t,!0)}async function ee(e){if(j.has(e))return j.get(e);try{const t=await fetch(e,{headers:{Range:"bytes=0-511"}});if(!t.ok&&t.status!==206)return j.set(e,!1),!1;const o=!(await t.text()).includes('id="app"');return j.set(e,o),o}catch{return j.set(e,!1),!1}}function De(e,{level:t="intro",lang:n="en"}={}){const{id:o,books:a=[],generated_concepts:s=[]}=e;Ge(a.filter(d=>d.file).map(d=>`/cb-zinets/domains/${o}/${d.file}`));const i=new Map;s.forEach(d=>{d.name&&d.pinyin&&!i.has(d.name)&&i.set(d.name,d.pinyin.toLowerCase())});const c=document.createElement("div");c.className="cb-graph-viewer";const p=document.createElement("div");p.className="cb-graph-topbar";const r=document.createElement("div");r.className="cb-graph-topbar__search";const l=document.createElement("input");l.type="text",l.placeholder="Search character or pinyin…",l.className="cb-graph-topbar__input";const u=document.createElement("button");u.type="button",u.textContent="Search",u.className="cb-btn cb-graph-topbar__search-btn",r.append(l,u);const m=document.createElement("div");m.className="cb-graph-topbar__view-controls";const v=document.createElement("button");v.type="button",v.textContent="Zoom −",v.title="Zoom out",v.className="cb-btn cb-graph-topbar__zoom";const h=document.createElement("button");h.type="button",h.textContent="Zoom +",h.title="Zoom in",h.className="cb-btn cb-graph-topbar__zoom";const _=document.createElement("button");_.type="button",_.textContent="Re-Center",_.className="cb-btn cb-graph-topbar__recenter",m.append(v,h,_),p.append(r,m),c.appendChild(p);const T=document.createElement("iframe");T.className="cb-graph-viewer__frame";const L=localStorage.getItem("cb_graph_layout")||"compact";T.src=`/cb-zinets/domains/${o}/output/graph.html?layout=${L}`,T.title=`${o} concept graph`,T.setAttribute("allowfullscreen","");function q(){var k,S,E,f;const d=l.value.trim().toLowerCase();if(!d)return;const g=T.contentWindow,b=(((k=g==null?void 0:g.__cb_RAW)==null?void 0:k.nodes)||[]).find(y=>{var M;return y.label.toLowerCase().includes(d)||y.id.toLowerCase().includes(d)||((M=i.get(y.id))==null?void 0:M.includes(d))});l.classList.remove("cb-graph-topbar__input--notfound"),b?((S=g.selectNode)==null||S.call(g,b.id),(f=(E=g.__cb_network)==null?void 0:E.focus)==null||f.call(E,b.id,{scale:1,animation:{duration:400,easingFunction:"easeInOutQuad"}})):(l.classList.add("cb-graph-topbar__input--notfound"),setTimeout(()=>l.classList.remove("cb-graph-topbar__input--notfound"),1200))}u.addEventListener("click",q),l.addEventListener("keydown",d=>{d.key==="Enter"&&(d.preventDefault(),q())}),_.addEventListener("click",()=>{var d,g;try{(g=(d=T.contentWindow)==null?void 0:d.reCenterGraph)==null||g.call(d)}catch{}});const P=.1,H=4;function w(d){var g;try{const N=(g=T.contentWindow)==null?void 0:g.__cb_network;if(!N)return;const b=Math.min(H,Math.max(P,N.getScale()*d));N.moveTo({scale:b,animation:{duration:150,easingFunction:"easeInOutQuad"}})}catch{}}return h.addEventListener("click",()=>w(1.25)),v.addEventListener("click",()=>w(.8)),T.addEventListener("load",()=>{var d;try{const g=T.contentWindow;if(!g)return;g.eval("window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex; window.__cb_network = network");const N=(((d=g.__cb_RAW)==null?void 0:d.nodes)||[]).map(k=>({id:k.id,label:k.label,kind:k.kind,tier:k.tier??0}));window.dispatchEvent(new CustomEvent("cb:graphLoaded",{detail:{concepts:N}}));const b=g.handleSelect;g.handleSelect=function(k){var E;b.call(g,k);const S=(E=g.__cb_nodeIndex)==null?void 0:E[k];S&&window.dispatchEvent(new CustomEvent("cb:nodeSelected",{detail:{nodeId:k,node:S}}))},Ke(T.contentDocument),L==="hierarchical"&&g.network&&g.eval(`
          network.setOptions({ layout: { hierarchical: {
            enabled: true, direction: 'UD', sortMethod: 'directed',
            levelSeparation: 120, nodeSpacing: 180
          }}});
          network.fit({ animation: false });
        `)}catch{}}),c.appendChild(T),c.selectNode=d=>{var g,N;try{(N=(g=T.contentWindow)==null?void 0:g.selectNode)==null||N.call(g,d)}catch{}},c.getPath=d=>{var g;try{const N=T.contentWindow,b=(g=N==null?void 0:N.__cb_nodeIndex)==null?void 0:g[d];if(!b)return null;const S=(N.getAncestors?[...N.getAncestors(d)]:[]).map(E=>N.__cb_nodeIndex[E]).filter(Boolean);return{nodeId:d,node:b,path:S}}catch{return null}},c}function Ke(e){if(e.querySelector("#cb-ide-layout"))return;const t=e.createElement("style");t.id="cb-ide-layout",t.textContent=`
    #path-sidebar, #explain-panel, .graph-recenter-btn { display: none !important; }
    .app {
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
    }
    #graph-panel { flex: 0 0 80%; min-height: 0; border-bottom: none !important; }
    #notes-sidebar {
      flex: 1;
      min-height: 0;
      width: 100% !important;
      border-left: none !important;
      border-top: 1px solid rgba(0,0,0,0.12) !important;
      overflow-y: auto !important;
      display: flex;
      flex-direction: column;
    }
    /* One-line entry — leaves more room for the notes history list below,
       instead of the default fixed 100px textarea. */
    #notes-textarea {
      flex: 0 0 auto !important;
      height: 32px !important;
      padding: 6px 12px !important;
    }
    .cb-notes-gutter {
      height: 6px; flex-shrink: 0; cursor: row-resize;
      background: rgba(0,0,0,0.1); touch-action: none;
      transition: background 0.15s;
    }
    .cb-notes-gutter:hover, .cb-notes-gutter:active { background: #60a5fa; }
  `,e.head.appendChild(t);const n=e.querySelector("#graph-panel"),o=e.querySelector("#notes-sidebar"),a=e.querySelector(".app");if(n&&o&&a&&!e.querySelector(".cb-notes-gutter")){const s=e.createElement("div");s.className="cb-notes-gutter",s.title="Drag to resize",n.insertAdjacentElement("afterend",s),Fe(s,n,a)}}function Fe(e,t,n){e.addEventListener("pointerdown",s=>{s.preventDefault(),e.setPointerCapture(s.pointerId);const i=p=>{const r=n.getBoundingClientRect(),l=Math.min(.92,Math.max(.3,(p.clientY-r.top)/r.height));t.style.flex=`0 0 ${(l*100).toFixed(2)}%`},c=p=>{e.releasePointerCapture(p.pointerId),e.removeEventListener("pointermove",i),e.removeEventListener("pointerup",c),e.removeEventListener("pointercancel",c)};e.addEventListener("pointermove",i),e.addEventListener("pointerup",c),e.addEventListener("pointercancel",c)})}function Ue(e,t,n){return`output/${e}.${t}/${n}/html`}function Ne(e){var o;const t=e.split("/");if(t.length<4)return null;const n=(o=t[1])==null?void 0:o.match(/^([^.]+)\.(.+)$/);return n?{level:n[1],language:n[2],model:t[2]}:null}function V(e,t,n,o){return`concepts/${e}.${t}/${n}/concept_${o}.html`}function $e(e,t,n,o){const a=o.startsWith("phrase_")?o:`book_${o}`;return`output/${e}.${t}/${n}/html/${a}.html`}function ae(e){const t=Ne(e);if(t)return{level:t.level,lang:t.language};const n=e.match(/output\/([^.]+)\.([^/]+)\//);return n?{level:n[1],lang:n[2]}:{level:"college",lang:"en"}}function oe(e){var t;return((t=Ne(e))==null?void 0:t.model)??""}function G(e){return e.replace(/^.*\//,"")}function X(e){return decodeURIComponent(G(e).replace(/^concept_/,"").replace(/\.html$/,""))}function ve(e,t,n,o,a){const s=G(t),i=a?Ue(n,o,a):`output/${n}.${o}/html`;return`/cb-zinets/domains/${e}/${i}/${s}`}function _e(e,t,n,o){const a=decodeURIComponent(e).replace(/^(?:concept|book)_/,"").replace(/_/g," ").replace(/\.html$/,"");return`<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${t||"default"}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${o}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${n}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${a}</strong> first — use the Generate bar above.</p>
  </body></html>`}const We=["sonnet","gemma4","gemma3","gemma4_27b"];async function Je(e,t,n,o,a){const s=G(t);if(e){const i=ve(e,t,n,o,a);if(await ee(i))return i;if(!s.startsWith("concept_"))for(const c of We){if(c===a)continue;const p=ve(e,t,n,o,c);if(await ee(p))return p}}if(a&&s.startsWith("concept_")){const i=X(s),c=`/cb-zinets/${V(n,o,a,i)}`;if(await ee(c))return c}return null}function Ze(e){try{const t=e.contentDocument;if(!t)return;const n=t.createElement("style");n.textContent="nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; max-width: none !important; width: 100% !important; } article, .content, main { max-width: none !important; } h1.book-title + section > h2:first-child { display: none !important; }",t.head.appendChild(n)}catch{}}function Xe(e,t,n){const o="font-family:system-ui,sans-serif",a=document.createElement("div");a.style.cssText="margin-top:14px;padding-top:12px;border-top:1px solid var(--color-border,#e0e3e8)";const s=document.createElement("div");s.style.cssText=`font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;${o};font-weight:700`,s.textContent="💬 Reviewer Chat",a.appendChild(s);const i=document.createElement("div");i.style.cssText="max-height:220px;overflow-y:auto;margin-bottom:8px;display:flex;flex-direction:column;gap:6px";function c(){i.innerHTML="",t.forEach(({role:m,text:v})=>{const h=document.createElement("div"),_=m==="user";h.style.cssText=[`font-size:.8rem;line-height:1.4;${o}`,"padding:6px 8px;border-radius:6px;word-break:break-word;white-space:pre-wrap",_?"background:#dbeafe;color:#1e3a5f;align-self:flex-end;text-align:right":"background:#f0f2f5;color:#374151;align-self:flex-start"].join(";"),h.textContent=v,i.appendChild(h)}),i.scrollTop=i.scrollHeight}c(),a.appendChild(i);const p=document.createElement("div");p.style.cssText="display:flex;flex-direction:column;gap:6px";const r=document.createElement("textarea");r.rows=4,r.placeholder="Ask about this concept…",r.style.cssText=[`width:100%;box-sizing:border-box;resize:vertical;${o};font-size:.8rem`,"border:1px solid #d1d5db;border-radius:5px","background:#fff;color:#374151","padding:5px 7px;outline:none"].join(";");const l=document.createElement("button");l.textContent="Send",l.style.cssText=[`${o};font-size:.75rem;font-weight:600;align-self:flex-end`,"padding:5px 14px;border:none;border-radius:5px","background:#3b82f6;color:#fff;cursor:pointer;white-space:nowrap"].join(";");async function u(){const m=r.value.trim();if(!m||l.disabled)return;r.value="",l.disabled=!0,l.textContent="…";let v="";try{const h=e.contentDocument,_=(h==null?void 0:h.querySelector("main"))||(h==null?void 0:h.body);_&&(v=(_.innerText||"").slice(0,3e3))}catch{}await n(m,v,c),l.disabled=!1,l.textContent="Send",c()}return l.addEventListener("click",u),r.addEventListener("keydown",m=>{m.key==="Enter"&&!m.shiftKey&&(m.preventDefault(),u())}),p.appendChild(r),p.appendChild(l),a.appendChild(p),a}function Qe(e,t,{tocItems:n,isAdmin:o=!1,chatHistory:a=[],onChatSend:s=null,onConceptClick:i}){if(e.innerHTML="",!n||!n.length){e.innerHTML='<p class="cb-panel__hint">No concepts found on this path.</p>';return}const c=document.createElement("ul");c.className="cb-ide-toc__list",n.forEach(({href:p,label:r,isTarget:l})=>{const u=document.createElement("li"),m=document.createElement("a");m.href="#",m.textContent=r,l&&(m.className="cb-ide-toc__current"),m.addEventListener("click",v=>{v.preventDefault(),i(p)}),u.appendChild(m),c.appendChild(u)}),e.appendChild(c),o&&s&&e.appendChild(Xe(t,a,s))}const Ve={application:"🌸",primitive:"🌱"};function Ye(e,t,{embedded:n=!1,graphViewer:o=null,onNodeChange:a=null}={}){var N;const{domain:s,file:i}=t||{};e.innerHTML="",e._renderKey=Symbol(),e.style.cssText="",e.className=n?"cb-book-embed":"cb-book-page",n||e.appendChild(F());const c=document.createElement("div");c.className="cb-ide-body",e.appendChild(c);const p=et();c.appendChild(p);const r=document.createElement("div");r.className="cb-ide-content",c.appendChild(r);const l=ae(i||"");let u=i,m=null,v=null;const h={level:l.level,lang:l.lang,model:oe(i||"")},_=((N=ke())==null?void 0:N.role)==="admin",T=[];async function L(b,k,S){T.push({role:"user",text:b}),S();try{const E=k?`You are a reviewer assistant for Chinese character concept books.

Current concept page content:
${k}

Help the reviewer understand, critique, and improve the content.`:"You are a reviewer assistant for Chinese character concept books.",f=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json",...Ae()},body:JSON.stringify({message:b,system:E,history:T.slice(0,-1).map(M=>({role:M.role,text:M.text}))})}),y=await f.json();T.push({role:"assistant",text:f.ok?y.response:`Error: ${y.detail||f.status}`})}catch(E){T.push({role:"assistant",text:`Error: ${E.message}`})}}function q(){if(!o||!m)return null;const b=o.getPath(m),k=[...(b==null?void 0:b.path)||[],v].filter(Boolean),S=new Set,E=k.filter(y=>!S.has(y.id)&&S.add(y.id)).sort((y,M)=>y.label.localeCompare(M.label)),f=X(G(u||""));return E.map(y=>{const M=Ve[y.kind];return{href:G(V(h.level,h.lang,h.model||"gemma4",y.id)),label:M?`${M} ${y.label}`:y.label,isTarget:y.id===f}})}function P(){r.innerHTML="",p.tocSection.innerHTML='<p class="cb-panel__hint">Loading…</p>';const b=document.createElement("iframe");b.className="cb-ide-content__frame",r.appendChild(b);let k=!1,S=0;b.addEventListener("load",()=>{var f;if(!k){try{if((f=b.contentDocument)!=null&&f.querySelector("#app")){k=!0,b.removeAttribute("src"),b.srcdoc=_e(G(u),h.model,h.lang,h.level);return}}catch{}Ze(b),Qe(p.tocSection,b,{isAdmin:_,chatHistory:T,onChatSend:L,tocItems:q(),onConceptClick:y=>{y&&(u=u.replace(/[^/]+\.html$/,y),a&&a(X(y)),E())}})}});function E(){const f=++S;Je(s,u,h.level,h.lang,h.model).then(y=>{f===S&&(k=!y,y?b.src=y:(b.removeAttribute("src"),b.srcdoc=_e(G(u),h.model,h.lang,h.level)))})}E()}function H(b){if(!b)return;u=b;const k=ae(b);h.level=k.level,h.lang=k.lang;const S=oe(b);S&&(h.model=S),P()}function w(b,k){m=b,v=k}function d({model:b,lang:k}={}){b!==void 0&&(h.model=b),k!==void 0&&(h.lang=k),u&&P()}function g(){Te(),u&&P()}return i?P():n&&(r.innerHTML='<p class="cb-panel__hint">Click any node in the graph to see its content.</p>'),{openFile:H,setAnchor:w,setViewParams:d,refresh:g}}function et(){const e=document.createElement("nav");e.className="cb-ide-toc";const t=document.createElement("div");return t.className="cb-ide-toc__section",t.innerHTML='<p class="cb-panel__hint">Select a node in the graph to see its contents.</p>',e.appendChild(t),e.tocSection=t,e}function tt(e){return/^phrase_/.test(e)||[...e].length>1?"book":"concept"}const nt=[{value:"gemma3",label:"gemma3 — local (Ollama)"},{value:"gemma4",label:"gemma4 — local (Ollama)"},{value:"sonnet",label:"sonnet — default (Claude API)"}];function at(e,t,{level:n="intro",lang:o="en",onDone:a,onViewChange:s,onRefresh:i}={}){const c=document.createElement("div");c.className="cb-gen-bar cb-gen-bar__row";const p=document.createElement("select");p.className="cb-gen-bar__select cb-gen-bar__target",p.style.display="none",p.innerHTML='<option value="">Select target to generate…</option>',[...t].sort((w,d)=>w.label.localeCompare(d.label)).forEach(w=>{const d=document.createElement("option");d.value=w.id,d.textContent=w.label,p.appendChild(d)}),c.appendChild(p);const r=document.createElement("select");r.className="cb-gen-bar__select",nt.forEach(w=>{const d=document.createElement("option");d.value=w.value,d.textContent=w.label,w.value==="sonnet"&&(d.selected=!0),r.appendChild(d)}),c.appendChild(r);const l=document.createElement("select");l.className="cb-gen-bar__select",Ce.forEach(w=>{const d=document.createElement("option");d.value=w.code,d.textContent=w.label,w.code===o&&(d.selected=!0),l.appendChild(d)}),c.appendChild(l),s&&(r.addEventListener("change",()=>s(r.value,l.value)),l.addEventListener("change",()=>s(r.value,l.value)));const u=document.createElement("button");u.type="button",u.className="cb-book-pane__refresh",u.title="Refresh — re-check for content that just finished generating",u.textContent="🔄",i&&u.addEventListener("click",i),c.appendChild(u);const m=document.createElement("button");m.type="button",m.className="cb-btn cb-btn--primary",m.textContent="Generate",m.disabled=!0,c.appendChild(m);const v=document.createElement("label");v.className="cb-gen-bar__skip-cache";const h=document.createElement("input");h.type="checkbox",v.appendChild(h),v.appendChild(document.createTextNode("Skip cache")),c.appendChild(v);const _=document.createElement("button");_.type="button",_.className="cb-btn cb-gen-bar__pdf-btn",_.textContent="Export PDF",_.disabled=!0,c.appendChild(_);const T=document.createElement("div");T.className="cb-ide-log-wrap",T.style.display="none";const L=document.createElement("pre");L.className="cb-ide-log";const q=document.createElement("button");q.type="button",q.className="cb-ide-log-copy",q.textContent="Copy",q.addEventListener("click",()=>{navigator.clipboard.writeText(L.textContent).then(()=>{q.textContent="Copied!",setTimeout(()=>{q.textContent="Copy"},1500)})}),T.append(L,q),p.addEventListener("change",()=>{m.disabled=!p.value,_.disabled=!p.value,_.textContent="Export PDF"}),c.setTarget=w=>{[...p.options].some(d=>d.value===w)&&(p.value=w,m.disabled=!1,_.disabled=!1)},c.syncView=({model:w,lang:d}={})=>{w&&[...r.options].some(g=>g.value===w)&&(r.value=w),d&&[...l.options].some(g=>g.value===d)&&(l.value=d)},_.addEventListener("click",async()=>{const w=p.value;if(!w)return;const d=n,g=l.value,N=r.value;_.disabled=!0,_.textContent="Generating…";try{const b=`/api/pdf?domain=${encodeURIComponent(e)}&target=${encodeURIComponent(w)}&level=${encodeURIComponent(d)}&language=${encodeURIComponent(g)}&model=${encodeURIComponent(N)}`,k=await fetch(b),S=await k.json();if(!k.ok)throw new Error(S.detail||"PDF generation failed");const E=`/cb-zinets/domains/${e}/${S.file}`;_.textContent="Export PDF ✓",_.disabled=!1,window.open(E,"_blank","noopener")}catch(b){_.textContent="Error",_.title=b.message,setTimeout(()=>{_.textContent="Export PDF",_.disabled=!1},3e3)}}),m.addEventListener("click",async()=>{const w=p.value;if(!w)return;const d=r.value,g=n,N=l.value,b=h.checked,k=tt(w);m.disabled=!0,m.textContent="Queuing…",T.style.display="block",L.textContent="";let S;try{const f=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domain:e,target:w,level:g,language:N,model:d,skip_cache:b,kind:k})});if(!f.ok)throw new Error(`Queue failed: ${f.status}`);S=(await f.json()).task_id,m.textContent="Generating…"}catch(f){L.textContent=`✗ ${f.message}
  Run: bash scripts/start-api.sh`,m.disabled=!1,m.textContent="Retry";return}const E=new EventSource(`/api/tasks/${S}/stream`);E.addEventListener("log",f=>{const{message:y}=JSON.parse(f.data);L.textContent+=y+`
`,L.scrollTop=L.scrollHeight}),E.addEventListener("done",f=>{E.close();const y=JSON.parse(f.data),M=y.model||d;L.textContent+=`
✓ Done`,m.textContent="Generate",m.disabled=!1,Te(),a&&a(k==="concept"?V(g,N,M,y.target):$e(g,N,M,y.target))}),E.addEventListener("gen_error",f=>{E.close(),L.textContent+=`
✗ ${JSON.parse(f.data).message}`,m.disabled=!1,m.textContent="Retry"}),E.onerror=()=>{E.readyState!==EventSource.CLOSED&&(E.close(),L.textContent+=`
✗ Connection lost`,m.disabled=!1,m.textContent="Retry")}});const P=()=>r.value,H=()=>l.value;return{bar:c,logWrap:T,setTarget:c.setTarget,syncView:c.syncView,getModel:P,getLang:H}}function ot(){return xe()}const st=new Set(["anthropic","gemini","openai","qwen","z","openrouter"]),Q={claude_cli:{label:"Claude CLI",models:[{value:"claude-sonnet-4-6",label:"Sonnet 4.6"},{value:"claude-haiku-4-5-20251001",label:"Haiku 4.5"},{value:"claude-opus-4-8",label:"Opus 4.8"}]},anthropic:{label:"Anthropic",models:[{value:"claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{value:"claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"claude-opus-4-8",label:"Claude Opus 4.8"}]},gemini:{label:"Gemini",models:[{value:"gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"gemini-3.5-flash",label:"Gemini 3.5 Flash"}]},openai:{label:"OpenAI",models:[{value:"gpt-4.1",label:"GPT-4.1"},{value:"gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"o3-mini",label:"o3-mini"}]},qwen:{label:"Qwen",models:[{value:"qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen3.6-35b-a3b",label:"Qwen 3.6 35B"}]},z:{label:"Z (Zhipu)",models:[{value:"glm-5.2",label:"GLM 5.2"}]},openrouter:{label:"OpenRouter",models:[{value:"anthropic/claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{value:"anthropic/claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"anthropic/claude-opus-4-8",label:"Claude Opus 4.8"},{value:"google/gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"google/gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"google/gemini-3.5-flash",label:"Gemini 3.5 Flash"},{value:"openai/gpt-4.1",label:"GPT-4.1"},{value:"openai/gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"openai/o3-mini",label:"o3-mini"},{value:"deepseek/deepseek-r1",label:"DeepSeek R1"},{value:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick"},{value:"z-ai/glm-5.2",label:"GLM 5.2"},{value:"qwen/qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen/qwen3.6-35b-a3b",label:"Qwen 3.6 35B"},{value:"nvidia/nemotron-3-ultra-550b-a55b:free",label:"Nemotron 3 Ultra 550B"},{value:"moonshotai/kimi-k2.6",label:"Kimi 2.6"}]},ollama:{label:"Ollama (local)",models:null}};async function te(e,t){const n=Q[e.value];if(t.innerHTML="",!n)return;let o=n.models;if(e.value==="ollama"&&!o){try{const a=await fetch("/api/settings/ollama-models");a.ok&&(o=await a.json())}catch{}if(!o||o.length===0){const a=document.createElement("option");a.value="",a.textContent="(ollama not available)",t.appendChild(a);return}Q.ollama.models=o}for(const a of o){const s=document.createElement("option");s.value=a.value,s.textContent=a.label,t.appendChild(s)}}function ne(e){if(e===0)return"never expires";if(e<1)return`${Math.round(e*60)} min`;if(e===1)return"1 hour";if(e<24)return`${e} hours`;const t=e/24;return Number.isInteger(t)?`${t} day${t>1?"s":""}`:`${e} hours`}async function ct(e){e.innerHTML="",e._renderKey=Symbol(),e.appendChild(F());const t=document.createElement("main");t.className="cb-settings",t.innerHTML=`
    <h2>Settings</h2>

    <div class="cb-settings__tabs">
      <button class="cb-settings__tab cb-settings__tab--active" data-tab="app">App-specific</button>
      <button class="cb-settings__tab" data-tab="llm">LLM Model</button>
    </div>

    <div class="cb-settings__grid cb-settings__grid--stacked" data-tab-panel="llm" style="display:none">

      <section class="cb-settings__section">
        <div class="cb-settings__section-title">SPL Adapter and Model Configuration</div>
        <div class="cb-settings__pair">
          <div class="cb-settings__field">
            <label class="cb-settings__label">Adapter</label>
            <select id="cb-adapter" class="cb-settings__select">
              ${Object.entries(Q).map(([x,C])=>`<option value="${x}">${C.label}</option>`).join("")}
            </select>
          </div>
          <div class="cb-settings__field cb-settings__field--grow">
            <label class="cb-settings__label">Model</label>
            <select id="cb-model" class="cb-settings__select"></select>
          </div>
        </div>
        <div class="cb-settings__pair" id="cb-api-key-row" style="margin-top:12px">
          <div class="cb-settings__field cb-settings__field--grow">
            <label class="cb-settings__label">API Key</label>
            <div class="cb-settings__row">
              <input id="cb-api-key" type="password" class="cb-settings__input" style="flex:1;min-width:140px"
                autocomplete="off" placeholder="Not set">
              <button id="cb-api-key-save" class="cb-btn">Save</button>
              <button id="cb-api-key-clear" class="cb-btn-ghost">Clear</button>
              <span id="cb-api-key-status" class="cb-settings__status"></span>
            </div>
            <span id="cb-api-key-hint" style="font-size:0.78rem;color:#6b7280">
              Stored in a local .env file (never committed to git) and applied to
              generation jobs immediately — no restart needed. Write-only: once
              saved, only a masked preview is ever shown again.
            </span>
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
  `,e.appendChild(t);const n=t.querySelectorAll(".cb-settings__tab"),o=t.querySelectorAll("[data-tab-panel]");n.forEach(x=>{x.addEventListener("click",()=>{n.forEach(C=>C.classList.toggle("cb-settings__tab--active",C===x)),o.forEach(C=>{C.style.display=C.dataset.tabPanel===x.dataset.tab?"":"none"})})});const a=t.querySelector("#cb-adapter"),s=t.querySelector("#cb-model"),i=t.querySelector("#cb-settings-save"),c=t.querySelector("#cb-settings-status"),p=t.querySelector("#cb-current-llm"),r=t.querySelector("#cb-api-key-row"),l=t.querySelector("#cb-api-key"),u=t.querySelector("#cb-api-key-save"),m=t.querySelector("#cb-api-key-clear"),v=t.querySelector("#cb-api-key-status");let h={};function _(){const x=a.value,C=st.has(x);if(r.style.display=C?"":"none",!C)return;l.value="";const $=h[x];l.placeholder=$!=null&&$.configured?`Configured (${$.masked})`:"Not set"}a.addEventListener("change",()=>{te(a,s),_()}),await te(a,s);try{const x=await fetch("/api/settings/api-keys");x.ok&&(h=await x.json())}catch{}_(),u.addEventListener("click",async()=>{const x=a.value,C=l.value.trim();if(!C){v.textContent="Enter a key first",v.style.color="#dc2626",setTimeout(()=>{v.textContent=""},3e3);return}try{const $=await fetch("/api/settings/api-keys",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({provider:x,api_key:C})}),z=await $.json();if(!$.ok)throw new Error(z.detail||`HTTP ${$.status}`);h[x]={configured:!0,masked:z.masked},l.value="",l.placeholder=`Configured (${z.masked})`,v.textContent="Saved",v.style.color="#16a34a"}catch($){v.textContent=`Failed: ${$.message}`,v.style.color="#dc2626"}setTimeout(()=>{v.textContent=""},3e3)}),m.addEventListener("click",async()=>{const x=a.value;try{const C=await fetch(`/api/settings/api-keys/${x}`,{method:"DELETE"});if(!C.ok)throw new Error(`HTTP ${C.status}`);h[x]={configured:!1,masked:null},l.value="",l.placeholder="Not set",v.textContent="Cleared",v.style.color="#16a34a"}catch(C){v.textContent=`Failed: ${C.message}`,v.style.color="#dc2626"}setTimeout(()=>{v.textContent=""},3e3)});const T=t.querySelector("#cb-while-max-iter"),L=t.querySelector("#cb-max-llm-calls"),q=t.querySelector("#cb-max-tokens"),P=t.querySelector("#cb-max-concurrent"),H=t.querySelector("#cb-spl-limits-save"),w=t.querySelector("#cb-spl-limits-status"),d=t.querySelector("#cb-graph-layout"),g=t.querySelector("#cb-graph-layout-save"),N=t.querySelector("#cb-graph-layout-status");d.value=localStorage.getItem("cb_graph_layout")||"compact",g.addEventListener("click",()=>{localStorage.setItem("cb_graph_layout",d.value),N.textContent="Saved — reload the graph page to apply",N.style.color="#16a34a",setTimeout(()=>{N.textContent=""},4e3)});const b=t.querySelector("#cb-cache-ttl"),k=t.querySelector("#cb-cache-ttl-hint"),S=t.querySelector("#cb-cache-save"),E=t.querySelector("#cb-cache-status");b.addEventListener("input",()=>{const x=Number(b.value);k.textContent=isNaN(x)||x<0?"":ne(x)});const f=t.querySelector("#cb-concept-cache-enabled"),y=t.querySelector("#cb-concept-cache-label"),M=t.querySelector("#cb-concept-cache-save"),I=t.querySelector("#cb-concept-cache-status");function A(){const x=f.checked;y.textContent=x?"Enabled":"Disabled",y.style.color=x?"#16a34a":"var(--color-muted)"}f.addEventListener("change",A);const Y=t.querySelector("#cb-catalog-sync"),K=t.querySelector("#cb-catalog-sync-status");Y.addEventListener("click",async()=>{var x;Y.disabled=!0,K.style.color="var(--color-muted)",K.textContent="Syncing…";try{const C=await fetch("/api/catalog/sync",{method:"POST"}),$=await C.json();if(!C.ok||!$.ok)throw new Error($.detail||`HTTP ${C.status}`);const z=[`${$.scanned} domains scanned`,$.added?`${$.added} added`:null,`${$.refreshed} refreshed`,`${$.books} books`,`${$.concepts} concepts`,$.concepts_without_pinyin?`${$.concepts_without_pinyin} without pinyin`:null,(x=$.default_symlinks)!=null&&x.linked?`${$.default_symlinks.linked} default symlinks created`:null].filter(Boolean);K.style.color="#16a34a",K.textContent=`Synced — ${z.join(", ")}`}catch(C){K.style.color="#dc2626",K.textContent=`Sync failed: ${C.message}`}finally{Y.disabled=!1}});try{const x=await fetch("/api/settings");if(x.ok){const C=await x.json();p.textContent=`Current: ${C.llm}`;const[$,...z]=C.llm.split(":"),W=z.join(":");Q[$]&&(a.value=$,await te(a,s),[...s.options].some(Me=>Me.value===W)&&(s.value=W)),C.spl_while_max_iter&&(T.value=C.spl_while_max_iter),C.spl_max_llm_calls&&(L.value=C.spl_max_llm_calls),C.spl_max_tokens&&(q.value=C.spl_max_tokens),C.task_max_concurrent&&(P.value=C.task_max_concurrent);const me=Math.round(C.compare_cache_ttl/3600);b.value=me,k.textContent=ne(me),C.use_concept_cache!==void 0&&(f.checked=!!C.use_concept_cache,A())}}catch{c.textContent="API not reachable — run the backend to change settings",c.style.color="#dc2626"}i.addEventListener("click",async()=>{const x=`${a.value}:${s.value}`;try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({llm:x})})).ok?(p.textContent=`Current: ${x}`,c.textContent="Saved",c.style.color="#16a34a"):(c.textContent="Save failed",c.style.color="#dc2626")}catch{c.textContent="API not reachable",c.style.color="#dc2626"}setTimeout(()=>{c.textContent=""},3e3)}),H.addEventListener("click",async()=>{const x=Number(T.value),C=Number(L.value),$=Number(q.value),z=Number(P.value);if(!Number.isInteger(x)||x<1||!Number.isInteger(C)||C<1||!Number.isInteger($)||$<100||!Number.isInteger(z)||z<1){w.textContent="Enter valid integers (iterations/calls ≥ 1, tokens ≥ 100, parallel ≥ 1)",w.style.color="#dc2626",setTimeout(()=>{w.textContent=""},3e3);return}try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({spl_while_max_iter:x,spl_max_llm_calls:C,spl_max_tokens:$,task_max_concurrent:z})})).ok?(w.textContent="Saved",w.style.color="#16a34a"):(w.textContent="Save failed",w.style.color="#dc2626")}catch{w.textContent="API not reachable",w.style.color="#dc2626"}setTimeout(()=>{w.textContent=""},3e3)}),S.addEventListener("click",async()=>{const x=Number(b.value);if(isNaN(x)||x<0){E.textContent="Enter a valid number ≥ 0",E.style.color="#dc2626",setTimeout(()=>{E.textContent=""},3e3);return}const C=Math.round(x*3600);try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({compare_cache_ttl:C})})).ok?(k.textContent=ne(x),E.textContent="Saved",E.style.color="#16a34a"):(E.textContent="Save failed",E.style.color="#dc2626")}catch{E.textContent="API not reachable",E.style.color="#dc2626"}setTimeout(()=>{E.textContent=""},3e3)}),M.addEventListener("click",async()=>{try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({use_concept_cache:f.checked})})).ok?(I.textContent="Saved",I.style.color="#16a34a"):(I.textContent="Save failed",I.style.color="#dc2626")}catch{I.textContent="API not reachable",I.style.color="#dc2626"}setTimeout(()=>{I.textContent=""},3e3)})}async function ue(e,{id:t,file:n}={}){var E;(E=e._abortController)==null||E.abort();const o=new AbortController;e._abortController=o,e.innerHTML="",e.className="";const a=Symbol();e._renderKey=a;let s=null,i=[];try{i=await Se(),t&&(s=i.find(f=>f.id===t)??{id:t,name:t,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(e._renderKey!==a)return;const c=document.createElement("div");c.style.cssText="display:flex;flex-direction:column;height:100vh;overflow:hidden",e.appendChild(c),c.appendChild(F({domainName:(s==null?void 0:s.name)||""}));const p=document.createElement("div");p.className="cb-domain-picker-bar";const r=document.createElement("span");r.className="cb-domain-picker-bar__label",r.textContent="Domain",p.appendChild(r);const l=document.createElement("input");l.type="text",l.placeholder="Search phrase or pinyin…",l.autocomplete="off",l.className="cb-domain-picker-bar__select",p.appendChild(l);const u=document.createElement("select");u.className="cb-domain-picker-bar__select";function m(){const f=l.value.trim(),y=f?i.filter(I=>pe(I.name||I.id,I.pinyin,I.pinyin_initials,f)):i;u.innerHTML="";const M=document.createElement("option");return M.value="",M.textContent=y.length?"Select domain…":"No match",u.appendChild(M),[...y].sort((I,A)=>I.id.localeCompare(A.id,"zh")).forEach(I=>{const A=document.createElement("option");A.value=I.id,A.textContent=I.name||I.id,I.id===t&&(A.selected=!0),u.appendChild(A)}),y}let v=m();l.addEventListener("input",()=>{v=m()}),l.addEventListener("keydown",f=>{f.key==="Enter"&&v.length&&(window.location.hash=`/domain/${encodeURIComponent(v[0].id)}`)});function h(){u.value&&(window.location.hash=`/domain/${encodeURIComponent(u.value)}`)}u.addEventListener("change",h),p.appendChild(u);const _=document.createElement("button");if(_.type="button",_.className="cb-btn cb-btn--primary cb-domain-picker-bar__load",_.textContent="Load",_.addEventListener("click",h),p.appendChild(_),c.appendChild(p),!t||!s)return;if(s.source){const f=document.createElement("div");f.className="cb-attribution",f.innerHTML=`Source: <a href="${s.source.url}" target="_blank">${s.source.title}</a> by ${s.source.authors} (${s.source.license}). ${s.source.attribution}`,c.appendChild(f)}const T=s.default_level||"intro",L=ot(),q=document.createElement("main");q.className="cb-ide-layout";const P=document.createElement("div");P.className="cb-ide-left";const H=parseFloat(localStorage.getItem("cb_ide_split"))||40;P.style.flex=`0 0 ${H}%`;const w=De(s,{level:T,lang:L});P.appendChild(w);const d=document.createElement("div");d.className="cb-ide-gutter",d.title="Drag to resize";const g=document.createElement("div");g.className="cb-ide-right";const N=document.createElement("div");g.appendChild(N);const b=document.createElement("div");g.appendChild(b);const k=Ye(b,{domain:t,file:n},{embedded:!0,graphViewer:w,onNodeChange:f=>S==null?void 0:S.setTarget(f)});q.append(P,d,g),c.appendChild(q),it(d,P,q,o.signal);let S=null;window.addEventListener("cb:graphLoaded",f=>{if(S)return;const y=f.detail.concepts||[];if(S=at(t,y,{level:T,lang:L,onDone:M=>k.openFile(M),onViewChange:(M,I)=>k.setViewParams({model:M,lang:I}),onRefresh:()=>k.refresh()}),N.appendChild(S.bar),g.appendChild(S.logWrap),n){const{lang:M}=ae(n),I=oe(n);S.syncView({model:I,lang:M}),S.setTarget(X(n))}},{signal:o.signal}),window.addEventListener("cb:nodeSelected",f=>{const{nodeId:y,node:M}=f.detail;k.setAnchor(y,M);const I=(S==null?void 0:S.getModel())??"sonnet",A=y.startsWith("phrase_")?$e(T,L,I,y):V(T,L,I,y);k.openFile(A),S==null||S.setTarget(y)},{signal:o.signal})}function it(e,t,n,o){e.addEventListener("pointerdown",i=>{i.preventDefault(),e.setPointerCapture(i.pointerId),document.body.style.cursor="col-resize",document.body.style.userSelect="none";let c=null;const p=l=>{const u=n.getBoundingClientRect(),m=Math.min(.8,Math.max(.2,(l.clientX-u.left)/u.width));c=m,t.style.flex=`0 0 ${(m*100).toFixed(2)}%`},r=l=>{e.releasePointerCapture(l.pointerId),document.body.style.cursor="",document.body.style.userSelect="",c!=null&&localStorage.setItem("cb_ide_split",(c*100).toFixed(2)),e.removeEventListener("pointermove",p),e.removeEventListener("pointerup",r),e.removeEventListener("pointercancel",r)};e.addEventListener("pointermove",p,{signal:o}),e.addEventListener("pointerup",r,{signal:o}),e.addEventListener("pointercancel",r,{signal:o})},{signal:o})}function lt(e){e.innerHTML="",e._renderKey=Symbol(),e.appendChild(F());const t=document.createElement("main");t.className="cb-about",t.innerHTML=`
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
  `,e.appendChild(t)}let Z=null;async function rt(){if(Z)return Z;const e=await fetch("/cb-zinets/resources.json",{cache:"no-cache"});if(!e.ok)throw new Error(`Failed to load resources: ${e.status}`);return Z=await e.json(),Z}function dt(e,t){e.innerHTML=`
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
  `}function pt(e){e.innerHTML="",e._renderKey=Symbol();const t=e._renderKey;e.appendChild(F());const n=document.createElement("main");n.className="cb-resources",n.innerHTML=`
    <h1>Resources</h1>
    <p>
      Great dictionaries and reference sites for looking up Chinese characters and phrases.
      Sites marked for concept pages are also linked directly from each character's concept page;
      the remaining entries are general references available here for browsing.
    </p>
    <div id="cb-resources-table-wrap" class="cb-resources-table-wrap">
      <div class="cb-home-empty">Loading…</div>
    </div>
  `,e.appendChild(n);const o=n.querySelector("#cb-resources-table-wrap");rt().then(a=>{e._renderKey===t&&dt(o,a)}).catch(()=>{e._renderKey===t&&(o.innerHTML='<div class="cb-home-empty">Failed to load resources.</div>')})}function ut(e,t={}){e.innerHTML="";const n=document.createElement("div");n.style.cssText="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb";const o=document.createElement("div");o.style.cssText=["background:#fff","border:1px solid #e5e7eb","border-radius:8px","padding:40px","width:340px","box-shadow:0 2px 8px rgba(0,0,0,.08)"].join(";"),o.innerHTML=`
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
    <p style="margin:16px 0 0;text-align:center;font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif">
      Don't have an account? <a href="#/signup" style="color:#2563eb;text-decoration:none">Sign up</a>
    </p>
  `,n.appendChild(o),e.appendChild(n);const a=o.querySelector("#cb-login-user"),s=o.querySelector("#cb-login-pass"),i=o.querySelector("#cb-login-btn"),c=o.querySelector("#cb-login-err"),p=o.querySelector("#cb-login-google-wrap"),r=o.querySelector("#cb-login-google");a.focus(),t.error&&(c.textContent=decodeURIComponent(t.error)),fetch("/api/auth/providers").then(u=>u.ok?u.json():null).then(u=>{u!=null&&u.google&&(p.style.display="")}).catch(()=>{}),r.addEventListener("click",()=>{window.location.href="/api/auth/google/login"});async function l(){c.textContent="",i.disabled=!0,i.textContent="Signing in…";try{const u=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:a.value.trim(),password:s.value})});if(u.ok){const m=await u.json();re(m.token),de(m.user),window.location.hash="/"}else{const m=await u.json().catch(()=>({}));c.textContent=m.detail||"Login failed"}}catch{c.textContent="Cannot connect to server"}finally{i.disabled=!1,i.textContent="Sign in"}}i.addEventListener("click",l),s.addEventListener("keydown",u=>{u.key==="Enter"&&l()}),a.addEventListener("keydown",u=>{u.key==="Enter"&&s.focus()})}function mt(e){e.innerHTML="";const t=document.createElement("div");t.style.cssText="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb";const n=document.createElement("div");n.style.cssText=["background:#fff","border:1px solid #e5e7eb","border-radius:8px","padding:40px","width:340px","box-shadow:0 2px 8px rgba(0,0,0,.08)"].join(";"),n.innerHTML=`
    <h1 style="margin:0 0 6px;display:flex;align-items:center;gap:8px;font-size:1.3rem;font-weight:700;color:#111;font-family:system-ui,sans-serif">
      <img src="/cb-zinets/brand/seal-zi-logo.png" alt="" style="height:28px;width:auto;display:block">ConceptBook
    </h1>
    <p style="margin:0 0 28px;font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif">Create an account</p>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Username</label>
      <input id="cb-su-user" type="text" autocomplete="username"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Password</label>
      <input id="cb-su-pass" type="password" autocomplete="new-password"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <div style="margin-bottom:24px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Email <span style="font-weight:400;color:#9ca3af">(optional)</span></label>
      <input id="cb-su-email" type="email" autocomplete="email"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <button id="cb-su-btn" class="cb-btn" style="width:100%;padding:10px;font-size:1rem">Create account</button>
    <div id="cb-su-err" style="margin-top:12px;font-size:.875rem;color:#dc2626;text-align:center;min-height:20px;font-family:system-ui,sans-serif"></div>
    <p style="margin:16px 0 0;text-align:center;font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif">
      Already have an account? <a href="#/login" style="color:#2563eb;text-decoration:none">Sign in</a>
    </p>
  `,t.appendChild(n),e.appendChild(t);const o=n.querySelector("#cb-su-user"),a=n.querySelector("#cb-su-pass"),s=n.querySelector("#cb-su-email"),i=n.querySelector("#cb-su-btn"),c=n.querySelector("#cb-su-err");o.focus();async function p(){c.textContent="",i.disabled=!0,i.textContent="Creating…";try{const r=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:o.value.trim(),password:a.value,email:s.value.trim()||null})});if(r.ok){const l=await r.json();re(l.token),de(l.user),window.location.hash="/"}else{const l=await r.json().catch(()=>({}));c.textContent=l.detail||"Sign up failed"}}catch{c.textContent="Cannot connect to server"}finally{i.disabled=!1,i.textContent="Create account"}}i.addEventListener("click",p),a.addEventListener("keydown",r=>{r.key==="Enter"&&p()}),o.addEventListener("keydown",r=>{r.key==="Enter"&&a.focus()})}const R=document.getElementById("app");async function D(e){{e();return}}O("/",()=>D(()=>je(R)));O("/graph",()=>D(()=>ue(R,{})));O("/about",()=>D(()=>lt(R)));O("/resources",()=>D(()=>pt(R)));O("/settings",()=>D(()=>ct(R)));O("/domain/:id",e=>D(()=>ue(R,e)));O("/book",e=>D(()=>ue(R,{id:e.domain,file:e.file})));O("/login",e=>ut(R,e));O("/signup",()=>mt(R));O("/auth/callback",async e=>{e.token?(re(e.token),await ze(),U("/")):U("/login")});Ie();
