/* The Church 2.2 — joypad (PC, RetroPie, console USB/Bluetooth).
 * Traduce i tasti del controller nei tasti della tastiera già usati dal gioco.
 * Nei menu: croce/levetta spostano la selezione, A conferma, START avvia.
 * SELECT + START tenuti per 1,5 secondi: esci (su RetroPie torna a EmulationStation).
 * Schema Xbox/standard: 0 A · 1 B · 2 X · 3 Y · 4 L · 5 R · 6 LT · 7 RT · 8 SELECT · 9 START · 12-15 croce.
 */
(function(){'use strict';
const page=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
const MAPS={
 strade:[{0:'KeyJ',1:'KeyK',2:'KeyL',3:'KeyU',4:'ShiftLeft',5:'Space',6:'KeyI',7:'KeyO',9:'KeyP'},{chords:[[[4,5],'KeyO'],[[2,3],'KeyI']]}],
 quartiere:[{0:'KeyJ',1:'KeyK',2:'KeyL',3:'KeyU',4:'KeyE',5:'Space',6:'KeyI',7:'KeyO',8:'KeyM',9:'KeyP'},{chords:[[[4,5],'KeyO'],[[2,3],'KeyI']]}],
 duelli:[{0:'KeyG',1:'KeyB',2:'KeyH',3:'KeyN',4:'KeyJ',5:'KeyK',6:'KeyL',7:'KeyO',8:'KeyV',9:'KeyP'},{chords:[[[4,5],'KeyO'],[[2,3],'KeyL']]}],
};
const P2={0:'Numpad1',1:'Numpad4',2:'Numpad2',3:'Numpad5',4:'Numpad7',5:'Numpad8',6:'Numpad9',7:'Numpad0',8:'Numpad6'};
const DIR1={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD'},DIR2={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
let inGame=()=>false;
const held=new Map();// code -> true
function key(code,down){if(!!held.get(code)===down)return;held.set(code,down);window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,key:code,bubbles:true,cancelable:true}));}
function releaseAll(){for(const [code,v] of held)if(v)key(code,false);}
// ---- navigazione nei menu
function vis(el){return!!el&&!el.disabled&&!el.closest('[hidden]')&&el.getBoundingClientRect().width>0;}
function dialog(){for(const id of ['brief','result','end']){const d=document.getElementById(id);if(d&&!d.hidden&&vis(d.querySelector('button')))return d;}return null;}
function focusables(){const root=dialog()||document;return[...root.querySelectorAll('a[href],button,select,input:not([type=hidden]),[tabindex="0"]')].filter(el=>{if(el.disabled||el.closest('[hidden]')||el.closest('.tc'))return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';});}
function moveFocus(dx,dy){const list=focusables();if(!list.length)return;const cur=document.activeElement;if(!list.includes(cur)){const f=(list.includes(primary())&&primary())||list[0];f.focus();f.scrollIntoView({block:'nearest'});return;}
 if(cur.tagName==='SELECT'&&dx){const i=Math.max(0,Math.min(cur.options.length-1,cur.selectedIndex+dx));if(i!==cur.selectedIndex){cur.selectedIndex=i;cur.dispatchEvent(new Event('change',{bubbles:true}));cur.dispatchEvent(new Event('input',{bubbles:true}));}return;}
 const a=cur.getBoundingClientRect(),ax=a.left+a.width/2,ay=a.top+a.height/2;let best=null,bd=1e9;
 for(const el of list){if(el===cur)continue;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,vx=x-ax,vy=y-ay;const along=dx?vx*dx:vy*dy;if(along<=4)continue;const across=dx?Math.abs(vy):Math.abs(vx);const d=along+across*2.2;if(d<bd){bd=d;best=el;}}
 if(!best&&dy){const i=list.indexOf(cur);best=list[(i+(dy>0?1:-1)+list.length)%list.length];}
 if(best){best.focus();best.scrollIntoView({block:'nearest',behavior:'smooth'});}}
function primary(){for(const id of ['briefgo','resultok','next','start','resume']){const el=document.getElementById(id);if(el&&!el.disabled&&!el.closest('[hidden]')&&el.getBoundingClientRect().width>0)return el;}return null;}
// ---- ciclo di lettura
const prev=[[],[]];let rep={},exitT=0,wasGame=false;const mute=[new Set(),new Set()];
function pressedNow(gp,i){const b=gp.buttons[i];return!!b&&(b.pressed||b.value>.5);}
function dirs(gp){const ax=gp.axes||[];const x=ax[0]||0,y=ax[1]||0;return{up:pressedNow(gp,12)||y<-.5,down:pressedNow(gp,13)||y>.5,left:pressedNow(gp,14)||x<-.5,right:pressedNow(gp,15)||x>.5};}
function poll(t){const pads=(navigator.getGamepads?navigator.getGamepads():[])||[];const list=[...pads].filter(Boolean);
 if(list.length){document.documentElement.classList.add('pad');const game=inGame();const map=MAPS[page];
  if(game!==wasGame){wasGame=game;list.slice(0,2).forEach((gp,pi)=>{mute[pi].clear();for(let i=0;i<gp.buttons.length;i++)if(pressedNow(gp,i))mute[pi].add(i);});}
  list.slice(0,2).forEach((gp,pi)=>{const now=[];for(let i=0;i<gp.buttons.length;i++){now[i]=pressedNow(gp,i);if(mute[pi].has(i)){if(now[i])now[i]=false;else mute[pi].delete(i);}}const was=prev[pi];const d=dirs(gp);
   // uscita: SELECT+START tenuti
   if(pi===0){if(now[8]&&now[9]){if(!exitT)exitT=t;else if(t-exitT>1500){exitT=0;releaseAll();window.dispatchEvent(new CustomEvent('church-exit'));if(location.port==='8977')try{location.href='/__exit';}catch{}}}else exitT=0;}
   if(game&&map){const [btn,{chords}]=pi===0?map:[P2,{chords:[]}];const D=pi===0?DIR1:DIR2;
    if(page==='duelli'||pi===0)for(const k in D)key(D[k],d[k]);
    const want={},used=new Set();for(const [ids,code] of chords){if(ids.every(i=>now[i])){ids.forEach(i=>used.add(i));want[code]=true;}}
    for(const i in btn){const code=btn[i];if(pi===0&&page!=='duelli'&&(i==='8'||i==='9')&&now[8]&&now[9]){want[code]=want[code]||false;continue;}want[code]=want[code]||(!!now[i]&&!used.has(+i));}
    for(const code in want)key(code,want[code]);
   }else if(pi===0){releaseAll();
    const fire=(name,on)=>{if(!on){rep[name]=0;return false;}if(!rep[name]){rep[name]=t+380;return true;}if(t>rep[name]){rep[name]=t+140;return true;}return false;};
    if(fire('u',d.up))moveFocus(0,-1);if(fire('d',d.down))moveFocus(0,1);if(fire('l',d.left))moveFocus(-1,0);if(fire('r',d.right))moveFocus(1,0);
    if(now[0]&&!was[0]){const el=document.activeElement,dl=dialog();if(dl&&!dl.contains(el)){primary()?.click();}else if(el&&el!==document.body&&focusables().includes(el)){if(el.tagName==='SELECT'){const i=(el.selectedIndex+1)%el.options.length;el.selectedIndex=i;el.dispatchEvent(new Event('change',{bubbles:true}));}else el.click();}else primary()?.click();}
    if(now[9]&&!was[9]&&!now[8]){const p=primary();if(p)p.click();else key('KeyP',true),setTimeout(()=>key('KeyP',false),60);}
    if(now[1]&&!was[1]){const back=document.getElementById('briefno')||document.getElementById('home');if(back&&back.getBoundingClientRect().width)back.click();}
   }
   prev[pi]=now;});}
 requestAnimationFrame(poll);}
window.addEventListener('gamepadconnected',()=>document.documentElement.classList.add('pad'));
window.ChurchPad={setInGame(fn){inGame=fn;},page};
requestAnimationFrame(poll);
})();
