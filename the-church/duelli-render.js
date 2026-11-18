/* The Church — sprite illustrati, un solo canvas, palette limitate.
 * Renderer del Duello classico, estratto da duelli.html 1.2.0 senza modifiche
 * di comportamento (2.2: spostato in un file separato).
 */
(function(root){'use strict';
const GLYPHS=Object.freeze({
 A:'01110/10001/10001/11111/10001/10001/10001',B:'11110/10001/10001/11110/10001/10001/11110',C:'01111/10000/10000/10000/10000/10000/01111',D:'11110/10001/10001/10001/10001/10001/11110',E:'11111/10000/10000/11110/10000/10000/11111',F:'11111/10000/10000/11110/10000/10000/10000',G:'01111/10000/10000/10111/10001/10001/01111',H:'10001/10001/10001/11111/10001/10001/10001',I:'11111/00100/00100/00100/00100/00100/11111',J:'00111/00010/00010/00010/10010/10010/01100',K:'10001/10010/10100/11000/10100/10010/10001',L:'10000/10000/10000/10000/10000/10000/11111',M:'10001/11011/10101/10101/10001/10001/10001',N:'10001/11001/11001/10101/10011/10011/10001',O:'01110/10001/10001/10001/10001/10001/01110',P:'11110/10001/10001/11110/10000/10000/10000',Q:'01110/10001/10001/10001/10101/10010/01101',R:'11110/10001/10001/11110/10100/10010/10001',S:'01111/10000/10000/01110/00001/00001/11110',T:'11111/00100/00100/00100/00100/00100/00100',U:'10001/10001/10001/10001/10001/10001/01110',V:'10001/10001/10001/10001/10001/01010/00100',W:'10001/10001/10001/10101/10101/10101/01010',X:'10001/10001/01010/00100/01010/10001/10001',Y:'10001/10001/01010/00100/00100/00100/00100',Z:'11111/00001/00010/00100/01000/10000/11111',
 '0':'01110/10001/10011/10101/11001/10001/01110','1':'00100/01100/00100/00100/00100/00100/01110','2':'01110/10001/00001/00010/00100/01000/11111','3':'11110/00001/00001/01110/00001/00001/11110','4':'00010/00110/01010/10010/11111/00010/00010','5':'11111/10000/10000/11110/00001/00001/11110','6':'01110/10000/10000/11110/10001/10001/01110','7':'11111/00001/00010/00100/01000/01000/01000','8':'01110/10001/10001/01110/10001/10001/01110','9':'01110/10001/10001/01111/00001/00001/01110',
 '.':'00000/00000/00000/00000/00000/00110/00110',':':'00000/00110/00110/00000/00110/00110/00000','!':'00100/00100/00100/00100/00100/00000/00100','?':'01110/10001/00001/00010/00100/00000/00100','-':'00000/00000/00000/11111/00000/00000/00000','/':'00001/00001/00010/00100/01000/10000/10000',"'":'00100/00100/01000/00000/00000/00000/00000','+':'00000/00100/00100/11111/00100/00100/00000','(':'00010/00100/01000/01000/01000/00100/00010',')':'01000/00100/00010/00010/00010/00100/01000'});
const PALETTES=Object.freeze({mario:['#22252c','#3a3738','#705343','#b1805d','#dea578','#f5ce9e','#173b37','#28594b','#49846b','#a6b886','#233e57','#426381','#7496ad','#a44542','#eddbac'],american:['#282532','#563d40','#88604a','#bb865f','#e6b184','#f8d4a1','#495569','#78919b','#b9b6a0','#e9dec0','#693741','#a44949','#d67659','#334468','#5a7394']});
class Renderer{
 constructor(canvas,assets={}){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.c.setTransform(canvas.width/384,0,0,canvas.height/224,0,0);this.c.imageSmoothingEnabled=true;this.c.imageSmoothingQuality="high";this.images={};this.ready=false;this.error=null;
 this.promise=Promise.all(Object.entries(assets).map(([key,src])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{this.images[key]=img;resolve();};img.onerror=()=>reject(new Error('Grafica non caricata: '+key));img.src=src;}))).then(()=>{this.ready=true;return this;}).catch(e=>{this.error=e;return this;});
 }
 sprite(id,frame,x,y,face=1,squash=1){const img=this.images[id];if(!img)return;if(window.ChurchAnim)frame=ChurchAnim.frame(id,frame,performance.now()/1000);const c=this.c;c.save();c.translate(Math.round(x),Math.round(y));c.scale(face,squash);c.drawImage(img,(frame%4)*(img.width/4),Math.floor(frame/4)*(img.height/4),img.width/4,img.height/4,-48,-90,96,96);c.restore();}
 frameFor(f,tick){
 if(f.state==='SCONFITTO'||f.state==='ATTERRATO')return 14;if(f.wakeup)return f.wakeup>10?10:12;
 if(f.state.startsWith('COLPITO')||f.state==='STORDITO')return 13;
 if(f.attack){const a=f.attack,hit=a.age>a.startup&&a.age<=a.startup+a.active;if(f.crouch&&!hit)return 10;return a.key==='lk'?(hit?8:4):a.key==='hk'?(hit?9:8):a.key==='hp'?(hit?7:6):a.key.endsWith('k')?(hit?9:8):(hit?5:4);}
 if(f.crouch)return 10;if(!f.grounded)return 11;if(f.state.startsWith('PARATA'))return 12;if(f.walking)return 2+Math.floor(tick/7)%2;return Math.floor(tick/22)%2;
 }
 // Rounded rectangle rasterization adapted from Antropocene's rect utility.
 rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 poly(points,color){const min=Math.ceil(Math.min(...points.map(p=>p[1]))),max=Math.floor(Math.max(...points.map(p=>p[1])));for(let y=min;y<=max;y++){const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i<xs.length;i+=2)this.rect(Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1,color);}}
 ellipse(x,y,rx,ry,color){for(let dy=-ry;dy<=ry;dy++){const half=Math.floor(rx*Math.sqrt(1-dy*dy/(ry*ry)));this.rect(x-half,y+dy,2*half+1,1,color);}}
 line(x1,y1,x2,y2,width,color){const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1),1);for(let i=0;i<=n;i++)this.rect(x1+(x2-x1)*i/n-width/2,y1+(y2-y1)*i/n-width/2,width,width,color);}
 text(t,x,y,color='#f0dfb1',scale=1,align='left'){
  const accented=[...String(t).toUpperCase()];t=String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();const w=t.length*6*scale-scale;if(align==='center')x-=w/2;else if(align==='right')x-=w;
  [...t].forEach((ch,i)=>{if(accented[i]==='Ù'){this.rect(x+(i*6+1)*scale,y-3*scale,scale,scale,color);this.rect(x+(i*6+2)*scale,y-2*scale,scale,scale,color);}const rows=GLYPHS[ch]?.split('/');rows?.forEach((row,dy)=>[...row].forEach((v,dx)=>{if(v==='1')this.rect(x+(i*6+dx)*scale,y+dy*scale,scale,scale,color);}));});
 }
 stage(camera,tick){
  if(this.images.stage){const crop=Math.round(SAF.clamp(camera/816,0,1)*216);this.c.drawImage(this.images.stage,crop*(this.images.stage.width/600),0,384*(this.images.stage.width/600),this.images.stage.height,0,0,384,224);return;}
  const r=(...a)=>this.rect(...a);r(0,0,384,224,'#263736');r(0,35,384,83,'#cc8963');r(0,74,384,45,'#e2aa74');r(0,100,384,26,'#ebc48c');
  for(let i=0;i<9;i++){const x=i*69-camera*.18;r(x,54+(i%3)*9,52,77,'#847f71');r(x+3,57+(i%3)*9,46,3,'#a99880');for(let k=0;k<4;k++)for(let j=0;j<3;j++)r(x+6+j*15,65+(i%3)*9+k*14,5,7,'#636b66');}
  for(let i=0;i<9;i++){const x=i*152-camera*.45-78,top=29+(i%3)*13;
   r(x,top,105,114,'#3d4b47');r(x+3,top+3,99,112,'#8d927d');r(x+7,top+5,89,3,'#b8b395');r(x+96,top+4,6,115,'#657768');
   for(let y=top+15;y<127;y+=24)for(let col=0;col<3;col++){const wx=x+11+col*29;r(wx,y,17,16,'#47544b');r(wx+2,y+1,12,12,'#293c3c');r(wx+7,y,2,15,'#a7a88b');r(wx-2,y+13,23,2,'#c3b792');r(wx-1,y+16,21,2,'#526454');for(let q=0;q<4;q++)r(wx+q*6,y+12,1,5,'#d1bf96');}
   this.line(x+8,top+36,x+91,top+41,1,'#d6c79d');r(x+20,top+37,9,12,'#ddd2b2');r(x+38,top+39,8,10,'#a45c48');r(x+61,top+40,10,10,'#5e7e7a');
  }
  r(0,128,384,14,'#70816a');r(0,128,384,2,'#b2ae83');r(0,142,384,8,'#334a44');
  for(let i=0;i<26;i++){const x=i*51-camera*.65;this.line(x,104,x,141,1,'#455b4e');this.line(x-26,111,x+26,140,1,'#768471');this.line(x-26,140,x+26,111,1,'#768471');}
  r(0,150,384,74,'#687966');r(0,153,384,8,'#7b896e');r(0,190,384,1,'#9ca17d');r(0,211,384,13,'#465d51');
  for(let i=0;i<140;i++){const x=(i*83+19)%1200-camera,y=156+(i*17)%53;r(x,y,i%4+1,1,i%2?'#596e60':'#829175');}
  this.line(-camera,199,1200-camera,199,2,'#b0b18a');this.line(570-camera,156,555-camera,207,2,'#b0b18a');
  // Porta senza rete e canestro storto: dettagli del JSON del campetto.
  let gx=435-camera*.65;this.line(gx,151,gx,106,3,'#cfccb0');this.line(gx,106,gx+62,106,3,'#cfccb0');this.line(gx+62,106,gx+62,151,3,'#cfccb0');
  const bx=689-camera*.65;r(bx,70,3,79,'#414f48');r(bx-15,63,32,21,'#b5b499');r(bx-8,67,17,12,'#735d4d');this.line(bx-8,81,bx+8,84,2,'#b45e46');
  // I ragazzini del muretto.
  for(let i=0;i<6;i++){const x=420+i*27-camera*.65,bob=tick%180<10?1:0;r(x-3,128-bob,7,8,'#c6956a');r(x-5,134-bob,11,12,i%2?'#576b83':'#a05e4e');r(x-5,144-bob,4,10,'#394d50');r(x+3,144-bob,4,10,'#394d50');r(x-3,126-bob,7,3,'#414342');}
  r(265-camera*.3,118,69,12,'#385c4a');this.text('VIA MAESTRA',299-camera*.3,121,'#d9cb9e',1,'center');
 }
 fighter(f,tick,camera,victory=false){
  if(this.images[f.def.id]){const a=f.attack;if(!victory&&a&&a.visual==='horse'&&window.ChurchHorse){this.ellipse(Math.round(f.x-camera),190,34,3,'#3b3b32');const seat=ChurchHorse.drawSide(this.c,Math.round(f.x-camera),f.y+1,f.face,.42,tick/60,a.age>a.startup);this.sprite(f.def.id,10,f.x-camera,f.y-seat+22,f.face,1);return;}this.ellipse(Math.round(f.x-camera),190,f.def.archetipo==='boxer'?19:16,3,'#3b3b32');this.sprite(f.def.id,victory?15:this.frameFor(f,tick),f.x-camera,f.y,f.face,1);return;}
  const p=PALETTES[f.def.id]||PALETTES.mario,ox=Math.round(f.x-camera),oy=Math.round(f.y),face=f.face,wide=f.def.archetipo==='boxer';
  this.ellipse(ox,190,wide?20:16,3,'#43594d');
  const r=(x,y,w,h,col)=>this.rect(ox+(face===1?x:-x-w),oy+y,w,h,p[col]);
  const limb=(x,y,xx,yy,w,col)=>{this.line(ox+face*x,oy+y,ox+face*xx,oy+yy,w+2,p[0]);this.line(ox+face*x,oy+y,ox+face*xx,oy+yy,w,p[col]);};
  if(f.state==='SCONFITTO'||f.state==='ATTERRATO'){r(-23,-14,39,12,0);r(-21,-12,26,9,wide?9:7);r(6,-12,12,10,4);r(7,-14,9,3,wide?3:2);r(-26,-8,9,7,10);return;}
  const crouch=f.crouch?18:0,bob=!f.walking&&!f.attack&&f.grounded?Math.floor(tick/18)%2:0;
  const walk=f.walking?Math.round(Math.sin(tick*.35)*7):0,jump=!f.grounded,hit=f.state.startsWith('COLPITO'),guard=f.state.startsWith('PARATA'),a=f.attack,active=a&&a.age>a.startup&&a.age<=a.startup+a.active;
  const punch=active&&a.key.endsWith('p'),kick=active&&a.key.endsWith('k'),headY=-63+crouch+bob,hip=-23+crouch/2;
  limb(-6,hip,-9-walk,jump?-7:-4,wide?11:9,wide?13:10);r(-16-walk,-5,15,5,0);r(-15-walk,-4,12,2,wide?9:12);
  if(kick){limb(6,hip,21,-30+crouch,wide?11:9,wide?13:10);limb(21,-30+crouch,43,-34+crouch,9,wide?4:10);r(39,-37+crouch,13,7,0);r(40,-37+crouch,11,3,wide?9:12);}
  else{limb(6,hip,10+walk,jump?-16:-4,wide?12:9,wide?13:10);r(6+walk,jump?-18:-5,16,5,0);r(8+walk,jump?-17:-4,13,2,wide?9:12);}
  r(wide?-16:-12,-46+crouch,wide?32:25,27-crouch/2,0);r(wide?-14:-10,-45+crouch,wide?28:21,24-crouch/2,wide?9:7);r(wide?-14:-10,-43+crouch,wide?7:6,21-crouch/2,wide?8:6);r(wide?8:6,-43+crouch,wide?6:5,20-crouch/2,wide?9:8);
  if(wide){r(-6,-38+crouch,16,3,11);r(-6,-32+crouch,16,3,11);r(-6,-26+crouch,16,3,11);r(-11,-43+crouch,10,12,13);r(-8,-40+crouch,2,2,9);r(-3,-36+crouch,2,2,9);}
  else{r(0,-43+crouch,4,22-crouch/2,14);r(-2,-43+crouch,2,21-crouch/2,6);r(4,-41+crouch,3,3,13);r(-9,-24+crouch/2,17,3,6);}
  // Cranio, capelli/barba e profilo. Non ritratti fotografici.
  r(-8,headY,18,20,0);r(-6,headY+1,14,17,3);r(-2,headY+2,11,13,4);r(0,headY+3,7,5,5);r(8,headY+9,4,4,4);r(5,headY+7,3,2,0);
  if(wide){r(-6,headY+12,15,7,1);r(5,headY+12,7,3,1);r(-5,headY,12,2,3);}
  else{r(-8,headY,17,5,2);r(-8,headY+4,4,8,1);r(-6,headY,9,2,1);r(1,headY+15,8,2,2);}
  // Braccia articolate: posa distinta per preparazione, impatto e guardia.
  const ay=-41+crouch;
  limb(-10,ay,-15,-30+crouch,wide?9:7,wide?3:7);limb(-15,-30+crouch,-8,-39+crouch,7,wide?11:4);
  if(punch){limb(10,ay,26,ay-3,wide?11:8,wide?4:8);limb(26,ay-3,43,ay-5,wide?10:7,wide?4:4);r(39,ay-11,12,12,0);r(40,ay-10,11,10,wide?11:4);r(41,ay-10,8,3,wide?12:5);}
  else if(guard||a){limb(10,ay,17,-32+crouch,9,wide?4:8);limb(17,-32+crouch,19,-52+crouch,8,wide?11:4);r(14,-58+crouch,12,11,0);r(15,-57+crouch,10,9,wide?11:4);r(16,-57+crouch,7,2,wide?12:5);}
  else{limb(10,ay,18,-32+crouch,9,wide?4:8);limb(18,-32+crouch,25,-43+crouch,7,wide?11:4);r(21,-48+crouch,10,10,0);r(22,-47+crouch,8,8,wide?11:4);}
  if(hit){r(-12,headY-4,3,3,14);r(13,headY-8,2,4,14);}
  if(f.state==='STORDITO')for(let i=0;i<3;i++){const sx=Math.round(Math.sin(tick*.2+i*2)*14);r(sx,headY-7,3,3,14);}
  if(f.wakeup&&tick%4<2){r(-9,-67,20,2,14);}
 }
 projectile(p,camera){const x=p.x-camera;this.line(x-Math.sign(p.vx)*17,p.y,x,p.y,4,'#d6c79d');this.ellipse(x,p.y,7,7,'#e9dec0');this.rect(x-2,p.y-3,4,5,'#384c47');this.rect(x-6,p.y+1,3,3,'#384c47');this.rect(x+3,p.y-5,3,3,'#384c47');}
 digit(n,x,y){const segs=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'][n];const boxes={a:[2,0,9,2],b:[11,2,2,8],c:[11,12,2,8],d:[2,20,9,2],e:[0,12,2,8],f:[0,2,2,8],g:[2,10,9,2]};for(const key of Object.keys(boxes))this.rect(x+boxes[key][0],y+boxes[key][1],boxes[key][2],boxes[key][3],segs.includes(key)?'#f2d394':'#5a493a');}
 hud(b){
  this.rect(0,0,384,36,'#17272d');this.rect(0,35,384,1,'#c3ac78');
  b.fighters.forEach((f,i)=>{const x=i?220:10,w=154,ratio=Math.max(0,f.hp/f.def.stats.vita);this.rect(x-2,7,w+4,12,'#c3ac78');this.rect(x-1,8,w+2,10,'#394d50');this.rect(x,9,w,8,'#733f40');const fw=Math.floor(w*ratio),fx=i?x+w-fw:x;
   this.rect(fx,9,fw,3,'#f2d394');this.rect(fx,12,fw,3,'#c9a968');this.rect(fx,15,fw,2,'#997643');
   this.text((SAF.label?SAF.label(f.def):f.def.nome).slice(0,25),i?374:10,23,'#f0dfb1',1,i?'right':'left');
   for(let j=0;j<3;j++){const sx=i?363-j*12:12+j*12;this.rect(sx,38,7,9,'#18272a');this.rect(sx+1,38,5,8,j<b.wins[i]?'#e8b867':'#58645e');this.rect(sx+1,40,5,2,j<b.wins[i]?'#98613d':'#283c3c');this.rect(sx+2,38,3,1,'#c4ab7a');}
   for(let j=0;j<3;j++){const xx=i?279+j*32:10+j*32;this.rect(xx,210,30,7,'#253a3a');this.rect(xx+1,211,Math.floor(SAF.clamp((f.meter-j*1000)/1000,0,1)*28),5,'#9ebd8b');}
   this.text('SUPER',i?275:109,211,'#d9c99c',1,i?'right':'left');
  });
  this.text('THE CHURCH',192,211,'#f0dfb1',1,'center');this.rect(171,3,42,31,'#253a3a');const t=Math.ceil(b.remaining/60);this.digit(Math.floor(t/10),177,7);this.digit(t%10,194,7);
 }
 draw(b,{paused=false,debug=false,menu=false}={}){
  this.stage(b.camera,b.tick);for(const f of b.fighters)this.fighter(f,b.tick,b.camera,b.result?.winner===f.side);
  for(const p of b.projectiles){if(p.delay>0)continue;this.projectile(p,b.camera);}
  for(const e of b.effects){const x=e.x-b.camera,c=e.blocked?'#b4d5ce':'#f2d394';this.line(x-8,e.y-9,x+8,e.y+9,2,c);this.line(x-9,e.y+7,x+9,e.y-7,2,c);this.rect(x-3,e.y-3,6,6,'#f0dfb1');}
  this.hud(b);
  if(debug){const c=this.c;c.lineWidth=1;for(const f of b.fighters)for(const [box,color] of [[f.pushbox,'#e4bd65'],[f.hurtbox,'#82c5bb'],[f.hitbox,'#ec775b']])if(box){c.strokeStyle=color;c.strokeRect(Math.round(box.x-b.camera)+.5,Math.round(box.y)+.5,box.w-1,box.h-1);}}
  let title='',sub='';if(menu){title='THE CHURCH';sub='IL CAMPETTO TI ASPETTA';}else if(paused){title='PAUSA';sub='PREMI P PER RIPRENDERE';}else if(b.phase==='intro'){title='ROUND '+b.round;sub=b.intro<30?'COMINCIA!':'IL CAMPETTO DI VIA MAESTRA';}else if(b.result){title=b.result.tie?'PARITA':b.result.timeout?'TEMPO!':'K.O.!';sub=b.result.tie?'ROUND ASSEGNATO A ENTRAMBI':(b.fighters[b.result.winner].def.id==='american'?'AMERICAN':b.fighters[b.result.winner].def.nome)+' VINCE IL ROUND';}
  if(title){this.rect(40,73,304,54,'#15262d');this.rect(40,73,304,2,'#c3ac78');this.rect(40,125,304,2,'#c3ac78');this.text(title,193,82,'#131f27',3,'center');this.text(title,192,80,'#f0dfb1',3,'center');this.text(sub,192,112,'#d3a56c',1,'center');}
 }
}
root.SAFRenderer=Renderer;
})(typeof window==='undefined'?globalThis:window);

