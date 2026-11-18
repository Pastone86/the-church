/* The Church 2.2 — disegno ad alta densità (schermi retina e telefoni).
 * Il gioco ragiona sempre in coordinate logiche (1152×672 o 384×224);
 * qui si ingrandisce solo la "carta" del canvas, così le immagini restano nitide.
 */
(function(){'use strict';
const dpr=()=>Math.max(1,window.devicePixelRatio||1);
// modalità leggera (Raspberry Pi / RetroPie): meno pixel da disegnare
let lite=false;try{if(/[?&]lite=1/.test(location.search))localStorage.setItem('church-lite','1');if(/[?&]lite=0/.test(location.search))localStorage.removeItem('church-lite');lite=localStorage.getItem('church-lite')==='1';}catch{}if(location.port==='8977')lite=true;
function want(canvas,logicalW,max){const r=canvas.getBoundingClientRect();const w=r.width||logicalW;let s=w*dpr()/logicalW;s=Math.ceil(s*4)/4;return Math.max(1,Math.min(lite?Math.max(1,1440/logicalW):(max||2.5),s));}
/* Tiene il canvas alla densità giusta; apply(scala) viene chiamato a ogni cambio. */
function auto(canvas,logicalW,logicalH,apply,max){let cur=0,t=0;
 const check=()=>{const s=want(canvas,logicalW,max);if(Math.abs(s-cur)<0.01)return;cur=s;canvas.width=Math.round(logicalW*s);canvas.height=Math.round(logicalH*s);const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';apply(s);};
 const soon=()=>{clearTimeout(t);t=setTimeout(check,120);};
 check();window.addEventListener('resize',soon);window.addEventListener('orientationchange',()=>setTimeout(check,350));document.addEventListener('fullscreenchange',soon);
 if(window.ResizeObserver)new ResizeObserver(soon).observe(canvas);
 return{get scale(){return cur},check};}
window.ChurchHD={dpr,want,auto,get lite(){return lite}};
})();
