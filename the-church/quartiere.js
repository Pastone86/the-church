/* The Church — QUARTIERE: Sant'Andrea dall'alto, missioni a piedi e in auto.
 * Ispirato ai primi GTA. Combattimento con gli stessi poteri delle Strade (powers.js).
 */
(function(){'use strict';
const $=id=>document.getElementById(id),CP=ChurchPowers,M=ChurchMap,roster=CHURCH_DATA.personaggi.personaggi;
const canvas=$('game'),c=canvas.getContext('2d'),VH=672;let VW=1152;
// Telefono in gioco: la vista dall'alto riempie tutto lo schermo (più strada visibile ai lati); disegno alla densità reale.
const hd={scale:1,check(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const full=document.documentElement.classList.contains('phone-ui')&&document.documentElement.classList.contains('playing');const vw=full?Math.round(Math.max(1152,Math.min(1760,VH*r.width/r.height))):1152;const s=Math.max(1,Math.min(ChurchHD.lite?1.25:2.5,Math.ceil(r.height*ChurchHD.dpr()/VH*4)/4));if(vw===VW&&s===this.scale&&canvas.width===Math.round(vw*s))return;VW=vw;this.scale=s;canvas.width=Math.round(VW*s);canvas.height=Math.round(VH*s);c.setTransform(s,0,0,s,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';}};
{let t=0;const soon=()=>{clearTimeout(t);t=setTimeout(()=>hd.check(),100);};window.addEventListener('resize',soon);window.addEventListener('orientationchange',()=>setTimeout(()=>hd.check(),350));if(window.ResizeObserver)new ResizeObserver(soon).observe(canvas);new MutationObserver(soon).observe(document.documentElement,{attributes:true,attributeFilter:['class']});setTimeout(()=>hd.check(),0);}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),hyp=Math.hypot,TAU=Math.PI*2;
const angDiff=(a,b)=>((b-a+Math.PI*3)%TAU)-Math.PI;
const byId=id=>roster.find(r=>r.id===id)||roster[0];
let R=(()=>{let s=20261104;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};})();
const images={};
// --------------------------------------------------------------- veicoli
const CARS={smart:{name:'Smart di Smartone',len:46,wid:30,maxV:330,acc:300,turn:2.9,color:'#d8d4c4',roof:'#2a2f33',hp:100},peugeot:{name:'Peugeot di Zulu',len:62,wid:30,maxV:420,acc:340,turn:2.5,color:'#6f97ad',roof:'#24343d',hp:120},'4x4':{name:'4x4 di Bruce',len:72,wid:36,maxV:390,acc:300,turn:2.1,color:'#3e474a',roof:'#1d2224',hp:200},graziella:{name:'La Graziella',len:30,wid:10,maxV:250,acc:330,turn:4,color:'#c43d3d',roof:'#c43d3d',hp:60,bike:true},moto:{name:'Moto di Renegade',len:38,wid:14,maxV:470,acc:420,turn:3.4,color:'#7d2c2c',roof:'#1d1d1d',hp:70,bike:true},panda:{name:'Panda',len:54,wid:28,maxV:350,acc:280,turn:2.6,color:'#e2e0d3',roof:'#3c4245',hp:90},cavallo:{name:'Il cavallo dell’Innominato',len:50,wid:20,maxV:410,acc:420,turn:3.8,color:'#2c1c14',roof:'#2c1c14',hp:9999,bike:true,horse:true},r4:{name:'La Renault 4 di Geppetto',len:56,wid:27,maxV:360,acc:290,turn:2.6,color:'#c8140c',roof:'#a8100a',hp:150},furgone:{name:'Furgone',len:74,wid:32,maxV:300,acc:220,turn:2,color:'#b9c1c5',roof:'#9aa3a8',hp:140}};
const TRAFFIC=['panda','panda','furgone','peugeot','smart'];
// --------------------------------------------------------------- missioni
const MISSIONS=[
 {id:'caffe',title:'Il caffè di Beppone',giver:'beppone',at:'vela',time:75,intro:'Beppone ha lasciato il caffè al Vela. Portaglielo alla Kiesetta finché è caldo: a piedi o con quello che trovi.',steps:[{t:'go',to:'kiesetta',text:'Porta il caffè alla Kiesetta',carry:'CAFFÈ'}],reward:100},
 {id:'smart',title:'La Smart di Smartone',giver:'petrone',at:'rosette',time:70,intro:'«Non ci sto più dentro». Smartone ti presta la Smart: portala al parcheggio del Presto Fresco. Senza ammaccarla troppo.',steps:[{t:'car',car:'smart',text:'Sali sulla Smart'},{t:'drive',car:'smart',to:'presto',text:'Porta la Smart al Presto Fresco'}],reward:150},
 {id:'sauron',title:'Sauron è scappato',giver:'ceravolo',at:'gobetti',time:120,intro:'Il rottweiler di Benigno è scappato verso il Parchetto Rosa. Prendilo e riportalo qui. Buono, Sauron. Buono.',steps:[{t:'catch',animal:'sauron',near:'rosa',text:'Acchiappa Sauron'},{t:'go',to:'gobetti',text:'Riporta Sauron da Benigno',follow:true}],reward:180},
 {id:'gratta',title:'I gratta e vinci di Nunzio',giver:'nunzio',at:'vela',time:110,intro:'Nunzio ha perso i gratta e vinci per il quartiere. Te lo dice lui come stanno le cose: sono sei, e uno è vincente.',steps:[{t:'collect',n:6,text:'Raccogli i gratta e vinci'}],reward:200},
 {id:'rissa',title:'Rissa al Parchetto Gobetti',giver:'american',at:'gobetti',time:0,intro:'«That’s how we do it.» Al canestro è arrivata gente da fuori. CIVVÙ ti chiede una mano: usa le speciali.',steps:[{t:'fight',at:'gobetti',n:5,text:'Sconfiggi i rivali al campetto'}],reward:250},
 {id:'staffetta',title:'La staffetta di Gigi',giver:'gigi',at:'thouar',time:95,intro:'Gigi ti presta la Graziella: come nell’Ossola, otto passaggi senza fermarsi.',steps:[{t:'car',car:'graziella',text:'Sali sulla Graziella'},{t:'checkpoints',n:8,text:'Passa dai punti della staffetta'}],reward:250},
 {id:'bruce',title:'Via delle Rosette a cento all’ora',giver:'zulu',at:'presto',time:0,intro:'Bruce ha visto chi ha graffiato il 4x4. Pensa che sia tu. Resisti 35 secondi e poi rifugiati alla De Agostini.',steps:[{t:'survive',secs:35,chaser:'bruce',text:'Scappa dal 4x4 di Bruce'},{t:'go',to:'deagostini',text:'Rifugiati alla De Agostini'}],reward:300},
 {id:'favore',title:'Il favore',giver:'mario',at:'deagostini',time:0,need:4,intro:'Un favore, solo uno. Un pacco dalla De Agostini alla Kiesetta. Alla Kiesetta però ti aspettano Gaetano ’o pazzo e Venom.',steps:[{t:'go',to:'kiesetta',text:'Porta il pacco alla Kiesetta',carry:'PACCO',limit:90},{t:'fight',at:'kiesetta',n:2,bosses:['gaetano','venom'],text:'Il favore lo paghi qui: battili'}],reward:600}];
// --------------------------------------------------------------- stato
const G={mode:'menu',time:0,zoom:1,cam:{x:0,y:0},map:null,baked:null,places:{},player:null,cars:[],peds:[],enemies:[],animals:[],pickups:[],checkpoints:[],mission:null,step:0,timer:0,respect:0,done:new Set(),particles:[],
 shots:[],fx:[],auras:[],summons:[],sweeps:[],rains:[],timers:[],toast:'',toastT:0,minimap:null,bigmap:false,wasted:0};
// ---------- interfaccia per ChurchPowers
G.entities=()=>[G.player,...G.enemies].filter(Boolean);
G.foes=u=>u.team==='p'?G.enemies.filter(e=>!e.dead):(G.player&&!G.player.dead&&!G.player.car?[G.player]:[]);
G.dist=(a,b)=>hyp(a.x-b.x,a.y-b.y);
G.later=(t,fn)=>G.timers.push({t,fn});
G.clampPos=e=>{const cl=M.cellAt(G.baked,e.x,e.y);if(cl===1||cl===4){if(e.px!==undefined){e.x=e.px;e.y=e.py;}}e.x=clamp(e.x,10,G.map.w-10);e.y=clamp(e.y,10,G.map.h-10);};
G.inWorld=s=>{const cl=M.cellAt(G.baked,s.x,s.y);return cl!==1;};
G.onScreen=e=>e.x>G.cam.x-40&&e.x<G.cam.x+VW/G.zoom+40&&e.y>G.cam.y-40&&e.y<G.cam.y+VH/G.zoom+40;
Object.defineProperty(G,'view',{get:()=>({left:G.cam.x,width:VW/G.zoom})});
G.text=(text,x,y,color='#ffe1a0')=>G.particles.push({text,x,y,color,life:1.1});
G.emit=t=>sound(t);
G.hurt=(t,amount,src,opts={})=>{if(!t||t.dead)return false;if(t===G.player&&t.car&&!t.car.horse)return false;let dmg=CP.incoming(G,t,src,amount,opts);if(dmg<=0)return false;
 if(!opts.dot){if(t.invuln>0&&!opts.power)return false;const ang=src?Math.atan2(t.y-src.y,t.x-src.x):0;const k=(opts.knock??110)*(CP.armored(t)?.2:1);t.kx=Math.cos(ang)*k;t.ky=Math.sin(ang)*k;if(!CP.armored(t)){t.hurtT=.25;t.windup=0;}t.invuln=t===G.player?.5:.1;if(audioOn&&window.ChurchSFX&&t.def&&src&&src.def)ChurchSFX.hit({att:src.def.id,tgt:t.def.id,heavy:amount>=70||!!opts.power,kick:src.action==='kick'});else sound('hit');}
 t.hp=Math.max(0,t.hp-dmg);if(!opts.dot||dmg>=10)G.text(Math.round(dmg),t.x,t.y-58,t===G.player?'#f58270':'#ffc360');
 if(t===G.player)t.meter=clamp(t.meter+dmg*.05,0,100);else if(src&&src.team==='p')G.player.meter=clamp(G.player.meter+(opts.dot?.4:opts.power?4:9),0,100);
 if(t.hp<=0){if(t===G.player)wasted();else{t.dead=true;t.deadT=1.4;G.respect+=t.boss?60:10;if(G.player.kit.passive.koMeter)G.player.meter=clamp(G.player.meter+G.player.kit.passive.koMeter,0,100);if(R()<.3)G.pickups.push({x:t.x,y:t.y,kind:R()<.4?'energy':'life',life:20});}}
 return true;};
// --------------------------------------------------------------- audio
let audioOn=(()=>{try{return localStorage.getItem('church-audio')!=='0';}catch{return true;}})(),ac=null;const music=on=>window.ChurchSFX?.setMusic(on);function sound(type){if(!audioOn)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();ac.resume();const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=type==='horn'?'square':type==='hit'?'triangle':'sine';const f={hit:110,special:330,super:80,pickup:760,horn:330,crash:70,done:880,fail:120,check:640,deny:90}[type]||200;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(type==='horn'?310:type==='pickup'||type==='done'||type==='check'?f*1.5:40,t+(type==='horn'?.3:.18));g.gain.setValueAtTime(type==='horn'?.03:.045,t);g.gain.exponentialRampToValueAtTime(.001,t+(type==='horn'?.32:.22));o.connect(g);g.connect(ac.destination);o.start();o.stop(t+.35);}catch{}}
// --------------------------------------------------------------- creazione mondo
function person(id,x,y,team='n',extra={}){const def=byId(id);return{uid:Math.random(),def,kit:CP.kit(def.id),team,x,y,px:x,py:y,fx:1,fy:0,dir:1,hp:def.stats.vita,maxHp:def.stats.vita,meter:0,cds:{},st:{},buff:{},invuln:0,kx:0,ky:0,hurtT:0,anim:R()*9,walking:false,...extra};}
const RING=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]];
function free(x,y,r=12){for(const [ux,uy] of RING){const dx=ux*r,dy=uy*r;const cl=M.cellAt(G.baked,x+dx,y+dy);if(cl===1||cl===4)return false;}return true;}
function nearFree(x,y){if(free(x,y))return{x,y};for(let r=20;r<400;r+=20)for(let a=0;a<TAU;a+=.5){const nx=x+Math.cos(a)*r,ny=y+Math.sin(a)*r;if(free(nx,ny))return{x:nx,y:ny};}return{x,y};}
function makeCar(kind,x,y,ang,extra={}){const k=CARS[kind];const p=nearFree(x,y);return{kind,...k,x:p.x,y:p.y,ang,v:0,hp:k.hp,maxHp:k.hp,driver:null,uid:Math.random(),...extra};}
function roadAt(i){const rs=G.map.roads.filter(r=>!r.foot&&r.pts.length>1);return rs[i%rs.length];}
function spawnTraffic(n){for(let i=0;i<n;i++){const r=roadAt(Math.floor(R()*999));const seg=Math.floor(R()*(r.pts.length-1));const car=makeCar(TRAFFIC[i%TRAFFIC.length],r.pts[seg][0],r.pts[seg][1],0,{driver:'npc',route:{r,i:seg,dir:1,t:R()},color:['#e2e0d3','#9d3b35','#36556e','#3d6b4a','#c9a74a','#8c8f93'][i%6]});G.cars.push(car);}}
function spawnPeds(n){const ids=roster.map(r=>r.id).filter(id=>id!==G.player.def.id);for(let i=0;i<n;i++){const p=M.randomRoadPoint(G.map,R);const q=nearFree(p.x+(R()-.5)*120,p.y+(R()-.5)*120);G.peds.push(person(ids[i%ids.length],q.x,q.y,'n',{target:null,wait:R()*3}));}}
function loadMap(map){G.map=map;G.baked=M.bake(map,images,{scale:ChurchHD.lite?1:ChurchHD.dpr()>=1.5?2:1.5});G.places={};for(const p of M.resolvePlaces(map))G.places[p.id]=p;
 const mm=document.createElement('canvas');const sc=Math.min(260/map.w,200/map.h);mm.width=Math.round(map.w*sc);mm.height=Math.round(map.h*sc);const x=mm.getContext('2d');x.drawImage(G.baked.canvas,0,0,mm.width,mm.height);G.minimap={canvas:mm,sc};}
