/* S. ANDREA FIGHTERS — motore del Duello classico (estratto da duelli.html 1.2.0).
 * Numeri: 02_SPEC_TECNICA. Versione 2.2: il codice è stato spostato in file
 * separati, con questi cambiamenti segnati "2.2":
 *  - le speciali premute mentre il personaggio è occupato restano in attesa
 *    per 18 tick invece di andare perse;
 *  - una speciale o una super negata emette l'evento "deny" (per l'avviso).
 * Utilità clamp adattata da Antropocene di Francesco D'Isa (Apache-2.0).
 */
(function(root){
'use strict';
const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
const CONFIG=freeze({width:384,height:224,tps:60,arena:1200,ground:190,minGap:40,maxGap:320,gravity:.9,jump:-14,buffer:8,roundTicks:5940,combo:[1,.8,.65,.5,.35],
 moves:{lp:{name:'Pugno debole',startup:4,active:3,recovery:7,damage:30,block:9,stun:14,reach:20},hp:{name:'Pugno forte',startup:9,active:4,recovery:18,damage:80,block:14,stun:21,reach:26},lk:{name:'Calcio debole',startup:5,active:3,recovery:9,damage:35,block:10,stun:15,reach:29},hk:{name:'Calcio forte',startup:12,active:5,recovery:22,damage:95,block:16,stun:24,reach:37}},
 special:{startup:12,active:6,recovery:24,block:16,stun:26,reach:32},ai:{facile:{reaction:26,block:.12,special:720,idle:.45,superChance:.15},normale:{reaction:13,block:.5,special:240,idle:.12,superChance:.6},difficile:{reaction:6,block:.8,special:70,idle:0,superChance:1}}});
// Same scalar clamp utility as Antropocene by Francesco D'Isa (Apache-2.0).
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(a,b)=>a&&b&&a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const empty=()=>({left:false,right:false,up:false,down:false,lp:false,hp:false,lk:false,hk:false});
class InputBuffer{
 constructor(){this.prev=empty();this.history=[];this.backSince=-100;this.wasBack=false;}
 clear(){this.prev=empty();this.history=[];this.backSince=-100;this.wasBack=false;}
 sample(raw,face,tick){
  const i={...empty(),...raw},forward=face===1?i.right:i.left,back=face===1?i.left:i.right;
  const direction=i.down?(forward?'DF':back?'DB':'D'):i.up?(forward?'UF':back?'UB':'U'):forward?'F':back?'B':'N';
  if(this.history.at(-1)?.direction!==direction)this.history.push({direction,tick});
  this.history=this.history.filter(h=>tick-h.tick<CONFIG.buffer);
  if(back&&!this.wasBack)this.backSince=tick;
  const pressed=Object.keys(i).filter(k=>i[k]&&!this.prev[k]);this.prev=i;this.wasBack=back;
  return {...i,forward,back,pressed,perfect:back&&tick-this.backSince<3};
 }
 matches(sequence,tick){let n=sequence.length-1;for(let j=this.history.length-1;j>=0&&n>=0;j--){const h=this.history[j];if(tick-h.tick>=CONFIG.buffer)break;if(h.direction===sequence[n])n--; }return n<0;}
 consume(){this.history=[];}
}
class Combattente{
 constructor(def,side){this.def=def;this.side=side;this.meter=0;this.input=new InputBuffer();this.reset();}
 reset(){Object.assign(this,{x:this.side?674:526,y:CONFIG.ground,vy:0,face:this.side?-1:1,hp:this.def.stats.vita,state:'FERMO',attack:null,stun:0,knockdown:0,wakeup:0,dizzy:0,stagger:0,combo:0,crouch:false,walking:false,guard:false,lowGuard:false,perfect:false,slide:0,flash:0,lastMove:'',controls:empty()});this.input.clear();}
 get grounded(){return this.y>=CONFIG.ground;}
 get free(){return !this.attack&&!this.stun&&!this.knockdown&&!this.wakeup&&!this.dizzy&&this.hp>0;}
 get hurtbox(){return this.wakeup?null:{x:this.x-18,y:this.y-(this.crouch?38:62),w:36,h:this.crouch?38:62};}
 get pushbox(){return {x:this.x-20,y:this.y-62,w:40,h:62};}
 get hitbox(){const a=this.attack;if(!a||a.age<=a.startup||a.age>a.startup+a.active||a.projectile)return null;
  const reach=a.reach+this.def.stats.portata;return {x:this.face>0?this.x+9:this.x-9-reach,y:this.y-(a.level==='low'?24:a.level==='high'?58:50),w:reach,h:a.level==='low'?19:24};}
}
class Proiettile{
 constructor(f,a){Object.assign(this,{owner:f.side,x:f.x+f.face*25,oldX:f.x+f.face*25,y:f.y-30,vx:f.face*a.speed,move:a,life:90});}
 get box(){return {x:Math.min(this.oldX,this.x)-7,y:this.y-7,w:Math.abs(this.x-this.oldX)+14,h:14};}
}
class Battle{
 constructor(data,{left='mario',right='american',seed=42}={}){
  this.data=data;this.rng=seed>>>0;this.fighters=[left,right].map((id,i)=>{const d=data.personaggi.personaggi.find(c=>c.id===id);if(!d)throw Error('Personaggio assente: '+id);return new Combattente(d,i);});
  this.wins=[0,0];this.round=1;this.tick=0;this.events=[];this.newRound();
 }
 random(){this.rng=(Math.imul(1664525,this.rng)+1013904223)>>>0;return this.rng/4294967296;}
 newRound(){this.fighters.forEach(f=>f.reset());this.projectiles=[];this.effects=[];this.remaining=CONFIG.roundTicks;this.phase='intro';this.intro=90;this.result=null;this.camera=408;}
 nextRound(){if(this.phase!=='roundEnd')return;this.round++;this.newRound();}
 emit(type,extra={}){this.events.push({type,...extra});}
 startAttack(f,key,special=null){
  if(!f.free)return false;
  const m=special?{...CONFIG.special,name:special.nome,damage:special.danno,projectile:special.proprieta.includes('proiettile'),speed:special.velocitaProiettile||8,knockdown:special.proprieta.includes('atterramento'),startup:special.startup??Number(special.note?.match(/Startup (\d+) tick/i)?.[1]||CONFIG.special.startup)}:{...CONFIG.moves[key]};
  if(!m.name)return false;
  f.attack={...m,key,age:0,hit:false,spawned:false,level:!f.grounded?'high':f.crouch&&key.endsWith('k')?'low':'mid'};f.state='ATTACCO';f.lastMove=m.name;f.guard=false;this.emit('swing',{side:f.side,key});return true;
 }
 process(f,raw){
  const opponent=this.fighters[1-f.side];if(!f.attack)f.face=f.x<opponent.x?1:-1;
  const i=f.input.sample(raw,f.face,this.tick);f.controls=i;f.guard=false;f.walking=false;
  if(f.flash)f.flash--;
  if(f.knockdown){f.knockdown--;f.state='ATTERRATO';if(!f.knockdown){f.wakeup=20;f.state='RIALZATA';}return;}
  if(f.wakeup){f.wakeup--;f.state='RIALZATA';return;}
  if(f.dizzy){f.dizzy--;f.state='STORDITO';return;}
  if(f.stun){if(f.state.startsWith('PARATA')&&i.back&&f.grounded){f.guard=true;f.lowGuard=i.down;f.perfect=i.perfect;f.crouch=i.down;}f.stun--;if(!f.stun)f.combo=0;return;}
  if(!f.attack){
   f.crouch=i.down&&f.grounded;
   const action=['hp','hk','lp','lk'].find(k=>i.pressed.includes(k));
   if(action){
    const button=action.endsWith('p')?'P':'K';
    const special=f.def.mosse.find(m=>m.comando===('↓ ↘ → + '+button));
    if(special&&f.input.matches(['D','DF','F'],this.tick)){this.startAttack(f,action,special);f.input.consume();}
    else this.startAttack(f,action);
   }else if(i.up&&f.grounded&&!this.jumpHeld(f)){f.vy=CONFIG.jump;f.crouch=false;this.emit('jump');}
   if(!f.attack){
    f.guard=i.back&&f.grounded;f.lowGuard=f.guard&&f.crouch;f.perfect=i.perfect;
    let dx=(i.right?1:0)-(i.left?1:0);
    if(!f.crouch){f.x+=dx*f.def.stats.velocita*.5;f.walking=!!dx;}
    f.state=!f.grounded||f.vy<0?'SALTO':f.guard?(f.crouch?'PARATA_BASSA':'PARATA_ALTA'):f.crouch?'ACCOVACCIATO':f.walking?(i.back?'CAMMINA_INDIETRO':'CAMMINA_AVANTI'):'FERMO';
   }
  }
 }
 jumpHeld(f){return !f.controls.pressed.includes('up');}
 physics(f){if(f.y<CONFIG.ground||f.vy<0){f.y+=f.vy;f.vy+=CONFIG.gravity;if(f.y>=CONFIG.ground){f.y=CONFIG.ground;f.vy=0;this.emit('land');}}
  f.x+=f.slide;f.slide*=.7;if(Math.abs(f.slide)<.05)f.slide=0;f.x=clamp(f.x,20,CONFIG.arena-20);
 }
 push(){const [a,b]=[...this.fighters].sort((a,b)=>a.x-b.x);const d=b.x-a.x;
  if(d<CONFIG.minGap){const m=(a.x+b.x)/2;a.x=m-CONFIG.minGap/2;b.x=m+CONFIG.minGap/2;}
  if(d>CONFIG.maxGap){const m=(a.x+b.x)/2;a.x=m-CONFIG.maxGap/2;b.x=m+CONFIG.maxGap/2;}
  if(a.x<20){b.x+=20-a.x;a.x=20;}if(b.x>CONFIG.arena-20){a.x-=b.x-(CONFIG.arena-20);b.x=CONFIG.arena-20;}
  this.camera=clamp((a.x+b.x)/2-CONFIG.width/2,0,CONFIG.arena-CONFIG.width);
 }
 contact(attacker,target,move){
  const blocked=target.guard&&target.grounded&&(move.level==='low'?target.lowGuard:move.level==='high'?!target.lowGuard:true);
  const combo=blocked?0:target.combo;
  const damage=move.damage*(blocked?1:CONFIG.combo[Math.min(combo,4)])*(blocked?.15:1);
  return {attacker,target,move,blocked,perfect:blocked&&target.perfect,damage};
 }
 apply(hit){const {attacker:a,target:t,move:m,blocked,perfect,damage}=hit;
  const floor=blocked?Math.min(1,t.hp):0,actual=Math.min(damage,Math.max(0,t.hp-floor));t.hp=Math.max(floor,t.hp-damage);
  a.meter=clamp(a.meter+actual*1.2,0,3000);t.meter=clamp(t.meter+(blocked?actual*.3:actual*.6)+(perfect?100:0),0,3000);
  t.flash=6;t.slide=a.face*(blocked?1.4:m.damage>=80?3:1.5);t.attack=null;
  if(blocked){t.stun=perfect?Math.ceil(m.block/2):m.block;t.state=t.lowGuard?'PARATA_BASSA':'PARATA_ALTA';}
  else{t.combo++;t.stun=m.stun;t.stagger+=damage/10;t.state=!t.grounded?'COLPITO_ARIA':m.level==='low'?'COLPITO_BASSO':'COLPITO_ALTO';
   if(m.knockdown){t.knockdown=36;t.stun=0;t.combo=0;t.state='ATTERRATO';}
   if(t.stagger>=100){t.dizzy=90;t.stagger=0;t.stun=0;t.state='STORDITO';}
  }
  this.effects.push({x:t.x-a.face*10,y:t.y-(m.level==='low'?16:43),life:blocked?4:m.damage>=80?5:3,blocked});
  this.emit(blocked?'block':'hit',{side:t.side,damage:actual,perfect,move:m.name,att:a.side,x:t.x,y:t.y-(m.level==='low'?16:43),base:m.damage||0,key:a.attack?.key||'',sup:!!m.isSuper,kick:/k$/.test(a.attack?.key||'')||/calc/i.test(m.name||''),ko:t.hp<=0});
 }
 endRound(){const [a,b]=this.fighters;const tie=a.hp===b.hp;const winner=tie?null:a.hp>b.hp?0:1;
  if(tie){this.wins[0]++;this.wins[1]++;}else this.wins[winner]++;
  this.result={tie,winner,timeout:a.hp>0&&b.hp>0,match:Math.max(...this.wins)>=2};this.phase=this.result.match?'matchEnd':'roundEnd';
  this.fighters.forEach(f=>{if(f.hp<=0)f.state='SCONFITTO';});this.emit('roundEnd');
 }
 step(raws=[empty(),empty()]){
  this.events=[];if(this.phase==='roundEnd'||this.phase==='matchEnd')return;
  if(this.phase==='intro'){if(--this.intro<=0){this.phase='fight';this.emit('start');}return;}
  this.tick++;this.effects=this.effects.filter(e=>--e.life>0);
  this.fighters.forEach((f,i)=>this.process(f,raws[i]));
  this.fighters.forEach(f=>{this.physics(f);if(f.attack){f.attack.age++;if(f.attack.projectile&&f.attack.age===f.attack.startup+1&&!f.attack.spawned){this.projectiles.push(new Proiettile(f,f.attack));f.attack.spawned=true;}}});this.push();
  const hits=[];
  for(const f of this.fighters){const t=this.fighters[1-f.side],a=f.attack;if(a&&!a.hit&&overlap(f.hitbox,t.hurtbox)){a.hit=true;hits.push(this.contact(f,t,a));}}
  for(const p of this.projectiles){p.oldX=p.x;p.x+=p.vx;p.life--;const t=this.fighters[1-p.owner];if(overlap(p.box,t.hurtbox)){hits.push(this.contact(this.fighters[p.owner],t,p.move));p.life=0;}}
  this.projectiles=this.projectiles.filter(p=>p.life>0&&p.x>=0&&p.x<=CONFIG.arena);
  // Snapshot both contacts before applying either: simultaneous hits trade.
  hits.forEach(h=>this.apply(h));
  for(const f of this.fighters){if(!hits.some(h=>h.target===f&&!h.blocked))f.stagger=Math.max(0,f.stagger-1);
   if(f.attack&&f.attack.age>=f.attack.startup+f.attack.active+f.attack.recovery){f.attack=null;f.state='FERMO';}
  }
  this.remaining--;if(this.remaining<=0||this.fighters.some(f=>f.hp<=0))this.endRound();
 }
}
class CPU{
 constructor(side,level='facile'){this.side=side;this.config=CONFIG.ai[level]||CONFIG.ai.facile;this.wait=0;this.held=empty();this.sequence=[];this.nextSpecial=0;}
 read(b){if(this.sequence.length)return this.sequence.shift();if(--this.wait>0)return this.held;this.wait=this.config.reaction;this.held=empty();if(this.config.idle&&b.random()<this.config.idle)return this.held;
  const f=b.fighters[this.side],t=b.fighters[1-this.side],d=Math.abs(f.x-t.x),forward=f.face>0?'right':'left',back=f.face>0?'left':'right';
  if(t.attack&&d<110&&b.random()<this.config.block){this.held[back]=true;this.held.down=t.attack.level==='low';return this.held;}
  if(f.free&&b.tick>=this.nextSpecial&&d<210){const m=f.def.mosse.find(m=>m.comando.startsWith('↓ ↘ →'));
   if(m){const k=m.comando.endsWith('K')?'lk':'lp';this.sequence=[{down:true,[forward]:true},{[forward]:true,[k]:true},empty()];this.nextSpecial=b.tick+this.config.special;return {down:true};}}
  if(d>65)this.held[forward]=true;
  else{this.held[['lp','hp','lk','hk'][Math.floor(b.random()*4)]]=true;if(b.random()<.2)this.held.down=true;}
  if(d>90&&d<170&&b.random()<.1)this.held.up=true;return this.held;
 }
}
class Clock{
 constructor(step){this.step=step;this.acc=0;this.last=null;this.count=0;}
 reset(){this.acc=0;this.last=null;}
 advance(ms){if(this.last===null){this.last=ms;return;}this.acc+=Math.max(0,ms-this.last);this.last=ms;
  while(this.acc+1e-7>=1000/60){this.step();this.count++;this.acc-=1000/60;}}
}
root.SAF=Object.freeze({CONFIG,InputBuffer,Combattente,Proiettile,Battle,CPU,Clock,empty,clamp,overlap});
})(typeof window==='undefined'?globalThis:window);

