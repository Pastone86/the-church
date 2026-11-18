/* The Church 2.7 — Sant'Andrea in prima persona (modalità 04).
 * Quartiere vero in 3D (fps-world.js), nemici con gli sprite del gioco, pugni, calci, speciale e super.
 * In fondo arriva Geppetto con la Renault 4 rosso fuoco. */
(function(){'use strict';
const T=THREE,WLD=window.ChurchFPSWorld,DATA=window.CHURCH_DATA,R=DATA.personaggi.personaggi,SFX=window.ChurchSFX,CP=window.ChurchPowers;
const $=id=>document.getElementById(id),TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=Math.random,pick=a=>a[Math.floor(rnd()*a.length)];
const byId=id=>R.find(r=>r.id===id);
const NOSPRITE=new Set(['riot','berta','sauron','tyson','tom','gerry']),FIGHTERS=R.filter(r=>!NOSPRITE.has(r.id));
const Q=new URLSearchParams(location.search);
const TOUCH=('ontouchstart'in window)||navigator.maxTouchPoints>0;
let LITE=Q.has('lite');try{if(localStorage.getItem('church-lite')==='1')LITE=true;}catch{}
/* da file:// (Windows) le immagini per il 3D arrivano da script in b64/ */
function loadImg(path){return new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);
 if(location.protocol==='file:'){const key=path.replace(/^assets\//,'').replace(/[^a-z0-9]/gi,'_'),s=document.createElement('script');s.src='b64/'+key+'.js';s.onload=()=>{const d=(window.CHURCH_B64||{})[key];if(d)i.src=d;else res(null);};s.onerror=()=>res(null);document.head.appendChild(s);}
 else i.src=path;});}

/* ------------------------------------------------------------ scena */
const canvas=$('gl'),hud=$('hud'),hc=hud.getContext('2d'),mini=$('mini'),mctx=mini.getContext('2d');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:!LITE&&!TOUCH,powerPreference:'high-performance'});}catch(e){$('loading').textContent='Questo dispositivo non ha la grafica 3D (WebGL) attiva: la prima persona non può partire. Le altre tre modalità funzionano.';return;}
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.fog=new T.Fog(0xc6d4dc,60,540);
const camera=new T.PerspectiveCamera(72,1,.12,4200);camera.rotation.order='YXZ';
scene.add(new T.HemisphereLight(0xdfeaf6,0xa89f8c,1.55));
const sun=new T.DirectionalLight(0xfff0d6,3.1);sun.castShadow=true;sun.shadow.camera.left=-75;sun.shadow.camera.right=75;sun.shadow.camera.top=75;sun.shadow.camera.bottom=-75;sun.shadow.camera.near=1;sun.shadow.camera.far=420;sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target);
const SUN=new T.Vector3(-110,105,120);
let QL=(LITE||TOUCH)?2:0,autoQ=true;
function applyQuality(){const pr=[Math.min(window.devicePixelRatio||1,1.5),1,.75,.5][QL];renderer.setPixelRatio(pr);renderer.shadowMap.enabled=QL<2;const s=QL===0?2048:1024;if(sun.shadow.mapSize.x!==s){sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});resize();}
function resize(){const w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?86:72;camera.updateProjectionMatrix();const d=Math.min(window.devicePixelRatio||1,2);hud.width=w*d;hud.height=h*d;}
window.addEventListener('resize',resize);

/* ------------------------------------------------------------ stato */
let world=null,state='load',player=null,enemies=[],shots=[],pops=[],time=0,shake=0,flash=0,stage=0,phase='go',msg='',msgT=0,beam=null,r4=null,r4run=null,kills=0,score=0,audioOn=true;
try{audioOn=localStorage.getItem('church-audio')!=='0';}catch{}
const sheets={};
const STAGES=[
 {at:'start',n:2,boss:'izza',text:'MISSIONE 1. Sei appena sceso in via delle Rosette e ti hanno già visto. Fatti rispettare: J pugno, K calcio, Spazio parata.'},
 {at:'boroli',n:3,boss:'american',text:'Al Giardino Boroli è arrivata gente da fuori. Vai a vedere chi comanda sul campo rosso.'},
 {at:'murales',n:4,boss:'renegade',text:'Qualcuno vuole coprire i murales delle Ferrovie Nord. Segui il sentiero e fermali.'},
 {at:'gobetti',n:4,boss:'ceravolo',text:'Sotto il muro «Sant’Andrea», al parchetto di via Gobetti, ti stanno aspettando.'},
 {at:'vela',n:5,boss:'nunzio',text:'Al Bar Vela è volata una sedia. E non era per sedersi.'},
 {at:'tarantola',n:5,boss:'zanfo',text:'Parchetto di via Tarantola: tra il divano e il muretto c’è chi cerca rissa.'},
 {at:'kiesetta',n:5,boss:'gaetano',text:'Piazza Regina Pacis, davanti alla Chiesetta. Qui non si fanno sconti.'},
 {at:'beltrami',n:6,boss:'venom',text:'Sul campo colorato del parco di via Beltrami c’è l’ultima banda.'},
 {at:'rosette',n:0,boss:'geppetto',final:true,text:'È domenica. In via delle Rosette si sente un motore: torna Geppetto con la Renault 4 rosso fuoco e otto poiane alla cintura.'}];
/* pattuglie: mentre vai da una missione all'altra, per strada qualcuno ti viene incontro */
let patD=0,patX=0,patZ=0,patBusy=false;
async function patrol(){patBusy=true;try{const pool=FIGHTERS.map(r=>r.id).filter(id=>id!==player.id&&id!=='innominato'&&id!=='geppetto');const ids=[pick(pool),pick(pool)];await Promise.all([...new Set(ids)].map(sheet));if(state!=='play'||phase!=='go')return;
 const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);ids.forEach((id,k)=>{const[x,z]=world.freeSpot(player.x+fx*17+(k?4:-4)*fz,player.z+fz*17-(k?4:-4)*fx,6);spawn(id,x,z,{});});setMsg('Per strada: '+ids.map(id=>byId(id).nome).join(' e ')+' ti sbarrano il passo.',3);}finally{patBusy=false;}}
function setMsg(t,s){msg=t;msgT=s||4;$('msg').textContent=t;$('msg').classList.add('on');}
function kitOf(id){let k=null;try{k=CP&&CP.kit?CP.kit(id):null;}catch{}return{sp:(k&&k.moves&&k.moves[0]&&k.moves[0].name)||'Speciale',sup:(k&&k.sup&&k.sup.name)||'Super'};}