function startGame(charId){const k=G.places.kiesetta||{x:G.map.w/2,y:G.map.h/2};const s=nearFree(k.x,k.y+40);G.player=person(charId,s.x,s.y,'p',{meter:60});G.player.maxHp=G.player.hp=Math.round(G.player.hp*1.0);
 G.cars=[];G.peds=[];G.enemies=[];G.animals=[];G.pickups=[];G.checkpoints=[];resetPowers();G.mission=null;
 // auto parcheggiate e veicoli del quartiere
 const park=(kind,place,dx,dy,ang=0)=>{const p=G.places[place];if(p)G.cars.push(makeCar(kind,p.x+dx,p.y+dy,ang,{parked:true}));};
 park('panda','kiesetta',-120,30);park('peugeot','presto',30,40,Math.PI/2);park('moto','vela',90,30);park('4x4','deagostini',-60,-40);park('furgone','thouar',140,-20);park('panda','redi',-150,-40);park('graziella','rosa',60,-60);
 if(charId==='geppetto'){G.cars.push(makeCar('r4',G.player.x+64,G.player.y+8,0,{parked:true,mine:true}));G.later(3.8,()=>toast('LA TUA RENAULT 4 È QUI · E PER SALIRE',2.6));}
 if(charId==='innominato'){G.cars.push(makeCar('cavallo',G.player.x+60,G.player.y+6,0,{parked:true,mine:true}));G.later(3.8,()=>toast('IL TUO CAVALLO È QUI · E PER SALIRE',2.6));}
 spawnTraffic(G.map.source==='osm'?10:8);spawnPeds(16);
 G.mode='play';G.time=0;G.wasted=0;toast('SANT’ANDREA · MISSIONI IN GIALLO SULLA MAPPA',3.5);save();}
function resetPowers(){G.shots=[];G.fx=[];G.auras=[];G.summons=[];G.sweeps=[];G.rains=[];G.timers=[];G.particles=[];}
function toast(t,s=2.2){G.toast=t;G.toastT=s;}
// --------------------------------------------------------------- missioni
function placeOf(id){return G.places[id]||{x:G.map.w/2,y:G.map.h/2,name:id};}
// Più missioni nello stesso luogo: i cerchi si affiancano.
function startPos(m){const same=MISSIONS.filter(o=>o.at===m.at),i=same.indexOf(m),g=placeOf(m.at);const q={x:g.x+(i-(same.length-1)/2)*96,y:g.y};return free(q.x,q.y,10)?q:g;}
function available(m){return !G.mission&&!G.done.has(m.id)&&(!m.need||G.done.size>=m.need);}
function startMission(m){G.mission=m;G.step=0;G.timer=m.time||0;G.failMsg='';toast(m.title.toUpperCase(),2.5);showBrief(m);beginStep();}
function beginStep(){const m=G.mission,s=m.steps[G.step],p=G.player;if(s.limit)G.timer=s.limit;
 if(s.t==='car'){const g=placeOf(m.at);const car=makeCar(s.car,g.x+70,g.y+50,0,{parked:true,missionCar:true});G.cars.push(car);s._car=car;}
 if(s.t==='drive'){s._car=m.steps.find(x=>x._car)?._car;}
 if(s.t==='catch'){const g=placeOf(s.near);const q=nearFree(g.x,g.y);G.animals.push({kind:s.animal,x:q.x,y:q.y,px:q.x,py:q.y,dir:1,caught:false,flee:true,anim:0});}
 if(s.t==='collect'){G.pickups=G.pickups.filter(x=>x.kind!=='ticket');for(let i=0;i<s.n;i++){let q;for(let k=0;k<30;k++){q=M.randomRoadPoint(G.map,R);if(hyp(q.x-p.x,q.y-p.y)<1100&&hyp(q.x-p.x,q.y-p.y)>200)break;}const f=nearFree(q.x,q.y);G.pickups.push({x:f.x,y:f.y,kind:'ticket',life:1e9,win:i===2});}}
 if(s.t==='checkpoints'){G.checkpoints=[];let last=p;for(let i=0;i<s.n;i++){let q;for(let k=0;k<40;k++){q=M.randomRoadPoint(G.map,R);const d=hyp(q.x-last.x,q.y-last.y);if(d>260&&d<650)break;}G.checkpoints.push({x:q.x,y:q.y});last=q;}}
 if(s.t==='fight'){const g=placeOf(s.at);const pool=roster.map(r=>r.id).filter(id=>id!==p.def.id&&!['gaetano','venom','innominato'].includes(id));const ids=s.bosses||Array.from({length:s.n},()=>pool[Math.floor(R()*pool.length)]);ids.forEach((id,i)=>{const q=nearFree(g.x+Math.cos(i*1.3)*120,g.y+Math.sin(i*1.3)*90);const e=person(id,q.x,q.y,'e',{boss:!!s.bosses,mission:true,cool:1+i*.4,bossCd:3+i*2});e.maxHp=e.hp=Math.round(e.def.stats.vita*(s.bosses?.55:.2));e.mulBoost=.5;if(p.kit.passive.hesitation)CP.applyStatus(e,{noAttack:p.kit.passive.hesitation});G.enemies.push(e);});}
 if(s.t==='survive'){s._left=s.secs;const g=placeOf(G.mission.at);const car=makeCar('4x4',g.x-400,g.y-300,0,{driver:'chaser',chaser:true,color:'#2d3436'});G.cars.push(car);s._car=car;}
 toast(s.text.toUpperCase(),2.4);}
function stepDone(){const m=G.mission;sound('check');G.step++;if(G.step>=m.steps.length){finishMission(true);return;}beginStep();}
function finishMission(ok,msg=''){const m=G.mission;if(!m)return;G.mission=null;G.cool=3;G.checkpoints=[];G.pickups=G.pickups.filter(x=>x.kind!=='ticket');G.animals=G.animals.filter(a=>!a.mission);
 for(const car of G.cars)if(car.chaser){car.chaser=false;car.driver=null;car.parked=true;car.v=0;}
 G.enemies=G.enemies.filter(e=>!e.mission);
 if(ok){G.done.add(m.id);G.respect+=m.reward;sound('done');showResult('MISSIONE COMPIUTA',`${m.title} · +${m.reward} rispetto`+(G.done.size===MISSIONS.length?' · S. Andrea ti rispetta tutta.':''));}
 else{sound('fail');showResult('MISSIONE FALLITA',msg||m.title);}save();}
function updateMission(dt){const m=G.mission;if(!m)return;const s=m.steps[G.step],p=G.player,pos=p.car||p;
 if(G.timer>0){G.timer-=dt;if(G.timer<=0){finishMission(false,'Tempo scaduto.');return;}}
 if(s.t==='go'){const t=placeOf(s.to);if(hyp(pos.x-t.x,pos.y-t.y)<80){if(s.follow&&!G.animals.some(a=>a.caught))return;stepDone();}}
 else if(s.t==='car'){if(p.car===s._car)stepDone();}
 else if(s.t==='drive'){const t=placeOf(s.to);if(s._car.hp<=0){finishMission(false,'La Smart è da rottamare.');return;}if(p.car===s._car&&hyp(s._car.x-t.x,s._car.y-t.y)<95&&Math.abs(s._car.v)<90)stepDone();}
 else if(s.t==='catch'){const a=G.animals.find(a=>a.kind===s.animal&&!a.caught);if(!a)stepDone();else if(!p.car&&hyp(p.x-a.x,p.y-a.y)<40){a.caught=true;a.flee=false;a.mission=true;G.text('PRESO!',a.x,a.y-40,'#a9ecc2');stepDone();}}
 else if(s.t==='collect'){if(!G.pickups.some(x=>x.kind==='ticket'))stepDone();}
 else if(s.t==='checkpoints'){const cp=G.checkpoints[0];if(!cp){stepDone();return;}if(hyp(pos.x-cp.x,pos.y-cp.y)<70){G.checkpoints.shift();sound('check');G.timer+=4;G.text('+4 s',pos.x,pos.y-60,'#a9ecc2');if(!G.checkpoints.length)stepDone();}}
 else if(s.t==='fight'){if(!G.enemies.some(e=>e.mission&&!e.dead))stepDone();}
 else if(s.t==='survive'){s._left-=dt;if(s._left<=0){s._car.chaser=false;s._car.driver=null;s._car.parked=true;s._car.v=0;toast('BRUCE HA PERSO LE TRACCE',2);stepDone();}}
}
function objective(){const m=G.mission;if(!m)return null;const s=m.steps[G.step];if(!s)return null;
 if(s.t==='go')return placeOf(s.to);if(s.t==='drive')return G.player.car===s._car?placeOf(s.to):s._car;if(s.t==='car')return s._car;if(s.t==='catch')return G.animals.find(a=>!a.caught);
 if(s.t==='collect'){const p=G.player.car||G.player;return G.pickups.filter(x=>x.kind==='ticket').sort((a,b)=>hyp(a.x-p.x,a.y-p.y)-hyp(b.x-p.x,b.y-p.y))[0];}
 if(s.t==='checkpoints')return G.checkpoints[0];if(s.t==='fight')return G.enemies.find(e=>e.mission&&!e.dead);if(s.t==='survive')return null;return null;}
