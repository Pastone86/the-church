/* The Church 2.2 — speciali aggiuntive per il Duello classico.
 * Nel Duello ogni giocatore ha tre tasti speciali (J K L / 7 8 9), ma molti
 * personaggi avevano una sola mossa attiva: gli altri tasti non facevano nulla.
 * Qui si completano le tre speciali convertendo i poteri di powers.js
 * (gli stessi delle Strade e del Quartiere) nelle regole del motore del Duello.
 * Le mosse originali restano invariate e mantengono il loro indice.
 */
(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const T=s=>Math.round(s*60);
const FALLBACK=[{name:'Scatto di quartiere',kind:'dash',dmg:60,dist:300,invuln:true,desc:'Scatto in avanti che travolge'},{name:'Spintone',kind:'melee',dmg:75,reach:120,knock:300,status:{stun:.4},desc:'Spinta che allontana e stordisce un attimo'}];
function statuses(st={}){const out=[];for(const [k,v] of Object.entries(st)){
 if(k==='stun')out.push({name:'dizzy',duration:T(v)});else if(k==='root')out.push({name:'rooted',duration:T(v),value:1});else if(k==='blind')out.push({name:'blind',duration:T(v),value:1});
 else if(k==='noAttack')out.push({name:'noAttack',duration:T(v),value:1});else if(k==='confused')out.push({name:'inverted',duration:T(v),value:1});
 else if(k==='slow'&&Array.isArray(v))out.push({name:'slow',duration:T(v[1]),value:v[0]});else if(k==='bleed'&&Array.isArray(v))out.push({name:'bleeding',duration:T(v[0]),value:v[1]});}
 return out;}
const ASSIST={sauron:'rottweiler',threehead:'threehead',monkey:'monkey',brother:'brother'};
function pick(m){if(m.kind==='multi')return m.steps.find(s=>s.kind!=='buff')||m.steps[0];if(m.kind==='random'){const o=m.outcomes.find(o=>o.move.kind!=='fail');return o?{...o.move,name:m.name}:null;}return m;}
// Converte un potere (powers.js) in [mossa del roster, regola di combattimento].
function convert(src){const m={...pick(src),name:src.name,desc:src.desc};if(!m||!m.kind||m.kind==='finisher'||m.kind==='fail')return null;
 const props=[],rule={visual:m.visual};let dmg=Math.round(m.perShot?(m.dmg||0)*(m.count||1):(m.dmg||0));
 switch(m.kind){
  case 'shot':props.push('proiettile');if(m.low)props.push('basso');Object.assign(rule,{mode:'projectile',hits:m.count||1,homing:!!m.homing,boomerang:!!m.boomerang,speed:Math.max(6,Math.round((m.speed||560)/70))});break;
  case 'melee':Object.assign(rule,{hits:m.hits||1,reach:Math.min(80,Math.round((m.reach||130)/4)),knockback:m.knock?Math.min(14,m.knock/30):undefined,hit:statuses(m.status)});if(m.unblockable)props.push('imparabile');break;
  case 'dash':Object.assign(rule,{dash:Math.max(6,Math.round((m.dist||320)/35)),active:24,hit:statuses(m.status),self:m.invuln?[{name:'invulnerable',duration:28,value:1}]:undefined});break;
  case 'aoe':Object.assign(rule,{reach:Math.min(160,Math.round((m.radius||150)/3)),hits:m.hits||1,hit:statuses(m.status)});if(m.unblockable)props.push('imparabile');if(!dmg)Object.assign(rule,{mode:'buff',other:statuses(m.status)});break;
  case 'aura':Object.assign(rule,{mode:'aura',duration:T(m.dur||4),radius:Math.round((m.radius||150)/2.5),pulse:T(m.pulse||.5),pulseDamage:m.dmg,smoke:m.visual==='smoke',oil:m.visual==='oil',hit:statuses(m.status)});dmg=Math.round(m.dmg*(m.dur||4)/(m.pulse||.5));break;
  case 'summon':{const avg=m.dmgRange?m.dmgRange.reduce((a,b)=>a+b,0)/m.dmgRange.length/3:m.dmg;Object.assign(rule,{mode:'assist',assistKind:ASSIST[m.sprite]||'monkey',duration:T(Math.min(m.dur||6,10)),pulse:T(m.pulse||.8),pulseDamage:Math.round(avg),count:1});dmg=Math.round(avg*(m.dur||6)/(m.pulse||.8));break;}
  case 'buff':{const s=m.self||{},self=[];if(s.atk)self.push({name:'attackUp',duration:T(m.dur||5),value:s.atk});if(s.def)self.push({name:'defenseUp',duration:T(m.dur||5),value:1/s.def});if(s.regen)self.push({name:'regeneration',duration:T(m.dur||4),value:s.regen});if(s.armor)self.push({name:'armorAll',duration:T(m.dur||4),value:1});if(s.reflect)self.push({name:'reflect',duration:T(m.dur||4),value:150});if(s.unblockable)self.push({name:'unblockable',duration:T(m.dur||4),value:1});if(s.dodge)self.push({name:'small',duration:T(m.dur||4),value:.6});if(s.invuln)self.push({name:'invulnerable',duration:T(s.invuln),value:1});
   Object.assign(rule,{mode:'buff',self,healSelf:s.heal||0});dmg=0;break;}
  case 'counter':Object.assign(rule,{mode:'counter',duration:Math.min(70,T(m.dur||1)),counterDamage:m.dmg,catchProjectile:!!m.catchShots});break;
  case 'teleport':Object.assign(rule,{mode:'teleport',randomSide:!!m.random,hit:statuses(m.status)});break;
  case 'sweep':Object.assign(rule,{mode:'assist',assistKind:m.visual==='4x4'?'4x4':m.visual==='headlights'?'headlights':'motorbike',hits:m.count||2,duration:60*(m.count||2),alternate:true});dmg=Math.round((m.dmg||100)*(m.count||2));break;
  case 'rain':props.push('proiettile');Object.assign(rule,{mode:'projectile',hits:3,speed:8,visual:m.visual});break;
  case 'copy':Object.assign(rule,{mode:'copy',copyMultiplier:m.mul||1.3});dmg=0;break;
  default:return null;}
 for(const k of Object.keys(rule))if(rule[k]===undefined)delete rule[k];
 return[{nome:m.name,comando:'tasto speciale',danno:dmg,proprieta:props,note:(m.desc||'')+' (speciale aggiunta nella 2.2)',extra:true},rule];}
function extend(data){const CP=root.ChurchPowers;if(!CP)return 0;let added=0;data['combat-rules']=data['combat-rules']||{};
 for(const def of data.personaggi.personaggi){const isActive=m=>!['passivo','parata perfetta'].includes(m.comando);const activeNames=new Set(def.mosse.filter(isActive).map(m=>norm(m.nome)));const allNames=new Set(def.mosse.map(m=>norm(m.nome)));
  const rules=data['combat-rules'][def.id]=data['combat-rules'][def.id]||{};rules.moves=rules.moves||{};
  const pool=[...CP.kit(def.id).moves,...FALLBACK];
  for(const pm of pool){if(def.mosse.filter(isActive).length>=3)break;if(activeNames.has(norm(pm.name)))continue;const conv=convert(pm);if(!conv)continue;const [move,rule]=conv;if(allNames.has(norm(move.nome)))move.nome=move.nome+' · attiva';activeNames.add(norm(pm.name));
   def.mosse.push(move);rules.moves[def.mosse.length-1]=rule;added++;}}
 return added;}
root.ChurchDuelExtra={extend,convert};
})(typeof window==='undefined'?globalThis:window);