/* ------------------------------------------------------------ sprite dei personaggi */
async function sheet(id){if(sheets[id]!==undefined)return sheets[id];const img=await loadImg('assets/'+id+'.webp');if(!img){sheets[id]=null;return null;}const t=new T.Texture(img);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;sheets[id]=t;return t;}
const SPR_H=2.445,spriteGeo=new T.PlaneGeometry(SPR_H,SPR_H);spriteGeo.translate(0,SPR_H/2-.16,0);
function setFrame(e,f){if(window.ChurchAnim)f=ChurchAnim.frame(e.id,f,time+e.seed);if(e.frame===f&&e.flipD===e.flip)return;e.frame=f;e.flipD=e.flip;const col=f%4,row=Math.floor(f/4)%4,t=e.tex;if(!t)return;t.repeat.set(e.flip?-.25:.25,.25);t.offset.set(e.flip?(col+1)*.25:col*.25,1-(row+1)*.25);}
function spawn(id,x,z,o={}){const def=byId(id)||byId('mario');const base=sheets[def.id];const e={def,id:def.id,x,z,vx:0,vz:0,kx:0,kz:0,hp:0,cool:.5+rnd(),windup:0,atkT:0,hurtT:0,dead:false,deadT:0,boss:!!o.boss,final:!!o.final,seed:rnd()*10,frame:-1,flip:false,shotCool:2,scale:o.boss?1.12:1};
 const v=(def.stats&&def.stats.vita)||1000;e.maxHp=e.hp=o.final?520:o.boss?190:46+v/60;e.dmg=o.final?13:o.boss?10:6.5;e.speed=(o.final?3.9:3.2)+((def.stats&&def.stats.velocita)||6)*.12+rnd()*.4;
 if(base){e.tex=base.clone();e.tex.needsUpdate=true;}const m=new T.MeshBasicMaterial({map:e.tex||null,color:e.tex?0xe2dcd2:0xaa5544,alphaTest:.45,side:T.DoubleSide});
 e.mesh=new T.Mesh(spriteGeo,m);e.mesh.castShadow=true;e.mesh.scale.setScalar(e.scale);e.mesh.position.set(x,0,z);scene.add(e.mesh);setFrame(e,0);enemies.push(e);return e;}
function removeEnemy(e){scene.remove(e.mesh);e.mesh.material.dispose();if(e.tex)e.tex.dispose();}

/* ------------------------------------------------------------ oggetti lanciati */
const shotTex={};function shotTexture(kind){if(shotTex[kind])return shotTex[kind];const c=WLD.cv(64,64,(g)=>{g.clearRect(0,0,64,64);if(kind==='poianaG'){const B=window.ChurchPoiana;if(B&&B.ready){const w=B.img.width/4;g.imageSmoothingEnabled=false;g.drawImage(B.img,w,3*w,w,w,0,0,64,64);}return;}if(kind==='pellet'){g.fillStyle='#2a2a2c';g.beginPath();g.arc(32,32,14,0,TAU);g.fill();g.fillStyle='#8a8a90';g.beginPath();g.arc(27,27,5,0,TAU);g.fill();}
  else if(kind==='poiana'){g.fillStyle='#5a3d28';g.beginPath();g.ellipse(32,34,12,18,0,0,TAU);g.fill();g.beginPath();g.moveTo(20,30);g.lineTo(2,18);g.lineTo(6,40);g.fill();g.beginPath();g.moveTo(44,30);g.lineTo(62,18);g.lineTo(58,40);g.fill();g.fillStyle='#d9c9a8';g.beginPath();g.arc(32,18,7,0,TAU);g.fill();g.fillStyle='#e0b020';g.fillRect(30,22,4,6);g.fillStyle='#b01818';g.fillRect(26,40,4,6);g.fillRect(34,44,3,5);}
  else if(kind==='stone'){g.fillStyle='#8c8a84';g.beginPath();g.moveTo(14,22);g.lineTo(36,10);g.lineTo(54,26);g.lineTo(48,50);g.lineTo(20,52);g.closePath();g.fill();g.fillStyle='#b9b6ad';g.beginPath();g.moveTo(20,24);g.lineTo(36,14);g.lineTo(44,26);g.closePath();g.fill();}
  else{g.fillStyle='#f2f0e8';g.beginPath();g.arc(32,32,24,0,TAU);g.fill();g.fillStyle='#1c1c1e';for(const[a,b]of[[32,32],[14,22],[50,22],[20,50],[44,50]]){g.beginPath();g.arc(a,b,7,0,TAU);g.fill();}g.strokeStyle='#1c1c1e';g.lineWidth=2;g.beginPath();g.arc(32,32,24,0,TAU);g.stroke();}});
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return shotTex[kind]=t;}
function shoot(from,x,y,z,dx,dz,o){const m=new T.Sprite(new T.SpriteMaterial({map:shotTexture(o.kind||'ball')}));m.scale.setScalar(o.size||.45);m.position.set(x,y,z);scene.add(m);shots.push({from,x,y,z,vx:dx*o.speed,vz:dz*o.speed,life:o.life||2.2,dmg:o.dmg,m,kind:o.kind,heavy:o.heavy});}

/* ------------------------------------------------------------ colpi */
function pop(x,y,z,word,size){if(word)pops.push({x,y,z,word,size:size||30,life:1,seed:(rnd()*1000)|0});}
function hurtEnemy(e,dmg,o={}){if(e.dead)return;e.hp-=dmg;const dx=e.x-player.x,dz=e.z-player.z,l=Math.hypot(dx,dz)||1;const k=o.knock||3;e.kx=dx/l*k;e.kz=dz/l*k;e.hurtT=o.stun||.28;e.windup=0;
 let word=null;if(audioOn&&SFX)word=SFX.hit({att:player.id,tgt:e.id,heavy:!!o.heavy,kick:!!o.kick,sup:!!o.sup,pan:0});else word=o.heavy?'SBAAAM!':'PAF!';pop(e.x,1.5,e.z,word,o.heavy||o.sup?40:30);
 player.en=Math.min(100,player.en+(o.gain||0));score+=Math.round(dmg);
 if(e.hp<=0){e.dead=true;e.deadT=0;e.kx*=2;e.kz*=2;kills++;score+=e.final?2000:e.boss?500:100;if(audioOn&&SFX&&(e.boss||e.final))SFX.ko(player.id,e.id);}}