/* The Church — roster combat layer. Source definitions remain unmodified. */
(function(root){'use strict';
const Base=root.SAF,{CONFIG:C,clamp,overlap,empty}=Base;
const active=d=>d.mosse.map((m,index)=>({...m,index})).filter(m=>!['passivo','parata perfetta'].includes(m.comando));
const value=(f,k,fallback=1)=>f.statuses?.[k]?.value??fallback;
const has=(f,k)=>!!f.statuses?.[k];
class Battle extends Base.Battle{
 newRound(){super.newRound();this.entities=[];this.cinematic=0;this.banner='';this.fighters.forEach(f=>{f.traits=this.data['combat-rules']?.[f.def.id]?.traits||{};f.statuses={};f.style=100;f.parries=0;f.patience=0;f.autoUsed=false;f.firstArmor=true;f.lastBlueprint=null;f.copy=null;f.slipTicks=0;f.lastPunch=-100;f.pend=null;
 Object.defineProperty(f,'hurtbox',{configurable:true,get(){if(this.wakeup||has(this,'invulnerable'))return null;const scale=value(this,'small',this.traits.hurtScale||1),h=(this.crouch?38:Math.min(76,this.traits.height||64)-2)*scale;return {x:this.x-18*scale,y:this.y-h,w:36*scale,h};}});
 });this.fighters.forEach(f=>{if(f.traits.hesitation)this.status(this.fighters[1-f.side],{name:'rooted',duration:f.traits.hesitation});});}
 status(f,s){if(s.name==='dizzy'){f.dizzy=Math.max(f.dizzy,s.duration);return;}f.statuses[s.name]={...s,left:s.duration,value:s.value??1};}
 blueprint(f,index){const original=index==='super'?f.def.super:f.def.mosse[index];if(!original)return null;const p=original.proprieta||[],r=this.data['combat-rules']?.[f.def.id]||{};
 const m={...C.special,name:original.nome,damage:original.danno,mode:p.includes('proiettile')?'projectile':'melee',projectile:p.includes('proiettile'),speed:original.velocitaProiettile||8,knockdown:p.includes('atterramento'),unblockable:p.some(k=>['imparabile','attraversaGuardia'].includes(k)),grab:p.includes('presa'),armor:p.includes('superArmor'),low:p.includes('basso'),sound:original.livelloSonoro??(p.includes('sonoro')?1:null),startup:original.startup??Number(original.note?.match(/Startup (\d+) tick/i)?.[1]||12),hits:1,...(index==='super'?r.super:r.moves?.[index]),isSuper:index==='super',sourceIndex:index};
 m.projectile=m.mode==='projectile';m.level=m.low?'low':'mid';m.reach+=(f.traits.reachAdd||0);if(m.hitsByHealth)m.hits=Math.round(m.hitsByHealth[0]+(1-f.hp/f.def.stats.vita)*(m.hitsByHealth[1]-m.hitsByHealth[0]));m.active=Math.max(m.active,m.hits*5);if(m.mode==='counter'){m.active=m.duration||30;}if(m.mode==='dash')m.active=m.duration||18;return m;}
 startMove(f,index,automatic=false){if((!f.free&&!automatic)||has(f,'noSpecial')||has(f,'noAttack'))return false;let m=this.blueprint(f,index);if(!m)return false;
 if(m.isSuper){const cost=m.cost||1000;if(!automatic&&f.meter<cost){this.emit('deny',{side:f.side,reason:'meter',need:cost});return false;}if(!automatic)f.meter-=cost;this.cinematic=36;this.banner=m.name;}
 if(m.mode==='copy'){const other=this.fighters[1-f.side];if(m.storeFirst){f.copy=f.copy||other.lastBlueprint;if(!f.copy){this.emit('deny',{side:f.side,reason:'copy'});return false;}}const copied=m.storeFirst?f.copy:other.lastBlueprint;if(!copied){this.emit('deny',{side:f.side,reason:'copy'});return false;}m={...copied,name:m.name+' · '+copied.name,damage:copied.damage*(m.copyMultiplier||1),isSuper:false,sourceIndex:index};}
 if(m.risk){let r=this.random();const outcome=m.risk.find(o=>(r-=o.chance)<0)||m.risk.at(-1);if(outcome.selfDamage)f.hp=Math.max(1,f.hp-outcome.selfDamage);if(outcome.targetStatus)m.other=[outcome.targetStatus];if(outcome.fail)m={...m,failed:true,damage:0,mode:'failed',active:1,recovery:outcome.recovery||m.recovery};}
 if(m.randomDamage)m.damage=m.randomDamage[Math.floor(this.random()*m.randomDamage.length)];
 f.attack={...m,key:m.low?'lk':'hp',age:0,hit:false,spawned:false,hitSlots:new Set(),origin:f.x};f.lastBlueprint={...m};f.lastMove=m.name;f.state='ATTACCO';f.guard=false;this.emit('swing',{side:f.side});this.emit('special',{side:f.side,move:m.name,isSuper:!!m.isSuper});return true;}
 startAttack(f,key,special){if(special)return this.startMove(f,f.def.mosse.indexOf(special));if(has(f,'noAttack'))return false;const ok=super.startAttack(f,key);if(ok){if(f.traits.instrument){f.attack.visual='music';f.attack.key='hp';f.attack.name={lp:'Nota breve',hp:'Soffio forte',lk:'Nota bassa',hk:'Accento finale'}[key];f.lastMove=f.attack.name;}if(f.traits.tentacleArms)f.attack.visual='tentacle';f.attack.hitSlots=new Set();f.attack.hits=1;f.attack.reach+=f.traits.reachAdd||0;f.lastBlueprint={...f.attack};}return ok;}
 command(f,raw){const prev=f.input.prev,forward=f.face===1?'right':'left',back=f.face===1?'left':'right';const pressed=k=>raw[k]&&!prev[k];const punch=['lp','hp'].some(pressed),kick=['lk','hk'].some(pressed);const dirs={'↓':'D','↘':'DF','→':'F','←':'B','↙':'DB','↗':'UF'};
 for(const m of active(f.def)){const [motion,button]=m.comando.trim().split(/\s*\+\s*/);if(m.comando.includes('rapidi')){if(punch&&this.tick-f.lastPunch<8)return m.index;continue;}if(m.extra)continue;const both=m.comando.includes('P+K');if(both?!((raw.lp||raw.hp)&&(raw.lk||raw.hk)&&(punch||kick)):button==='P'?!punch:button==='K'?!kick:!(pressed('down')||pressed(forward)||pressed(back)))continue;
 const seq=[...motion].filter(c=>dirs[c]).map(c=>dirs[c]);const current=raw.down?(raw[forward]?'DF':raw[back]?'DB':'D'):raw.up?(raw[forward]?'UF':'U'):raw[forward]?'F':raw[back]?'B':'N';const history=(f.input.history.at(-1)?.direction===current?f.input.history:f.input.history.concat({direction:current,tick:this.tick})).filter(h=>this.tick-h.tick<8);let n=seq.length-1;for(let j=history.length-1;j>=0&&n>=0;j--){if(history[j].direction===seq[n]){n--;if(j&&history[j-1].direction===history[j].direction)j--;}}if(n<0&&seq.length)return m.index;
 }return null;}
 process(f,source){let raw={...source};const oldX=f.x;const t=this.fighters[1-f.side];
 if(has(f,'inverted'))[raw.left,raw.right,raw.up,raw.down]=[raw.right,raw.left,raw.down,raw.up];if(has(f,'disabled'))raw[f.statuses.disabled.key]=false;
 if(has(f,'meditate')&&(raw.left||raw.right||raw.up||raw.down)){for(const k of ['meditate','armorAll','noAttack'])delete f.statuses[k];}
 if(has(f,'rooted'))raw.left=raw.right=raw.up=false;
 const list=active(f.def);let selected=['special1','special2','special3'].findIndex(k=>raw[k]&&!f.input.prev[k]);let index=selected<0?this.command(f,raw):list[selected]?.index;
 // 2.2: una speciale senza mossa corrispondente avvisa invece di non fare nulla.
 if(selected>=0&&index==null)this.emit('deny',{side:f.side,reason:'none'});
 // 2.2: pressione in attesa finché il personaggio non è libero (18 tick).
 const superPress=raw.super&&!f.input.prev.super;
 if(superPress)f.pend={k:'super',t:18};else if(index!=null&&index!==-1)f.pend={k:index,t:18};
 if(f.pend){const k=f.pend.k;const ready=f.free;
  if(ready){if(f.def.mosse[k]?.comando?.includes('rapidi')&&f.attack?.key==='lp'&&this.tick-f.lastPunch<8)f.attack=null;const ok=this.startMove(f,k);if(ok&&k!=='super')f.input.consume();f.pend=null;}
  else if(--f.pend.t<=0){this.emit('deny',{side:f.side,reason:has(f,'noSpecial')||has(f,'noAttack')?'blocked':'busy'});f.pend=null;}}
 if((raw.lp&&!f.input.prev.lp)||(raw.hp&&!f.input.prev.hp))f.lastPunch=this.tick;
 if(has(f,'noAttack')){raw.lp=raw.hp=raw.lk=raw.hk=false;}
 super.process(f,raw);
 const factor=value(f,'slow')*value(f,'overclock')*(has(f,'heavy')?.65:1);f.x=oldX+(f.x-oldX)*factor;if(f.walking)f.x+=Math.sign(f.x-oldX)*value(f,'speedAdd',0)*.5;
 if(f.traits.autoHigh&&!(this.assist?.noAuto&&f.side===this.assist.cpu)&&!f.crouch&&f.grounded&&!f.knockdown&&!f.wakeup){f.guard=true;f.lowGuard=false;}
 if(has(f,'autoGuard')&&!(this.assist?.noAuto&&f.side===this.assist.cpu)&&!f.knockdown){f.guard=true;f.lowGuard=t.attack?.level==='low';}
 }
 activate(f,a){const t=this.fighters[1-f.side];if(a.failed)return;
 if(a.sound>0){const other=t.attack;if(other?.sound>0&&other.age<=other.startup+other.active){if(other.sound>a.sound){a.failed=true;a.mode='failed';return;}if(a.sound>other.sound)t.attack=null;}this.entities=this.entities.filter(e=>!(e.owner!==f.side&&e.sound>0&&e.sound<a.sound));this.projectiles=this.projectiles.filter(e=>!(e.owner!==f.side&&e.move.sound>0&&e.move.sound<a.sound));}
 if(a.toggle&&has(f,a.toggle)){delete f.statuses[a.toggle];return;}
 for(const s of a.self||[])this.status(f,s);for(const s of a.other||[])this.status(t,s);
 if(a.healSelf)f.hp=Math.min(f.def.stats.vita,f.hp+a.healSelf);
 if(a.randomDisable)this.status(t,{name:'disabled',key:['lp','hp','lk','hk','special1','special2','special3'][Math.floor(this.random()*7)],duration:a.randomDisable});
 if(a.dashY)f.vy=a.dashY;
 if(a.mode==='teleport'){const sign=a.randomSide?(this.random()<.5?-1:1):t.face;f.x=clamp(t.x+sign*50,25,C.arena-25);f.face=f.x<t.x?1:-1;}
 if(a.mode==='projectile'){for(let n=0;n<a.hits;n++){const p=new Base.Proiettile(f,{...a,damage:a.damage/(a.damagePerHit?1:a.hits)});Object.assign(p,{delay:n*10,life:140,age:0,returning:false,touched:false});if(a.low)p.y=f.y-14;if(a.behind){p.x=t.x+t.face*90;p.oldX=p.x;p.vx=-t.face*a.speed;p.move={...p.move,fromBehind:true};}this.projectiles.push(p);}}
 if(a.mode==='assist'||a.mode==='aura'){this.entities=this.entities.filter(e=>!(e.owner===f.side&&e.name===a.name));const pulse=a.pulse||Math.max(10,Math.floor((a.duration||120)/(a.hits||1)));this.entities.push({...a,owner:f.side,age:0,life:a.duration||120,pulse,x:f.x,next:1,damage:a.pulseDamage??a.damage/(a.hits||1),kind:a.assistKind||'aura'});}
 if(a.extraDogs)this.entities.push({owner:f.side,age:0,life:400,pulse:120,next:30,damage:35,kind:'threehead',count:1,name:'Doberman',mode:'assist',level:'low',block:10,stun:14});
 }
 contact(a,t,m){if(m.sound>0&&this.entities.some(e=>e.owner!==a.side&&e.sound>m.sound))return {skip:true};if(!t.hurtbox||has(t,'projectileImmune')&&m.projectile)return {skip:true};if(m.grab&&t.traits.immuneGrab)return {skip:true};if(m.facingOnly&&t.face===a.face)return {skip:true};
 if(t.attack?.mode==='counter'&&t.attack.age>t.attack.startup&&t.attack.age<=t.attack.startup+t.attack.active){const c=t.attack;if(!m.projectile||c.catchProjectile){t.attack=null;t.meter=clamp(t.meter+(c.meterGain||0),0,3000);let d=c.counterDamage??c.damage;if(c.patienceMultiplier)d*=1+t.parries*.15;this.apply(this.contact(t,a,{...C.special,...c,damage:d,mode:'melee',projectile:false,unblockable:true,counterReturn:true}));return {skip:true};}}
 if(m.grab&&t.knockdown)return {skip:true};
 const guard=t.guard,unblock=m.unblockable||m.grab||m.breakGuard||has(a,'unblockable')||(a.traits.unblockableBelow&&a.hp<a.def.stats.vita*a.traits.unblockableBelow)||(m.fromBehind&&!t.traits.backAware);
 if(unblock)t.guard=false;const hit=super.contact(a,t,m);t.guard=guard;
 let factor=value(a,'attackUp')*(a.traits.style&&a.style>=100?1.2:1)*value(t,'defenseDown')/value(t,'defenseUp')*(t.traits.damageTaken||1);
 if(a.def.derby?.some(id=>id===t.def.id||id===t.def.casata))factor*=2;
 if(a.traits.patience&&a.patience>0){factor*=1+a.patience;a.patience=0;}
 if(m.distanceDamage){const progress=clamp(Math.abs(a.x-(m.origin??a.x))/200,0,1);hit.damage=m.distanceDamage[0]+progress*(m.distanceDamage[1]-m.distanceDamage[0]);}
 hit.damage*=factor;return hit;
 }
 apply(h){if(!h||h.skip)return;const as=this.assist;if(as&&!h.assisted){h.assisted=true;h.damage*=h.attacker.side===as.cpu?as.out:as.inn;}const {attacker:a,target:t,move:m}=h;const keep=t.attack,stun=t.stun,slide=t.slide;const armored=has(t,'armorAll')||t.attack?.armor||(t.traits.firstArmor&&t.firstArmor)||(t.traits.vehicleArmor&&t.attack?.visual==='4x4');
 super.apply(h);if(armored&&!m.grab&&!m.knockdown){t.attack=keep;t.stun=stun;t.slide=slide;t.dizzy=0;t.firstArmor=false;}
 if(h.perfect){t.parries++;if(t.traits.patience)t.patience=Math.min(1.5,t.patience+.15);}
 if(t.traits.style&&!h.blocked)t.style=m.knockdown?Math.max(0,t.style-35):t.style;if(a.traits.style&&!h.blocked)a.style=Math.min(100,a.style+15);
 if(has(t,'tea'))a.meter=Math.max(0,a.meter-200);
 if(has(t,'reflect')&&!m.reflection){const d=Math.min(value(t,'reflect'),m.damage);a.hp=Math.max(0,a.hp-d);this.effects.push({x:a.x,y:a.y-40,life:6,blocked:false});}
 if(!h.blocked){for(const s of m.hit||[])this.status(t,s);if(t.def.eta<18)for(const s of m.hitUnder18||[])this.status(t,s);
 if(m.healTarget)t.hp=Math.min(t.def.stats.vita,t.hp+m.healTarget);if(m.resetTarget){t.statuses={};t.meter=0;t.patience=0;}
 if(m.knockback)t.slide=a.face*m.knockback;if(t.traits.knockback)t.slide*=t.traits.knockback;
 if(m.mode==='finisher')t.hp=0;if(m.ringOut){t.slide=a.face*24;if(this.arena==='esilio'&&(t.x<100||t.x>C.arena-100))t.hp=0;}
 }
 }
 statuses(f){for(const [k,s]of Object.entries(f.statuses)){if(--s.left<=0){delete f.statuses[k];continue;}if(k==='tea')f.hp=Math.min(f.def.stats.vita,f.hp+1);if(k==='regeneration'||k==='meditate')f.hp=Math.min(f.def.stats.vita,f.hp+s.value/60);if(k==='bleeding')f.hp=Math.max(0,f.hp-s.value/60);if(k==='overclock')f.hp=Math.max(1,f.hp-5/60);}
 if(has(f,'slippery')&&f.walking){if(++f.slipTicks>=30){f.knockdown=24;f.slipTicks=0;}}else f.slipTicks=0;
 if(f.traits.autoSuper&&!f.autoUsed&&f.hp>0&&f.hp<f.def.stats.vita*f.traits.autoSuper){f.autoUsed=true;this.startMove(f,'super',true);}
 const t=this.fighters[1-f.side],s=f.traits.smoke;if(s&&this.tick%s.pulse===0&&Math.abs(f.x-t.x)<s.radius)t.hp=Math.max(0,t.hp-s.damage);
 }
 step(raws=[empty(),empty()]){this.events=[];if(['roundEnd','matchEnd'].includes(this.phase))return;if(this.phase==='intro'){if(--this.intro<=0){this.phase='fight';this.emit('start');}return;}if(this.cinematic>0){this.cinematic--;return;}
 this.tick++;this.effects=this.effects.filter(e=>--e.life>0);this.fighters.forEach(f=>this.statuses(f));this.fighters.forEach((f,i)=>this.process(f,raws[i]));
 const sounding=this.fighters.filter(f=>f.attack&&f.attack.age===f.attack.startup&&f.attack.sound>0);if(sounding.length===2){const [a,b]=sounding;if(a.attack.sound>=b.attack.sound)b.attack.cancelled=true;if(b.attack.sound>=a.attack.sound)a.attack.cancelled=true;}
 this.fighters.forEach(f=>{this.physics(f);const a=f.attack;if(!a)return;a.age++;if(a.age===a.startup+1){if(a.cancelled){a.failed=true;a.mode='failed';}this.activate(f,a);}if(a.age>a.startup&&a.age<=a.startup+a.active&&a.dash){f.x+=f.face*a.dash;if(a.alternate&&a.age%8===0){const t=this.fighters[1-f.side];f.x=t.x+t.face*45;f.face=-t.face;}}});this.push();
 const hits=[];for(const f of this.fighters){const a=f.attack,t=this.fighters[1-f.side];if(!a||a.failed||['counter','buff','dash','projectile','aura','assist'].includes(a.mode))continue;const slot=Math.floor((a.age-a.startup-1)/Math.max(1,a.active/(a.hits||1)));if(slot<0||slot>=(a.hits||1)||a.hitSlots.has(slot))continue;if(overlap(f.hitbox,t.hurtbox)){a.hitSlots.add(slot);hits.push(this.contact(f,t,{...a,damage:a.damage/(a.damagePerHit?1:a.hits||1)}));}}
 for(const p of this.projectiles){if(p.delay--> 0)continue;p.age++;p.oldX=p.x;const t=this.fighters[1-p.owner];if(p.move.homing){p.vx=Math.sign(t.x-p.x)*p.move.speed;p.y+=(t.y-(p.move.low?14:30)-p.y)*.08;}if(p.move.arc)p.y+=Math.sin(p.age*.12)*2;if(p.move.boomerang&&p.age===35){p.vx=-p.vx;p.touched=false;}p.x+=p.vx;p.life--;
 if(t.attack?.globalCatch&&t.attack.age>t.attack.startup&&t.attack.age<=t.attack.startup+t.attack.active){p.life=0;this.emit('block',{perfect:true,move:t.attack.name});continue;}
 if(!p.touched&&overlap(p.box,t.hurtbox)){hits.push(this.contact(this.fighters[p.owner],t,p.move));p.touched=true;if(!p.move.boomerang)p.life=0;}}
 this.projectiles=this.projectiles.filter(p=>p.life>0&&p.x>=0&&p.x<=C.arena);
 for(const e of this.entities){e.age++;e.life--;const f=this.fighters[e.owner],t=this.fighters[1-e.owner];e.x=e.mode==='aura'?f.x:t.x-f.face*25;
 const dogs=['doberman','rottweiler','threehead'].includes(e.kind);const clash=dogs&&this.entities.some(o=>o.owner!==e.owner&&['doberman','rottweiler','threehead'].includes(o.kind));e.clash=clash;if(clash&&e.age<180)continue;
 if(e.age>=e.next){e.next+=e.pulse;if(e.mode==='aura'&&Math.abs(f.x-t.x)>(e.radius||90))continue;let damage=e.openingDamage&&e.age===1?e.openingDamage:e.damage;if(e.pulseRange)damage=e.pulseRange[0]+(e.pulseRange[1]-e.pulseRange[0])*e.age/e.duration;
 for(let i=0;i<(e.count||1);i++)hits.push(this.contact(f,t,{...C.special,...e,damage,fromBehind:e.flank&&i===1,projectile:false,level:e.low?'low':'mid'}));if(e.oil&&t.walking){t.slipTicks+=10;if(t.slipTicks>=30){t.knockdown=30;t.slipTicks=0;}}}}
 this.entities=this.entities.filter(e=>e.life>0);hits.forEach(h=>this.apply(h));for(const f of this.fighters){f.stagger=Math.max(0,f.stagger-1);if(f.attack&&f.attack.age>=f.attack.startup+f.attack.active+f.attack.recovery){f.attack=null;f.state='FERMO';}}
 this.remaining--;if(this.remaining<=0||this.fighters.some(f=>f.hp<=0))this.endRound();
 }
}
class CPU extends Base.CPU{read(b){const f=b.fighters[this.side];if(f.free&&this.wait<=1&&b.tick>=this.nextSpecial){const list=active(f.def);this.nextSpecial=b.tick+this.config.special;if(f.meter>= (b.blueprint(f,'super').cost||1000)&&b.random()<(this.config.superChance??1))return {super:true};if(list.length)return {['special'+(1+Math.floor(b.random()*Math.min(3,list.length)))]:true};}return super.read(b);}}
const ASSIST={facile:{cpu:1,out:.55,inn:1.35,noAuto:true},normale:{cpu:1,out:.9,inn:1.05,noAuto:false}};
const applyAssist=(b,level)=>{b.assist=ASSIST[level]||null;return b;};
root.SAF=Object.freeze({...Base,Battle,CPU,applyAssist,activeMoves:active,label:d=>({marlboro:"Marlboro",american:"CIVVÙ",bruce:"Bruce",duzzi:"Duzzi",simonino:"Simonino",buccia:"Buccia",zulu:"Zulu",lumumba:"Lumumba",venom:"Venom",mariolino:"Prof. Mariolino",pannella:"Pannella",luigina:"Luigina",gigi:"Gigi",petrone:"Smartone",ceravolo:"Benigno","4mani":"Spazzola",max4mani:"Max Bianchino",nunzio:"Nunzio"}[d.id]||d.nome)});
})(typeof window==='undefined'?globalThis:window);