function wasted(){const p=G.player;if(G.wasted>0)return;G.wasted=3;p.hp=0;if(G.mission)finishMission(false,'Sei finito a terra.');toast('A TERRA. LA KIESETTA TI RIMETTE IN PIEDI',3);G.respect=Math.max(0,G.respect-25);sound('fail');}
function respawn(){const p=G.player,k=nearFree(placeOf('kiesetta').x,placeOf('kiesetta').y+40);Object.assign(p,{x:k.x,y:k.y,px:k.x,py:k.y,hp:p.maxHp,dead:false,car:null,st:{},buff:{},invuln:2});G.enemies=G.enemies.filter(e=>e.mission);for(const car of G.cars)if(car.driver==='player')car.driver=null;}
// --------------------------------------------------------------- input
const keys=new Set(),pressed=new Set();
const KEYMAP={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyJ:'punch',KeyK:'kick',KeyL:'special1',KeyU:'special2',KeyI:'special3',KeyO:'super',Digit1:'special1',Digit2:'special2',Digit3:'special3',Digit4:'super',KeyE:'car',KeyF:'car',Enter:'car',Space:'brake',KeyH:'horn',KeyM:'map',Tab:'map'};
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat){e.preventDefault();togglePause();return;}const a=KEYMAP[e.code];if(a&&G.mode!=='menu'){e.preventDefault();if(!keys.has(a))pressed.add(a);keys.add(a);}});
window.addEventListener('keyup',e=>{const a=KEYMAP[e.code];if(a)keys.delete(a);});
window.addEventListener('blur',()=>{keys.clear();if(G.mode==='play')togglePause(true);});
const BTN=[{id:'punch',label:'✊',sub:'PUGNO',buzz:1},{id:'kick',label:'🦵',sub:'CALCIO',buzz:1},{id:'car',label:'🚗',sub:'AUTO',cls:'tc-car',buzz:1},{id:'brake',label:'■',sub:'FRENO'},{id:'special1',label:'1',sub:'SPEC',cls:'sp',buzz:1},{id:'special2',label:'2',sub:'SPEC',cls:'sp',buzz:1},{id:'special3',label:'3',sub:'SPEC',cls:'sp',buzz:1},{id:'super',label:'★',sub:'SUPER',cls:'sp sup',buzz:1}];
window.ChurchPad?.setInGame(()=>G.mode==='play'&&$('brief').hidden&&(!$('result')||$('result').hidden));
const touch=ChurchTouch.create($('screen'),{buttons:BTN,onPress:id=>{if(G.mode!=='play')return;keys.add(id);pressed.add(id);},onRelease:id=>keys.delete(id)});
ChurchTouch.watch(()=>touch.show(G.mode==='play'&&(ChurchTouch.coarse()||ChurchTouch.phone())));
// --------------------------------------------------------------- aggiornamento

// ---- percorsi: mappa delle distanze (BFS) attorno al giocatore, così i nemici aggirano i palazzi
const FF={S:16,R:64,t:0,n:0,ox:0,oy:0,walk:null,dist:null,q:null};
function flowUpdate(dt){FF.t-=dt;if(FF.t>0&&FF.dist)return;FF.t=.3;const tg=G.player.car||G.player;if(!tg)return;const S=FF.S,R=FF.R,n=R*2+1;FF.n=n;
 FF.ox=Math.floor(tg.x/S)-R;FF.oy=Math.floor(tg.y/S)-R;if(!FF.walk){FF.walk=new Uint8Array(n*n);FF.dist=new Uint16Array(n*n);FF.q=new Int32Array(n*n);}
 const W=FF.walk,D=FF.dist,Q=FF.q;for(let j=0;j<n;j++)for(let i=0;i<n;i++)W[j*n+i]=free((FF.ox+i+.5)*S,(FF.oy+j+.5)*S,9)?1:0;
 D.fill(65535);let st=R*n+R;if(!W[st]){let best=-1,bd=1e9;for(let j=R-4;j<=R+4;j++)for(let i=R-4;i<=R+4;i++){const k=j*n+i;if(W[k]){const d=(i-R)**2+(j-R)**2;if(d<bd){bd=d;best=k;}}}if(best<0)return;st=best;}
 let h=0,t=0;D[st]=0;Q[t++]=st;
 while(h<t){const k=Q[h++],i=k%n,j=(k/n)|0,nd=D[k]+1;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const a=i+di,b=j+dj;if(a<0||b<0||a>=n||b>=n)continue;const kk=b*n+a;if(!W[kk]||D[kk]<=nd)continue;
   if(di&&dj&&(!W[j*n+a]||!W[b*n+i]))continue;D[kk]=nd;Q[t++]=kk;}}}
// direzione verso il giocatore seguendo le strade libere; null = fuori dalla zona; 'lost' = in un cortile chiuso
function flowDir(e){if(!FF.dist)return null;const n=FF.n,i=Math.floor(e.x/FF.S)-FF.ox,j=Math.floor(e.y/FF.S)-FF.oy;if(i<1||j<1||i>=n-1||j>=n-1)return null;
 const D=FF.dist;let k=j*n+i;if(D[k]===65535){let best=65535,bk=-1;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const kk=(j+dj)*n+i+di;if(D[kk]<best){best=D[kk];bk=kk;}}if(bk<0)return'lost';k=bk;if(best<=1)return null;const bi=k%n,bj=(k/n)|0;return{x:(FF.ox+bi+.5)*FF.S-e.x,y:(FF.oy+bj+.5)*FF.S-e.y};}
 if(D[k]<=2)return null;let best=D[k],bk=k;
 for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const kk=(j+dj)*n+i+di;if(D[kk]<best||(D[kk]===best&&kk!==k&&!(di&&dj)&&bk===k&&false)){best=D[kk];bk=kk;}}
 // guarda due passi avanti per curve morbide
 let k2=bk;{const i2=bk%n,j2=(bk/n)|0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const a=i2+di,b=j2+dj;if(a<0||b<0||a>=n||b>=n)continue;const kk=b*n+a;if(D[kk]<D[k2])k2=kk;}}
 const tk=D[k2]<D[bk]&&free(((k2%n)+FF.ox+.5)*FF.S,(((k2/n)|0)+FF.oy+.5)*FF.S,7)?k2:bk;return{x:((tk%n)+FF.ox+.5)*FF.S-e.x,y:(((tk/n)|0)+FF.oy+.5)*FF.S-e.y};}
// rimette in gioco chi è finito in un cortile chiuso: il punto raggiungibile più vicino
function rescue(e){if(!FF.dist)return false;const n=FF.n,i0=Math.floor(e.x/FF.S)-FF.ox,j0=Math.floor(e.y/FF.S)-FF.oy,D=FF.dist;
 for(let r=1;r<22;r++)for(let a=0;a<r*8;a++){const ang=a/(r*8)*TAU,i=Math.round(i0+Math.cos(ang)*r),j=Math.round(j0+Math.sin(ang)*r);if(i<0||j<0||i>=n||j>=n)continue;const k=j*n+i;if(D[k]!==65535&&D[k]>3){e.x=(FF.ox+i+.5)*FF.S;e.y=(FF.oy+j+.5)*FF.S;e.kx=e.ky=0;return true;}}
 // nessun punto vicino: rientra da una strada a distanza media dal giocatore
 const cand=[];for(let k=0;k<n*n;k+=3)if(D[k]>20&&D[k]<45)cand.push(k);if(!cand.length)return false;const k=cand[Math.floor(R()*cand.length)];e.x=((k%n)+FF.ox+.5)*FF.S;e.y=(((k/n)|0)+FF.oy+.5)*FF.S;e.kx=e.ky=0;return true;}
function unstuck(e){if(!free(e.x,e.y,5)){const f=nearFree(e.x,e.y);e.x=f.x;e.y=f.y;e.kx=e.ky=0;}}
function moveBody(e,dx,dy,keep){if(!keep){e.px=e.x;e.py=e.y;}if(!dx&&!dy)return true;const R0=8;
 if(free(e.x+dx,e.y+dy,R0)){e.x+=dx;e.y+=dy;return true;}
 // scivola lungo il muro: prova gli assi separati
 const okx=dx&&free(e.x+dx,e.y,R0),oky=dy&&free(e.x,e.y+dy,R0);if(okx)e.x+=dx;if(oky)e.y+=dy;if(okx||oky)return true;
 // spigolo: aggira ruotando la direzione (±35°, ±70°)
 const l=Math.hypot(dx,dy);for(const a of [.6,-.6,1.2,-1.2]){const ca=Math.cos(a),sa=Math.sin(a),nx=(dx*ca-dy*sa)*.85,ny=(dx*sa+dy*ca)*.85;if(free(e.x+nx,e.y+ny,R0)){e.x+=nx;e.y+=ny;return true;}}
 return false;}