function hurtPlayer(dmg,srcId,heavy){if(state!=='play'||player.inv>0)return;const d=dmg*(player.block?.2:1);player.hp-=d;player.hurtT=.45;shake=Math.max(shake,player.block?.15:.4);
 if(audioOn&&SFX)SFX.hit({att:srcId,tgt:player.id,heavy:!!heavy,blocked:player.block,pan:0});
 if(player.hp<=0){player.hp=0;state='over';if(audioOn&&SFX){SFX.ko(null,player.id);SFX.setMusic(false);}$('over').hidden=false;$('overtext').textContent='Ti hanno steso in '+(world.roadName(player.x,player.z)||'quartiere')+'. '+kills+' avversari battuti, '+score+' punti.';unlock();}}
function melee(kind){const kick=kind==='kick';const reach=(kick?2.7:2.15)+((player.def.stats.portata||6)-6)*.07;const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);let hit=0;
 const c=enemies.filter(e=>!e.dead).map(e=>({e,dx:e.x-player.x,dz:e.z-player.z})).map(o=>(o.d=Math.hypot(o.dx,o.dz),o.dot=(o.dx*fx+o.dz*fz)/(o.d||1),o)).filter(o=>o.d<reach&&o.dot>(o.d<1?.2:.72)).sort((a,b)=>a.d-b.d);
 for(const o of c){if(hit>=(kick?2:1))break;const w=player.def.stats.peso||6;hurtEnemy(o.e,kick?15+w*1.3:9+w*.9,{heavy:kick,kick,knock:kick?6:2.6,stun:kick?.45:.26,gain:kick?10:7});hit++;}
 if(!hit&&audioOn&&SFX)SFX.swing(player.id,{kick,heavy:kick});if(hit)shake=Math.max(shake,kick?.22:.12);}
function attack(kind){if(state!=='play'||player.atk||player.block)return;
 if(kind==='special'){if(player.en<35){setMsg('Energia insufficiente: colpisci per ricaricarla',1.6);return;}player.en-=35;player.atk={kind,t:0,dur:.42,at:.16};return;}
 if(kind==='super'){if(player.en<100){setMsg('La super vuole la barra piena',1.6);return;}player.en=0;player.atk={kind,t:0,dur:.9,at:.3};if(audioOn&&SFX)SFX.special(player.id,true);return;}
 player.side=!player.side;player.atk={kind,t:0,dur:kind==='kick'?.46:.3,at:kind==='kick'?.18:.11};}
function fire(a){const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw);
 if(a.kind==='punch'||a.kind==='kick')melee(a.kind);
 else if(a.kind==='special'){const w=player.def.stats.peso||6;if(player.id==='geppetto'){for(const s of[-.12,0,.12]){const c=Math.cos(s),sn=Math.sin(s);shoot('p',player.x+fx*.6,1.35,player.z+fz*.6,fx*c-fz*sn,fx*sn+fz*c,{kind:'pellet',speed:34,dmg:16+w,size:.22});}if(audioOn&&SFX)SFX.play('boom',{vol:.8,rate:1.5});shake=.25;}
  else{shoot('p',player.x+fx*.6,1.35,player.z+fz*.6,fx,fz,{kind:player.id==='zanfo'?'stone':'ball',speed:26,dmg:34+w*1.5,heavy:true});if(audioOn&&SFX)SFX.play('fiuuu',{vol:.6,rate:1.2});}}
 else if(a.kind==='super'){shake=.7;flash=.5;if(audioOn&&SFX){SFX.play('boom',{vol:1});}if(player.id==='bruce'&&window.ChurchPoiana&&ChurchPoiana.ready){const bx=-Math.sin(player.yaw),bz=-Math.cos(player.yaw);for(let i=-1;i<=1;i++){const c=Math.cos(i*.22),sn=Math.sin(i*.22);shoot('p',player.x+bx*.8,1.7,player.z+bz*.8,bx*c-bz*sn,bx*sn+bz*c,{kind:'poianaG',speed:20,dmg:60,size:2.6,life:1.6,heavy:true});}}for(const e of enemies){if(e.dead)continue;const d=Math.hypot(e.x-player.x,e.z-player.z);if(d<12)hurtEnemy(e,(player.id==='geppetto'?95:78)*(1-d/26),{heavy:true,sup:true,knock:9,stun:.9});}
  if(player.id==='geppetto')for(let i=0;i<8;i++){const an=i/8*TAU;shoot('p',player.x,1.6,player.z,Math.cos(an),Math.sin(an),{kind:'poiana',speed:15,dmg:30,size:.7,life:1.4});}}}

/* ------------------------------------------------------------ tappe */
function placeOf(s){return world.PLACES[s.at];}
function startStage(i){stage=i;phase='go';const s=STAGES[i],p=placeOf(s);beam.position.set(p.x,0,p.z);beam.visible=true;setMsg(s.text,7);$('obj').textContent='MISSIONE '+(i+1)+'/'+STAGES.length+' · '+p.name;patD=0;}
function bossId(s){let b=s.boss;if(s.final&&player.id==='geppetto')b='innominato';if(b===player.id)b='bruce';return b;}
async function beginFight(){const s=STAGES[stage],p=placeOf(s);phase='fight';beam.visible=false;
 if(s.final){const b=bossId(s);await sheet(b);if(b==='geppetto')arriveR4(p);else{const[x,z]=world.freeSpot(p.x,p.z-14,5);spawn(b,x,z,{boss:true,final:true});setMsg(byId(b).nome+': «'+(byId(b).vittoria||'Adesso basta.')+'»',5);}return;}
 const pool=FIGHTERS.map(r=>r.id).filter(id=>id!==player.id&&id!=='innominato'&&id!=='geppetto'&&id!==s.boss);const ids=[];for(let k=0;k<s.n;k++)ids.push(pick(pool));const b=bossId(s);ids.push(b);
 await Promise.all([...new Set(ids)].map(sheet));if(state!=='play'&&state!=='pause')return;
 ids.forEach((id,k)=>{const a=rnd()*TAU,d=13+rnd()*10;const[x,z]=world.freeSpot(p.x+Math.cos(a)*d,p.z+Math.sin(a)*d,6);spawn(id,x,z,{boss:id===b&&k===ids.length-1});});
 setMsg(p.name.toUpperCase()+': '+ids.length+' avversari. Il capo è '+byId(b).nome+'.',4);}
