/* The Church 2.2 — strato grafico dei poteri sopra al renderer delle Strade.
 * Il renderer originale (streets-renderer.js) disegna scenari, sprite e HUD;
 * qui si aggiungono proiettili, alleati, aure, veicoli, stati e barra speciali.
 */
(function(root){'use strict';
const CP=root.ChurchPowers,R=root.StreetRenderer;
const base=R.prototype.draw;
const KEYS=['L','U','I'];
R.prototype.draw=function(g,preview=0){
 // Il renderer originale conosceva un solo tipo di proiettile: li nascondiamo e li ridisegniamo qui.
 const shots=g.shots;g.shots=[];try{base.call(this,g,preview);}finally{g.shots=shots;}
 if(g.mode==='menu')return;const c=this.c,cam=g.camera||0,p=g.player;
 for(const f of g.pickups||[])if(f.kind==='energy'){const x=f.x-cam;c.fillStyle='#8bd5cd';c.beginPath();c.moveTo(x,f.y-44);c.lineTo(x+9,f.y-24);c.lineTo(x+2,f.y-24);c.lineTo(x+6,f.y-8);c.lineTo(x-9,f.y-30);c.lineTo(x-2,f.y-30);c.closePath();c.fill();}
 for(const e of [p,...g.enemies]){if(e.dead)continue;const x=e.x-cam;
  if(e.dash?.m.visual==='horse'){/* il cavallo è disegnato sotto il cavaliere (streets-renderer) */}
  else if(e.dash?.m.visual){c.save();c.globalAlpha=.92;CP.vehicle(c,e.dash.m.visual,x,e.y+4,e.dir);c.restore();}
  else if(e.dash){c.save();c.globalAlpha=.35;c.strokeStyle='#fff2b0';c.lineWidth=4;for(let i=1;i<4;i++){c.beginPath();c.moveTo(x-e.dir*i*28,e.y-120+i*10);c.lineTo(x-e.dir*(i*28+40),e.y-120+i*10);c.stroke();}c.restore();}
  if(e.counter){c.save();c.strokeStyle='#99e4ff';c.lineWidth=3;c.setLineDash([8,6]);c.beginPath();c.ellipse(x,e.y-e.z-80,60,95,0,0,7);c.stroke();c.restore();}
  if(e.buff&&Object.keys(e.buff).length){c.save();c.globalAlpha=.25+Math.sin(g.time*8)*.08;c.fillStyle=e.buff.armor?'#c8d6ff':e.buff.atk?'#ffb36b':'#a9ecc2';c.beginPath();c.ellipse(x,e.y-e.z-80,52,92,0,0,7);c.fill();c.restore();}
  const lab=CP.labelOf(e);if(lab)this.text(lab,x,e.y-e.z-(e.boss?192:176),12,e.enemy?'#9fe3ff':'#ffb0a0','center');
 }
 CP.draw(c,g,{x:cam,y:0},this,{top:false,width:1152,height:672});
 // Barra delle speciali: costo, ricarica e tasto, sotto il riquadro del giocatore.
 const k=p.kit,list=[...k.moves.map((m,i)=>({m,key:KEYS[i],slot:String(i)})),{m:k.sup,key:'O',slot:'super'}];
 if(document.documentElement.classList.contains('phone-ui'))return;// su telefono costi e ricariche sono sui pulsanti
 const X0=372,W0=416;this.rect(X0,18,W0,75,'#14252ce0');
 list.forEach((it,i)=>{const n=list.length,w=(W0-12-(n-1)*4)/n,x=X0+6+i*(w+4),cost=Math.round(it.m.cost*(k.passive.costMul||1)),cd=p.cds?.[it.slot]||0,ok=p.meter>=cost&&cd<=0;
  this.rect(x,24,w,63,ok?(it.slot==='super'?'#2e8a78':'#3f5a4a'):'#2a3438');if(cd>0)this.rect(x,24,w*Math.min(1,cd/it.m.cd),63,'#00000066');
  this.text(it.key,x+7,42,14,ok?'#ffe1a0':'#8a9690');this.text(it.slot==='super'?'SUPER':cost+' ⚡',x+w-6,42,11,ok?'#bff6e8':'#8a9690','right');
  const max=Math.floor((w-12)/6.8),name=it.m.name.toUpperCase(),words=name.split(' ');let l1='',l2='';for(const wd of words){if((l1+' '+wd).trim().length<=max&&!l2)l1=(l1+' '+wd).trim();else l2=(l2+' '+wd).trim();}if(l2.length>max)l2=l2.slice(0,max-1)+'…';if(l1.length>max)l1=l1.slice(0,max-1)+'…';
  this.text(l1,x+7,63,11,ok?'#f4e5c5':'#8a9690');this.text(l2,x+7,78,11,ok?'#f4e5c5':'#8a9690');});
 this.text('ENERGIA '+Math.floor(p.meter),346,88,10,p.meter>=100?'#8bf5df':'#9fc9c4','right');
};
})(window);
(function(root){'use strict';const R=root.StreetRenderer,load=R.prototype.load;
// Il cane a tre teste di Bruce vive nell'atlante "animals-wild".
R.prototype.load=async function(roster){await load.call(this,roster);await new Promise(res=>{const i=new Image();i.onload=()=>{this.images['animals-wild']=i;res();};i.onerror=res;i.src='assets/animals-wild.webp';});};
})(window);
