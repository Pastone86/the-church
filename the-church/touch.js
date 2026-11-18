/* The Church — comandi touch condivisi (Strade e Quartiere).
 * Joystick a sinistra, pulsanti a destra, sopra l'area di gioco.
 * Ogni dito "possiede" un solo comando: muoversi e colpire insieme funziona.
 * Idea del layout presa da Je suis Maranza (F. D'Isa, Apache-2.0, dist/mobile.js).
 */
(function(root){'use strict';
const coarse=()=>matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
function phone(){const w=document.documentElement.clientWidth,h=window.innerHeight;return w<=600||Math.min(w,h)<=540||(w<=1180&&coarse());}
function create(host,{buttons=[],onPress=()=>{},onRelease=()=>{}}={}){
 const wrap=document.createElement('div');wrap.className='tc';wrap.hidden=true;
 wrap.innerHTML='<div class="tc-left" aria-label="Zona joystick: trascina per muoverti"><div class="tc-base"><i class="tc-knob"></i></div><span class="tc-hint">MUOVI</span></div><div class="tc-right"></div>';
 host.appendChild(wrap);
 const left=wrap.querySelector('.tc-left'),base=wrap.querySelector('.tc-base'),knob=wrap.querySelector('.tc-knob'),right=wrap.querySelector('.tc-right');
 const state={x:0,y:0,held:new Set(),owner:null,buttons:{}};
 let home=null;
 const place=(x,y)=>{base.style.left=x+'px';base.style.top=y+'px';};
 const resetStick=()=>{state.x=state.y=0;knob.style.transform='translate(-50%,-50%)';if(home){place(home[0],home[1]);}base.classList.remove('on');};
 const move=e=>{const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.42;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max;}
  state.x=Math.abs(dx/max)<.18?0:dx/max;state.y=Math.abs(dy/max)<.18?0:dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;};
 left.addEventListener('pointerdown',e=>{e.preventDefault();if(state.owner!==null)return;state.owner=e.pointerId;left.setPointerCapture(e.pointerId);const r=left.getBoundingClientRect();if(!home){const b=base.getBoundingClientRect();home=[b.left-r.left+b.width/2,b.top-r.top+b.height/2];}place(e.clientX-r.left,e.clientY-r.top);base.classList.add('on');move(e);});
 left.addEventListener('pointermove',e=>{if(e.pointerId===state.owner)move(e);});
 const endStick=e=>{if(e.pointerId!==state.owner)return;state.owner=null;resetStick();};
 for(const t of ['pointerup','pointercancel','lostpointercapture'])left.addEventListener(t,endStick);
 for(const b of buttons){const el=document.createElement('button');el.type='button';el.className='tc-btn tc-'+b.id+' '+(b.cls||'');el.dataset.id=b.id;el.innerHTML=`<b>${b.label}</b><span>${b.sub||''}</span><em class="tc-cd"></em>`;el.setAttribute('aria-label',b.aria||b.label);right.appendChild(el);state.buttons[b.id]=el;let owner=null;
  el.addEventListener('pointerdown',e=>{e.preventDefault();if(owner!==null)return;owner=e.pointerId;el.setPointerCapture(e.pointerId);el.classList.add('pressed');state.held.add(b.id);onPress(b.id);if(navigator.vibrate&&b.buzz)try{navigator.vibrate(12);}catch{}});
  const up=e=>{if(e.pointerId!==owner)return;owner=null;el.classList.remove('pressed');state.held.delete(b.id);onRelease(b.id);};
  for(const t of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(t,up);
  el.addEventListener('contextmenu',e=>e.preventDefault());}
 // disposizione ad arco attorno al pulsante principale (pollice destro): niente sovrapposizioni
 const INNER=['jump','lk','brake','guard','car','hk','hp','kick'];
 const ringOf=id=>['punch','lp'].includes(id)?0:(/^special|^super|^relic/.test(id)?2:1);
 const SIDE_ROWS=[['kick','punch'],['lk','lp'],['hk','hp'],['guard','jump'],['brake','car'],['special1','special2'],['special3','super'],['relic']];
 const layout=()=>{const port=window.innerHeight>window.innerWidth,R0=document.documentElement;
  // comandi FUORI dal riquadro di gioco: colonna a sinistra (joystick) e a destra (pulsanti in griglia)
  if(R0.classList.contains('side-ctrl')&&!port){const ids=buttons.map(b=>b.id),flat=SIDE_ROWS.flat().filter(i=>ids.includes(i)).concat(ids.filter(i=>!SIDE_ROWS.flat().includes(i)));const rows=[];for(let i=0;i<flat.length;i+=2)rows.push(flat.slice(i,i+2));
   const S=Math.max(120,Math.min(200,window.innerWidth*.19)),H=window.innerHeight,b=Math.floor(Math.min(S*.45,(H-20)/(rows.length*1.1)));R0.style.setProperty('--side',S+'px');wrap.style.setProperty('--b',b+'px');
   rows.forEach((row,ri)=>row.forEach((id,ci)=>{const el=state.buttons[id];const col=row.length===1?.5:1-ci,sz=id==='punch'||id==='lp'?1.08:1;Object.assign(el.style,{width:b*sz+'px',height:b*sz+'px',right:Math.round(8+col*b*1.12)+'px',bottom:Math.round(10+ri*b*1.1)+'px'});}));return;}
  wrap.style.removeProperty('--b');const ids=buttons.map(b=>b.id);const r1=ids.filter(i=>ringOf(i)===1).sort((a,b)=>INNER.indexOf(a)-INNER.indexOf(b)),r2=ids.filter(i=>ringOf(i)===2);
  const put=(id,ang,rad,size)=>{const el=state.buttons[id];const a=ang*Math.PI/180;const cx=1.25-Math.cos(a)*rad,cy=1.0+Math.sin(a)*rad;Object.assign(el.style,{width:`calc(var(--b)*${size})`,height:`calc(var(--b)*${size})`,right:`calc(var(--b)*${(cx-size/2).toFixed(3)})`,bottom:`calc(var(--b)*${(cy-size/2).toFixed(3)})`});};
  ids.filter(i=>ringOf(i)===0).forEach(id=>put(id,0,0,1.3));
  const spread=(list,from,to,rad,size)=>list.forEach((id,i)=>put(id,list.length===1?(from+to)/2:from+(to-from)*i/(list.length-1),rad,typeof size==='function'?size(id):size));
  spread(r1,port?190:200,75,1.45,.95);spread(r2,port?160:180,80,2.55,id=>id==='super'?1:.86);};layout();window.addEventListener('resize',layout);new MutationObserver(()=>layout()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});window.addEventListener('orientationchange',()=>setTimeout(layout,300));
 for(const t of ['gesturestart','dblclick','contextmenu'])wrap.addEventListener(t,e=>e.preventDefault());
 wrap.addEventListener('touchmove',e=>{if(e.cancelable)e.preventDefault();},{passive:false});
 return{state,el:wrap,
  show(v){wrap.hidden=!v;if(!v){state.held.clear();state.owner=null;resetStick();Object.values(state.buttons).forEach(b=>b.classList.remove('pressed'));}},
  set(id,{label,sub,ready,disabled,cd,hidden}={}){const el=state.buttons[id];if(!el)return;if(label!==undefined)el.querySelector('b').textContent=label;if(sub!==undefined)el.querySelector('span').textContent=sub;if(hidden!==undefined)el.hidden=hidden;el.classList.toggle('ready',!!ready);el.classList.toggle('off',!!disabled);const c=el.querySelector('.tc-cd');c.style.height=cd?Math.round(cd*100)+'%':'0';},
  reset(){state.held.clear();resetStick();}};
}
// Orizzontale: schermo intero + blocco orientamento quando il browser lo consente.
async function landscape(el=document.documentElement){try{if(!document.fullscreenElement&&el.requestFullscreen)await el.requestFullscreen({navigationUI:'hide'});}catch{}try{await screen.orientation?.lock?.('landscape');}catch{}}
function watch(onChange){const root=document.documentElement;const tv=location.port==='8977'||/[?&]tv=1/.test(location.search);const upd=()=>{const ph=phone();root.classList.toggle('phone-ui',ph||tv);root.classList.toggle('tv',tv);root.classList.toggle('is-portrait',ph&&window.innerHeight>window.innerWidth);root.style.setProperty('--vh',window.innerHeight+'px');onChange?.(ph);};window.addEventListener('resize',upd);window.addEventListener('orientationchange',()=>setTimeout(upd,250));upd();return upd;}
root.ChurchTouch={create,phone,landscape,watch,coarse};
})(window);