function arriveR4(p){const rd=world.road('Via delle Rosette');const pts=rd?rd.p:[[p.x,p.z+120],[p.x,p.z]];let bi=0,bd=1e9;pts.forEach((q,i)=>{const d=Math.hypot(q[0]-p.x,q[1]-p.z);if(d<bd){bd=d;bi=i;}});
 const path=[];let acc=0;for(let i=bi;i<pts.length-1&&acc<170;i++){path.push(pts[i]);acc+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);}path.push(pts[Math.min(pts.length-1,bi+path.length)]);path.reverse();
 if(!r4){r4=WLD.renault4();scene.add(r4);}let L=0;const seg=[];for(let i=0;i<path.length-1;i++){const l=Math.hypot(path[i+1][0]-path[i][0],path[i+1][1]-path[i][1]);seg.push(l);L+=l;}
 r4run={path,seg,L,s:Math.max(0,L-150),stop:Math.max(0,L-10),done:false};r4.visible=true;setMsg('GEPPETTO: «La domenica si torna a casa. E a casa mia comando io.»',6);if(audioOn&&SFX)SFX.play('fiuuu',{vol:.7,rate:.6});}
function updateR4(dt){if(!r4run||r4run.done)return;const r=r4run;r.s=Math.min(r.stop,r.s+dt*clamp((r.stop-r.s)*1.2,2.5,15));let s=r.s,i=0;while(i<r.seg.length-1&&s>r.seg[i]){s-=r.seg[i];i++;}const a=r.path[i],b=r.path[i+1],t=clamp(s/(r.seg[i]||1),0,1),dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;
 const x=a[0]+dx*t-dz/l*1.4,z=a[1]+dz*t+dx/l*1.4;r4.position.set(x,0,z);r4.rotation.y=Math.atan2(-dz,dx);
 if(Math.hypot(x-player.x,z-player.z)<2.6&&r.s<r.stop-.5)hurtPlayer(16,'geppetto',true);
 if(r.s>=r.stop-.05){r.done=true;const[gx,gz]=world.freeSpot(x-dz/l*2.6,z+dx/l*2.6,2.5);spawn('geppetto',gx,gz,{boss:true,final:true});if(audioOn&&SFX)SFX.play('tonf',{vol:.8});setMsg('Geppetto scende dalla Renault 4. Otto poiane alla cintura, la doppietta in mano.',4);}}
function stageDone(){const s=STAGES[stage];if(s.final){state='win';$('win').hidden=false;$('wintext').textContent='Hai fatto il giro di Sant’Andrea e hai rimandato a casa '+byId(bossId(s)).nome+'. '+kills+' avversari, '+score+' punti.';if(audioOn&&SFX)SFX.setMusic(false);unlock();return;}
 player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.35);setMsg('Zona ripulita. +35% di vita.',3);setTimeout(()=>{if(state==='play'||state==='pause')startStage(stage+1);},2600);phase='wait';}

/* ------------------------------------------------------------ comandi */
const keys={};let locked=false,noLock=false,drag=null;const pad={mx:0,mz:0,lx:0,ly:0};
function unlock(){try{if(document.pointerLockElement)document.exitPointerLock();}catch{}}
function lock(){if(TOUCH||noLock)return;try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{noLock=true;});}catch{noLock=true;}}
let lockAt=0;document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;lockAt=performance.now();if(was&&!locked&&state==='play')pause(true);});
document.addEventListener('pointerlockerror',()=>{noLock=true;});
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)&&state==='play')e.preventDefault();if(keys[k])return;keys[k]=true;
 if(state==='play'){if(k==='j')attack('punch');else if(k==='k')attack('kick');else if(k==='l')attack('special');else if(k==='o'||k==='f')attack('super');else if(k==='p'||k==='Escape')pause(true);else if(k==='m')mini.classList.toggle('big');}
 else if(state==='pause'&&(k==='p'||k==='Enter'))pause(false);});
window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
canvas.addEventListener('mousedown',e=>{if(state!=='play'||TOUCH)return;if(!locked&&!noLock){lock();return;}if(!locked){drag={x:e.clientX,y:e.clientY,moved:false,b:e.button};return;}if(e.button===0)attack('punch');else if(e.button===2)attack('special');else if(e.button===1)attack('super');});
window.addEventListener('mouseup',e=>{if(drag){if(!drag.moved){if(drag.b===0)attack('punch');else if(drag.b===2)attack('special');}drag=null;}});
window.addEventListener('mousemove',e=>{if(state!=='play')return;if(locked){if(performance.now()-lockAt>180)look(clamp(e.movementX,-160,160),clamp(e.movementY,-160,160));}else if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;look(dx*1.6,dy*1.6);drag.x=e.clientX;drag.y=e.clientY;}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function look(dx,dy){player.yaw-=dx*.0023;player.pitch=clamp(player.pitch-dy*.002,-.75,.75);}
/* tocco: metà sinistra leva, metà destra sguardo */
const stick={id:null,x0:0,y0:0},lookT={id:null,x:0,y:0};
if(TOUCH){const tz=$('touch');tz.hidden=false;const knob=$('knob'),base=$('stickbase');
 tz.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;e.preventDefault();if(e.clientX<window.innerWidth*.45&&stick.id===null){stick.id=e.pointerId;stick.x0=e.clientX;stick.y0=e.clientY;base.style.left=e.clientX+'px';base.style.top=e.clientY+'px';base.classList.add('on');}else if(lookT.id===null){lookT.id=e.pointerId;lookT.x=e.clientX;lookT.y=e.clientY;}});
 tz.addEventListener('pointermove',e=>{if(e.pointerId===stick.id){const dx=e.clientX-stick.x0,dy=e.clientY-stick.y0,l=Math.hypot(dx,dy),m=Math.min(l,60);pad.mx=l?dx/l*m/60:0;pad.mz=l?-dy/l*m/60:0;knob.style.transform=`translate(${pad.mx*60}px,${-pad.mz*60}px)`;}else if(e.pointerId===lookT.id&&state==='play'){look((e.clientX-lookT.x)*2.4,(e.clientY-lookT.y)*2.2);lookT.x=e.clientX;lookT.y=e.clientY;}});
 const end=e=>{if(e.pointerId===stick.id){stick.id=null;pad.mx=pad.mz=0;knob.style.transform='';base.classList.remove('on');}if(e.pointerId===lookT.id)lookT.id=null;};tz.addEventListener('pointerup',end);tz.addEventListener('pointercancel',end);
 for(const b of tz.querySelectorAll('button[data-a]')){b.addEventListener('pointerdown',e=>{e.preventDefault();const a=b.dataset.a;if(a==='block')keys[' ']=true;else if(a==='run')keys.Shift=!keys.Shift;else attack(a);});b.addEventListener('pointerup',()=>{if(b.dataset.a==='block')keys[' ']=false;});b.addEventListener('pointercancel',()=>{if(b.dataset.a==='block')keys[' ']=false;});}}