// spinta (colpi): stessa collisione morbida, senza bloccare il personaggio sul posto
function knockMove(e,dt,damp){if(Math.abs(e.kx)+Math.abs(e.ky)<2){e.kx=e.ky=0;return;}if(!moveBody(e,e.kx*dt,e.ky*dt,true)){e.kx*=-.2;e.ky*=-.2;}const f=Math.exp(-damp*dt);e.kx*=f;e.ky*=f;}
// gira il personaggio solo se lo spostamento orizzontale è netto (niente sfarfallio)
function face(e,dx,min=10){if(dx>min)e.dir=1;else if(dx<-min)e.dir=-1;}
function playerFoot(dt,inp){const p=G.player;if(p.hurtT>0){p.hurtT-=dt;}
 p.px=p.x;p.py=p.y;unstuck(p);knockMove(p,dt,9);
 if(p.dash){return;}
 let ix=inp.x,iy=inp.y;const l=hyp(ix,iy);p.walking=l>.1&&CP.canMove(p)&&p.hurtT<=.12;
 if(p.walking){ix/=Math.max(1,l);iy/=Math.max(1,l);p.vx=(p.vx||0)+(ix-(p.vx||0))*Math.min(1,dt*14);p.vy=(p.vy||0)+(iy-(p.vy||0))*Math.min(1,dt*14);const sp=(150+p.def.stats.velocita*9)*CP.speedMul(p)*(p.time>0?.6:1);moveBody(p,p.vx*sp*dt,p.vy*sp*dt,true);p.fx=ix/(hyp(ix,iy)||1);p.fy=iy/(hyp(ix,iy)||1);if(Math.abs(ix)>.2)p.dir=ix>0?1:-1;}
 if(!p.walking){p.vx=p.vy=0;}
 p.time=Math.max(0,(p.time||0)-dt);p.cool=Math.max(0,(p.cool||0)-dt);
 if((inp.punch||inp.kick)&&p.cool<=0&&CP.canAttack(p)){const kick=inp.kick&&!inp.punch;const reach=(kick?78:62)*(p.kit.passive.reach||1)+p.def.stats.portata*2;const fast=p.kit.passive.fastPunch?.75:1;p.time=(kick?.3:.24)*fast;p.cool=(kick?.45:.3)*fast;p.action=kick?'kick':'punch';sound('swing');
  for(const e of [...G.enemies.filter(e=>!e.dead),...G.peds.filter(q=>!q.down)]){const dx=e.x-p.x,dy=e.y-p.y,d=hyp(dx,dy);if(d<reach&&(dx*p.fx+dy*p.fy)>-10){if(e.team==='n')angerPed(e);G.hurt(e,(kick?72:48)*CP.outMul(p),p,{knock:kick?220:130});if(kick&&p.kit.passive.kickStun)CP.applyStatus(e,{stun:p.kit.passive.kickStun});}}
  G.fx.push({type:'slash',x:p.x,y:p.y-20,fx:p.fx,fy:p.fy,r:reach,life:.16,max:.16});}
 for(const k of ['special1','special2','special3','super'])if(inp[k]){const slot=k==='super'?'super':Number(k.at(-1))-1;if(slot!=='super'&&!p.kit.moves[slot])continue;const r=CP.use(G,p,slot);if(!r.ok){toast(r.reason==='energy'?`ENERGIA INSUFFICIENTE · SERVONO ${r.need}`:r.reason==='cooldown'?'IN RICARICA…':'NON PUOI ORA',.9);sound('deny');}else{p.time=.3;p.action='special';toast(r.move.name.toUpperCase(),1.3);}}
}
function angerPed(q){if(q.team!=='n')return;G.peds=G.peds.filter(x=>x!==q);q.team='e';q.angry=true;q.maxHp=q.hp=Math.round(q.def.stats.vita*.16);q.cool=.6;q.mulBoost=.4;G.enemies.push(q);G.text(['EHI!','MA SEI SCEMO?','ADESSO VEDI'][Math.floor(R()*3)],q.x,q.y-60,'#ffd2a0');}
function carPhysics(car,dt,throttle,steer,brake){const k=car;const off=M.cellAt(G.baked,car.x,car.y)===3&&!car.horse;const maxV=k.maxV*(off?.55:1);
 if(brake){if(car.v>20)car.v-=k.acc*2.4*dt;else if(car.v>-maxV*.35)car.v-=k.acc*.8*dt;}
 else car.v+=throttle*k.acc*dt*(throttle<0?.6:1);
 car.v*=Math.exp(-(throttle?0.35:1.1)*dt);car.v=clamp(car.v,-maxV*.4,maxV);
 const turn=k.turn*(car.horse?clamp(Math.abs(car.v)/60,.45,1):clamp(Math.abs(car.v)/120,0,1))*Math.sign(car.v||1);car.ang+=steer*turn*dt;
 const nx=car.x+Math.cos(car.ang)*car.v*dt,ny=car.y+Math.sin(car.ang)*car.v*dt;
 const corners=(x,y)=>{const cs=Math.cos(car.ang),sn=Math.sin(car.ang),hl=car.len/2,hw=car.wid/2;return[[hl,hw],[hl,-hw],[-hl,hw],[-hl,-hw],[hl,0]].map(([a,b])=>[x+cs*a-sn*b,y+sn*a+cs*b]);};
 const blocked=(x,y)=>corners(x,y).some(([qx,qy])=>{const cl=M.cellAt(G.baked,qx,qy);return cl===1||cl===4;});
 if(!blocked(nx,ny)){car.x=nx;car.y=ny;}else{const hit=Math.abs(car.v);if(hit>120){car.hp-=hit*.03;sound('crash');G.fx.push({type:'ring',x:car.x+Math.cos(car.ang)*car.len/2,y:car.y+Math.sin(car.ang)*car.len/2,r:30,life:.3,max:.3,visual:'tools'});}if(!blocked(nx,car.y))car.x=nx;else if(!blocked(car.x,ny))car.y=ny;car.v*=-.25;}
}
function playerCar(dt,inp){const p=G.player,car=p.car;let throttle=0,steer=0;const brake=!!inp.brake;
 const kb=(keys.has('up')||keys.has('down')||keys.has('left')||keys.has('right'));
 if(kb){throttle=(keys.has('up')?1:0)-(keys.has('down')?1:0);steer=(keys.has('right')?1:0)-(keys.has('left')?1:0);}
 else{const m=hyp(inp.x,inp.y);if(m>.25){const want=Math.atan2(inp.y,inp.x);let d=angDiff(car.ang,want);if(Math.abs(d)>2.5&&car.v<60){throttle=-m;d=angDiff(car.ang+Math.PI,want);steer=clamp(-d*2,-1,1);}else{throttle=m*(Math.abs(d)>1.4?.4:1);steer=clamp(d*2.2,-1,1);}}}
 carPhysics(car,dt,throttle,steer,brake);p.x=car.x;p.y=car.y;
 if(car.horse)horseFight(p,car,dt,inp);
 if(inp.horn){sound('horn');for(const q of G.peds)if(hyp(q.x-car.x,q.y-car.y)<180){q.target={x:q.x+(q.x-car.x),y:q.y+(q.y-car.y)};q.scared=1.5;}}
 if(car.hp<=0){car.wreck=true;car.driver=null;p.car=null;const q=nearFree(car.x,car.y);p.x=q.x;p.y=q.y;toast('MACCHINA DISTRUTTA',1.6);sound('crash');}}
// in sella: pugno = zoccolata, calcio = impennata (tutto intorno), speciali e super come a piedi
function horseFight(p,car,dt,inp){p.fx=Math.cos(car.ang);p.fy=Math.sin(car.ang);if(Math.abs(p.fx)>.2)p.dir=p.fx>0?1:-1;p.walking=Math.abs(car.v)>20;
 p.time=Math.max(0,(p.time||0)-dt);p.cool=Math.max(0,(p.cool||0)-dt);
 if((inp.punch||inp.kick)&&p.cool<=0&&CP.canAttack(p)){const rear=inp.kick&&!inp.punch;const reach=rear?95:80;p.cool=rear?.6:.38;p.time=.3;p.action=rear?'kick':'punch';car.rear=rear?.45:.25;sound('swing');
  for(const e of [...G.enemies.filter(e=>!e.dead),...G.peds.filter(q=>!q.down)]){const dx=e.x-car.x,dy=e.y-car.y,d=hyp(dx,dy);if(d<reach&&(rear||(dx*p.fx+dy*p.fy)>-15)){if(e.team==='n')angerPed(e);G.hurt(e,(rear?120:85)*CP.outMul(p),car,{knock:rear?380:260});}}
  G.fx.push({type:rear?'ring':'slash',x:car.x,y:car.y-10,fx:p.fx,fy:p.fy,r:reach,life:.2,max:.2});}
 car.rear=Math.max(0,(car.rear||0)-dt);
 for(const k of ['special1','special2','special3','super'])if(inp[k]){const slot=k==='super'?'super':Number(k.at(-1))-1;if(slot!=='super'&&!p.kit.moves[slot])continue;const r=CP.use(G,p,slot);if(!r.ok){toast(r.reason==='energy'?`ENERGIA INSUFFICIENTE · SERVONO ${r.need}`:r.reason==='cooldown'?'IN RICARICA…':'NON PUOI ORA',.9);sound('deny');}else{p.time=.3;p.action='special';toast(r.move.name.toUpperCase(),1.3);}}
 if(p.dash){p.dash=null;}}
function toggleCar(){const p=G.player;if(p.car){const car=p.car;car.driver=null;p.car=null;const sx=car.x-Math.sin(car.ang)*(car.wid/2+16),sy=car.y+Math.cos(car.ang)*(car.wid/2+16);const q=nearFree(sx,sy);p.x=q.x;p.y=q.y;car.v*=.3;return;}
 const near=G.cars.filter(c=>!c.wreck&&!c.chaser).sort((a,b)=>hyp(a.x-p.x,a.y-p.y)-hyp(b.x-p.x,b.y-p.y))[0];
 if(near&&hyp(near.x-p.x,near.y-p.y)<near.len/2+40){if(near.driver==='npc'){const q=G.peds.length;const drv=person(roster[Math.floor(R()*roster.length)].id,near.x+20,near.y+20,'n',{target:null,wait:0});G.peds.push(drv);G.text('LA MIA MACCHINA!',near.x,near.y-50,'#ffd2a0');G.respect=Math.max(0,G.respect-5);}near.driver='player';near.parked=false;near.route=null;p.car=near;toast((near.name||'AUTO').toUpperCase(),1.4);}
 else if(p.def.id==='innominato'){const h=G.cars.find(c=>c.horse&&c.mine);if(h){const q=nearFree(p.x-50,p.y);h.x=q.x;h.y=q.y;h.v=0;h.ang=0;G.text('FIIIUUU!',p.x,p.y-60,'#fce003');sound('horn');toast('ARRIVA IL CAVALLO',1.2);G.later(.35,()=>{if(!p.car&&hyp(h.x-p.x,h.y-p.y)<140){h.driver='player';h.parked=false;p.car=h;toast('IN SELLA',1);}});}}
 else toast('NESSUN VEICOLO VICINO',.9);}