(function(root){'use strict';
const Base=root.SAFRenderer;
const labels={blind:'ACCECATO',noAttack:'TREGUA',noSpecial:'NO SPECIALI',inverted:'INVERTITO',slow:'LENTO',heavy:'PESANTE',slippery:'SCIVOLO',bleeding:'FERITA',rooted:'BLOCCATO',overclock:'OVERCLOCK',invulnerable:'INVULNERABILE',attackUp:'ATTACCO +',defenseUp:'DIFESA +',reflect:'RIFLESSO',autoGuard:'PARATA AUTO',tea:'TE',meditate:'MEDITAZIONE',regeneration:'RIGENERA',unblockable:'IMPARABILE',disabled:'TASTO BLOCCATO',invisible:'INVISIBILE',small:'SCHIVATA'};
class Renderer extends Base{
 fighter(f,tick,camera,victory){const x=f.x-camera,c=this.c;c.save();if(f.statuses?.invisible)c.globalAlpha=.2;if(f.statuses?.blind)c.globalAlpha=.65;super.fighter(f,tick,camera,victory);c.restore();
 if(f.traits?.leftie&&f.attack&&f.attack.age<=f.attack.startup)this.line(x-12*f.face,f.y-42,x-25*f.face,f.y-40,3,'#e7b778');
 if(f.flash&&tick%2===0){c.save();c.globalAlpha=.22;this.ellipse(x,f.y-30,20,29,'#fff4c8');c.restore();}
 const st=Object.keys(f.statuses||{}).filter(k=>labels[k]).slice(0,2);st.forEach((k,i)=>this.text(labels[k],x,f.y-(f.traits?.height||64)-10-i*9,f.side?'#99d6dd':'#ffcc88',1,'center'));
 if(f.traits?.style){this.rect(x-18,f.y+5,36,3,'#21383e');this.rect(x-18,f.y+5,36*f.style/100,3,'#f1cd8b');}
 if(f.traits?.patience&&f.parries)this.text('+'+Math.round(f.patience*100)+'%',x,f.y+8,'#b1d3b2',1,'center');
 if(f.attack?.mode==='counter'){this.c.strokeStyle='#99d6dd';this.c.strokeRect(x-25,f.y-67,50,65);}
 const a=f.attack;if(a&&a.age>a.startup&&a.age<=a.startup+a.active){if(a.visual==='tentacle'){for(let i=0;i<3;i++)this.line(x,f.y-20-i*12,x+f.face*Math.min(a.reach,170),f.y-45+i*13,3,'#916dac');}else if(a.visual==='flash'){c.save();c.globalAlpha=.25;this.rect(x,f.y-60,f.face*150,50,'#fff8d9');c.restore();}else if(a.visual==='fire'){for(let i=0;i<7;i++)this.line(x+i*5*f.face,f.y-2,x+i*5*f.face,f.y-20-(i+tick)%4*7,3,i%2?'#ef6859':'#eac888');}else if(['motorbike','bicycle','car','cart','4x4','peugeot'].includes(a.visual))this.vehicle(a.visual,x,f.y,f.face,tick);}
 }
 vehicle(kind,x,y,face,tick){const c=kind==='peugeot'?'#7198ae':kind==='cart'?'#929c98':kind==='4x4'?'#474f51':'#9d6353';this.ellipse(x-21,y-5,8,8,'#142026');this.ellipse(x+23,y-5,8,8,'#142026');this.ellipse(x-21,y-5,4,4,'#b8b9a6');this.ellipse(x+23,y-5,4,4,'#b8b9a6');if(kind==='bicycle'){this.line(x-21,y-5,x,y-25,2,c);this.line(x,y-25,x+23,y-5,2,c);this.line(x+23,y-5,x-21,y-5,2,c);}else{this.rect(x-29,y-24,58,16,c);this.rect(x-13,y-38,33,15,c);this.rect(x-9,y-35,24,11,'#b5ccba');this.rect(x+face*28,y-21,4,6,'#f2d394');}}
 draw(b,options={}){super.draw(b,options);if(options.menu||options.paused||b.result||b.phase==='intro')return;const c=this.c;
 if(b.fighters.some(f=>f.statuses?.africa)){c.save();c.globalAlpha=.14;this.rect(0,36,384,174,'#f1b665');c.restore();this.text('ABIDJAN',192,50,'#f1d09c',1,'center');}
 for(const e of b.entities||[]){const f=b.fighters[e.owner],t=b.fighters[1-e.owner],x=e.x-b.camera;
 if(e.mode==='aura'){c.save();c.globalAlpha=.23;const color=e.oil?'#d1a54e':e.smoke?'#aabcb0':'#7fc6d4';if(e.oil)this.rect(0,185,384,15,color);else for(let i=0;i<6;i++)this.ellipse(x+Math.sin(e.age*.05+i)*Math.min(e.radius,180),153+Math.cos(i+e.age*.03)*24,24,15,color);c.restore();if(e.visual==='sound')for(let i=0;i<3;i++){c.strokeStyle='#82bac9';c.beginPath();c.arc(x,150,((e.age*2+i*20)%80)+10,-1.2,1.2);c.stroke();}continue;}
 if(['doberman','rottweiler','threehead'].includes(e.kind)){/* rendered by edition layer */}
 else if(['motorbike','4x4','headlights'].includes(e.kind)){const progress=(e.age%e.pulse)/e.pulse,px=(e.alternate&&Math.floor(e.age/e.pulse)%2?1-progress:progress)*440-25;this.vehicle(e.kind==='headlights'?'car':e.kind,px,190,f.face,e.age);if(e.kind==='headlights'){c.save();c.globalAlpha=.2;this.poly([[px,175],[px+140,140],[px+140,190]],'#fff2b9');c.restore();}}
 else if(e.kind==='tray'){this.ellipse(x,149,17,4,'#c0c5ad');this.rect(x-11,146,22,2,'#e5ddbb');}
 else if(e.kind==='monkey'){this.ellipse(x,147+Math.sin(e.age*.2)*12,9,12,'#755345');this.ellipse(x+4,136+Math.sin(e.age*.2)*12,7,7,'#b18a65');this.line(x-5,150,x-15,162,3,'#755345');}
 else if(e.kind==='brother')this.sprite(f.def.id,5,x,190,-f.face,.9);
 else if(e.kind==='crowd'){for(let i=0;i<12;i++){const px=(i*37+e.age*3)%430-20;this.sprite(f.def.id,2+(Math.floor(e.age/6)+i)%2,px,190,f.face,.65+(i%3)*.1);}this.text('97 IN ARRIVO',192,62,'#efc784',1,'center');}
 }
 // Glare follows the affected player's view; local versus shares the arena.
 const blinded=b.fighters.find(f=>f.statuses?.blind&&(this.viewer==null||f.side===this.viewer));if(blinded){c.save();c.globalAlpha=.55;this.rect(0,48,384,154,'#d1d7c1');c.restore();this.text('ABBAGLIATO',192,60,'#26383c',1,'center');}
 // Character-specific projectile silhouettes.
 for(const p of b.projectiles){if(p.delay>0)continue;const x=p.x-b.camera;if(p.move.visual==='slipper'){this.ellipse(x,p.y,10,4,'#d8986f');this.rect(x-3,p.y-5,8,4,'#704943');}else if(p.move.visual==='sandwich'){this.ellipse(x,p.y,11,6,'#dab16c');this.rect(x-10,p.y,20,2,'#69966b');}else if(p.move.visual==='sound'){this.c.strokeStyle='#99d6dd';this.c.beginPath();this.c.arc(x,p.y,10,-1.2,1.2);this.c.stroke();}}
 if(b.cinematic){this.rect(0,81,384,45,'#13252e');this.rect(0,81,384,2,'#e8b777');this.text(b.banner.slice(0,56),192,98,'#f2d394',1,'center');this.text('SUPER',192,113,'#9bd0c8',1,'center');}
 }
}
root.SAFRenderer=Renderer;
})(typeof window==='undefined'?globalThis:window);