let gpPrev={};
function gamepad(dt){const gs=navigator.getGamepads?navigator.getGamepads():[];const g=[...gs].find(x=>x&&x.connected);if(!g){pad.gx=pad.gz=0;return;}const dz=v=>Math.abs(v)<.18?0:v;pad.gx=dz(g.axes[0]||0);pad.gz=-dz(g.axes[1]||0);if(state==='play'){player.yaw-=dz(g.axes[2]||0)*2.6*dt;player.pitch=clamp(player.pitch-dz(g.axes[3]||0)*1.6*dt,-.75,.75);}
 const b=i=>!!(g.buttons[i]&&g.buttons[i].pressed),press=i=>{const v=b(i),p=!gpPrev[i]&&v;gpPrev[i]=v;return p;};pad.block=b(6)||b(4);pad.run=b(10)||b(5);
 if(state==='play'){if(press(2)||press(7))attack('punch');if(press(0))attack('kick');if(press(1))attack('special');if(press(3))attack('super');if(press(9))pause(true);}else if(state==='pause'){if(press(9)||press(0))pause(false);}else{press(9);press(0);}}
function pause(on){if(on&&state==='play'){state='pause';$('pause').hidden=false;unlock();if(audioOn&&SFX)SFX.setMusic(false);}else if(!on&&state==='pause'){state='play';$('pause').hidden=true;lock();if(audioOn&&SFX)SFX.setMusic(true);last=performance.now();}}

/* ------------------------------------------------------------ aggiornamento */
function movePlayer(dt){let mx=(keys.d?1:0)-(keys.a?1:0)+(pad.mx||0)+(pad.gx||0),mz=(keys.w||keys.ArrowUp?1:0)-(keys.s||keys.ArrowDown?1:0)+(pad.mz||0)+(pad.gz||0);
 const turn=(keys.ArrowLeft||keys.q?1:0)-(keys.ArrowRight||keys.e?1:0);player.yaw+=turn*2.5*dt;const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l;}
 player.block=!!(keys[' ']||keys.i||pad.block)&&!player.atk;const run=(keys.Shift||pad.run)&&mz>0&&!player.block;const sp=(4.3+(player.def.stats.velocita||6)*.14)*(run?1.7:1)*(player.block?.45:1)*(player.atk?.7:1);
 const fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw);const tx=(fx*mz+rx*mx)*sp,tz=(fz*mz+rz*mx)*sp;const k=Math.min(1,dt*12);player.vx+=(tx-player.vx)*k;player.vz+=(tz-player.vz)*k;
 const nx=player.x+player.vx*dt,nz=player.z+player.vz*dt;if(!world.blocked(nx,player.z,.38))player.x=nx;else player.vx=0;if(!world.blocked(player.x,nz,.38))player.z=nz;else player.vz=0;
 const v=Math.hypot(player.vx,player.vz);player.bob+=v*dt*1.7;player.bobA+=((v>.5?1:0)-player.bobA)*Math.min(1,dt*8);}
function updateEnemies(dt){let attackers=0;for(const e of enemies)if(e.windup>0||e.atkT>0)attackers++;
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];const dx=player.x-e.x,dz=player.z-e.z,d=Math.hypot(dx,dz)||1;
  // sprite rivolto alla camera; specchiato se si muove verso sinistra dello schermo
  e.mesh.position.set(e.x,e.dead?Math.max(-.25,-e.deadT*.4):0,e.z);e.mesh.rotation.y=Math.atan2(camera.position.x-e.x,camera.position.z-e.z);
  if(e.dead){e.deadT+=dt;e.x+=e.kx*dt;e.z+=e.kz*dt;e.kx*=.9;e.kz*=.9;if(world.blocked(e.x,e.z,.3)){e.x-=e.kx*dt;e.z-=e.kz*dt;}setFrame(e,14);if(e.deadT>3.5){e.mesh.material.opacity=1;removeEnemy(e);enemies.splice(i,1);}continue;}
  if(e.hurtT>0){e.hurtT-=dt;const nx=e.x+e.kx*dt,nz=e.z+e.kz*dt;if(!world.blocked(nx,e.z,.35))e.x=nx;if(!world.blocked(e.x,nz,.35))e.z=nz;e.kx*=.86;e.kz*=.86;setFrame(e,13);continue;}
  e.cool-=dt;e.shotCool-=dt;
  if(e.windup>0){e.windup-=dt;setFrame(e,e.ranged?8:6);if(e.windup<=0){if(e.ranged){const a=Math.atan2(dz,dx);for(const s of(e.id==='geppetto'?[-.14,0,.14]:[0])){shoot('e',e.x+dx/d*.7,1.3,e.z+dz/d*.7,Math.cos(a+s),Math.sin(a+s),{kind:e.id==='geppetto'?'pellet':'stone',speed:e.id==='geppetto'?17:14,dmg:e.id==='geppetto'?7:9,size:e.id==='geppetto'?.24:.4});}if(audioOn&&SFX&&e.id==='geppetto')SFX.play('boom',{vol:.7,rate:1.4});e.shotCool=e.id==='geppetto'?2.6:4;e.ranged=false;}
    else if(d<2.3&&world.los(e.x,e.z,player.x,player.z))hurtPlayer(e.dmg,e.id,e.boss);else if(audioOn&&SFX)SFX.swing(e.id,{});e.atkT=.26;e.cool=.8+rnd()*.9;}continue;}
  if(e.atkT>0){e.atkT-=dt;setFrame(e,e.final&&e.shotCool>2?9:7);continue;}
  const see=d<60&&world.los(e.x,e.z,player.x,player.z);
  if(d<1.65&&e.cool<=0&&attackers<2){e.windup=e.boss?.36:.45;attackers++;continue;}
  if((e.final||e.id==='zanfo')&&see&&d>6&&d<32&&e.shotCool<=0){e.windup=.55;e.ranged=true;continue;}
  let mx,mz;if(see&&d<16){mx=dx/d;mz=dz/d;}else{const f=world.flowDir(e.x,e.z);mx=f[0];mz=f[1];if(!mx&&!mz){mx=dx/d;mz=dz/d;}}
  for(const o of enemies){if(o===e||o.dead)continue;const ox=e.x-o.x,oz=e.z-o.z,od=Math.hypot(ox,oz);if(od<1.3&&od>.001){mx+=ox/od*(1.3-od)*1.5;mz+=oz/od*(1.3-od)*1.5;}}
  if(d<1.3){mx=0;mz=0;}else if(d<3.2&&attackers>=2&&e.cool>0){const s=e.seed>5?1:-1;const tx=-dz/d*s,tz=dx/d*s;mx=tx*.8;mz=tz*.8;}
  const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l;}const sp=e.speed*(d>40?1.8:1);e.vx+=(mx*sp-e.vx)*Math.min(1,dt*8);e.vz+=(mz*sp-e.vz)*Math.min(1,dt*8);
  const nx=e.x+e.vx*dt,nz=e.z+e.vz*dt;if(!world.blocked(nx,e.z,.34))e.x=nx;else e.vx*=-.2;if(!world.blocked(e.x,nz,.34))e.z=nz;else e.vz*=-.2;
  const rx=Math.cos(player.yaw),rz=-Math.sin(player.yaw),lat=e.vx*rx+e.vz*rz;if(Math.abs(lat)>.6)e.flip=lat<0;const mv=Math.hypot(e.vx,e.vz)>.5;setFrame(e,mv?2+Math.floor((time+e.seed)*7)%2:Math.floor((time+e.seed)*2)%2);}}