function traffic(dt){for(const car of G.cars){if(car.driver==='npc'&&car.route){const rt=car.route,pts=rt.r.pts;const a=pts[rt.i],b=pts[rt.i+rt.dir]||pts[rt.i];if(!b||a===b){rt.dir*=-1;rt.i=clamp(rt.i,0,pts.length-1);continue;}
  const tx=b[0],ty=b[1];const lane=rt.r.w*.22;const dx=tx-a[0],dy=ty-a[1],L=hyp(dx,dy)||1;const ox=-dy/L*lane,oy=dx/L*lane;const goalX=tx+ox,goalY=ty+oy;
  const want=Math.atan2(goalY-car.y,goalX-car.x);car.ang+=clamp(angDiff(car.ang,want),-3*dt,3*dt);
  let speed=car.maxV*.42;const blocker=[...G.cars.filter(o=>o!==car),G.player.car?null:G.player,...G.peds].filter(Boolean).find(o=>{const rx=o.x-car.x,ry=o.y-car.y,ahead=rx*Math.cos(car.ang)+ry*Math.sin(car.ang),side=Math.abs(-rx*Math.sin(car.ang)+ry*Math.cos(car.ang));return ahead>0&&ahead<car.len/2+45&&side<26;});
  if(blocker){speed=0;car.honk=(car.honk||0)-dt;if(car.honk<=0&&blocker===G.player.car){car.honk=2.5;G.text('BEEP!',car.x,car.y-40,'#fff');}}
  car.v+=(speed-car.v)*Math.min(1,dt*2);car.x+=Math.cos(car.ang)*car.v*dt;car.y+=Math.sin(car.ang)*car.v*dt;
  if(hyp(goalX-car.x,goalY-car.y)<26){rt.i+=rt.dir;if(rt.i<=0||rt.i>=pts.length-1){const end=pts[rt.i];const next=G.map.roads.filter(r=>!r.foot&&r!==rt.r&&r.pts.length>1).map(r=>{const d0=hyp(r.pts[0][0]-end[0],r.pts[0][1]-end[1]),d1=hyp(r.pts.at(-1)[0]-end[0],r.pts.at(-1)[1]-end[1]);return{r,d:Math.min(d0,d1),start:d0<d1};}).filter(o=>o.d<60);
   if(next.length&&R()<.8){const o=next[Math.floor(R()*next.length)];car.route={r:o.r,i:o.start?0:o.r.pts.length-1,dir:o.start?1:-1};}else rt.dir*=-1;}}}
  else if(car.chaser){const p=G.player,t=p.car||p;const want=Math.atan2(t.y-car.y,t.x-car.x);const d=angDiff(car.ang,want);carPhysics(car,dt,1,clamp(d*2.5,-1,1),false);car.maxV=CARS['4x4'].maxV*.92;
   if(hyp(t.x-car.x,t.y-car.y)<(car.len/2+(p.car?p.car.len/2:12))&&Math.abs(car.v)>80){car.v*=-.4;if(p.car){p.car.hp-=12;p.car.v+=car.v*.2;}else G.hurt(p,70,car,{knock:400,power:true});G.text('SBAM!',t.x,t.y-50,'#ff9a7a');}}
  else if(!car.driver){car.v*=Math.exp(-3*dt);if(Math.abs(car.v)>2){car.x+=Math.cos(car.ang)*car.v*dt;car.y+=Math.sin(car.ang)*car.v*dt;}}
 }
 // urti tra auto e investimenti
 for(let i=0;i<G.cars.length;i++)for(let j=i+1;j<G.cars.length;j++){const a=G.cars[i],b=G.cars[j];const d=hyp(a.x-b.x,a.y-b.y),min=(a.len+b.len)*.36;if(d<min&&d>.01){const ux=(a.x-b.x)/d,uy=(a.y-b.y)/d,push=(min-d)/2;a.x+=ux*push;a.y+=uy*push;b.x-=ux*push;b.y-=uy*push;const rel=Math.abs(a.v-b.v);if(rel>140){const dmg=rel*.04;a.hp-=dmg;b.hp-=dmg;sound('crash');}a.v*=.6;b.v*=.6;}}
 for(const car of G.cars){if(Math.abs(car.v)<110)continue;for(const q of [...G.peds,...G.enemies,G.player.car?null:G.player].filter(Boolean)){if(q.down||q.dead)continue;if(hyp(q.x-car.x,q.y-car.y)<car.len/2+8){const ang=Math.atan2(q.y-car.y,q.x-car.x);if(q===G.player){if(car.driver!=='player')G.hurt(q,Math.abs(car.v)*.25,car,{knock:420,power:true});}else if(q.team==='e'){if(car.driver==='player'||car.chaser){q.kx=Math.cos(ang)*420;q.ky=Math.sin(ang)*420;G.hurt(q,Math.abs(car.v)*.35,G.player,{knock:420,power:true});}}else{q.down=2.2;q.kx=Math.cos(ang)*300;q.ky=Math.sin(ang)*300;G.text('AHIA!',q.x,q.y-50,'#ffd2a0');if(car.driver==='player')G.respect=Math.max(0,G.respect-3);}car.v*=.8;}}}
 G.cars=G.cars.filter(c=>!(c.wreck&&c.wreckT>8));for(const c of G.cars)if(c.hp<=0){c.wreck=true;c.wreckT=(c.wreckT||0)+dt;if(c.driver==='npc'){c.driver=null;}}
}
function peds(dt){for(const q of G.peds){q.anim+=dt;q.px=q.x;q.py=q.y;unstuck(q);knockMove(q,dt,6);
 if(q.down>0){q.down-=dt;if(q.down<=0)G.text(['EHI!','GUARDA DOVE VAI','MA CHE FAI?'][Math.floor(R()*3)],q.x,q.y-55,'#ffd2a0');continue;}
 if(q.hp<q.maxHp*.999&&q.team==='n'&&!q.down)angerPed(q);
 q.scared=Math.max(0,(q.scared||0)-dt);if(!q.target||hyp(q.target.x-q.x,q.target.y-q.y)<12){q.wait-=dt;q.walking=false;if(q.wait<=0){const a=R()*TAU,r=80+R()*260;const t={x:q.x+Math.cos(a)*r,y:q.y+Math.sin(a)*r};if(free(t.x,t.y,8))q.target=t;q.wait=1+R()*4;}continue;}
 const dx=q.target.x-q.x,dy=q.target.y-q.y,l=hyp(dx,dy);const sp=(q.scared?150:55);const ox=q.x,oy=q.y;moveBody(q,dx/l*sp*dt,dy/l*sp*dt,true);const moved=hyp(q.x-ox,q.y-oy);q.stuck=moved<sp*dt*.3?(q.stuck||0)+dt:0;if(q.stuck>.35){q.target=null;q.stuck=0;q.wait=.2+R()*.6;}q.walking=moved>.05;face(q,dx,6);q.fx=dx/l;q.fy=dy/l;}
 const p=G.player.car||G.player;for(const q of G.peds){if(hyp(q.x-p.x,q.y-p.y)>1600){const s=M.randomRoadPoint(G.map,R);const f=nearFree(s.x+(R()-.5)*80,s.y+(R()-.5)*80);if(hyp(f.x-p.x,f.y-p.y)>700){q.x=f.x;q.y=f.y;q.target=null;}}}}
function enemies(dt){const p=G.player,tgt=p.car||p;for(const e of G.enemies){e.anim=(e.anim||0)+dt;if(e.dead){e.deadT-=dt;continue;}e.px=e.x;e.py=e.y;unstuck(e);knockMove(e,dt,8);
 e.invuln=Math.max(0,e.invuln-dt);if(e.hurtT>0){e.hurtT-=dt;continue;}if(e.dash)continue;if(CP.st(e,'stun'))continue;
 const dx=tgt.x-e.x,dy=tgt.y-e.y,d=hyp(dx,dy);face(e,dx,12);e.fx=dx/(d||1);e.fy=dy/(d||1);e.cool=Math.max(0,(e.cool||0)-dt);
 if(p.car&&!p.car.horse){if(d<520&&CP.canMove(e)){moveBody(e,-dx/d*40*dt,-dy/d*40*dt);e.walking=true;}continue;}
 if(e.windup>0){e.windup-=dt;if(e.windup<=0){const miss=CP.st(e,'blind')&&R()<.6;if(d<62&&!miss)G.hurt(p,(e.boss?60:30)*CP.outMul(e)*(CP.st(e,'weak')?.5:1),e,{knock:200});else if(miss)G.text('MANCATO',e.x,e.y-55,'#c9d4cf');e.cool=(e.boss?1.1:1.7)*(p.kit.passive.enemySlowAttack||1);e.action='punch';e.time=.25;}continue;}
 e.time=Math.max(0,(e.time||0)-dt);
 if(e.boss&&CP.canAttack(e)){e.bossCd-=dt;if(e.bossCd<=0&&d<420){const opts=[...e.kit.moves.map((m,i)=>[i,m]),['super',e.kit.sup]].filter(([,m])=>['shot','melee','aoe','dash','summon','aura','sweep'].includes(m.kind));const pk=opts[Math.floor(R()*opts.length)];if(pk){e.cds={};CP.use(G,e,pk[0],{free:true});toast(e.def.nome.toUpperCase()+': '+pk[1].name.toUpperCase(),1.3);}e.bossCd=(pk&&pk[0]==='super'?9:5)+R()*2;continue;}}
 if(d<56&&e.cool<=0&&CP.canAttack(e)){e.windup=e.boss?.55:.7;continue;}
 if(!CP.canMove(e)){e.walking=false;continue;}let mx=dx,my=dy;const fd=CP.st(e,'confused')||CP.st(e,'noAttack')?null:flowDir(e);
 if(fd==='lost'){e.lost=(e.lost||0)+dt;if(e.lost>.8){rescue(e);e.lost=0;}e.walking=false;continue;}e.lost=0;if(fd){mx=fd.x;my=fd.y;e.detour=0;}
 if(CP.st(e,'confused')){mx=Math.sin(e.anim*2)*100;my=Math.cos(e.anim*1.4)*100;}else if(CP.st(e,'noAttack')&&d<120){mx=-dx;my=-dy;}else if(CP.st(e,'blind'))mx+=Math.sin(e.anim*3)*120;
 if(d>48||CP.st(e,'confused')||CP.st(e,'noAttack')){const l=hyp(mx,my)||1,sp=(e.boss?125:100)*CP.speedMul(e);let ux=mx/l,uy=my/l;
  // se è bloccato da un muro prova per un po' una direzione laterale, poi riprova dritto
  if(e.detour>0){e.detour-=dt;const ca=Math.cos(e.detA),sa=Math.sin(e.detA);[ux,uy]=[ux*ca-uy*sa,ux*sa+uy*ca];}
  const ox=e.x,oy=e.y;moveBody(e,ux*sp*dt,uy*sp*dt,true);const moved=hyp(e.x-ox,e.y-oy);
  e.stuck=moved<sp*dt*.3?(e.stuck||0)+dt:0;if(e.stuck>.25){e.stuck=0;e.detour=.7;e.detA=(R()<.5?1:-1)*(1.1+R()*.5);}
  e.walking=moved>.05;}else e.walking=false;
 for(const o of G.enemies){if(o===e||o.dead)continue;const ox=e.x-o.x,oy=e.y-o.y,l=hyp(ox,oy);if(l<30&&l>.01){moveBody(e,ox/l*30*dt,oy/l*30*dt,true);}}}
 G.enemies=G.enemies.filter(e=>!e.dead||e.deadT>0);for(const e of G.enemies)if(!e.dead&&e.angry&&hyp(e.x-tgt.x,e.y-tgt.y)>900){e.dead=true;e.deadT=0;}}
function animals(dt){const p=G.player.car||G.player;for(const a of G.animals){a.anim+=dt;a.px=a.x;a.py=a.y;let tx,ty,sp;if(a.caught){tx=p.x-30;ty=p.y+10;sp=hyp(tx-a.x,ty-a.y)>40?240:0;}else{const d=hyp(p.x-a.x,p.y-a.y);if(d<260){tx=a.x+(a.x-p.x);ty=a.y+(a.y-p.y);sp=165;}else{tx=a.x+Math.sin(a.anim*.7)*60;ty=a.y+Math.cos(a.anim*.5)*60;sp=40;}}const dx=tx-a.x,dy=ty-a.y,l=hyp(dx,dy)||1;if(sp){moveBody(a,dx/l*sp*dt,dy/l*sp*dt,true);face(a,dx,8);a.moving=true;}else a.moving=false;
 if(!a.caught&&a.x===a.px&&a.y===a.py&&sp>100){const s=nearFree(a.x+(R()-.5)*200,a.y+(R()-.5)*200);a.x=s.x;a.y=s.y;}}}
