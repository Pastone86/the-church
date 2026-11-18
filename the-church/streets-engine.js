/* The Church — Strade di S. Andrea, versione 2.2.
 * Movement normalization, footpoint distance, seeded RNG, entity structure and
 * camera interpolation adapted from Francesco D'Isa, Je suis Maranza engine.js
 * (Apache-2.0). Combat, campaign, poteri and roster integration rewritten for
 * The Church. I poteri dei personaggi sono in powers.js (ChurchPowers).
 */
(function(root){'use strict';
const CP=root.ChurchPowers;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6);
const STAGES=[
{id:'rosa',name:'Parchetto Rosa',kind:'gym',house:'Chiesetta',boss:'beppone',subtitle:'Ferro, cemento e calisthenics',color:'#cf8583'},
{id:'fratelli',name:'Via Fratelli Di Dio',kind:'street',house:'Chiesetta',boss:'american',subtitle:'La strada non appartiene a nessuno',color:'#bb986c'},
{id:'gobetti',name:'Parchetto Via Gobetti',kind:'basket',house:'I Gobetti',boss:'gargoyle',subtitle:'Sotto il canestro, sopra le righe',color:'#658e9e'},
{id:'tarantola',name:'Via Tarantola',kind:'street',house:'Bar Vela',boss:'labbro',subtitle:'Ogni portone ha una storia',color:'#c07851'},
{id:'redi',name:'Parchetto Via Redi',kind:'rail',house:'Via Redi',boss:'zanfo',subtitle:'L’asilo, le altalene, i treni',color:'#718d79'},
{id:'sanrocco',name:'Via San Rocco',kind:'street',house:'Via Redi',boss:'ciabatta',subtitle:'Non voltarti al primo incrocio',color:'#96909a'},
{id:'regina',name:'Via Regina Pacis',kind:'street',house:'Chiesetta',boss:'bruce',subtitle:'La piazza è vicina',color:'#bda68b'},
{id:'rosette',name:'Via delle Rosette',kind:'street',house:'Via Redi',boss:'buccia',subtitle:'Tra balconi e giardini',color:'#b99f73'},
{id:'deagostini',name:'De Agostini',kind:'street',house:'Via Redi',boss:'marines',subtitle:'Acciaio, scale e cancelli',color:'#8a999c'},
{id:'murales',name:'Ferrovie Nord',kind:'muralpark',house:'I Gobetti',boss:'gargoyle',subtitle:'Il quartiere dipinto sui muri',color:'#83965a'},
{id:'chiesetta',name:'La Kiesetta',kind:'church',house:'Chiesetta',boss:'mario',subtitle:'L’ultimo incontro, sul porfido',color:'#bd967c'},
{id:'supermercato',name:'Presto Fresco',kind:'supermarket',house:'Bar Vela',boss:'labbro',subtitle:'Ultima corsia, nessuna scorciatoia',color:'#b7c3bb'}];
// Mosse che i capi sanno usare contro il giocatore (niente finali istantanei).
const BOSS_KINDS=new Set(['shot','melee','aoe','dash','summon','aura','buff','sweep']);
class StreetGame{
 constructor(roster,emit=()=>{}){this.roster=roster;this.emit=emit;this.seed=2749;this.uid=0;this.mode='menu';this.depth=1.6;this.resetFx();}
 resetFx(){this.shots=[];this.fx=[];this.auras=[];this.summons=[];this.sweeps=[];this.rains=[];this.timers=[];this.particles=[];}
 rnd(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 entity(id,x,y,enemy=false,boss=false){const def=this.roster.find(r=>r.id===id)||this.roster[0];const hp=enemy?(boss?Math.round(def.stats.vita*.58):Math.round(def.stats.vita*.2)):def.stats.vita;return{uid:++this.uid,def,kit:CP.kit(def.id),team:enemy?'e':'p',x,y,hp,maxHp:hp,enemy,boss,dir:enemy?-1:1,z:0,vz:0,action:'idle',anim:0,time:0,cooldown:0,invuln:0,knock:0,dead:false,meter:enemy?0:60,combo:0,guard:false,st:{},buff:{},cds:{},bossCd:3+this.rnd()*2};}
 start(id='mario',stage=0,mode='campaign',difficulty='normale'){this.runMode=mode;this.difficulty=difficulty;this.scale=difficulty==='facile'?.7:difficulty==='difficile'?1.35:1;this.player=this.entity(id,130,525);this.score=0;this.kills=0;this.time=0;this.load(stage);}
 load(index){this.stage=index;this.world=2800;this.camera=0;this.enemies=[];this.resetFx();this.pickups=[];this.wave=0;this.spawned=false;this.gate=850;this.mode='playing';const p=this.player;Object.assign(p,{x:130,y:525,z:0,vz:0,invuln:1.5,action:'idle',time:0,st:{},dash:null,counter:null,autoUsed:false,lastStandUsed:false});p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.25);p.meter=Math.max(p.meter,60);this.toast=STAGES[index].name;this.toastTime=3;this.wait=0;this.bossDone=false;this.spawnWave();}
 next(){if(this.mode!=='clear')return;if(this.stage===STAGES.length-1){this.mode='victory';return;}this.load(this.stage+1);}
 spawnWave(){const pool=this.roster.filter(r=>r.id!==this.player.def.id&&r.id!=='innominato');const count=this.runMode==='survival'?Math.min(7,3+Math.floor(this.wave/2)):3+(this.wave===2?1:0);for(let i=0;i<count;i++){const id=this.wave===2&&i===count-1&&this.runMode!=='survival'?STAGES[this.stage].boss:pool[Math.floor(this.rnd()*pool.length)].id;const boss=(this.runMode!=='survival'&&this.wave===2&&i===count-1)||(this.runMode==='survival'&&this.wave>0&&this.wave%4===3&&i===0);const x=this.runMode==='survival'?clamp(this.player.x+(i%2?-330:430),40,2760):this.wave*850+480+i*82;const e=this.entity(id===this.player.def.id?pool[0].id:id,x,450+(i%4)*43,true,boss);e.cooldown=1+i*.3;const h=this.player.kit.passive.hesitation;if(h)CP.applyStatus(e,{noAttack:h});this.enemies.push(e);}this.spawned=true;this.emit('wave');}
 // ---- interfaccia richiesta da ChurchPowers
 entities(){return[this.player,...this.enemies];}
 foes(u){return u.team==='p'?this.enemies.filter(e=>!e.dead):(this.player.dead?[]:[this.player]);}
 dist(a,b){return distance(a,b);}
 later(t,fn){this.timers.push({t,fn});}
 clampPos(e){e.x=clamp(e.x,35,2765);e.y=clamp(e.y,435,610);}
 inWorld(s){return s.x>-200&&s.x<3000;}
 onScreen(e){return e.x>this.camera-60&&e.x<this.camera+1212;}
 get view(){return{left:this.camera,width:1152};}
 text(text,x,y,color='#ffe1a0'){this.particles.push({text,x,y,color,life:1});}
 hurt(target,amount,source,opts={}){if(!target||target.dead||(target.z>60&&!opts.power&&!opts.dot))return false;
  let damage=CP.incoming(this,target,source,amount,opts);if(damage<=0)return false;
  const guarded=!opts.dot&&!opts.unblockable&&target.guard&&source&&(source.x-target.x)*target.dir>0;
  if(guarded){damage*=.18;this.emit('block',{target,source});if(!target.enemy&&target.kit.passive.patience)target.patience=Math.min(1.5,(target.patience||0)+.15);}
  else if(!opts.dot){if(target.invuln>0&&!opts.power)return false;const armored=CP.armored(target)||(target.boss&&!opts.power&&this.rnd()<.35);if(!armored){target.action='hurt';target.time=opts.power?.3:.23;target.attack=null;target.knock=Math.sign(target.x-(source?.x??target.x-1))*(opts.knock??110);}this.emit('hit',{target,source,amount,power:!!opts.power});}
  target.hp=Math.max(0,target.hp-damage);if(!opts.dot)target.invuln=Math.max(target.invuln,target.enemy?.12:.55);
  if(!opts.dot||damage>=10)this.text(Math.round(damage),target.x+(this.rnd()-.5)*20,target.y-125,target.enemy?'#ffc360':'#f58270');
  if(!target.enemy){target.combo=0;target.meter=clamp(target.meter+damage*.05,0,100);}else if(source&&source.team==='p'){this.player.meter=clamp(this.player.meter+(opts.dot?.4:opts.power?4:9),0,100);if(!opts.dot)this.player.combo++;}
  if(target.hp<=0){if(!target.dead)this.emit('ko',{target,source});target.dead=true;target.action='down';target.time=1.1;if(target.enemy){this.score+=target.boss?1000:100;this.kills++;const p=this.player;if(p.kit.passive.koMeter)p.meter=clamp(p.meter+p.kit.passive.koMeter,0,100);if(target.boss||this.rnd()<.28)this.pickups.push({x:target.x,y:target.y,life:18,kind:this.rnd()<.35?'energy':'life'});}else this.mode='over';}
  return true;}
 // ---- attacchi del giocatore
 attack(type){const p=this.player;if(this.mode!=='playing'||p.dead)return false;
  if(['special1','special2','special3','super'].includes(type)){if(p.dash||p.time>.15){p.queued=type;return false;}const slot=type==='super'?'super':Number(type.at(-1))-1;if(slot!=='super'&&!p.kit.moves[slot]){this.toast='NESSUNA TERZA SPECIALE';this.toastTime=.8;return false;}
   const r=CP.use(this,p,slot);if(!r.ok){this.toast=r.reason==='energy'?`ENERGIA INSUFFICIENTE · SERVONO ${r.need}`:r.reason==='cooldown'?'IN RICARICA…':'NON PUOI ORA';this.toastTime=.9;this.emit('deny');return false;}
   p.action=slot==='super'?'super':'special';p.time=slot==='super'?.5:.35;p.cooldown=.15;this.toast=r.move.name.toUpperCase();this.toastTime=1.4;return true;}
  if(p.cooldown>0||p.time>0||p.dash||!CP.canAttack(p))return false;const fast=p.kit.passive.fastPunch?.75:1;
  const amount=type==='kick'?72:48,reach=type==='kick'?125:95;p.action=type;p.time=(type==='kick'?.3:.26)*fast;p.cooldown=(type==='kick'?.46:.3)*fast;p.attack={type,amount,reach,done:false};this.emit('swing',{who:p,type});return true;}
 resolveAttack(){const p=this.player,a=p.attack;if(!a||a.done)return;a.done=true;const reach=a.reach*(p.kit.passive.reach||1)+(p.def.stats.portata||5)*3;let landed=false;
  for(const e of this.enemies){if(e.dead)continue;const ahead=(e.x-p.x)*p.dir;if(distance(p,e)<reach&&ahead>-30){const crit=this.rnd()<(p.kit.passive.crit||0);const left=this.rnd()<(p.kit.passive.leftie||0);if(this.hurt(e,a.amount*CP.outMul(p)*(crit?1.6:1),p,{unblockable:left}))landed=true;if(crit)this.text('CRITICO',e.x,e.y-150,'#ffe08a');if(a.type==='kick'&&p.kit.passive.kickStun)CP.applyStatus(e,{stun:p.kit.passive.kickStun});}}
  this.fx.push({type:'slash',x:p.x,y:p.y,fx:p.dir,fy:0,r:reach,life:.18,max:.18,visual:landed?null:'sound'});}
 tick(e,dt){e.anim+=dt;e.time=Math.max(0,e.time-dt);e.cooldown=Math.max(0,e.cooldown-dt);e.invuln=Math.max(0,e.invuln-dt);e.x+=e.knock*dt;e.knock*=Math.exp(-10*dt);if(e.z>0||e.vz>0){e.z=Math.max(0,e.z+e.vz*dt);e.vz-=1100*dt;if(e.z===0)e.vz=0;}e.x=clamp(e.x,35,2765);if(e.time===0&&!e.dead)e.action=e.dash?'special':'idle';}
 enemyAI(e,dt){const p=this.player;if(e.dash)return;e.dir=p.x>e.x?1:-1;if(CP.st(e,'stun')){e.action='hurt';return;}const d=distance(e,p);
  if(e.action==='windup'){if(e.time<.06&&!e.struck){e.struck=true;e.action='punch';const miss=CP.st(e,'blind')&&this.rnd()<.6;if(d<110&&!miss)this.hurt(p,(e.boss?70:36)*this.scale*CP.outMul(e)*(CP.st(e,'weak')?.5:1),e);else if(miss)this.text('MANCATO',e.x,e.y-140,'#c9d4cf');e.cooldown=(e.boss?1.15:1.8)/this.scale*(p.kit.passive.enemySlowAttack||1);e.time=.26;}return;}
  if(e.time>0)return;
  if(e.boss&&!p.dead&&CP.canAttack(e)){e.bossCd-=dt;if(e.bossCd<=0&&d<520){const opts=[...e.kit.moves.map((m,i)=>[i,m]),['super',e.kit.sup]].filter(([,m])=>BOSS_KINDS.has(m.kind)&&!(m.kind==='buff'&&!m.self));const pick=opts[Math.floor(this.rnd()*opts.length)];if(pick){e.cds={};e.mulBoost=.55*this.scale;CP.use(this,e,pick[0],{free:true});e.action='special';e.time=.45;this.toast=e.def.nome.toUpperCase()+': '+(pick[1].name||'').toUpperCase();this.toastTime=1.3;}e.bossCd=(pick&&pick[0]==='super'?9:5.5)/this.scale+this.rnd()*2;return;}}
  if(d<88&&e.cooldown<=0&&CP.canAttack(e)){e.action='windup';e.time=e.boss?.65:.8;e.struck=false;return;}
  if(!CP.canMove(e)){e.action='idle';return;}
  let dx=p.x-e.x,dy=p.y-e.y;if(CP.st(e,'confused')){dx=Math.sin(e.anim*2+e.uid)*100;dy=Math.cos(e.anim*1.3+e.uid)*60;}else if(CP.st(e,'noAttack')&&d<160){dx=-dx;dy=-dy;}else if(CP.st(e,'blind')){dx+=Math.sin(e.anim*3)*160;}
  if(d>75||CP.st(e,'confused')||CP.st(e,'noAttack')){const mag=Math.max(1,Math.hypot(dx,dy)),sp=CP.speedMul(e)*this.scale;e.x+=dx/mag*(e.boss?112:88)*sp*dt;e.y+=dy/mag*75*sp*dt;e.action='walk';}
  for(const b of this.enemies){if(e===b||b.dead)continue;let ox=e.x-b.x,oy=e.y-b.y;const l=Math.hypot(ox,oy);if(l<45&&l>.01){e.x+=ox/l*30*dt;e.y+=oy/l*22*dt;}}e.y=clamp(e.y,435,610);}
 step(dt,input={}){if(this.mode!=='playing')return;dt=Math.min(dt,.04);this.time+=dt;this.toastTime=Math.max(0,this.toastTime-dt);const p=this.player;this.tick(p,dt);
  for(const t of this.timers)t.t-=dt;const due=this.timers.filter(t=>t.t<=0);this.timers=this.timers.filter(t=>t.t>0);due.forEach(t=>t.fn());
  p.meter=clamp(p.meter+dt*3.2,0,100);
  p.guard=!!input.guard&&p.z===0&&p.time===0&&!p.dash;
  if(input.jump&&p.z===0&&p.time===0&&!p.guard&&!p.dash&&CP.canMove(p)){p.vz=490;p.z=.1;this.emit('jump');}
  if(input.punch)this.attack('punch');if(input.kick)this.attack('kick');
  for(const k of ['special1','special2','special3','super'])if(input[k])this.attack(k);
  if(p.queued&&!p.dash&&p.time<=.15){const q=p.queued;p.queued=null;this.attack(q);}
  if(p.attack&&!p.attack.done&&p.time<.16)this.resolveAttack();
  const ix=clamp(input.x||0,-1,1),iy=clamp(input.y||0,-1,1),len=Math.max(1,Math.hypot(ix,iy));
  if(p.time===0&&!p.dash){const speed=(p.guard?70:160+p.def.stats.velocita*8)*CP.speedMul(p)*(CP.canMove(p)?1:0);p.x+=ix/len*speed*dt;p.y+=iy/len*speed*.72*dt;if(ix)p.dir=ix>0?1:-1;p.action=p.guard?'guard':ix||iy?'walk':'idle';}
  p.x=clamp(p.x,35,this.runMode==='survival'?2765:this.gate);p.y=clamp(p.y,435,610);
  for(const e of this.enemies){this.tick(e,dt);if(!e.dead)this.enemyAI(e,dt);}
  CP.update(this,dt);
  p.x=clamp(p.x,35,this.runMode==='survival'?2765:this.gate);
  for(const f of this.pickups){f.life-=dt;if(distance(f,p)<48){if(f.kind==='energy'){p.meter=clamp(p.meter+40,0,100);this.text('+ ENERGIA',p.x,p.y-110,'#8bd5cd');}else{p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.18);this.text('+ VITA',p.x,p.y-110,'#a9ecc2');}f.life=0;this.emit('pickup');}}this.pickups=this.pickups.filter(f=>f.life>0);
  for(const fx of this.particles){fx.life-=dt;if(fx.text)fx.y-=dt*28;}this.particles=this.particles.filter(f=>f.life>0);
  for(const e of this.enemies)if(!e.dead&&e.hp<=0){e.dead=true;e.action='down';e.time=1.1;}
  this.enemies=this.enemies.filter(e=>!e.dead||e.time>0);
  if(p.hp<=0&&!p.dead){p.dead=true;this.mode='over';}
  if(!p.dead&&this.spawned&&!this.enemies.some(e=>!e.dead)){if(this.runMode==='survival'){this.wait+=dt;if(this.wait>1.4){this.wave++;this.wait=0;this.spawnWave();this.toast='ONDATA '+(this.wave+1);this.toastTime=2;}}else if(this.wave<2){this.wave++;this.gate=Math.min(2765,(this.wave+1)*850);this.spawned=false;}else{this.bossDone=true;this.gate=2765;if(p.x>2640){this.mode='clear';this.score+=750;this.emit('clear');}}}
  if(!this.spawned&&p.x>this.wave*850-100)this.spawnWave();
  const camTarget=clamp(p.x-420,0,this.world-1152);this.camera+=(camTarget-this.camera)*Math.min(1,dt*7);
 }
}
root.ChurchStreets={StreetGame,STAGES,clamp,distance};if(typeof module!=='undefined')module.exports=root.ChurchStreets;
})(typeof window==='undefined'?globalThis:window);