function updateShots(dt){for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.x+=s.vx*dt;s.z+=s.vz*dt;s.life-=dt;s.m.position.set(s.x,s.y,s.z);s.m.material.rotation+=dt*9;let dead=s.life<=0||world.isSolid(s.x,s.z);
  if(!dead&&s.from==='p'){for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-s.x,e.z-s.z)<.8){hurtEnemy(e,s.dmg,{heavy:!!s.heavy,knock:s.heavy?7:3,stun:s.heavy?.6:.3,gain:4});dead=true;break;}}}
  else if(!dead&&Math.hypot(player.x-s.x,player.z-s.z)<.55){hurtPlayer(s.dmg,'geppetto',false);dead=true;}
  if(dead){scene.remove(s.m);s.m.material.dispose();shots.splice(i,1);}}}
let flowT=0,fpsAcc=0,fpsN=0,qT=0;
function update(dt){time+=dt;movePlayer(dt);
 if(player.atk){const a=player.atk;const before=a.t;a.t+=dt;if(before<a.at&&a.t>=a.at)fire(a);if(a.t>=a.dur)player.atk=null;}
 player.hurtT=Math.max(0,player.hurtT-dt);player.inv=Math.max(0,player.inv-dt);flowT-=dt;if(flowT<=0){flowT=.35;world.flow(player.x,player.z);}
 updateEnemies(dt);updateShots(dt);updateR4(dt);
 const s=STAGES[stage],p=placeOf(s);if(phase==='go'){const st=Math.hypot(player.x-patX,player.z-patZ);if(st<3)patD+=st;patX=player.x;patZ=player.z;if(patD>30&&!patBusy&&!s.final&&enemies.filter(e=>!e.dead).length<3&&Math.hypot(p.x-player.x,p.z-player.z)>38){patD=0;patrol();}}else{patX=player.x;patZ=player.z;}if(phase==='go'&&Math.hypot(p.x-player.x,p.z-player.z)<(s.final?22:17))beginFight();
 else if(phase==='fight'&&enemies.length&&enemies.every(e=>e.dead))stageDone();
 if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').classList.remove('on');}
 for(let i=pops.length-1;i>=0;i--){pops[i].life-=dt*1.15;pops[i].y+=dt*.6;if(pops[i].life<=0)pops.splice(i,1);}
 shake=Math.max(0,shake-dt*1.8);flash=Math.max(0,flash-dt*1.6);}

/* ------------------------------------------------------------ disegno */
const V=new T.Vector3();
function project(x,y,z){V.set(x,y,z).project(camera);if(V.z>1||V.z<-1)return null;return[(V.x*.5+.5)*hud.width,(-V.y*.5+.5)*hud.height];}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function fist(c,cx,cy,sc,flip,rot){c.save();c.translate(cx,cy);c.rotate(rot);c.scale(flip?-sc:sc,sc);
 let g=c.createLinearGradient(-70,0,80,0);g.addColorStop(0,'#7c4d36');g.addColorStop(.4,'#c99170');g.addColorStop(.75,'#b98060');g.addColorStop(1,'#80503a');c.fillStyle=g;c.beginPath();c.moveTo(-50,30);c.lineTo(-78,520);c.lineTo(96,520);c.lineTo(54,30);c.closePath();c.fill();
 c.fillStyle='rgba(60,30,18,.25)';c.beginPath();c.ellipse(0,40,56,16,0,0,TAU);c.fill();
 g=c.createLinearGradient(0,-80,0,50);g.addColorStop(0,'#d9a482');g.addColorStop(.6,'#c48a68');g.addColorStop(1,'#9a6247');c.fillStyle=g;rr(c,-68,-78,136,124,36);c.fill();
 c.strokeStyle='rgba(84,44,26,.6)';c.lineWidth=4;for(let i=1;i<4;i++){c.beginPath();c.moveTo(-68+i*34,-70);c.quadraticCurveTo(-66+i*34,-40,-68+i*34,-6);c.stroke();}c.beginPath();c.moveTo(-62,-8);c.quadraticCurveTo(0,6,62,-8);c.stroke();
 c.fillStyle='#c08462';c.beginPath();c.ellipse(52,8,26,40,-.5,0,TAU);c.fill();c.strokeStyle='rgba(84,44,26,.5)';c.lineWidth=3;c.stroke();
 c.fillStyle='rgba(255,235,215,.22)';for(let i=0;i<4;i++){c.beginPath();c.ellipse(-51+i*34,-64,11,8,0,0,TAU);c.fill();}c.restore();}
function drawHands(c,w,h){const s=h/820,bx=Math.sin(player.bob)*12*s*player.bobA,by=Math.abs(Math.cos(player.bob))*10*s*player.bobA;const a=player.atk;let L={x:w*.24,y:h*.93,sc:1.02,r:.22},Rr={x:w*.76,y:h*.93,sc:1.02,r:-.22};
 if(player.block){L={x:w*.4,y:h*.72,sc:1.2,r:.5};Rr={x:w*.6,y:h*.72,sc:1.2,r:-.5};}
 else if(a&&(a.kind==='punch'||a.kind==='special'||a.kind==='super')){const t=a.t/a.dur,k=Math.sin(Math.min(1,t*1.25)*Math.PI);const tgt=player.side&&a.kind==='punch'?L:Rr;const dir=tgt===L?1:-1;tgt.x+=dir*w*.2*k;tgt.y-=h*.3*k;tgt.sc+=.55*k;tgt.r+=dir*-.2*k;if(a.kind==='super'){const o=tgt===L?Rr:L;o.x-=dir*w*.2*k;o.y-=h*.3*k;o.sc+=.55*k;}}
 if(a&&a.kind==='kick'){const t=a.t/a.dur,k=Math.sin(Math.min(1,t*1.2)*Math.PI);c.save();c.translate(w*.5+w*.03,h+h*.25-h*.62*k);c.rotate(-.12);c.scale(s*1.5,s*1.5);let g=c.createLinearGradient(-60,0,60,0);g.addColorStop(0,'#1c2a44');g.addColorStop(.5,'#3c5a8c');g.addColorStop(1,'#1a2740');c.fillStyle=g;c.fillRect(-52,60,104,420);c.fillStyle='#e9e6dc';rr(c,-62,-46,124,120,30);c.fill();c.fillStyle='#22262c';rr(c,-66,44,132,30,10);c.fill();c.strokeStyle='#b9b4a6';c.lineWidth=4;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-34,-20+i*20);c.lineTo(34,-20+i*20);c.stroke();}c.restore();}
 fist(c,L.x+bx,L.y+by,L.sc*s*1.15,false,L.r);fist(c,Rr.x+bx,Rr.y+by,Rr.sc*s*1.15,true,Rr.r);}