function update(dt){if(G.mode!=='play'||G.paused||G.bigmap)return;G.time+=dt;G.toastT=Math.max(0,G.toastT-dt);
 for(const t of G.timers)t.t-=dt;const due=G.timers.filter(t=>t.t<=0);G.timers=G.timers.filter(t=>t.t>0);due.forEach(t=>t.fn());
 const p=G.player;const inp={x:(keys.has('right')?1:0)-(keys.has('left')?1:0)||touch.state.x,y:(keys.has('down')?1:0)-(keys.has('up')?1:0)||touch.state.y,brake:keys.has('brake'),horn:pressed.has('horn')};for(const k of ['punch','kick','special1','special2','special3','super','car','map'])inp[k]=pressed.has(k);pressed.clear();
 if(inp.map){G.bigmap=true;return;}
 if(G.wasted>0){G.wasted-=dt;if(G.wasted<=0)respawn();return;}
 if(inp.car)toggleCar();
 p.invuln=Math.max(0,p.invuln-dt);p.meter=clamp(p.meter+dt*3.2,0,100);
 if(p.car)playerCar(dt,inp);else playerFoot(dt,inp);
 traffic(dt);peds(dt);if(G.enemies.length)flowUpdate(dt);enemies(dt);animals(dt);
 CP.update(G,dt);if(p.hp<=0&&!G.wasted)wasted();
 for(const f of G.pickups){if(f.life!==undefined)f.life-=dt;const q=p.car||p;if(hyp(f.x-q.x,f.y-q.y)<(p.car?40:30)){f.life=0;if(f.kind==='ticket'){G.text(f.win?'VINCENTE! +50':'GRATTA E VINCI',f.x,f.y-40,'#ffe08a');if(f.win)G.respect+=50;sound('pickup');}else if(f.kind==='energy'){p.meter=clamp(p.meter+40,0,100);G.text('+ ENERGIA',q.x,q.y-50,'#8bd5cd');sound('pickup');}else{p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.2);G.text('+ VITA',q.x,q.y-50,'#a9ecc2');sound('pickup');}}}G.pickups=G.pickups.filter(f=>f.life>0);
 for(const f of G.particles){f.life-=dt;f.y-=dt*26;}G.particles=G.particles.filter(f=>f.life>0);
 // inizio missioni dai marcatori gialli
 G.cool=Math.max(0,(G.cool||0)-dt);
 if(!G.mission&&G.cool<=0){const q=p.car||p;for(const m of MISSIONS){if(!available(m))continue;const g=startPos(m);if(hyp(q.x-g.x,q.y-g.y)<46&&!p.car){startMission(m);break;}}}
 updateMission(dt);
 // telecamera con anticipo nella direzione di marcia
 const t=p.car||p;const look=p.car?{x:Math.cos(p.car.ang)*p.car.v*.45,y:Math.sin(p.car.ang)*p.car.v*.45}:{x:p.fx*30,y:p.fy*30};const vw=VW/G.zoom,vh=VH/G.zoom;
 const cx=clamp(t.x+look.x-vw/2,0,Math.max(0,G.map.w-vw)),cy=clamp(t.y+look.y-vh/2,0,Math.max(0,G.map.h-vh));G.cam.x+=(cx-G.cam.x)*Math.min(1,dt*5);G.cam.y+=(cy-G.cam.y)*Math.min(1,dt*5);
 if(G.time%3<dt)save();}
// --------------------------------------------------------------- disegno
function sprite(e,scale=.29){const img=images[e.def.id];if(!img)return;const t=G.time+(e.anim||0);let f=e.dead?14:e.down>0?14:e.hurtT>0?13:e.windup>0?6:e.time>0?(e.action==='kick'?9:7):e.walking?2+Math.floor(t*8)%2:Math.floor(t*2)%2;if(window.ChurchAnim)f=ChurchAnim.frame(e.def.id,f,t);const size=190*scale;const x=e.x,y=e.y;
 c.fillStyle='#0000004d';c.beginPath();c.ellipse(x,y,15*scale/.29,5*scale/.29,0,0,TAU);c.fill();c.save();if(e.dead)c.globalAlpha=Math.max(0,e.deadT);if(e.invuln>0&&e===G.player&&Math.floor(G.time*16)%2)c.globalAlpha=.55;if(CP.st(e,'invisible')||e.buff?.invisible)c.globalAlpha=.25;c.translate(x,y+3);c.scale(e.dir||1,1);if(f===14){c.rotate(0);}c.drawImage(img,f%4*img.width/4,Math.floor(f/4)*img.height/4,img.width/4,img.height/4,-size/2,-size*.94,size,size);c.restore();}
function drawCar(car){if(car.horse&&window.ChurchHorse){const mv=Math.abs(car.v)>20;const lift=(car.rear||0)>0?6:0;ChurchHorse.drawTop(c,car.x,car.y-lift,car.ang,1.05,G.time,mv);
  if(car.driver==='player'){const p=G.player,img=images[p.def.id];if(img){c.save();c.translate(car.x-Math.cos(car.ang)*3,car.y-8-lift);c.scale(Math.cos(car.ang)>=0?1:-1,1);const s=190*.31,fr=p.time>0?(p.action==='kick'?9:7):10;c.drawImage(img,fr%4*img.width/4,Math.floor(fr/4)*img.height/4,img.width/4,img.height/4,-s/2,-s*.94,s,s);c.restore();}}
  else if(car.mine&&G.player.def.id==='innominato'&&!G.player.car)marker(car.x,car.y-34,'#f7a406');return;}
 c.save();c.translate(car.x,car.y);c.rotate(car.ang);const L=car.len,W=car.wid;c.fillStyle='#00000055';c.fillRect(-L/2+4,-W/2+5,L,W);
 if(car.bike){c.fillStyle='#15191c';c.fillRect(-L/2,-2,L,4);c.fillStyle=car.color;c.fillRect(-L/2+6,-W/2+1,L-12,W-2);c.fillStyle='#202020';c.beginPath();c.arc(-L/2+3,0,4,0,TAU);c.arc(L/2-3,0,4,0,TAU);c.fill();c.fillStyle='#d9c08a';c.fillRect(L/2-12,-W/2-2,3,W+4);}
 else{c.fillStyle=car.wreck?'#3a3633':(car.color);c.beginPath();c.roundRect?c.roundRect(-L/2,-W/2,L,W,6):c.rect(-L/2,-W/2,L,W);c.fill();c.fillStyle=car.wreck?'#2a2725':car.roof;c.fillRect(-L*.18,-W/2+4,L*.38,W-8);c.fillStyle='#9fc6d6';c.fillRect(L*.2,-W/2+4,L*.1,W-8);c.fillRect(-L*.28,-W/2+5,L*.07,W-10);c.fillStyle='#f6e7a8';c.fillRect(L/2-3,-W/2+3,3,5);c.fillRect(L/2-3,W/2-8,3,5);c.fillStyle='#c0392b';c.fillRect(-L/2,-W/2+3,3,5);c.fillRect(-L/2,W/2-8,3,5);
  if(car.kind==='4x4'){c.fillStyle='#202425';c.fillRect(-L/2-5,-6,5,12);}if(car.chaser){c.fillStyle=Math.floor(G.time*6)%2?'#ff5a4a':'#ffdd66';c.fillRect(-4,-3,8,6);}
  if(car.wreck){c.fillStyle='#55555588';for(let i=0;i<4;i++){c.beginPath();c.arc(Math.sin(G.time*2+i)*8,-10-((G.time*30+i*12)%40),8+i*2,0,TAU);c.fill();}}}
 c.restore();if(car.missionCar&&G.player.car!==car){marker(car.x,car.y-30,'#ffd36b');}
 if(car.driver==='player'&&!car.bike&&car.hp<car.maxHp*.35){c.fillStyle='#ff6a4a';c.beginPath();c.arc(car.x+Math.cos(car.ang)*car.len*.4,car.y+Math.sin(car.ang)*car.len*.4,4+Math.sin(G.time*20)*2,0,TAU);c.fill();}
 if(car.driver==='player'&&car.bike){const p=G.player,img=images[p.def.id];if(img){c.save();c.translate(car.x,car.y);c.scale(Math.cos(car.ang)>=0?1:-1,1);const s=190*.26;c.drawImage(img,2*img.width/4,0,img.width/4,img.height/4,-s/2,-s*.94,s,s);c.restore();}}}