/* Visual redesign and neighborhood fauna. */
(function(root){'use strict';const Base=root.SAFRenderer;
class Renderer extends Base{
 animal(id,frame,x,y,face=1,scale=1){const rows={riot:['animals-dogs',0],berta:['animals-dogs',1],sauron:['animals-dogs',2],tyson:['animals-dogs',3],ibis:['animals-wild',0],tom:['animals-wild',1],gerry:['animals-wild',2],threehead:['animals-wild',3]},entry=rows[id];if(!entry||!this.images[entry[0]])return;const c=this.c;c.save();c.translate(Math.round(x),Math.round(y));c.scale(face*scale,scale);c.drawImage(this.images[entry[0]],frame%4*96,entry[1]*96,96,96,-48,-90,96,96);c.restore();}
 frameFor(f,tick){const frame=super.frameFor(f,tick);if(f.attack&&f.def.id==='mario'&&f.attack.visual==='ball')return f.attack.age>f.attack.startup&&f.attack.age<=f.attack.startup+f.attack.active?9:8;if(f.attack&&f.def.id==='zanfo'&&f.attack.visual==='stone')return f.attack.age>f.attack.startup&&f.attack.age<=f.attack.startup+f.attack.active?5:4;return frame===0&&(f.traits?.pet||f.traits?.blackBicycle)?1:frame;}
 projectile(p,camera){if(p.move.visual==='poiana'&&window.ChurchPoiana){ChurchPoiana.draw(this.c,p.x-camera,p.y+4,Math.sign(p.vx)||1,120,performance.now()/1000,'super',12);return;}if(p.move.visual!=='stone')return super.projectile(p,camera);const x=p.x-camera,y=p.y,c=this.c;c.save();c.translate(x,y);c.rotate((p.age||0)*.16*Math.sign(p.vx));this.poly([[-8,-3],[-4,-7],[4,-6],[8,0],[5,6],[-4,7]],'#353c40');this.poly([[-6,-2],[-3,-5],[4,-4],[6,0],[3,4],[-3,5]],'#a5a7a0');this.line(-4,-2,1,-4,2,'#d5d1c5');this.line(2,2,5,1,2,'#707873');c.restore();}

 stage(camera,tick){if(this.urban&&this.images['stage-urban']){const crop=Math.round(SAF.clamp(camera/816,0,1)*216);this.c.drawImage(this.images['stage-urban'],crop*3,0,1152,672,0,0,384,224);}else super.stage(camera,tick);
 const fauna=['riot','berta','sauron','tyson','tom','gerry'];fauna.forEach((id,i)=>{if(id==='sauron'&&this.currentBattle?.fighters.some(f=>f.traits?.pet==='sauron'))return;const t=tick*.22+i*49,phase=Math.floor(t/330)%2,dx=phase?350-(t%330):20+t%330,x=dx+(camera-408)*-.05,y=166+(i%2)*9;this.animal(id,1+Math.floor(tick/12+i)%2,x,y,phase?-1:1,.58);if(Math.abs((tick+i*70)%420)<120)this.text(id.toUpperCase(),x,y+3,'#ffe477',.65,'center');});
 for(let i=0;i<10;i++){const x=((i*43+tick*.35)%450)-30,y=70+(i%3)*12+Math.sin(tick*.04+i)*3;this.animal('ibis',3,x,y,1,.4);}
 }
 fighter(f,tick,camera,victory){super.fighter(f,tick,camera,victory);const x=f.x-camera;
 if(f.traits?.pet&&!victory){const active=this.currentBattle?.entities.some(e=>e.owner===f.side&&['rottweiler','threehead','doberman'].includes(e.kind));if(!active){const px=x-f.face*37;this.animal(f.traits.pet,f.walking?1+Math.floor(tick/8)%2:0,px,193,f.face,f.traits.pet==='sauron'?1.12:1);this.line(x-f.face*9,f.y-31,px+f.face*10,172,1,'#aaa18d');}}
 if(f.traits?.blackBicycle&&!victory&&!f.walking&&!f.attack){this.vehicle('bicycle',x-f.face*45,191,f.face,tick);}
 if(f.attack?.visual==='music'&&f.attack.age>f.attack.startup){for(let i=0;i<3;i++)this.note(x+f.face*(24+i*15),f.y-45-i*7,'#ffe16d');}
 }
 vehicle(kind,x,y,face,tick){if(kind!=='bicycle')return super.vehicle(kind,x,y,face,tick);const ink='#15191c';this.ellipse(x-20,y-7,11,11,ink);this.ellipse(x+21,y-7,11,11,ink);this.ellipse(x-20,y-7,8,8,'#697773');this.ellipse(x+21,y-7,8,8,'#697773');this.line(x-20,y-7,x-3,y-24,2,ink);this.line(x-3,y-24,x+8,y-7,2,ink);this.line(x+8,y-7,x-20,y-7,2,ink);this.line(x-3,y-24,x+14,y-25,2,ink);this.line(x+14,y-25,x+21,y-7,2,ink);this.line(x+14,y-25,x+13,y-32,2,ink);this.line(x+13,y-32,x+22,y-32,2,ink);this.line(x-8,y-25,x+1,y-25,3,ink);}
 note(x,y,color){this.ellipse(x,y,3,2,color);this.line(x+2,y,x+2,y-12,2,color);this.line(x+2,y-12,x+8,y-9,2,color);}
 draw(b,options={}){this.currentBattle=b;this.urban=b.fighters.some(f=>f.def.id==='ampebi'||f.def.id==='izza');super.draw(b,options);if(options.menu||options.paused||b.result||b.phase==='intro')return;
 for(const e of b.entities||[]){if(['rottweiler','doberman','threehead'].includes(e.kind)){const pet=e.kind==='rottweiler'?'sauron':'threehead',f=b.fighters[e.owner],x=e.clash?192:e.x-b.camera;this.animal(pet,1+Math.floor(e.age/7)%2,x,194,f.face,pet==='sauron'?1.25:1.15);this.text(pet==='sauron'?'SAURON':'',x,200,'#ffe36a',.75,'center');}if(e.visual==='music'){for(let i=0;i<7;i++)this.note((e.age*2+i*51)%384,105+i%3*25,'#ffe26b');}}
 for(const p of b.projectiles){if(p.delay>0)continue;const x=p.x-b.camera;if(p.move.visual==='wrench'){this.line(x-8,p.y+5,x+8,p.y-5,3,'#bfcbd0');this.line(x+5,p.y-8,x+11,p.y-3,2,'#edf2dd');}if(p.move.visual==='music')this.note(x,p.y,'#ffe36a');}
 }
}
root.SAFRenderer=Renderer;
})(typeof window==='undefined'?globalThis:window);
