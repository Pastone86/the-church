/* The Church 2.7 — poteri enormi e nuovi personaggi (Innominato, Geppetto).
 * Si carica subito dopo powers.js: ritocca il roster (Duello), le regole del
 * Duello e i poteri di Strade e Quartiere (ChurchPowers.P).
 *  - Zanfo, Smartone, Spazzola e Gaetano 'o pazzo: super e speciali enormi.
 *  - Nuovo: l'Innominato, il più forte di tutti.
 */
(function(){'use strict';
const D=window.CHURCH_DATA;if(!D)return;const R=D.personaggi.personaggi,RULES=D['combat-rules']=D['combat-rules']||{},P=window.ChurchPowers&&window.ChurchPowers.P;
const S=(name,o)=>({name,...o});const get=id=>R.find(r=>r.id===id);
const rules=id=>RULES[id]=RULES[id]||{moves:{},traits:{height:64}};

/* ---------------- ZANFO: la montagna di pietre */
{const c=get('zanfo');if(c){Object.assign(c.super,{nome:'La Grande Frana',danno:640,note:'Nove pietre una dopo l’altra, l’ultima è un masso enorme. Si para, ma fa malissimo lo stesso.'});
 const r=rules('zanfo');r.super={...(r.super||{}),mode:'projectile',visual:'stone',hits:9,speed:12,startup:14,recovery:30,cost:1000};
 c.mosse[2]&&Object.assign(c.mosse[2],{nome:'Il Masso',danno:240,note:'Un masso gigante che attraversa tutto lo schermo.'});r.moves['2']={...(r.moves['2']||{}),visual:'stone',hits:1,speed:7};}
 if(P&&P.zanfo){P.zanfo.passive={label:'Tiratore: proiettili +35%',shotMul:1.35};
  P.zanfo.moves[2]=S('Il Masso',{kind:'shot',dmg:240,size:2.8,speed:420,pierce:true,knock:520,status:{stun:.8},visual:'stone',desc:'Un masso gigante che travolge tutta la fila'});
  P.zanfo.sup=S('La Grande Frana',{kind:'multi',steps:[{kind:'rain',dmg:560,waves:5,visual:'stone'},{kind:'aoe',dmg:140,radius:460,status:{stun:1.6},knock:300,visual:'stone'}],desc:'Cinque ondate di pietre dal cielo: tutto lo schermo trema'});}}

/* ---------------- SMARTONE: testate e Smart a tutta birra */
{const c=get('petrone');if(c){Object.assign(c.super,{danno:760,note:'Sette testate imparabili, poi arriva la Smart a tutta birra.'});
 const r=rules('petrone');r.super={...(r.super||{}),hits:7,grab:true,unblockable:true};}
 if(P&&P.petrone){P.petrone.passive={def:.8,atk:1.2,label:'Picchiatore: -20% danni, +20% forza'};
  P.petrone.moves[2]=S('Smart a tutta birra',{kind:'sweep',dmg:260,count:3,visual:'headlights',desc:'La Smart attraversa la strada tre volte'});
  P.petrone.sup=S('Non Ci Sto Più Dentro',{kind:'multi',steps:[{kind:'melee',dmg:760,hits:7,reach:210,around:true,unblockable:true,status:{stun:2.5},knock:420},{kind:'sweep',dmg:220,count:2,visual:'headlights'}],desc:'Sette testate tutto intorno, poi la Smart investe chi resta'});}}

/* ---------------- SPAZZOLA: cento mani */
{const c=get('4mani');if(c){Object.assign(c.super,{nome:'Cento Mani',danno:700,note:'Forbici, pettine e phon: sedici colpi a raffica, nessuno resta in piedi.'});
 const r=rules('4mani');r.super={...(r.super||{}),hits:16,reach:110};}
 if(P&&P['4mani']){P['4mani'].passive={label:'Mani velocissime: pugni rapidi, +15% forza',fastPunch:true,atk:1.15};
  P['4mani'].moves[2]=S('Phon a turbina',{kind:'aura',radius:230,dur:5,pulse:.3,dmg:24,status:{slow:[.5,1]},visual:'smoke',desc:'Un tornado d’aria calda: rallenta e brucia chi è vicino'});
  P['4mani'].sup=S('Cento Mani',{kind:'melee',dmg:950,hits:20,reach:360,around:true,status:{stun:2},knock:380,desc:'Cento mani tutte insieme, tutto intorno'});}}

/* ---------------- GAETANO 'O PAZZO: il nome che fa tremare il quartiere */
{const c=get('gaetano');if(c){Object.assign(c.super,{danno:820,note:'Pronuncia il nome intero: otto secondi in cui trema tutto lo schermo, imparabile.'});
 const r=rules('gaetano');r.super={...(r.super||{}),mode:'aura',duration:480,radius:600,pulse:40,pulseDamage:95,unblockable:true,visual:'sound'};}
 if(P&&P.gaetano){P.gaetano.passive={label:'Sotto il 50%: furia +80%',rage:{below:.5,atk:1.8},def:.85};
  P.gaetano.moves[2]=S('Terremoto Mitico',{kind:'aoe',dmg:270,radius:520,hits:3,status:{stun:1.5},knock:420,visual:'sound',desc:'Batte il piede: trema tutto il quartiere'});
  P.gaetano.sup=S('Il Nome Completo',{kind:'multi',steps:[{kind:'aura',radius:720,dur:8,pulse:.3,dmg:72,unblockable:true,visual:'sound'},{kind:'buff',dur:8,self:{atk:1.5,armor:1,invuln:1.2}}],desc:'Otto secondi di nome: niente e nessuno lo ferma'});}}


/* ---------------- BEPPONE 2.6.3: sprite e mosse disegnate da Giuseppe
 * Foglio 4x4 nell'ordine dell'autore: 0-3 guardia, 4-7 camminata, 8-11 pugno, 12 calcio, 13 parata, 14 colpito, 15 a terra.
 * ChurchAnim traduce le pose standard del gioco in quelle del suo foglio (con i tempi indicati). */
window.ChurchAnim=window.ChurchAnim||{map:{},frame(id,f,t){const m=this.map[id];if(!m)return f;
 if(f===0||f===1)return m.idle[Math.floor(t*1000/m.idleMs)%m.idle.length];
 if(f===2||f===3)return m.walk[Math.floor(t*1000/m.walkMs)%m.walk.length];
 return m.f[f]??f;}};
ChurchAnim.map.beppone={idle:[0,1,2,3],idleMs:140,walk:[4,5,6,7],walkMs:100,
 // pose standard -> pose di Beppone: 4/6 carica = 9, 5/7 pugno = 10, 8 prepara calcio = 0, 9 calcio = 12,
 // 10 accucciato = 13, 11 salto = 1, 12 parata = 13, 13 colpito = 14, 14 a terra = 15, 15 vittoria = 11
 f:{4:9,5:10,6:9,7:10,8:0,9:12,10:13,11:1,12:13,13:14,14:15,15:11}};
{const c=get('beppone');if(c){c.stats.vita=1000;
 c.mosse=[{nome:'Zoccolata di cemento',comando:'↓ ↘ → + P',danno:180,proprieta:['atterramento'],note:'Zoccolata di legno che manda a terra. Costa 35 di energia (Strade e Quartiere).'},
  {nome:'Raffica del Beppone',comando:'↓ ↘ → + K',danno:250,proprieta:['atterramento'],note:'Due pugni rapidi da 60 e un colpo finale da 130 che manda a terra. Costa 60 di energia.'}];
 c.super={nome:'Sentenza del quartiere',danno:360,proprieta:['atterramento'],note:'Para, poi un pugno da 130 e il colpo finale da 230 che scaraventa via. Costa tutta la barra (tre tacche).'};
 RULES.beppone={moves:{'0':{reach:76,startup:13,active:9,recovery:18,hits:1,visual:'stone'},'1':{reach:62,startup:6,active:32,recovery:18,hits:3}},traits:{height:70},
  super:{cost:3000,reach:84,hits:2,startup:15,active:22,recovery:30,visual:'stone'}};}
 if(P&&P.beppone){P.beppone={passive:{atk:1.35,label:'Pugno di cemento (65) e Zoccolata (100) · parata: -80% danni'},moves:[
   S('Zoccolata di cemento',{kind:'melee',dmg:180,reach:150,knock:420,status:{stun:.9},cost:35,visual:'stone',desc:'Zoccolata di legno che manda a terra'}),
   S('Raffica del Beppone',{kind:'melee',dmg:250,hits:3,reach:120,knock:380,status:{stun:.7},cost:60,desc:'Due pugni rapidi e il colpo finale che atterra'})],
  sup:S('Sentenza del quartiere',{kind:'melee',dmg:360,hits:2,reach:170,around:true,knock:560,status:{stun:1.2},cost:100,visual:'stone',desc:'Para, poi due colpi di cemento: chi resta in piedi vola via'})};}}

/* ---------------- BRUCE 2.7.1: la Poiana Gigante (foglio 4x4 di Giuseppe: 0-1 riposo, 2-3 decollo, 4-7 volo, 8-11 attacco, 12-15 super) */
window.ChurchPoiana=window.ChurchPoiana||(function(){const img=new Image();let ok=false;img.onload=()=>ok=true;img.src='assets/poiana.webp';
 const A={idle:[0,1],takeoff:[2,3],fly:[4,5,6,7],attack:[8,9,10,11],super:[12,13,14,15]};
 return{A,img,get ready(){return ok},draw(c,x,y,dir,size,t,anim='super',fps=10){if(!ok)return;const fr=A[anim]||A.fly,k=fr[Math.floor(t*fps)%fr.length],w=img.width/4;
  c.save();c.translate(x,y);c.scale(dir<0?-1:1,1);const sm=c.imageSmoothingEnabled;c.imageSmoothingEnabled=false;c.drawImage(img,(k%4)*w,Math.floor(k/4)*w,w,w,-size/2,-size*.62,size,size);c.imageSmoothingEnabled=sm;c.restore();}};})();
{const c=get('bruce');if(c){c.super={nome:'La Poiana Gigante',danno:420,proprieta:['assist','accecamento'],note:'Fischia e arriva la poiana gigante: tre beccate in picchiata all’altezza del viso. Chi le prende resta accecato per un secondo e mezzo.'};
  rules('bruce').super={mode:'projectile',visual:'poiana',hits:3,speed:4.5,startup:14,recovery:26,hit:[{name:'blind',duration:90,value:1}]};}
 if(P&&P.bruce)P.bruce.sup=S('La Poiana Gigante',{kind:'multi',steps:[{kind:'sweep',dmg:140,count:3,visual:'poiana',speed:640,gap:.7,life:3.2,status:{blind:1.5}},{kind:'summon',sprite:'threehead',dur:6,pulse:.6,dmg:35,speed:320}],desc:'Tre picchiate della poiana gigante: acceca per 1,5 s. Poi il cane libero'});}

/* ---------------- NUOVO: L'INNOMINATO */
if(!get('innominato')){
 R.push({id:'innominato',nome:'Innominato',soprannome:'quello che non si nomina',casata:'boss',archetipo:'boss',difficolta:5,
  stats:{vita:1450,velocita:7,portata:6,peso:9},
  descrizione:'Piccolino e muscoloso, pizzetto, capelli neri con la stempiatura alla Vegeta, felpa nera smanicata. Gira a cavallo per il quartiere. Entra ed esce di galera come dalla porta di casa. Come quello dei Promessi Sposi nessuno osa dire il suo nome, ma tutti sanno chi è: il più forte di tutti.',
  mosse:[
   {nome:'Il Rapimento',comando:'↓ ↘ → + P',danno:190,proprieta:['presa','imparabile'],note:'Ti afferra e ti trascina via, come Lucia al castello. Imparabile.'},
   {nome:'Al galoppo',comando:'↓ ↙ ← + K',danno:170,proprieta:[],note:'Arriva a cavallo e travolge tutto: invulnerabile mentre galoppa.'},
   {nome:'Le sbarre',comando:'→ ↓ ↘ + P',danno:120,proprieta:[],note:'Ti chiude dietro le sbarre: bloccato per due secondi.'}],
  super:{nome:'La Notte dell’Innominato',danno:800,proprieta:['imparabile'],note:'La notte in cui tutto cambia: dieci colpi imparabili, poi si rialza più forte di prima.'},
  vittoria:'Il mio nome? Qui non lo dice nessuno.'});
 RULES.innominato={moves:{'0':{grab:true,unblockable:true,reach:60,hit:[{name:'dizzy',duration:40,value:1}]},'1':{mode:'dash',dash:7,active:40,startup:8,recovery:16,hits:2,visual:'horse',self:[{name:'invulnerable',duration:50,value:1}]},'2':{reach:72,hit:[{name:'rooted',duration:120,value:1}]}},
  traits:{height:60,damageTaken:.7,immuneGrab:true},super:{hits:10,unblockable:true,armor:true,reach:90}};
 if(P)P.innominato={passive:{def:.65,atk:1.3,label:'Il più forte di tutti: -35% danni, +30% forza'},moves:[
   S('Il Rapimento',{kind:'teleport',dmg:200,status:{stun:1.2},self:{invuln:.6},desc:'Compare alle spalle, afferra e stordisce'}),
   S('Al galoppo',{kind:'dash',dmg:170,dist:620,time:.75,rehit:.2,invuln:true,visual:'horse',desc:'A cavallo: travolge tutta la strada, invulnerabile'}),
   S('Le sbarre',{kind:'aoe',dmg:130,radius:250,status:{root:2.5},visual:'smoke',desc:'Chiude tutti dietro le sbarre per 2,5 s'})],
  sup:S('La Notte dell’Innominato',{kind:'multi',steps:[{kind:'aoe',dmg:700,radius:720,hits:4,unblockable:true,status:{stun:2.5},knock:520,visual:'smoke'},{kind:'buff',dur:6,self:{invuln:2,heal:350,atk:1.5}}],desc:'Trema tutto lo schermo, poi si rialza più forte'})};
}

/* ---------------- 2.7 · NUOVO: GEPPETTO, il cacciatore della domenica */
if(!get('geppetto')){
 R.push({id:'geppetto',nome:'Geppetto',soprannome:'il cacciatore della domenica',casata:'boss',archetipo:'boss',difficolta:4,
  stats:{vita:1250,velocita:5,portata:8,peso:8},
  descrizione:'Tornava la domenica con la sua Renault 4 rosso fuoco. Alla cintura otto poiane spallottate la mattina, la giacca da caccia sporca di sangue, il carniere a tracolla. In quartiere lo sentivano arrivare dal motore.',
  mosse:[
   {nome:'La Doppietta',comando:'↓ ↘ → + P',danno:150,proprieta:['proiettile'],note:'Due canne, pallini a ventaglio: più sei vicino, più fa male.'},
   {nome:'Renault 4 rosso fuoco',comando:'↓ ↙ ← + K',danno:180,proprieta:['veicolo'],note:'Mette in moto e passa: chi è sulla strada vola via.'},
   {nome:'Poiana al volo',comando:'→ ↓ ↘ + P',danno:110,proprieta:['proiettile'],note:'Stacca una poiana dalla cintura e la tira come un sasso.'}],
  super:{nome:'Le Otto Poiane',danno:720,proprieta:['proiettile'],note:'Le otto poiane della mattina tornano giù dal cielo, una dopo l’altra.'},
  vittoria:'La domenica si mangia cacciagione.'});
 RULES.geppetto={moves:{'0':{mode:'projectile',visual:'stone',hits:2,speed:15,startup:12,recovery:22},'1':{mode:'dash',dash:8,active:36,startup:10,recovery:18,hits:2,visual:'car'},'2':{mode:'projectile',visual:'stone',hits:1,speed:10}},
  traits:{height:66,damageTaken:.85},super:{mode:'projectile',visual:'stone',hits:8,speed:11,startup:14,recovery:30}};
 if(P)P.geppetto={passive:{def:.85,shotMul:1.2,label:'Cacciatore: -15% danni, proiettili +20%'},moves:[
   S('La Doppietta',{kind:'shot',dmg:150,count:3,spread:.22,speed:560,size:.8,knock:260,visual:'stone',desc:'Pallini a ventaglio: tre colpi insieme'}),
   S('Renault 4 rosso fuoco',{kind:'dash',dmg:180,dist:640,time:.8,rehit:.25,armor:true,knock:380,visual:'r4',desc:'Passa con la Renault 4 e travolge la strada'}),
   S('Poiana al volo',{kind:'shot',dmg:110,speed:420,size:1.5,pierce:true,status:{stun:.7},visual:'stone',desc:'Tira una poiana: attraversa tutta la fila'})],
  sup:S('Le Otto Poiane',{kind:'rain',dmg:720,waves:8,visual:'stone',desc:'Otto poiane dal cielo, una dopo l’altra'})};
}
})();