function drawHud(){const c=hc,w=hud.width,h=hud.height,d=w/window.innerWidth;c.clearRect(0,0,w,h);
 for(const e of enemies){if(e.dead)continue;const dd=Math.hypot(e.x-player.x,e.z-player.z);if(dd>45||!world.los(player.x,player.z,e.x,e.z))continue;const p=project(e.x,2.2*e.scale,e.z);if(!p)continue;const bw=clamp(900/dd,26,120)*d;c.fillStyle='rgba(20,26,28,.75)';c.fillRect(p[0]-bw/2,p[1],bw,5*d);c.fillStyle=e.boss?'#efbc63':'#d86a5c';c.fillRect(p[0]-bw/2,p[1],bw*clamp(e.hp/e.maxHp,0,1),5*d);
  if(e.boss||dd<12){c.font=`bold ${Math.round((e.boss?13:11)*d)}px ui-monospace,Menlo,monospace`;c.textAlign='center';c.fillStyle='rgba(0,0,0,.7)';c.fillText(e.def.nome.toUpperCase(),p[0]+1,p[1]-5*d+1);c.fillStyle=e.boss?'#ffe2a3':'#f1ede2';c.fillText(e.def.nome.toUpperCase(),p[0],p[1]-5*d);}
  if(e.windup>0){c.font=`900 ${Math.round(26*d)}px Impact,sans-serif`;c.fillStyle='#ff5a48';c.fillText('!',p[0],p[1]-20*d);}}
 for(const o of pops){const p=project(o.x,o.y,o.z);if(!p)continue;const dd=Math.hypot(o.x-player.x,o.z-player.z);const sz=clamp(o.size*9/Math.max(3,dd),14,56)*h/900;if(SFX&&SFX.drawPop)SFX.drawPop(c,p[0],p[1],o.word,sz,o.life,o.seed);}
 if(phase==='go'&&beam.visible){const pl=placeOf(STAGES[stage]),p=project(pl.x,3.2,pl.z),dist=Math.hypot(pl.x-player.x,pl.z-player.z);if(p&&p[0]>40&&p[0]<w-40){c.font=`bold ${Math.round(13*d)}px ui-monospace,Menlo,monospace`;c.textAlign='center';c.fillStyle='rgba(0,0,0,.7)';c.fillText(pl.name.toUpperCase()+' · '+Math.round(dist)+' m',p[0]+1,p[1]+1);c.fillStyle='#ffe08a';c.fillText(pl.name.toUpperCase()+' · '+Math.round(dist)+' m',p[0],p[1]);}}
 drawHands(c,w,h);
 c.fillStyle='rgba(255,255,255,.75)';c.fillRect(w/2-1.5*d,h/2-1.5*d,3*d,3*d);
 if(player.hurtT>0||player.hp<player.maxHp*.3){const a=Math.max(player.hurtT*1.4,player.hp<player.maxHp*.3?.25+.1*Math.sin(time*5):0);const g=c.createRadialGradient(w/2,h/2,h*.25,w/2,h/2,h*.8);g.addColorStop(0,'rgba(190,20,10,0)');g.addColorStop(1,`rgba(190,20,10,${clamp(a,0,.75)})`);c.fillStyle=g;c.fillRect(0,0,w,h);}
 if(flash>0){c.fillStyle=`rgba(255,244,210,${flash})`;c.fillRect(0,0,w,h);}
 // minimappa
 const m=mctx,mw=mini.width,k=mini.classList.contains('big')?.55:1.0;m.save();m.clearRect(0,0,mw,mw);m.beginPath();m.arc(mw/2,mw/2,mw/2-2,0,TAU);m.clip();m.fillStyle='#22271f';m.fillRect(0,0,mw,mw);m.translate(mw/2,mw/2);m.rotate(player.yaw);m.scale(k,k);m.translate(-player.x*2,-player.z*2);m.drawImage(world.mini,0,0);
 for(const e of enemies){if(e.dead)continue;m.fillStyle=e.boss?'#ffd36b':'#ff5a48';m.beginPath();m.arc(e.x*2,e.z*2,(e.boss?5:3.5)/k,0,TAU);m.fill();}
 if(r4&&r4.visible){m.fillStyle='#e0201a';m.fillRect(r4.position.x*2-4/k,r4.position.z*2-4/k,8/k,8/k);}
 if(phase==='go'){const pl=placeOf(STAGES[stage]);m.strokeStyle='#ffe08a';m.lineWidth=3/k;m.beginPath();m.arc(pl.x*2,pl.z*2,(7+2*Math.sin(time*5))/k,0,TAU);m.stroke();}
 m.restore();m.fillStyle='#fff';m.beginPath();m.moveTo(mw/2,mw/2-9);m.lineTo(mw/2+6,mw/2+7);m.lineTo(mw/2,mw/2+3);m.lineTo(mw/2-6,mw/2+7);m.closePath();m.fill();
 if(phase==='go'){const pl=placeOf(STAGES[stage]);const a=Math.atan2(pl.x-player.x,-(pl.z-player.z))+player.yaw;m.save();m.translate(mw/2,mw/2);m.rotate(a);m.fillStyle='#ffe08a';m.beginPath();m.moveTo(0,-mw/2+3);m.lineTo(7,-mw/2+17);m.lineTo(-7,-mw/2+17);m.closePath();m.fill();m.restore();}
 m.strokeStyle='rgba(245,236,214,.85)';m.lineWidth=3;m.beginPath();m.arc(mw/2,mw/2,mw/2-2,0,TAU);m.stroke();
 $('hp').style.width=clamp(player.hp/player.maxHp*100,0,100)+'%';$('en').style.width=player.en+'%';$('en').classList.toggle('full',player.en>=100);
 const rn=world.roadName(player.x,player.z);$('street').textContent=rn||'';$('score').textContent=score+' PT';
 if(phase==='go'){const pl=placeOf(STAGES[stage]);$('dist').textContent=Math.round(Math.hypot(pl.x-player.x,pl.z-player.z))+' m';}else $('dist').textContent=phase==='fight'?enemies.filter(e=>!e.dead).length+' in piedi':'';}
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;gamepad(dt);
 if(state==='play'){update(dt);fpsAcc+=dt;fpsN++;qT+=dt;if(qT>3){const fps=fpsN/fpsAcc;if(autoQ&&fps<27&&QL<3){QL++;applyQuality();}fpsAcc=0;fpsN=0;qT=0;}}
 if(state==='load'||!player)return;
 const sx=shake?(rnd()-.5)*shake*.12:0,sy=shake?(rnd()-.5)*shake*.12:0;camera.position.set(player.x+sx,1.66+Math.sin(player.bob*2)*.035*player.bobA+sy,player.z);camera.rotation.set(player.pitch,player.yaw+(shake?(rnd()-.5)*shake*.02:0),0);
 sun.target.position.set(player.x,0,player.z);sun.position.copy(sun.target.position).add(SUN);world.sky.position.set(player.x,0,player.z);
 if(beam.visible){beam.material.opacity=.3+.12*Math.sin(now/260);beam.rotation.y+=dt;}
 renderer.render(scene,camera);if(state==='play'||state==='pause')drawHud();}