/* Optional Reliquie mode: conversions documented in data/relics.json. */
(function(root){'use strict';
const Base=root.SAF, CHIESA=new Set(['american','labbro','ampebi','beppone','mario','duzzi','abbabut','buccia','bruce','izza']);
class Battle extends Base.Battle{
 newRound(){super.newRound();this.relicGrave=[];this.relicTick=0;this.relicMessage='';this.relicOmegaUsed=this.relicOmegaUsed||[false,false];this.fighters.forEach(f=>{f.relic={used:false,left:0,bonus:0,defense:0,shield:0,nina:false,revive:false,crit:0,critBonus:0,fireCrit:0,freeze:0,lock:0,second:false};});}
 setRelics(ids){this.relicIds=ids;}
 bonus(f,n){f.relic.bonus=n;f.relic.left=480;}
 freeze(f){if(f.relic.lock>0)return;f.attack=null;f.relic.freeze=60;f.relic.lock=240;}
 revive(f){if(f.hp<=0&&f.relic.revive){f.hp=100;f.relic.revive=false;}}
 useRelic(side,choice){
  if(this.phase!=='fight'||this.cinematic>0)return false;
  const f=this.fighters[side],t=this.fighters[1-side],r=f.relic,id=choice||this.relicIds?.[side];
  if(!id||r.used&&!r.second||r.second&&(!choice||id==='cavallo'||id==='tuta'||r.secondAt>this.relicTick))return false;
  const card=this.data.relics?.find(c=>c.id===id);if(!card)return false;
  let cost=['cavallo','tomo'].includes(id)?3000:id==='chicago'&&f.def.id==='american'?3000:id==='sbiascico'&&f.def.id!=='duzzi'?2000:0;
  if(f.meter<cost)return false;
  if(['cavallo','tomo'].includes(id)&&this.relicOmegaUsed[side])return false;
  if(id==='cavallo'&&this.relicTick<1200)return false;
  f.meter-=cost;r.used=true;r.second=false;
  if(['cavallo','tomo'].includes(id))this.relicOmegaUsed[side]=true;
  const owner=f.def.id;
  switch(id){
   case 'joystick':this.bonus(f,owner==='mario'?50:30);break;
   case 'bolletta':r.left=480;r.crit=.2;r.critBonus=20;if(owner==='simonino')f.meter=Math.min(3000,f.meter+200);break;
   case 'nina':this.bonus(f,100);r.nina=true;this.entities.push({owner:side,age:0,life:480,pulse:120,next:120,damage:0,kind:'threehead',count:1,name:'Nina',mode:'assist',level:'low',block:0,stun:0,relicDecor:true});break;
   case 'occhi':if(owner==='abbabut'){this.bonus(f,20);f.meter=Math.min(3000,f.meter+200);}else if(t.def.id==='abbabut'){this.bonus(t,20);t.meter=Math.min(3000,t.meter+200);}else{this.bonus(t,-20);this.freeze(t);}break;
   case 'divano':if(owner==='ampebi')r.revive=true;else if(t.def.id!=='ampebi'){this.bonus(t,-50);t.relic.meterLock=180;t.meter=0;}break;
   case 'mojo':{const q=CHIESA.has(owner)?f:t;if(CHIESA.has(q.def.id)){this.bonus(q,20);this.freeze(q);}else this.bonus(q,-30);break;}
   case 'cavallo':this.entities=[];this.projectiles=[];this.fighters.forEach(q=>{q.relic.revive=false;q.hp=0;});break;
   case 'tuta':r.shield=100;if(owner==='izza'){r.second=true;r.secondAt=this.relicTick+180;}break;
   case 'chicago':if(owner==='american'){this.bonus(f,40);t.hp=0;this.revive(t);}else{this.bonus(t,-40);this.freeze(t);}break;
   case 'sbiascico':if(owner==='duzzi'){f.hp=Math.min(f.def.stats.vita,f.hp+300);this.bonus(f,10);f.meter=Math.min(3000,f.meter+100);}else if(t.def.id==='duzzi'){t.hp=Math.min(t.def.stats.vita,t.hp+300);this.bonus(t,10);t.meter=Math.min(3000,t.meter+100);}else{t.x=t.side?600:216;t.meter=0;this.freeze(t);}break;
   case 'labbro':t.meter=Math.max(0,t.meter-100);this.freeze(t);if(owner==='labbro'){f.meter=Math.min(3000,f.meter+100);this.bonus(f,10);r.defense=10;r.crit=.1;r.fireCrit=10;}break;
   case 'tomo':this.entities.push(...this.relicGrave.map(e=>({...e,owner:side,age:0,life:480,next:30})));this.relicGrave=[];if(owner==='beppone'){this.bonus(f,100);r.defense=100;}break;
  }
  this.relicMessage=Base.label(f.def)+' · '+card.name;this.emit('relic',{side,move:card.name});return true;
 }
 process(f,raw){if(f.relic.freeze>0){f.relic.freeze--;f.state='STORDITO';return;}super.process(f,raw);}
 contact(a,t,m){if(m.relicDecor)return {skip:true};const fire=/fuoco|fiamma|fire|incend|brucia/i.test(m.name||'');const magic=m.sourceIndex!==undefined||m.isSuper||m.mode==='aura';
  if(t.relic.nina&&((magic&&!fire)||(fire&&t.def.id==='bruce')))return {skip:true};
  const h=super.contact(a,t,m);if(!h||h.skip)return h;
  if(!h.blocked){if(!magic&&a.relic.bonus)h.damage=Math.max(1,h.damage+a.relic.bonus);if(a.relic.crit>0&&this.random()<a.relic.crit)h.damage+=a.relic.critBonus+(fire?a.relic.fireCrit:0);if(t.relic.defense)h.damage=Math.max(1,h.damage-t.relic.defense);}
  const absorbed=Math.min(t.relic.shield,h.damage);t.relic.shield-=absorbed;h.damage-=absorbed;return h;
 }
 apply(h){super.apply(h);if(h&&!h.skip)this.revive(h.target);}
 step(raws){if(this.phase==='fight'&&!this.cinematic){this.relicTick++;for(const f of this.fighters){const r=f.relic;if(r.left>0&&--r.left===0){r.bonus=r.defense=r.crit=r.critBonus=r.fireCrit=0;r.nina=false;}if(r.lock>0)r.lock--;if(r.meterLock>0){r.meterLock--;f.meter=0;}}
  for(const e of this.entities)if(e.life===1&&e.mode==='assist')this.relicGrave.push({...e});
 }
 super.step(raws);for(const f of this.fighters)if(f.relic.meterLock>0)f.meter=0;
 }
}
root.SAF={...Base,Battle};
})(typeof window==='undefined'?globalThis:window);
