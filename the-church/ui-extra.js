/* The Church 2.4 — extra comuni alle tre modalità:
 * - scheda personaggio che si apre sotto la riga quando tocchi un ritratto (ritocchi: si chiude);
 * - comandi fuori dal riquadro di gioco (con pulsante per tornare ai comandi sopra);
 * - schermo intero accanto a pausa/audio, nascosto dove il browser non lo permette (iPhone);
 * - suggerimento "Aggiungi a Home" su iPhone per giocare senza la barra del browser.
 */
(function(){'use strict';
const root=document.documentElement,esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
const roster=(window.CHURCH_DATA&&window.CHURCH_DATA.personaggi&&window.CHURCH_DATA.personaggi.personaggi)||[];
const label=c=>(window.SAF&&window.SAF.label?window.SAF.label(c):c.nome);

/* ---------- stile ---------- */
const css=document.createElement('style');css.textContent=`
.cinfo{grid-column:1/-1;background:#0d141a;border:2px solid #ffc66b;border-radius:6px;padding:12px 14px;color:#f5e5c5;font:13px/1.45 ui-monospace,Consolas,monospace;text-align:left;animation:cinfo .16s ease-out;min-width:0}
@keyframes cinfo{from{opacity:0;transform:translateY(-4px)}}
.cinfo h3{margin:0 0 2px;font-size:16px;color:#ffc66b;letter-spacing:.04em}.cinfo .nick{color:#a5ada9;font-size:12px;margin:0 0 8px}
.cinfo p{margin:0 0 8px}.cinfo .st{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:#8bd5cd;margin-bottom:8px}
.cinfo h4{margin:10px 0 4px;font-size:11px;letter-spacing:.14em;color:#e9757a}.cinfo ul{margin:0;padding-left:16px;display:grid;gap:4px}
.cinfo kbd{font:inherit;font-size:11px;padding:0 4px;border:1px solid #ffffff33;border-radius:3px;background:#000;white-space:nowrap}
.cinfo .note{color:#c9c1ab;font-size:12px}.cinfo .vitt{font-style:italic;color:#ffe1a0;margin-top:8px}
.cinfo .close{float:right;background:none;border:1px solid #ffffff33;color:#f5e5c5;border-radius:4px;padding:2px 8px;cursor:pointer;font:inherit}
.tc-top .xbtn{font-size:15px}
.ios-hint{position:relative;z-index:30;margin:8px max(12px,env(safe-area-inset-left));padding:10px 12px;border:1px solid #ffc66b88;border-radius:6px;background:#1a232b;color:#f5e5c5;font:12px/1.4 ui-monospace,monospace}
.ios-hint button{float:right;background:none;border:0;color:#ffc66b;font:inherit;cursor:pointer}
html.playing .ios-hint{display:none}
`;document.head.appendChild(css);

/* ---------- scheda personaggio ---------- */
function infoHTML(id){const c=roster.find(r=>r.id===id);if(!c)return'';const k=window.ChurchPowers?.kit?.(id),keys=['L','U','I'];
 const st=c.stats||{};const mosse=(c.mosse||[]).filter(m=>!m.extra);
 return `<button class="close" type="button" aria-label="Chiudi">✕</button><h3>${esc(label(c))}</h3><p class="nick">${c.soprannome?'«'+esc(c.soprannome)+'» · ':''}${esc(c.archetipo||'')}</p>
 <p>${esc(c.descrizione)}</p><div class="st"><span>VITA ${st.vita??'-'}</span><span>VELOCITÀ ${st.velocita??'-'}</span><span>PORTATA ${st.portata??'-'}</span><span>PESO ${st.peso??'-'}</span></div>
 ${mosse.length?`<h4>MOSSE</h4><ul>${mosse.map(m=>`<li><b>${esc(m.nome)}</b> <kbd>${esc(m.comando)}</kbd><br><span class="note">${esc(m.note||'')}</span></li>`).join('')}${c.super?`<li><b>SUPER · ${esc(c.super.nome)}</b><br><span class="note">${esc(c.super.note||'')}</span></li>`:''}</ul>`:''}
 ${k?`<h4>NELLE STRADE E NEL QUARTIERE</h4><ul>${k.passive?.label?`<li><b>Passiva</b> <span class="note">${esc(k.passive.label)}</span></li>`:''}${(k.moves||[]).map((m,i)=>`<li><kbd>${keys[i]}</kbd> <b>${esc(m.name)}</b> <span class="note">${esc(m.desc||'')}</span></li>`).join('')}${k.sup?`<li><kbd>O</kbd> <b>${esc(k.sup.name)}</b> <span class="note">${esc(k.sup.desc||'')}</span></li>`:''}</ul>`:''}
 ${c.vittoria?`<p class="vitt">«${esc(c.vittoria)}»</p>`:''}`;}
function attachInfo(grid,tileSel){if(!grid)return;let open=null;
 const place=()=>{grid.querySelectorAll(':scope > .cinfo').forEach(n=>n.remove());if(!open)return;const tiles=[...grid.querySelectorAll(':scope > '+tileSel)];const t=tiles.find(x=>x.dataset.id===open);if(!t){open=null;return;}
  const top=t.offsetTop;let last=t;for(const x of tiles)if(Math.abs(x.offsetTop-top)<4)last=x;
  const box=document.createElement('div');box.className='cinfo';box.innerHTML=infoHTML(open);box.querySelector('.close').onclick=e=>{e.stopPropagation();open=null;place();};last.after(box);
  const r=box.getBoundingClientRect();if(r.bottom>innerHeight)box.scrollIntoView({block:'nearest',behavior:'smooth'});};
 grid.addEventListener('click',e=>{if(e.target.closest('.cinfo'))return;const t=e.target.closest(tileSel);if(!t||!t.dataset.id)return;open=open===t.dataset.id?null:t.dataset.id;setTimeout(place,0);});
 new MutationObserver(()=>{if(open&&!grid.querySelector(':scope > .cinfo'))place();}).observe(grid,{childList:true});
 let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(place,150);});}