/* ------------------------------------------------------------ avvio */
let chosen='mario';try{const c=localStorage.getItem('church-fps-char');if(c&&byId(c))chosen=c;}catch{}
function fillSelect(){const g=$('grid');g.innerHTML='';for(const r of FIGHTERS){const b=document.createElement('button');b.type='button';b.className='face';b.style.backgroundImage=`url(assets/${r.id}.webp)`;b.title=r.nome;b.dataset.id=r.id;b.setAttribute('aria-label',r.nome);b.addEventListener('click',()=>choose(r.id));g.appendChild(b);}choose(chosen);}
function choose(id){chosen=id;const r=byId(id),k=kitOf(id);for(const b of $('grid').children)b.classList.toggle('sel',b.dataset.id===id);$('cname').textContent=r.nome;$('cnick').textContent=r.soprannome||'';$('ckit').textContent='L · '+k.sp+'   ★ O · '+k.sup;$('cimg').style.backgroundImage=`url(assets/${id}.webp)`;}
async function begin(from){$('menu').hidden=true;$('loading').hidden=false;$('loading').textContent='Carico '+byId(chosen).nome+'…';try{localStorage.setItem('church-fps-char',chosen);}catch{}
 await sheet(chosen);const def=byId(chosen),S=world.PLACES.start;for(const e of enemies)removeEnemy(e);enemies=[];for(const s of shots)scene.remove(s.m);shots=[];pops=[];if(r4)r4.visible=false;r4run=null;kills=0;score=0;
 player={def,id:chosen,x:S.x,z:S.z,yaw:0,pitch:0,vx:0,vz:0,hp:0,maxHp:(def.stats.vita||1000)/10,en:30,atk:null,block:false,hurtT:0,inv:1,bob:0,bobA:0,side:false};player.hp=player.maxHp;
 const k=kitOf(chosen);$('pname').textContent=def.nome.toUpperCase();$('pface').style.backgroundImage=`url(assets/${chosen}.webp)`;$('moves').innerHTML=TOUCH?'':`<b>J</b> pugno · <b>K</b> calcio · <b>L</b> ${k.sp} · <b>O</b> ★ ${k.sup} · <b>Spazio</b> parata · <b>Maiusc</b> corsa`;
 if(TOUCH){$('bsp').textContent=k.sp.split(' ')[0].toUpperCase().slice(0,9);}
 $('loading').hidden=true;$('ui').hidden=false;$('over').hidden=true;$('win').hidden=true;$('pause').hidden=true;state='play';last=performance.now();startStage(typeof from==='number'?from:Q.has('stage')?clamp(+Q.get('stage'),0,STAGES.length-1):0);
 if(SFX){try{await SFX.unlock();}catch{}SFX.setMusic(audioOn);}lock();}
async function init(){resize();const names=['santandrea','scritta','mur1','mur2','mur3','palUp','palGr'];const imgs=await Promise.all(names.map(n=>loadImg('assets/fps/'+n+'.jpg')));const textures={};names.forEach((n,i)=>{if(imgs[i])textures[n]=imgs[i];});
 $('loading').textContent='Costruisco Sant’Andrea…';await new Promise(r=>setTimeout(r,30));
 world=WLD.build(scene,null,{textures});beam=new T.Mesh(new T.CylinderGeometry(2.2,2.2,60,20,1,true),new T.MeshBasicMaterial({color:0xffd36b,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false,fog:false}));beam.position.y=30;beam.geometry.translate(0,30,0);beam.position.y=0;beam.visible=false;scene.add(beam);
 applyQuality();fillSelect();const S=world.PLACES.start;player={def:byId(chosen),id:chosen,x:S.x,z:S.z,yaw:0,pitch:0,bob:0,bobA:0,hp:1,maxHp:1,en:0,hurtT:0};state='menu';$('loading').hidden=true;$('menu').hidden=false;
 window.FPS={r4At(x,z,rot){if(!r4){r4=WLD.renault4();scene.add(r4);}r4.visible=true;r4.position.set(x,0,z);r4.rotation.y=rot||0;},get player(){return player},get enemies(){return enemies},get state(){return state},world,scene,camera,renderer,spawn,sheet,attack,startStage,STAGES,set quality(v){QL=v;autoQ=false;applyQuality();},get quality(){return QL},get phase(){return phase}};}
$('start').addEventListener('click',()=>begin());$('again').addEventListener('click',()=>begin(stage));$('again2').addEventListener('click',()=>begin(0));$('resume').addEventListener('click',()=>pause(false));
$('audio').addEventListener('click',()=>{audioOn=!audioOn;try{localStorage.setItem('church-audio',audioOn?'1':'0');}catch{}$('audio').textContent=audioOn?'AUDIO: SÌ':'AUDIO: NO';if(SFX)SFX.setMusic(audioOn&&state==='play');});$('audio').textContent=audioOn?'AUDIO: SÌ':'AUDIO: NO';
if($('pbtn'))$('pbtn').addEventListener('click',()=>pause(state==='play'));
requestAnimationFrame(frame);init().catch(e=>{console.error(e);$('loading').hidden=false;$('loading').textContent='Errore nel caricare il quartiere: '+e.message;});
})();
