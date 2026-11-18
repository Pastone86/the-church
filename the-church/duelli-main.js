/* The Church — Duello classico, interfaccia (2.2).
 * Rispetto alla 1.2.0:
 *  - i dati vengono da roster.js (gli stessi delle Strade) e ogni personaggio
 *    ha tre speciali (duelli-extra.js);
 *  - la tastiera non si blocca più dopo aver cliccato un pulsante della pagina;
 *  - i tocchi brevi non vanno persi (ogni pressione vale almeno un tick);
 *  - telefono: orizzontale, joystick a sinistra e mosse a destra (touch.js);
 *  - avviso quando una speciale o la super non partono.
 */
(function(){'use strict';
const $=id=>document.getElementById(id),data=window.CHURCH_DATA;
const extra=window.ChurchDuelExtra?ChurchDuelExtra.extend(data):0;
const ART={};for(const c of data.personaggi.personaggi)ART[c.id]='assets/'+c.id+'.webp';for(const k of ['stage','stage-urban','animals-dogs','animals-wild'])ART[k]='assets/'+k+'.webp';
const P1KEYS={up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD',lp:'KeyG',hp:'KeyH',lk:'KeyB',hk:'KeyN',special1:'KeyJ',special2:'KeyK',special3:'KeyL',super:'KeyO'};
// Tutto lo stato mutabile dell'applicazione vive in Gioco.
const Gioco={pops:[],played:{},pick:0,house:'tutte',art:ART,data,keys:new Set(),latch:new Set(),stick:{x:0,y:0},battle:new SAF.Battle(data),cpu:null,mode:'cpu',running:false,paused:false,debug:false,renderer:new SAFRenderer($('arena'),ART),clock:null,error:null,toast:'',toastT:0,
 audio:{enabled:(()=>{try{return localStorage.getItem('church-audio')!=='0';}catch{return true;}})(),context:null,
  // Oscillator envelope adapted from Antropocene (Francesco D'Isa, Apache-2.0).
  unlock(){if(!this.enabled)return;window.ChurchSFX?.unlock();try{if(!this.context){const AC=window.AudioContext||window.webkitAudioContext;if(AC)this.context=new AC();else this.enabled=false;}if(this.context?.state==='suspended')this.context.resume().catch(()=>{});}catch{this.enabled=false;this.context=null;}},
  tone(f,d=.1,type='square',gain=.035,end){if(!this.enabled||!this.context)return;const c=this.context,o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.setValueAtTime(f,c.currentTime);if(end)o.frequency.exponentialRampToValueAtTime(Math.max(20,end),c.currentTime+d);v.gain.setValueAtTime(gain,c.currentTime);v.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);o.connect(v);v.connect(c.destination);o.start();o.stop(c.currentTime+d+.01);},
  event(e,b){if(!this.enabled)return;const S=window.ChurchSFX;
   if(S&&b){const id=i=>b.fighters[i]?.def?.id||'x',pan=e.x!=null?Math.max(-.8,Math.min(.8,(e.x-(b.camera||0)-192)/220)):0;
    if(e.type==='hit'||e.type==='block'){const heavy=(e.base||0)>=80||e.damage>=80,att=e.att??1-e.side;const w=S.hit({att:id(att),tgt:id(e.side),heavy,kick:e.kick,sup:e.sup,blocked:e.type==='block',pan});
     if(e.perfect)this.tone(800,.08,'square',.02);if(w&&e.x!=null)Gioco.pops.push({w,x:e.x,y:e.y-16,life:1,size:e.sup?19:heavy?16:12.5,seed:Math.random()});if(e.ko&&e.type==='hit')S.ko(id(att),id(e.side),pan);return;}
    if(e.type==='swing'){S.swing(id(e.side),{kick:/k$/.test(e.key||''),heavy:/^h/.test(e.key||'')});return;}
    if(e.type==='special'){S.special(id(e.side),e.isSuper);if(e.isSuper)this.tone(90,.25,'sawtooth',.03,40);return;}}
   if(e.type==='hit')this.tone(110,.09,'triangle',.08,35);else if(e.type==='block')this.tone(e.perfect?800:360,.08,'square',.02);else if(e.type==='jump')this.tone(180,.1,'square',.014,400);else if(e.type==='start')this.tone(650,.24,'triangle',.06);else if(e.type==='roundEnd')this.tone(160,.6,'triangle',.06,80);else if(e.type==='special')this.tone(e.isSuper?90:330,.2,'sawtooth',.04,e.isSuper?40:660);else if(e.type==='deny')this.tone(90,.12,'square',.02);}
 },
 down(code){return this.keys.has(code)||this.latch.has(code);},
 raw(side){const k=c=>this.down(c);if(side===0){const s=this.stick;return {up:k('KeyW')||s.y<-.55,left:k('KeyA')||s.x<-.35,down:k('KeyS')||s.y>.55,right:k('KeyD')||s.x>.35,lp:k('KeyG'),hp:k('KeyH'),lk:k('KeyB'),hk:k('KeyN'),special1:k('KeyJ'),special2:k('KeyK'),special3:k('KeyL'),super:k('KeyO')};}
  return {up:k('ArrowUp'),left:k('ArrowLeft'),down:k('ArrowDown'),right:k('ArrowRight'),lp:k('Numpad1')||k('Digit1'),hp:k('Numpad2')||k('Digit2'),lk:k('Numpad4')||k('Digit4'),hk:k('Numpad5')||k('Digit5'),special1:k('Numpad7')||k('Digit7'),special2:k('Numpad8')||k('Digit8'),special3:k('Numpad9')||k('Digit9'),super:k('Numpad0')||k('Digit0')};},
 press(code){if(!this.running)return;this.keys.add(code);this.latch.add(code);},
 clear(){this.keys.clear();this.latch.clear();this.stick={x:0,y:0};touch?.reset();this.battle.fighters.forEach(f=>f.input.clear());this.clock.reset();},
 start(){if(!this.renderer.ready||this.renderer.error)return;this.renderer.viewer=$('mode').value==='cpu'?0:null;const left=$('fighter').value,right=$('opponent').value;this.mode=$('mode').value;this.battle=new SAF.Battle(data,{left,right,seed:Date.now()});this.battle.setRelics([$('relic-p1').value,$('relic-p2').value]);this.cpu=this.mode==='cpu'?new SAF.CPU(1,$('difficulty').value):null;if(this.cpu)SAF.applyAssist(this.battle,$('difficulty').value);this.running=true;this.paused=false;this.clear();this.audio.unlock();$('setup').hidden=true;$('selection').hidden=true;$('moves-panel').open=false;$('result').hidden=true;$('pause').disabled=false;$('menu').hidden=false;
  this.audio.unlock();window.ChurchSFX?.setMusic(this.audio.enabled);this.pops=[];document.documentElement.classList.add('playing');if(ChurchTouch.phone()||ChurchTouch.coarse()){ChurchTouch.landscape();touch.show(true);}updateTouch(true);$('arena').focus();this.status('Round 1 · J / K / L: speciali · O: super.');},
 pause(force){if(!this.running||this.battle.result)return;this.paused=force??!this.paused;window.ChurchSFX?.setMusic(this.audio.enabled&&!this.paused);this.clear();$('pause').textContent=this.paused?'Riprendi · P':'Pausa · P';$('tpause').textContent=this.paused?'▶':'II';this.status(this.paused?'Partita in pausa. Premi P per riprendere.':'Combatti!');},
 home(){this.running=false;window.ChurchSFX?.setMusic(false);this.paused=false;this.clear();touch.show(false);document.documentElement.classList.remove('playing');if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});$('setup').hidden=false;$('selection').hidden=false;this.updateRoster();$('result').hidden=true;$('pause').disabled=true;$('pause').textContent='Pausa · P';$('menu').hidden=true;this.status('Scegli la modalità e comincia.');},
 next(){if(this.battle.phase==='matchEnd'){this.start();return;}this.battle.nextRound();this.cpu=this.mode==='cpu'?new SAF.CPU(1,$('difficulty').value):null;this.clear();$('result').hidden=true;if(ChurchTouch.phone()||ChurchTouch.coarse())touch.show(true);$('arena').focus();},
 status(s){$('status').textContent=s;},
 say(s,t=1.2){this.toast=s;this.toastT=t;this.status(s);},
 finish(){const b=this.battle,r=b.result;if(r.match){for(const f of b.fighters)this.played[f.def.id]=(this.played[f.def.id]||0)+1;try{localStorage.setItem('the-church-played',JSON.stringify(this.played));}catch{}}touch.show(false);$('result').hidden=false;const name=r.tie?'Pareggio':b.fighters[r.winner].def.nome+(b.fighters[r.winner].def.id==='american'?' “American”':'');$('result-title').textContent=r.match?(r.tie?'Match in parità':name+' vince il match!'):(r.tie?'Round doppio':name+' vince il round');$('result-line').textContent=r.tie?'Entrambi guadagnano un round.':b.fighters[r.winner].def.vittoria;$('next').textContent=r.match?'Rivincita · Invio':'Round successivo · Invio';this.status(`Round: ${b.wins[0]} a ${b.wins[1]}. ${r.match?'Match terminato.':'Pronti al prossimo round.'}`);this.keys.clear();this.latch.clear();},
 step(){if(!this.running||this.paused)return;const was=this.battle.phase;if(this.cpu&&this.battle.relicTick%120===0){const r=this.battle.fighters[1].relic;this.battle.useRelic(1,r.second?'joystick':undefined);}const cpuRaw=this.cpu?this.cpu.read(this.battle):this.raw(1);if(this.cpu&&!this.battle.fighters[1].relic.used&&['cavallo','tomo','chicago','sbiascico'].includes(this.battle.relicIds?.[1]))cpuRaw.super=false;this.battle.step([this.raw(0),cpuRaw]);this.latch.clear();
  for(const e of this.battle.events){this.audio.event(e,this.battle);if(e.type==='hit'||e.type==='block')this.status(e.perfect?'Parata perfetta! +100 super':e.type==='block'?'Colpo parato':e.move+' · '+Math.round(e.damage)+' danni');
   if(e.type==='deny'&&(e.side===0||!this.cpu)){const who=this.mode==='cpu'?'':'P'+(e.side+1)+' · ';this.say(who+(e.reason==='meter'?`SUPER NON PRONTA · SERVE ${e.need/1000} TACC${e.need>1000?'HE':'A'}`:e.reason==='none'?'NESSUNA SPECIALE SU QUESTO TASTO':e.reason==='busy'?'COLPITO O OCCUPATO: SPECIALE NON PARTITA, RIPROVA':e.reason==='copy'?'NIENTE DA COPIARE: L’AVVERSARIO NON HA ANCORA USATO MOSSE':'BLOCCATO: NON PUOI USARE SPECIALI'));}
   if(e.type==='special'&&(e.side===0||!this.cpu))this.say((e.isSuper?'SUPER · ':'')+e.move.toUpperCase(),1);}
  if(was!==this.battle.phase&&this.battle.result)this.finish();},
 frame(t){try{if(this.running&&!this.paused&&!document.hidden)this.clock.advance(t);else this.clock.reset();$('relic-status').textContent=this.battle.fighters.map((f,i)=>`${i?'P2':'P1'}: ${f.relic.used?(f.relic.second?'scegli la seconda reliquia':'usata'):'pronta'} · scudo ${Math.round(f.relic.shield)} · bonus ${f.relic.bonus}`).join(' | ')+' — '+this.battle.relicMessage;this.renderer.draw(this.battle,{menu:!this.running,paused:this.paused,debug:this.debug});if(this.pops.length&&window.ChurchSFX){const c=this.renderer.c,cam=this.battle.camera||0;for(const p of this.pops){ChurchSFX.drawPop(c,p.x-cam,p.y,p.w,p.size,p.life,p.seed);if(!this.paused)p.life-=1/50;}this.pops=this.pops.filter(p=>p.life>0&&this.running);}
  if(this.running&&this.toastT>0){this.toastT-=1/60;const r=this.renderer,w=Math.min(360,this.toast.length*6+16);r.rect(192-w/2,56,w,15,'#13252ee8');r.rect(192-w/2,56,w,1,'#e8b777');r.text(this.toast.slice(0,58),192,60,'#f2d394',1,'center');}
  if(this.running)updateTouch();}catch(error){this.error=String(error);this.paused=true;$('error').hidden=false;$('error').textContent='Il gioco si è fermato: '+error.message;console.error(error);}requestAnimationFrame(t=>this.frame(t));},
 resize(){const scale=Math.max(1,Math.min(4,Math.floor((window.innerWidth-36)/384),Math.floor((window.innerHeight-200)/224)));$('arena').style.width=384*scale+'px';$('arena').style.height=224*scale+'px';$('scale').textContent='HD 1152 × 672 · 60 tick/s';}
};
// ---- comandi touch 2.2: joystick a sinistra (giocatore 1), mosse a destra
const BTN=[{id:'lp',label:'P',sub:'PUGNO',buzz:1},{id:'hp',label:'P+',sub:'FORTE',buzz:1},{id:'lk',label:'K',sub:'CALCIO',buzz:1},{id:'hk',label:'K+',sub:'FORTE',buzz:1},{id:'special1',label:'1',sub:'SPEC',cls:'sp',buzz:1},{id:'special2',label:'2',sub:'SPEC',cls:'sp',buzz:1},{id:'special3',label:'3',sub:'SPEC',cls:'sp',buzz:1},{id:'super',label:'★',sub:'SUPER',cls:'sp sup',buzz:1},{id:'relic',label:'✦',sub:'RELIQ.',cls:'tc-relic'}];
const touch=ChurchTouch.create($('cabinet'),{buttons:BTN,onPress:id=>{if(id==='relic'){useRelic(0);return;}Gioco.press(P1KEYS[id]);},onRelease:id=>{if(P1KEYS[id])Gioco.keys.delete(P1KEYS[id]);}});
let lastTouch=0;function updateTouch(force){const now=performance.now();if(!force&&now-lastTouch<120)return;lastTouch=now;Gioco.stick=touch.state.owner!==null?{x:touch.state.x,y:touch.state.y}:{x:0,y:0};
 const f=Gioco.battle.fighters[0];if(!f)return;const list=SAF.activeMoves(f.def);const short=s=>{const w=String(s).replace(/^(L'|La |Il |Lo |Le |I )/i,'').split(/\s+/);return(w[0].length>9?w[0].slice(0,8)+'.':w[0]).toUpperCase();};
 ['special1','special2','special3'].forEach((id,i)=>{const m=list[i];touch.set(id,{hidden:!m,label:m?short(m.nome):'',sub:m?(m.extra?'NUOVA':'SPEC'):'',disabled:!f.free});});
 const cost=(Gioco.battle.blueprint(f,'super')?.cost)||1000;touch.set('super',{sub:f.meter>=cost?'SUPER!':Math.floor(f.meter/cost*100)+'%',ready:f.meter>=cost,disabled:f.meter<cost});
 touch.set('relic',{hidden:!Gioco.battle.relicIds?.[0],disabled:f.relic?.used&&!f.relic?.second});}
// stick sempre aggiornato, non solo ogni 120 ms
setInterval(()=>{Gioco.stick=touch.state.owner!==null?{x:touch.state.x,y:touch.state.y}:{x:0,y:0};},16);
ChurchTouch.watch(()=>{if(Gioco.running)touch.show(ChurchTouch.phone()||ChurchTouch.coarse());Gioco.resize();});
document.querySelectorAll('[data-roster-count]').forEach(el=>el.textContent=String(data.personaggi.personaggi.length));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
Gioco.updateRoster=function(){const selected=[$('fighter').value,$('opponent').value];$('roster').innerHTML=this.data.personaggi.personaggi.filter(c=>this.house==='tutte'||c.casata===this.house).map(c=>`<button class="fighter-tile" data-id="${c.id}" data-p1="${selected[0]===c.id}" data-p2="${selected[1]===c.id}" aria-label="Seleziona ${esc(c.nome)}"><em>${selected[0]===c.id?'P1 ':''}${selected[1]===c.id?'P2':''}</em><span class="portrait" style="background-image:url(${this.art[c.id]})"></span>${esc(SAF.label(c))}</button>`).join('');
 $('roster').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{ $(this.pick?'opponent':'fighter').value=btn.dataset.id;this.updateRoster(); });
 $('move-cards').innerHTML=selected.map((id,side)=>{const c=data.personaggi.personaggi.find(c=>c.id===id);const hidden=c.id==='duzzi'&&(this.played.duzzi||0)<5;let n=0;return `<article class="move-card"><h3>${side?'P2 / CPU':'P1'} · ${esc(c.nome)}</h3><p>${esc(c.descrizione)}</p><p class="stat-strip">VITA ${c.stats.vita} · VELOCITÀ ${c.stats.velocita} · PORTATA ${c.stats.portata}</p><ul>${c.mosse.map(m=>{const passive=['passivo','parata perfetta'].includes(m.comando);const key=passive?'PASSIVA':(side?['7','8','9','—']:['J','K','L','—'])[n++]||'—';return `<li><kbd>${key}</kbd> <strong>${hidden&&!passive&&!m.extra?'???':esc(m.nome)}</strong>${m.extra?' <span class="tag">NUOVA 2.2</span>':''}<small>${hidden&&!passive&&!m.extra?'Misterioso: gioca 5 match con Duzzi per svelare la scheda.':(m.extra?'Tasto speciale':esc(m.comando))+' · '+m.danno+' danni<br>'+esc(m.note)}</small></li>`;}).join('')}</ul><p><kbd>${side?'0':'O'}</kbd> <strong>SUPER · ${esc(c.super.nome)}</strong><small>${c.super.danno} danni · ${id==='beppone'?3:1} tacca${id==='beppone'?'e':''}<br>${esc(c.super.note)}</small></p></article>`;}).join('');
 if(!this.running)this.battle=new SAF.Battle(data,{left:selected[0],right:selected[1]});
};
for(const id of ['fighter','opponent']){ $(id).innerHTML=data.personaggi.personaggi.map(c=>`<option value="${c.id}">${esc(SAF.label(c))}${SAF.label(c)!==c.nome?' — '+esc(c.nome):''}</option>`).join('');$(id).onchange=()=>Gioco.updateRoster();}
for(const id of ['relic-p1','relic-p2','relic-choice'])$(id).innerHTML=(id==='relic-choice'?'':'<option value="">Nessuna · classica</option>')+data.relics.filter(c=>id!=='relic-choice'||!['cavallo','tuta'].includes(c.id)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
$('relic-catalog').innerHTML=data.relics.map(c=>`<article><h3>${esc(c.name)}</h3><p>${esc(c.lore)}</p><p><strong>ARCADE:</strong> ${esc(c.arcade)}</p></article>`).join('');
function useRelic(side){if(!Gioco.running||Gioco.paused)return;const r=Gioco.battle.fighters[side].relic;const ok=Gioco.battle.useRelic(side,r.second?$('relic-choice').value:undefined);if(ok)Gioco.say(Gioco.battle.relicMessage);else Gioco.say('Reliquia non disponibile: controlla barra Super, tempo e utilizzi.');}
$('relic-use').onclick=()=>useRelic(0);$('relic-use2').onclick=()=>{if(!Gioco.cpu)useRelic(1);};
window.addEventListener('keydown',e=>{if(!e.repeat&&!['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName)&&['KeyV','Digit6'].includes(e.code)){e.preventDefault();if(e.code==='KeyV')useRelic(0);else if(!Gioco.cpu)useRelic(1);}});
$('fighter').value='mario';$('opponent').value='american';
$('houses').innerHTML=['tutte',...new Set(data.personaggi.personaggi.map(c=>c.casata))].map(h=>`<button data-house="${esc(h)}" aria-pressed="${h==='tutte'}">${esc(h).toUpperCase()}</button>`).join('');
$('houses').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{Gioco.house=btn.dataset.house;$('houses').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));Gioco.updateRoster();});
[0,1].forEach(side=>$('pick-p'+(side+1)).onclick=()=>{Gioco.pick=side;[0,1].forEach(s=>$('pick-p'+(s+1)).setAttribute('aria-pressed',String(s===side)));});
try{Gioco.played=JSON.parse(localStorage.getItem('the-church-played')||'{}');}catch{}
Gioco.updateRoster();
Gioco.clock=new SAF.Clock(()=>Gioco.step());window.Gioco=Gioco;
$('start').onclick=()=>Gioco.start();$('pause').onclick=()=>Gioco.pause();$('menu').onclick=()=>Gioco.home();$('next').onclick=()=>Gioco.next();$('result-menu').onclick=()=>Gioco.home();
$('tpause').onclick=()=>Gioco.pause();$('tmenu').onclick=()=>Gioco.home();
const audioLabels=()=>{$('audio').textContent=Gioco.audio.enabled?'Audio acceso':'Audio spento';$('tsound').textContent=Gioco.audio.enabled?'♪':'×♪';$('audio').setAttribute('aria-pressed',String(Gioco.audio.enabled));};
const toggleAudio=()=>{Gioco.audio.enabled=!Gioco.audio.enabled;try{localStorage.setItem('church-audio',Gioco.audio.enabled?'1':'0');}catch{}Gioco.audio.unlock();window.ChurchSFX?.setMusic(Gioco.audio.enabled&&Gioco.running&&!Gioco.paused);$('audio').textContent=Gioco.audio.enabled?'Audio acceso':'Audio spento';$('tsound').textContent=Gioco.audio.enabled?'♪':'×♪';$('audio').setAttribute('aria-pressed',String(Gioco.audio.enabled));};
$('audio').onclick=toggleAudio;$('tsound').onclick=toggleAudio;audioLabels();
$('boxes').onclick=()=>{Gioco.debug=!Gioco.debug;$('boxes').setAttribute('aria-pressed',String(Gioco.debug));$('boxes').textContent=Gioco.debug?'Nascondi hitbox':'Mostra hitbox';};
$('mode').onchange=()=>{$('difficulty').disabled=$('mode').value!=='cpu';};
$('fullscreen').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen?.();return;}ChurchTouch.landscape(ChurchTouch.phone()?document.documentElement:$('cabinet'));};
window.addEventListener('resize',()=>Gioco.resize());
window.addEventListener('blur',()=>{Gioco.clear();if(Gioco.running)Gioco.pause(true);});
document.addEventListener('visibilitychange',()=>{Gioco.clear();if(document.hidden&&Gioco.running)Gioco.pause(true);});
// 2.2: dopo un clic su un pulsante della pagina il fuoco torna all'arena,
// così i tasti del gioco (speciali comprese) continuano a funzionare.
document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&Gioco.running&&!b.closest('#setup')&&!b.closest('#selection'))setTimeout(()=>{if(document.activeElement?.tagName==='BUTTON')$('arena').focus({preventScroll:true});},0);});
const GAME_KEYS=['KeyW','KeyA','KeyS','KeyD','KeyG','KeyH','KeyB','KeyN','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Numpad1','Numpad2','Numpad4','Numpad5','Digit1','Digit2','Digit4','Digit5','KeyJ','KeyK','KeyL','KeyO','Numpad7','Numpad8','Numpad9','Numpad0','Digit7','Digit8','Digit9','Digit0'];
window.addEventListener('keydown',e=>{
 if(['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;
 if(['KeyP','Escape'].includes(e.code)){if(!e.repeat){e.preventDefault();Gioco.pause();}return;}
 if(e.code==='Enter'&&Gioco.running&&Gioco.battle.result){e.preventDefault();if(!e.repeat)Gioco.next();return;}
 // 1.2.0 ignorava TUTTI i tasti quando il fuoco era su un pulsante: ora solo Invio e Spazio.
 if(e.target.tagName==='BUTTON'&&['Enter','Space','NumpadEnter'].includes(e.code))return;
 if(GAME_KEYS.includes(e.code)&&Gioco.running){e.preventDefault();if(!e.repeat)Gioco.press(e.code);}
});window.addEventListener('keyup',e=>Gioco.keys.delete(e.code));
Gioco.renderer.promise.then(renderer=>{if(renderer.error){$('error').hidden=false;$('error').textContent='Impossibile caricare la grafica. Riapri il file scaricato.';return;}$('start').disabled=false;$('start').textContent='COMINCIA A COMBATTERE →';Gioco.status('The Church · scegli la modalità e comincia.'+(extra?` ${extra} speciali aggiunte nella 2.2.`:''));});
window.ChurchPad?.setInGame(()=>Gioco.running&&$('result').hidden);Gioco.resize();ChurchHD.auto($('arena'),384,224,k=>Gioco.renderer.c.setTransform(k,0,0,k,0,0),7);requestAnimationFrame(t=>Gioco.frame(t));
})();