function marker(x,y,col){const b=Math.sin(G.time*5)*4;c.fillStyle=col;c.beginPath();c.moveTo(x,y+b);c.lineTo(x-8,y-14+b);c.lineTo(x+8,y-14+b);c.closePath();c.fill();}
function drawAnimal(a){const atlas=images['animals-dogs'];if(!atlas)return;c.fillStyle='#0004';c.beginPath();c.ellipse(a.x,a.y,14,5,0,0,TAU);c.fill();c.save();c.translate(a.x,a.y+4);c.scale(a.dir*.5,.5);const fr=a.moving?1+Math.floor(a.anim*10)%2:0;c.drawImage(atlas,fr*atlas.width/4,2*atlas.height/4,atlas.width/4,atlas.height/4,-48,-90,96,96);c.restore();if(!a.caught){c.font='bold 11px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#ffe36a';c.fillText('SAURON',a.x,a.y-48);}}
function ring(x,y,r,col,fill){c.save();c.globalAlpha=.85;c.strokeStyle=col;c.lineWidth=4;c.beginPath();c.arc(x,y,r+Math.sin(G.time*4)*3,0,TAU);c.stroke();if(fill){c.globalAlpha=.18;c.fillStyle=col;c.fill();}c.restore();}
function drawWorld(){const z=G.zoom,vw=VW/z,vh=VH/z;c.save();c.scale(z,z);c.translate(-G.cam.x,-G.cam.y);
 const sx=Math.max(0,Math.floor(G.cam.x)),sy=Math.max(0,Math.floor(G.cam.y));c.fillStyle='#5d5a50';c.fillRect(G.cam.x,G.cam.y,vw,vh);M.drawTiles(G.baked,c,G.cam.x,G.cam.y,vw,vh);
 // marcatori missioni
 for(const m of MISSIONS){const g=startPos(m);if(!G.onScreen(g))continue;const ok=available(m),done=G.done.has(m.id);if(G.mission&&G.mission!==m)continue;if(G.mission===m)continue;ring(g.x,g.y,30,done?'#7fb38a':ok?'#ffd36b':'#8b8f8a',ok);if(ok){const giver={def:byId(m.giver),x:g.x+34,y:g.y,dir:-1,anim:0};sprite(giver,.27);c.font='bold 13px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#1d2224';c.fillText(m.title.toUpperCase(),g.x+1,g.y-58);c.fillStyle='#ffe08a';c.fillText(m.title.toUpperCase(),g.x,g.y-59);}else if(!done&&m.need){c.font='bold 11px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#d6d2c2';c.fillText('BLOCCATA · '+G.done.size+'/'+m.need,g.x,g.y-40);}}
 const obj=objective();if(obj&&G.mission){const s=G.mission.steps[G.step];if(['go','drive'].includes(s.t)&&obj.x!==undefined&&!obj.len)ring(obj.x,obj.y,s.t==='drive'?80:62,'#ffd36b',true);}
 for(const cp of G.checkpoints.slice(0,2)){ring(cp.x,cp.y,46,cp===G.checkpoints[0]?'#7ef0c8':'#7ef0c855',cp===G.checkpoints[0]);}
 for(const f of G.pickups){if(!G.onScreen(f))continue;if(f.kind==='ticket'){c.save();c.translate(f.x,f.y-10+Math.sin(G.time*4)*3);c.rotate(Math.sin(G.time*2)*.2);c.fillStyle='#e6c776';c.fillRect(-11,-8,22,16);c.fillStyle='#8cb18b';c.fillRect(-8,-4,16,5);c.restore();marker(f.x,f.y-24,'#ffd36b');}else{c.fillStyle=f.kind==='energy'?'#8bd5cd':'#a4d6a5';c.fillRect(f.x-5,f.y-18,10,18);}}
 // oggetti in profondità
 const things=[...G.cars.filter(G.onScreen).map(o=>({y:o.y,d:()=>drawCar(o)})),...G.peds.filter(G.onScreen).map(o=>({y:o.y,d:()=>sprite(o)})),...G.enemies.filter(G.onScreen).map(o=>({y:o.y,d:()=>{sprite(o,o.boss?.34:.29);if(!o.dead){c.fillStyle='#25363a';c.fillRect(o.x-18,o.y-62,36,4);c.fillStyle=o.boss?'#efbc63':'#be766b';c.fillRect(o.x-18,o.y-62,36*o.hp/o.maxHp,4);if(o.windup>0){c.font='bold 18px monospace';c.textAlign='center';c.fillStyle='#ff7463';c.fillText('!',o.x,o.y-68);}const lab=CP.labelOf(o);if(lab){c.font='bold 10px monospace';c.textAlign='center';c.fillStyle='#9fe3ff';c.fillText(lab,o.x,o.y-70);}if(o.boss){c.font='bold 11px monospace';c.textAlign='center';c.fillStyle='#ffe2a3';c.fillText(o.def.nome,o.x,o.y-80);}}}})),...G.animals.map(o=>({y:o.y,d:()=>drawAnimal(o)}))];
 if(!G.player.car&&G.wasted<=0)things.push({y:G.player.y,d:()=>{const p=G.player;if(p.dash?.m.visual)CP.vehicle(c,p.dash.m.visual,p.x,p.y,p.dir,Math.atan2(p.dash.vy,p.dash.vx));sprite(p);if(p.counter){c.strokeStyle='#99e4ff';c.setLineDash([6,5]);c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-25,32,0,TAU);c.stroke();c.setLineDash([]);}const m=G.mission?.steps[G.step];if(m?.carry){c.font='bold 10px monospace';c.textAlign='center';c.fillStyle='#ffe08a';c.fillText(m.carry,p.x,p.y-62);}}});
 if(G.wasted>0&&!G.player.car)things.push({y:G.player.y,d:()=>sprite({...G.player,dead:true,deadT:1})});
 things.sort((a,b)=>a.y-b.y).forEach(t=>t.d());
 CP.draw(c,G,{x:0,y:0},{images},{top:true,width:G.map.w,height:G.map.h});
 for(const f of G.particles){c.globalAlpha=Math.min(1,f.life*2);c.font='bold 15px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#1d2224';c.fillText(f.text,f.x+1,f.y+1);c.fillStyle=f.color;c.fillText(f.text,f.x,f.y);c.globalAlpha=1;}
 c.restore();
 // freccia verso l'obiettivo se fuori schermo
 if(obj&&G.mission){const t=G.player.car||G.player;const sx2=(obj.x-G.cam.x)*z,sy2=(obj.y-G.cam.y)*z;if(sx2<30||sx2>VW-30||sy2<30||sy2>VH-30){const px=(t.x-G.cam.x)*z,py=(t.y-G.cam.y)*z;const a=Math.atan2(sy2-py,sx2-px);const ex=clamp(px+Math.cos(a)*1e4,40,VW-40),ey=clamp(py+Math.sin(a)*1e4,150,VH-60);const k=Math.min((ex-px)/Math.cos(a)||1e9,(ey-py)/Math.sin(a)||1e9);const ax=clamp(px+Math.cos(a)*Math.abs(k),40,VW-40),ay=clamp(py+Math.sin(a)*Math.abs(k),150,VH-60);c.save();c.translate(ax,ay);c.rotate(a);c.fillStyle='#ffd36b';c.strokeStyle='#1d2224';c.lineWidth=3;c.beginPath();c.moveTo(22,0);c.lineTo(-10,-14);c.lineTo(-4,0);c.lineTo(-10,14);c.closePath();c.stroke();c.fill();c.restore();c.font='bold 12px monospace';c.textAlign='center';c.fillStyle='#ffe08a';c.fillText(Math.round(hyp(obj.x-t.x,obj.y-t.y)/5)+' m',ax,ay+30);}}}
function hud(){const p=G.player;c.fillStyle='#14252ce8';c.fillRect(14,14,300,78);c.font='bold 15px ui-monospace,monospace';c.textAlign='left';c.fillStyle='#f4e5c5';c.fillText(p.def.nome.toUpperCase().slice(0,24),26,36);c.fillStyle='#634b4a';c.fillRect(26,46,276,10);c.fillStyle='#f4c475';c.fillRect(26,46,276*p.hp/p.maxHp,10);c.fillStyle='#34494b';c.fillRect(26,62,276,6);c.fillStyle='#8bd5cd';c.fillRect(26,62,276*p.meter/100,6);c.font='bold 11px monospace';c.fillStyle='#a4d4c9';c.fillText('RISPETTO '+G.respect+'  ·  MISSIONI '+G.done.size+'/'+MISSIONS.length,26,84);
 if(p.car){const car=p.car;c.fillStyle='#14252ce8';c.fillRect(14,96,300,30);c.font='bold 11px monospace';c.fillStyle='#ffe1a0';c.fillText((car.name||'AUTO').toUpperCase(),24,115);c.fillStyle='#634b4a';c.fillRect(170,107,90,8);c.fillStyle=car.hp>car.maxHp*.35?'#a4d6a5':'#ff7a5a';c.fillRect(170,107,90*Math.max(0,car.hp)/car.maxHp,8);c.fillStyle='#d3cdb7';c.textAlign='right';c.fillText(Math.round(Math.abs(car.v)/5)+' km/h',306,115);}
 // minimappa
 const mm=G.minimap;if(mm){const W=mm.canvas.width,H=mm.canvas.height,x0=VW-W-14,y0=14;c.fillStyle='#0d161b';c.fillRect(x0-4,y0-4,W+8,H+8);c.drawImage(mm.canvas,x0,y0);const q=G.player.car||G.player;const dot=(x,y,col,r=4)=>{c.fillStyle=col;c.beginPath();c.arc(x0+x*mm.sc,y0+y*mm.sc,r,0,TAU);c.fill();};
  c.strokeStyle='#ffffff88';c.lineWidth=1;c.strokeRect(x0+G.cam.x*mm.sc,y0+G.cam.y*mm.sc,VW/G.zoom*mm.sc,VH/G.zoom*mm.sc);
  if(!G.mission)for(const m of MISSIONS){const g=startPos(m);if(available(m))dot(g.x,g.y,'#ffd36b',5);else if(G.done.has(m.id))dot(g.x,g.y,'#7fb38a',3);}
  const o=objective();if(o)dot(o.x,o.y,'#ffd36b',5);for(const cp of G.checkpoints)dot(cp.x,cp.y,'#7ef0c8',3);for(const e of G.enemies)if(!e.dead)dot(e.x,e.y,'#ff6a5a',3);for(const car of G.cars)if(car.chaser)dot(car.x,car.y,'#ff3a2a',5);
  c.save();c.translate(x0+q.x*mm.sc,y0+q.y*mm.sc);c.rotate(p.car?p.car.ang:Math.atan2(p.fy,p.fx));c.fillStyle='#fff';c.strokeStyle='#000';c.beginPath();c.moveTo(8,0);c.lineTo(-5,-5);c.lineTo(-5,5);c.closePath();c.fill();c.stroke();c.restore();
  c.font='bold 10px monospace';c.textAlign='right';c.fillStyle='#9fb5ad';c.fillText('M · MAPPA',x0+W,y0+H+14);}
 // pannello missione
 if(G.mission){const m=G.mission,s=m.steps[G.step];const w=530,x=328;c.fillStyle='#17262cdc';c.fillRect(x,14,w,58);c.font='bold 12px ui-monospace,monospace';c.textAlign='left';c.fillStyle='#ffc66b';c.fillText(m.title.toUpperCase(),x+12,34);c.font='bold 15px ui-monospace,monospace';c.fillStyle='#f4e5c5';let txt=s.text;if(s.t==='collect')txt+=` · ${G.pickups.filter(f=>f.kind==='ticket').length} rimasti`;if(s.t==='checkpoints')txt+=` · ${s.n-G.checkpoints.length}/${s.n}`;if(s.t==='survive')txt+=` · ${Math.ceil(s._left)} s`;if(s.t==='fight')txt+=` · ${G.enemies.filter(e=>e.mission&&!e.dead).length} in piedi`;c.fillText(txt,x+12,58);
  if(G.timer>0){c.textAlign='right';c.font='bold 22px ui-monospace,monospace';c.fillStyle=G.timer<10?'#ff7a5a':'#ffe1a0';c.fillText(Math.floor(G.timer/60)+':'+String(Math.floor(G.timer%60)).padStart(2,'0'),x+w-12,48);}}
 // suggerimento auto
 const p2=G.player;if(!p2.car&&G.wasted<=0){const near=G.cars.find(o=>!o.wreck&&!o.chaser&&hyp(o.x-p2.x,o.y-p2.y)<o.len/2+40);if(near){c.font='bold 14px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#14252cd8';c.fillRect(VW/2-170,VH-120,340,30);c.fillStyle='#c6f2a4';c.fillText('E / 🚗 AUTO · '+(near.name||'veicolo').toUpperCase(),VW/2,VH-100);}}
 if(G.toastT>0){c.font='bold 18px ui-monospace,monospace';c.textAlign='center';const w=Math.min(VW-40,c.measureText(G.toast).width+40);c.fillStyle='#17262cd9';c.fillRect(VW/2-w/2,90,w,36);c.fillStyle='#ffe1a0';c.fillText(G.toast,VW/2,114);}
 if(G.wasted>0){c.fillStyle='#3a0d0d88';c.fillRect(0,0,VW,VH);c.font='bold 64px Impact,sans-serif';c.textAlign='center';c.fillStyle='#ffd2a0';c.fillText('A TERRA',VW/2,VH/2);}
 if(G.paused){c.fillStyle='#14222bb0';c.fillRect(0,0,VW,VH);c.font='bold 52px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#ffe1a0';c.fillText('PAUSA',VW/2,VH/2);}}