/* ---------- comandi fuori / sopra, schermo intero ---------- */
if(store.get('church-side-ctrl')!=='0')root.classList.add('side-ctrl');
const fsOK=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
const target=()=>document.querySelector('.screen,.cabinet')||document.documentElement;
function toggleFS(){if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document)?.catch?.(()=>{});return;}const el=target();const req=el.requestFullscreen||el.webkitRequestFullscreen;try{const p=req&&req.call(el,{navigationUI:'hide'});p&&p.catch&&p.catch(()=>{});}catch{}}
function addTopButtons(){document.querySelectorAll('.tc-top').forEach(bar=>{if(bar.querySelector('.xbtn'))return;
  if(fsOK){const b=document.createElement('button');b.className='xbtn';b.type='button';b.textContent='⛶';b.setAttribute('aria-label','Schermo intero');b.onclick=toggleFS;bar.insertBefore(b,bar.lastElementChild);}
  const s=document.createElement('button');s.className='xbtn';s.type='button';s.setAttribute('aria-label','Comandi fuori o sopra il gioco');const upd=()=>{s.textContent=root.classList.contains('side-ctrl')?'⇥⇤':'⇤⇥';};upd();
  s.onclick=()=>{root.classList.toggle('side-ctrl');store.set('church-side-ctrl',root.classList.contains('side-ctrl')?'1':'0');upd();dispatchEvent(new Event('resize'));};bar.insertBefore(s,bar.lastElementChild);});
 if(!fsOK)document.querySelectorAll('#fullscreen').forEach(b=>b.hidden=true);}

/* ---------- iPhone: aggiungi alla schermata Home ---------- */
function iosHint(){const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);const standalone=navigator.standalone||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches;
 if(!ios||standalone||store.get('church-ios-hint')==='0')return;const d=document.createElement('div');d.className='ios-hint';
 d.innerHTML='<button type="button" aria-label="Chiudi">✕</button><b>Schermo intero su iPhone:</b> tocca <b>Condividi</b> (il quadrato con la freccia) → <b>Aggiungi alla schermata Home</b>. Aprendo il gioco dall’icona sparisce la barra del browser.';
 d.querySelector('button').onclick=()=>{d.remove();store.set('church-ios-hint','0');};document.body.prepend(d);}

function init(){addTopButtons();iosHint();
 const g=document.getElementById('roster');if(g){if(g.querySelector('.fighter-tile')||/duelli/.test(location.pathname))attachInfo(g,'.fighter-tile');else attachInfo(g,'.fighter');}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.ChurchUI={infoHTML,attachInfo,toggleFS};
})();
