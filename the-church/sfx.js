/* The Church 2.6.1 — suoni dei colpi, versi, frasi e scritte a fumetto.
 * Tutti i suoni sono originali (sintetizzati per The Church) e stanno in sfx-data.js,
 * così funzionano anche aprendo il gioco da file (Windows) senza server.
 * Musica: music-data.js (stessa traccia di assets/musica-duello.mp3).
 */
(function(){'use strict';
const D=window.CHURCH_SFX_DATA||{};
const FEM=new Set(['maradona','zozza','luigina']);
let ac=null,master=null,loading=null;const buf={};let lastVoice=0,lastLine='';
const rnd=Math.random,pick=a=>a[Math.floor(rnd()*a.length)];
const hash=s=>{let h=7;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h;};
function ctx(){try{if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ac=new AC();master=ac.createGain();master.gain.value=.95;master.connect(ac.destination);}
 if(ac.state==='suspended')ac.resume().catch(()=>{});}catch{return null;}return ac;}
function load(){if(loading)return loading;const c=ctx();if(!c)return Promise.resolve();
 loading=Promise.all(Object.keys(D).map(k=>new Promise(res=>{try{const bin=atob(D[k]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
  c.decodeAudioData(a.buffer,b=>{buf[k]=b;res();},()=>res());}catch{res();}})));return loading;}
function play(name,{vol=1,rate=1,pan=0,delay=0}={}){const c=ctx();if(!c||!buf[name])return false;try{const s=c.createBufferSource();s.buffer=buf[name];s.playbackRate.value=rate;
 const g=c.createGain();g.gain.value=vol;s.connect(g);if(c.createStereoPanner&&pan){const p=c.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,pan));g.connect(p);p.connect(master);}else g.connect(master);
 s.start(c.currentTime+delay);return true;}catch{return false;}}
/* voce del personaggio: uomo/donna + timbro leggermente diverso per ognuno */
function voice(id,line,{force=false,vol=.95,pan=0,delay=0}={}){const now=performance.now();if(!force&&now-lastVoice<420)return false;
 const name=(FEM.has(id)?'donna-':'uomo-')+line;if(!buf[name])return false;lastVoice=now+delay*1000;lastLine=line;
 const rate=.9+(hash(id)%23)/100;return play(name,{vol,rate,pan,delay});}

/* ---------- musica: Web Audio da music-data.js (va da file://, sul sito e nell'anteprima);
   se manca, ripiego sull'elemento <audio> */
let musicOn=false,mBuf=null,mSrc=null,mGain=null,mLoading=null,mEl=null,useWA=false;
/* iPhone: con l'interruttore del silenzioso la Web Audio tace. La musica va quindi su un elemento <audio>
   (che suona come un video) e la sessione audio passa a "riproduzione": così si sentono anche i colpi. */
function session(){try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}}
function musicEl(){if(mEl!==null)return mEl;try{const d=window.CHURCH_MUSIC_DATA;if(!d||!window.Blob||!window.URL)return mEl=false;
 const bin=atob(d),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
 mEl=new Audio(URL.createObjectURL(new Blob([a],{type:'audio/mpeg'})));mEl.loop=true;mEl.volume=.34;mEl.preload='auto';mEl.setAttribute('playsinline','');}catch{mEl=false;}return mEl;}
function loadMusic(){if(mLoading)return mLoading;const c=ctx(),d=window.CHURCH_MUSIC_DATA;if(!c||!d)return mLoading=Promise.resolve();
 mLoading=new Promise(res=>{try{const bin=atob(d),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);c.decodeAudioData(a.buffer,b=>{mBuf=b;res();},()=>res());}catch{res();}}).then(()=>{if(musicOn&&useWA)startMusic();});return mLoading;}
function startMusic(){const c=ctx();if(!c||!mBuf||mSrc)return;try{mGain=c.createGain();mGain.gain.value=.34;mGain.connect(master);mSrc=c.createBufferSource();mSrc.buffer=mBuf;mSrc.loop=true;mSrc.connect(mGain);mSrc.start();}catch{mSrc=null;}}
function stopMusic(){try{mSrc&&mSrc.stop();}catch{}mSrc=null;}
function fallbackWA(){useWA=true;if(!musicOn)return;ctx();if(mBuf)startMusic();else loadMusic();}
function setMusic(on){musicOn=on;session();
 const el=!useWA&&musicEl();
 if(el){if(on){try{const p=el.play();if(p&&p.catch)p.catch(fallbackWA);}catch{fallbackWA();}}else{el.pause();stopMusic();}return;}
 if(on){ctx();if(mBuf)startMusic();else loadMusic();}else stopMusic();}