function bigMap(){const m=G.map;const sc=Math.min((VW-40)/m.w,(VH-80)/m.h);const W=m.w*sc,H=m.h*sc,x0=(VW-W)/2,y0=50;c.fillStyle='#0d161bf2';c.fillRect(0,0,VW,VH);c.drawImage(G.baked.canvas,x0,y0,W,H);c.font='bold 16px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#ffe1a0';c.fillText((G.map.name||'').toUpperCase()+' · TOCCA O PREMI M PER CHIUDERE',VW/2,32);
 for(const mm of MISSIONS){const g=startPos(mm);const ok=available(mm),done=G.done.has(mm.id);c.fillStyle=done?'#7fb38a':ok?'#ffd36b':'#8b8f8a';c.beginPath();c.arc(x0+g.x*sc,y0+g.y*sc,7,0,TAU);c.fill();const same=MISSIONS.filter(o=>o.at===mm.at),ly=y0+g.y*sc+(same.indexOf(mm)%2?24:-12);c.font='bold 11px monospace';c.fillStyle='#14202a';c.fillText(mm.title,x0+g.x*sc+1,ly+1);c.fillStyle=done?'#bfe6c6':ok?'#ffe8a8':'#c9ccc8';c.fillText(mm.title+(done?' ✓':!ok&&mm.need?' · '+G.done.size+'/'+mm.need:''),x0+g.x*sc,ly);}
 const q=G.player.car||G.player;c.fillStyle='#fff';c.beginPath();c.arc(x0+q.x*sc,y0+q.y*sc,6,0,TAU);c.fill();c.strokeStyle='#000';c.stroke();}
function render(){if(!G.baked){c.fillStyle='#101a20';c.fillRect(0,0,VW,VH);return;}if(G.mode==='menu'){G.cam.x=(G.cam.x+.4)%Math.max(1,G.map.w-VW);G.cam.y=Math.max(0,G.map.h/2-VH/2);c.save();c.translate(-G.cam.x,-G.cam.y);M.drawTiles(G.baked,c,G.cam.x,G.cam.y,VW,VH);c.restore();return;}
 drawWorld();grade();hud();if(G.bigmap)bigMap();}
// luce: vignettatura morbida e tono caldo di fine pomeriggio
let gradeKey='',gradeFill=null;function grade(){if(gradeKey!==VW){gradeKey=VW;const g=c.createRadialGradient(VW/2,VH*.45,VH*.35,VW/2,VH/2,VW*.62);g.addColorStop(0,'#ffd9a000');g.addColorStop(.7,'#2a1d1022');g.addColorStop(1,'#0b0a1466');gradeFill=g;}c.fillStyle='#ffb46a0d';c.fillRect(0,0,VW,VH);c.fillStyle=gradeFill;c.fillRect(0,0,VW,VH);}
// --------------------------------------------------------------- interfaccia
function save(){try{localStorage.setItem('church-quartiere',JSON.stringify({id:G.player?.def.id,done:[...G.done],respect:G.respect}));}catch{}}
function showBrief(m){const g=byId(m.giver);$('brief').hidden=false;$('brieftitle').textContent=m.title;$('briefgiver').textContent=g.nome;$('brieftext').textContent=m.intro;$('briefportrait').style.backgroundImage=`url(assets/${g.id}.webp)`;G.paused=true;}
function showResult(t,s){$('result').hidden=false;$('resulttitle').textContent=t;$('resulttext').textContent=s;G.paused=true;}
$('briefgo').onclick=()=>{$('brief').hidden=true;G.paused=false;canvas.focus();};
$('briefno').onclick=()=>{$('brief').hidden=true;G.paused=false;const m=G.mission;G.mission=null;G.cool=3;G.checkpoints=[];G.pickups=G.pickups.filter(x=>x.kind!=='ticket');G.cars=G.cars.filter(c=>!c.missionCar||c.driver==='player');G.enemies=G.enemies.filter(e=>!e.mission);G.animals=[];for(const car of G.cars)if(car.chaser){car.chaser=false;car.driver=null;}const p=G.player,g=startPos(m);const q=nearFree(g.x,g.y+80);if(!p.car){p.x=q.x;p.y=q.y;}};
$('resultok').onclick=()=>{$('result').hidden=true;G.paused=false;canvas.focus();};
function togglePause(force){if(G.mode!=='play')return;if(!$('brief').hidden||!$('result').hidden)return;G.paused=force??!G.paused;music(audioOn&&!G.paused);keys.clear();touch.reset();$('tpause').textContent=G.paused?'▶':'II';}
$('tpause').onclick=()=>togglePause();$('tmap').onclick=()=>{if(G.mode==='play')G.bigmap=!G.bigmap;};canvas.addEventListener('pointerdown',()=>{if(G.bigmap)G.bigmap=false;});
window.addEventListener('keydown',e=>{if(G.bigmap&&['KeyM','Tab','Escape'].includes(e.code)){G.bigmap=false;keys.delete('map');pressed.delete('map');e.preventDefault();}},true);
$('tsound').onclick=()=>{audioOn=!audioOn;try{localStorage.setItem('church-audio',audioOn?'1':'0');}catch{}if(audioOn)window.ChurchSFX?.unlock();music(audioOn&&G.mode==='play'&&!G.paused);$('tsound').textContent=audioOn?'♪':'×♪';sound('pickup');};$('tsound').textContent=audioOn?'♪':'×♪';
$('tmenu').onclick=()=>{music(false);G.mode='menu';G.paused=false;G.bigmap=false;touch.show(false);document.documentElement.classList.remove('playing');$('menu').hidden=false;$('brief').hidden=true;$('result').hidden=true;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});};
function fillSelect(){const sel=$('char');sel.innerHTML=roster.map(r=>`<option value="${r.id}">${r.nome}</option>`).join('');let s={};try{s=JSON.parse(localStorage.getItem('church-quartiere'))||{};}catch{}if(s.id&&roster.some(r=>r.id===s.id))sel.value=s.id;else sel.value='mario';if(s.done)G.done=new Set(s.done);G.respect=s.respect||0;updateKit();}
function updateKit(){const k=CP.kit($('char').value);$('charkit').textContent=k.moves.map(m=>m.name).join(' · ')+' · ★ '+k.sup.name;$('charimg').style.backgroundImage=`url(assets/${$('char').value}.webp)`;}
$('char').onchange=updateKit;
document.documentElement.dataset.view='top';
$('start').onclick=()=>{if(audioOn){window.ChurchSFX?.unlock();music(true);}$('menu').hidden=true;document.documentElement.classList.add('playing');G.zoom=ChurchTouch.phone()?1.3:1;if(ChurchTouch.phone()||ChurchTouch.coarse())ChurchTouch.landscape();startGame($('char').value);touch.show(ChurchTouch.coarse()||ChurchTouch.phone());canvas.focus();};
$('reset').onclick=()=>{const b=$('reset');if(!b.dataset.arm){b.dataset.arm='1';b.dataset.lab=b.textContent;b.textContent='SICURO? TOCCA ANCORA';setTimeout(()=>{if(b.dataset.arm){delete b.dataset.arm;b.textContent=b.dataset.lab;}},3000);return;}delete b.dataset.arm;b.textContent=b.dataset.lab;G.done=new Set();G.respect=0;save();$('progress').textContent=progressText();};
function progressText(){return`Missioni completate: ${G.done.size}/${MISSIONS.length} · Rispetto ${G.respect}`;}
// mappa: incorporata oppure OpenStreetMap
async function useMap(map,label){$('mapinfo').textContent='Disegno della mappa…';await new Promise(r=>setTimeout(r,20));loadMap(map);$('mapinfo').textContent=label;}
$('osmfile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{$('mapinfo').textContent='Lettura di '+f.name+'…';const text=await f.text();const map=M.parseOSM(text);await useMap(map,`Mappa importata: ${map.roads.length} strade, ${map.buildings.length} edifici. ${M.PLACES.length} luoghi del gioco posizionati per nome della via.`);try{localStorage.setItem('church-osm',text.length<4.5e6?text:'');}catch{$('mapinfo').textContent+=' (Troppo grande per salvarla nel browser: va ricaricata ogni volta.)';}$('mapsrc').value='osm';}catch(err){$('mapinfo').textContent='Errore: '+err.message;}};
$('mapsrc').onchange=async()=>{if($('mapsrc').value==='builtin'){await useMap(M.builtin(),'Pianta scenografica di Sant’Andrea: luoghi del gioco, posizioni indicative.');}else{let t='';try{t=localStorage.getItem('church-osm')||'';}catch{}if(t){try{await useMap(M.parseOSM(t),'Mappa OpenStreetMap salvata in questo browser.');}catch(err){$('mapinfo').textContent='Errore: '+err.message;}}else{$('mapinfo').textContent='Scegli il file .osm esportato da openstreetmap.org.';$('osmfile').click();}}};
// caricamento
const ids=[...roster.map(r=>r.id),'animals-dogs','animals-wild',...Array.from({length:5},(_,i)=>'mural-'+i)];
Promise.all(ids.map(id=>new Promise(res=>{const i=new Image();i.onload=()=>{images[id]=i;res();};i.onerror=res;i.src='assets/'+id+'.webp';}))).then(async()=>{fillSelect();let t='';try{t=localStorage.getItem('church-osm')||'';}catch{}if(t){try{await useMap(M.parseOSM(t),'Mappa OpenStreetMap salvata in questo browser.');$('mapsrc').value='osm';}catch{await useMap(M.builtin(),'Pianta scenografica di Sant’Andrea.');}}else await useMap(M.builtin(),'Pianta scenografica di Sant’Andrea: luoghi del gioco, posizioni indicative.');$('start').disabled=false;$('start').textContent='ENTRA NEL QUARTIERE →';$('progress').textContent=progressText();});
// ciclo
let last=0,acc=0,lastBtn=0;function frame(t){const dt=last?Math.min(.1,(t-last)/1000):0;last=t;if(dt>0){const n=Math.ceil(dt/(1/60)-.01);for(let i=0;i<n;i++)update(dt/n);}render();
 if(t-lastBtn>120&&G.player&&G.mode==='play'){lastBtn=t;const p=G.player,k=p.kit,inCar=!!p.car;const short=s=>{const w=s.replace(/^(L'|La |Il |Lo |Le |I )/i,'').split(/\s+/);return(w[0].length>9?w[0].slice(0,8)+'.':w[0]).toUpperCase();};
  ['special1','special2','special3'].forEach((id,i)=>{const m=k.moves[i];if(!m||inCar){touch.set(id,{hidden:true});return;}const cost=Math.round(m.cost*(k.passive.costMul||1)),cd=p.cds?.[String(i)]||0;touch.set(id,{hidden:false,label:short(m.name),sub:cost+'⚡',ready:p.meter>=cost&&cd<=0,disabled:p.meter<cost,cd:cd>0?cd/m.cd:0});});
  touch.set('super',{hidden:inCar,sub:p.meter>=100?'SUPER!':Math.floor(p.meter)+'%',ready:p.meter>=100,disabled:p.meter<100});touch.set('punch',{hidden:inCar});touch.set('kick',{hidden:inCar});touch.set('brake',{hidden:!inCar});touch.set('car',{sub:inCar?'SCENDI':'AUTO'});}
 requestAnimationFrame(frame);}
requestAnimationFrame(frame);window.theQuartiere={G,MISSIONS,startMission,toggleCar};
})();