/* ---------- scritte a fumetto */
/* colori del logo di The Church: giallo, arancio, rosso (+ filo blu), contorno nero */
const LOGO={yellow:'#fce003',orange:'#f7a406',red:'#f50504',blue:'#0000f9',ink:'#000000'};
function drawPop(c,x,y,word,size,life,seed){const h=hash(word+seed);const age=1-life;const sc=age<.12?.4+age/.12*.75:age<.22?1.15-(age-.12)*1.5:1;
 c.save();c.translate(x,y-age*size*.6);c.rotate(((h%17)-8)*.025);c.scale(sc,sc);c.globalAlpha=Math.min(1,life*3);
 c.font=`900 ${size}px Impact,"Arial Black","Helvetica Neue",sans-serif`;c.textAlign='center';c.textBaseline='middle';
 const w=c.measureText(word).width,rx=w*.62+size*.5,ry=size*1.05,n=14;
 const star=k=>{c.beginPath();for(let i=0;i<n*2;i++){const a=i/(n*2)*Math.PI*2,r=(i%2?.72:1+((h>>i)&3)*.06)*k;const px=Math.cos(a)*rx*r,py=Math.sin(a)*ry*r;i?c.lineTo(px,py):c.moveTo(px,py);}c.closePath();};
 // esplosione: rosso fuori, arancio dentro, come il tramonto del logo
 star(1);c.fillStyle=LOGO.red;c.fill();c.lineWidth=Math.max(1.5,size*.1);c.strokeStyle=LOGO.ink;c.lineJoin='miter';c.stroke();
 star(.8);c.fillStyle=LOGO.orange;c.fill();
 // scritta: gialla con ombra rossa e filo blu sfalsati, contorno nero
 const o=Math.max(1,size*.07),ty=size*.04;c.lineJoin='round';c.lineWidth=Math.max(2,size*.16);c.strokeStyle=LOGO.ink;
 c.strokeText(word,o*2,ty+o*2);c.fillStyle=LOGO.blue;c.fillText(word,o*2,ty+o*2);
 c.strokeText(word,o,ty+o);c.fillStyle=LOGO.red;c.fillText(word,o,ty+o);
 c.strokeText(word,0,ty);c.fillStyle=LOGO.yellow;c.fillText(word,0,ty);
 c.restore();}

/* ---------- regie dei colpi (usate da Duello e Strade)
 * hit: {att, tgt, dmg, heavy, kick, sup, special, blocked, pan}
 * restituisce la parola da mostrare a fumetto (o null) */
function hit(o){const pan=o.pan||0;
 if(o.blocked){play('toc',{vol:.7,pan,rate:.95+rnd()*.1});return rnd()<.35?'TOC!':null;}
 let word;
 if(o.sup){play('boom',{vol:1,pan});play('sbaaam',{vol:.7,pan,rate:.9});word=pick(['BOOM!','KABOOM!','SBADABAM!']);}
 else if(o.heavy){play('sbaaam',{vol:.95,pan,rate:.92+rnd()*.16});word=o.kick?pick(['FIUUU-TUMP!','SDENG!','SBAM!']):pick(['SBAAAM!','SGANASS!','SBONK!','CRASH!']);
  if(!o.kick&&rnd()<.3)voice(o.att,'sganassone',{force:true,pan});}
 else if(o.kick){play('sciaff',{vol:.8,pan,rate:.9+rnd()*.25});word=pick(['SCIAFF!','PAM!','STOCK!']);}
 else{play('paf',{vol:.85,pan,rate:.9+rnd()*.25});word=pick(['PAF!','POW!','PUF!','SPLASH!']);}
 if(rnd()<(o.heavy||o.sup?.55:.35))voice(o.tgt,o.heavy||o.sup?pick(['ahrgh','ahrgh','ahia']):pick(['uff','ahia','uff']),{pan,delay:.05});
 return(o.heavy||o.sup||rnd()<.55)?word:null;}
function swing(id,{kick=false,heavy=false,pan=0}={}){
 if(kick&&heavy){play('fiuuu',{vol:.55,pan,rate:1.15});if(rnd()<.35)voice(id,'feeeeu',{pan});return;}
 if(rnd()<(heavy?.4:.14))voice(id,pick(heavy?['hia','tie','ha']:['ha','tie']),{pan});}
function special(id,isSuper,pan=0){if(isSuper||rnd()<.35)voice(id,isSuper?'santandreaken':pick(['santandreaken','hia']),{force:isSuper,pan,vol:1});}
function ko(winner,loser,pan=0){play('tonf',{vol:.95,pan});voice(loser,'oooh-ko',{force:true,pan});if(winner)setTimeout(()=>voice(winner,'minchia-ti-talii',{force:true,vol:1}),1150);}

window.ChurchSFX={get loaded(){return Object.keys(buf).length},unlock(){session();ctx();return load();},get musicPlaying(){return!!mSrc||!!(mEl&&!mEl.paused)},play,voice,hit,swing,special,ko,drawPop,setMusic,get musicOn(){return musicOn},FEM};
})();
