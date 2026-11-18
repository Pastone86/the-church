/* The Church 2.7 — Sant'Andrea in prima persona.
 * Costruisce il quartiere in 3D dai dati veri di OpenStreetMap (fps-map.js):
 * vie, palazzi, parchi, ferrovia. 1 unità = 1 metro. X = est, Z = sud.
 * Dati mappa © OpenStreetMap contributors (ODbL). */
(function(){'use strict';
const T=THREE,W=450,D=570,TAU=Math.PI*2;
const HX=x=>x/2,HZ=y=>(1140-y)/2,H=(x,y)=>[HX(x),HZ(y)];
function rng(s){let a=s>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function parse(txt){const o={b:[],r:[],g:[],l:[],t:[]};
 const pts=s=>{const n=s.split(',').map(Number),p=[];for(let i=0;i<n.length;i+=2)p.push([HX(n[i]),HZ(n[i+1])]);return p;};
 for(const line of txt.split('\n')){const f=line.split('|'),k=f[0];
  if(k==='B'){const p=pts(f[4]);if(p.length>3&&p[0][0]===p[p.length-1][0]&&p[0][1]===p[p.length-1][1])p.pop();o.b.push({k:f[1],lv:+f[2]||0,name:f[3],p});}
  else if(k==='R')o.r.push({k:f[1],name:f[2].replace(/^V\./,'Via ').replace(/^S\./,'Strada ').replace(/^C\./,'Corso '),p:pts(f[3])});
  else if(k==='G'){const p=pts(f[3]);p.pop();o.g.push({k:f[1],name:f[2],p});}
  else if(k==='L')o.l.push({k:f[1],p:pts(f[2])});
  else if(k==='T')for(const s of f[1].split(';'))o.t.push(pts(s)[0]);}
 return o;}
const area=p=>{let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return a/2;};
const centroid=p=>{let x=0,z=0;for(const q of p){x+=q[0];z+=q[1];}return[x/p.length,z/p.length];};
function inPoly(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}

/* ---------------------------------------------------------------- texture disegnate */
function cv(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c;}
function tex(c,o={}){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?T.ClampToEdgeWrapping:T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=o.aniso||8;return t;}
function alphaTex(c,fill){const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,o=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,j=((h-1-y)*w+x)*4;if(d[i+3]<10){o[j]=fill[0];o[j+1]=fill[1];o[j+2]=fill[2];o[j+3]=0;}else{o[j]=d[i];o[j+1]=d[i+1];o[j+2]=d[i+2];o[j+3]=255;}}
 const t=new T.DataTexture(o,w,h,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;}
function grain(c,w,h,amt,seed){const d=c.getImageData(0,0,w,h),a=d.data,r=rng(seed);for(let i=0;i<a.length;i+=4){const n=(r()-.5)*amt;a[i]+=n;a[i+1]+=n;a[i+2]+=n;}c.putImageData(d,0,0);}
function blotch(c,w,h,n,rgb,rmin,rmax,alpha,r){for(let i=0;i<n;i++){const x=r()*w,y=r()*h,rad=rmin+r()*(rmax-rmin);for(const ox of[-w,0,w])for(const oy of[-h,0,h]){if(x+ox+rad<0||x+ox-rad>w||y+oy+rad<0||y+oy-rad>h)continue;const g=c.createRadialGradient(x+ox,y+oy,0,x+ox,y+oy,rad);g.addColorStop(0,`rgba(${rgb},${alpha})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x+ox-rad,y+oy-rad,rad*2,rad*2);}}}
function shade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`;}
function bricks(c,w,h,bw,bh,cols,joint,r){c.fillStyle=joint;c.fillRect(0,0,w,h);for(let y=0,row=0;y<h;y+=bh,row++)for(let x=-(row%2)*bw/2;x<w;x+=bw){c.fillStyle=shade(cols[Math.floor(r()*cols.length)],.86+r()*.28);c.fillRect(x+1,y+1,bw-2,bh-2);}}
const TX={};
function makeTextures(){const R=rng(77);
 TX.asphalt=tex(cv(512,512,(c,w,h)=>{c.fillStyle='#4b4c4e';c.fillRect(0,0,w,h);blotch(c,w,h,40,'20,20,22',30,120,.22,R);blotch(c,w,h,30,'120,120,118',20,90,.12,R);
  c.fillStyle='rgba(30,30,32,.22)';c.fillRect(60,300,150,90);c.fillRect(330,70,110,140);c.strokeStyle='rgba(18,18,20,.7)';c.lineWidth=1.5;for(let i=0;i<9;i++){c.beginPath();let x=R()*w,y=R()*h;c.moveTo(x,y);for(let k=0;k<7;k++){x+=(R()-.5)*70;y+=(R()-.5)*70;c.lineTo(x,y);}c.stroke();}grain(c,w,h,46,3);}));
 TX.pavers=tex(cv(512,512,(c,w,h)=>{bricks(c,w,h,64,32,['#8f5a4a','#9a6352','#7f5346','#a06a58','#86594f','#8a7068'],'#4a3a34',R);blotch(c,w,h,30,'40,34,30',20,90,.25,R);blotch(c,w,h,16,'180,170,150',15,60,.12,R);grain(c,w,h,30,5);}));
 TX.grass=tex(cv(512,512,(c,w,h)=>{c.fillStyle='#5d7a35';c.fillRect(0,0,w,h);blotch(c,w,h,50,'60,84,30',30,110,.35,R);blotch(c,w,h,36,'150,150,70',20,80,.22,R);blotch(c,w,h,14,'110,88,55',20,60,.3,R);
  for(let i=0;i<9000;i++){const x=R()*w,y=R()*h,l=3+R()*6;c.strokeStyle=`rgba(${40+R()*90|0},${90+R()*90|0},${20+R()*50|0},.55)`;c.beginPath();c.moveTo(x,y);c.lineTo(x+(R()-.5)*3,y-l);c.stroke();}grain(c,w,h,26,7);}));
 TX.dirt=tex(cv(512,512,(c,w,h)=>{c.fillStyle='#857a66';c.fillRect(0,0,w,h);blotch(c,w,h,50,'96,112,60',30,120,.3,R);blotch(c,w,h,40,'60,54,44',20,100,.25,R);blotch(c,w,h,30,'170,160,140',15,70,.2,R);
  for(let i=0;i<2600;i++){c.fillStyle=`rgba(${90+R()*110|0},${85+R()*100|0},${75+R()*90|0},.6)`;c.fillRect(R()*w,R()*h,1+R()*3,1+R()*2);}grain(c,w,h,34,9);}));
 TX.gravel=tex(cv(256,256,(c,w,h)=>{c.fillStyle='#cfc4ab';c.fillRect(0,0,w,h);for(let i=0;i<2600;i++){c.fillStyle=`rgba(${150+R()*90|0},${140+R()*90|0},${120+R()*80|0},.7)`;c.fillRect(R()*w,R()*h,1+R()*3,1+R()*3);}blotch(c,w,h,14,'120,110,90',20,70,.2,R);grain(c,w,h,30,11);}));
 TX.kerb=tex(cv(128,128,(c,w,h)=>{c.fillStyle='#a9a69d';c.fillRect(0,0,w,h);c.fillStyle='#6d6a64';c.fillRect(0,0,2,h);blotch(c,w,h,8,'60,60,56',10,40,.3,R);grain(c,w,h,40,13);}));
 TX.concrete=tex(cv(512,256,(c,w,h)=>{c.fillStyle='#9a988f';c.fillRect(0,0,w,h);blotch(c,w,h,30,'60,60,56',30,110,.25,R);blotch(c,w,h,22,'190,188,178',20,90,.2,R);
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(70,96,50,.75)');g.addColorStop(.22,'rgba(70,96,50,.2)');g.addColorStop(.5,'rgba(70,96,50,0)');g.addColorStop(.85,'rgba(40,40,36,0)');g.addColorStop(1,'rgba(40,40,36,.55)');c.fillStyle=g;c.fillRect(0,0,w,h);
  c.strokeStyle='rgba(50,50,46,.35)';for(let x=0;x<w;x+=128){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let i=0;i<14;i++){const x=R()*w;const s=c.createLinearGradient(0,0,0,h);s.addColorStop(0,'rgba(30,30,28,.4)');s.addColorStop(1,'rgba(30,30,28,0)');c.fillStyle=s;c.fillRect(x,0,3+R()*8,h*(.3+R()*.6));}grain(c,w,h,34,15);}));
 TX.gabion=tex(cv(256,256,(c,w,h)=>{c.fillStyle='#3d3c38';c.fillRect(0,0,w,h);for(let i=0;i<420;i++){const x=R()*w,y=R()*h,rx=7+R()*10,ry=5+R()*8,v=110+R()*90|0;c.fillStyle=`rgb(${v},${v-4},${v-14})`;c.beginPath();c.ellipse(x,y,rx,ry,R()*3,0,TAU);c.fill();}c.strokeStyle='rgba(20,20,20,.5)';for(let k=0;k<=w;k+=32){c.beginPath();c.moveTo(k,0);c.lineTo(k,h);c.moveTo(0,k);c.lineTo(w,k);c.stroke();}grain(c,w,h,26,17);}));
 TX.brick=tex(cv(512,256,(c,w,h)=>{bricks(c,w,h,64,21.33,['#a4543f','#9a4a38','#b05c45','#8e4635','#a9604c'],'#c9c0ad',R);blotch(c,w,h,20,'40,30,26',20,80,.22,R);grain(c,w,h,28,19);}));
 TX.roof=tex(cv(256,256,(c,w,h)=>{c.fillStyle='#8a4b35';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=(y/16%2)*8-8;x<w;x+=16){c.fillStyle=shade('#a55c40',.8+R()*.35);c.beginPath();c.ellipse(x+8,y+8,7.5,9,0,0,TAU);c.fill();}blotch(c,w,h,16,'40,36,30',20,70,.3,R);grain(c,w,h,24,21);}));
 TX.court=tex(cv(256,256,(c,w,h)=>{c.fillStyle='#a8414a';c.fillRect(0,0,w,h);blotch(c,w,h,26,'90,30,36',20,80,.25,R);blotch(c,w,h,14,'220,150,150',10,50,.12,R);grain(c,w,h,26,23);}));
 TX.pitch=tex(cv(256,256,(c,w,h)=>{c.fillStyle='#3d6b4f';c.fillRect(0,0,w,h);blotch(c,w,h,26,'24,48,34',20,80,.25,R);grain(c,w,h,26,25);}));
 // campo colorato del parco di via Beltrami: disegno geometrico originale, stessa tavolozza vivace
 TX.color=tex(cv(1024,1024,(c,w,h)=>{c.fillStyle='#f2c230';c.fillRect(0,0,w,h);const P=['#1f6fd0','#e8402e','#15181c','#f2c230','#2aa56b','#f08a24'];
  const poly=(col,...p)=>{c.fillStyle=col;c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fill();};
  poly(P[2],0,0,520,0,300,360,0,460);poly(P[0],0,460,300,360,760,1024,0,1024);poly(P[1],520,0,1024,0,1024,300,700,420);poly(P[2],700,420,1024,300,1024,720);poly(P[0],760,1024,1024,720,1024,1024);
  c.fillStyle=P[1];c.beginPath();c.ellipse(560,520,250,150,-.35,0,TAU);c.fill();const g=c.createLinearGradient(120,600,520,820);g.addColorStop(0,P[4]);g.addColorStop(.5,P[3]);g.addColorStop(1,P[5]);c.fillStyle=g;c.beginPath();c.ellipse(330,720,230,110,.2,0,TAU);c.fill();
  c.strokeStyle='#f5f2e8';c.lineWidth=10;c.strokeRect(40,40,w-80,h-80);c.beginPath();c.arc(w/2,h/2,120,0,TAU);c.stroke();blotch(c,w,h,40,'30,30,30',20,90,.1,R);grain(c,w,h,18,27);}),{clamp:true});
 TX.water=tex(cv(128,128,(c,w,h)=>{c.fillStyle='#51685a';c.fillRect(0,0,w,h);blotch(c,w,h,20,'150,170,150',8,40,.25,R);blotch(c,w,h,20,'30,44,40',8,40,.3,R);}));
 TX.metal=tex(cv(64,64,(c,w,h)=>{c.fillStyle='#ffffff';c.fillRect(0,0,w,h);grain(c,w,h,30,29);}));
 TX.net=alphaTex(cv(256,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.strokeStyle='#f26a1b';c.lineWidth=5;for(let x=0;x<=w;x+=16){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}c.lineWidth=7;for(let y=4;y<=h;y+=20){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}}),[242,106,27]);
 TX.tree=alphaTex(treeCanvas(false,31),[70,104,42]);TX.poplar=alphaTex(treeCanvas(true,33),[70,104,42]);
 TX.bar=tex(barCanvas(),{clamp:true});TX.church=tex(churchCanvas(),{clamp:true});
 TX.sky=tex(cv(1024,512,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1f5aa6');g.addColorStop(.3,'#4f8fd0');g.addColorStop(.46,'#9cc3e6');g.addColorStop(.5,'#d3e2ea');g.addColorStop(.52,'#d9e1e0');g.addColorStop(1,'#b9bdb4');c.fillStyle=g;c.fillRect(0,0,w,h);
  for(let i=0;i<16;i++){const x=R()*w,y=50+R()*150,s=26+R()*56;for(let k=0;k<8;k++){const px=x+(R()-.5)*s*2.4,py=y+(R()-.5)*s*.5,rad=s*(.4+R()*.6);const q=c.createRadialGradient(px,py,0,px,py,rad);q.addColorStop(0,'rgba(255,255,255,.42)');q.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=q;c.fillRect(px-rad,py-rad,rad*2,rad*2);}}}),{clamp:true});
 TX.dome=tex(domeCanvas(),{clamp:true});
}
function treeCanvas(poplar,seed){return cv(256,512,(c,w,h)=>{const r=rng(seed);c.clearRect(0,0,w,h);const tw=poplar?8:16;const g=c.createLinearGradient(w/2-tw,0,w/2+tw,0);g.addColorStop(0,'#5a4636');g.addColorStop(.5,'#8a705a');g.addColorStop(1,'#4a392c');c.fillStyle=g;c.beginPath();c.moveTo(w/2-tw,h);c.lineTo(w/2-tw*.45,h*.3);c.lineTo(w/2+tw*.45,h*.3);c.lineTo(w/2+tw,h);c.fill();
  if(!poplar){c.strokeStyle='#6a5442';c.lineWidth=7;for(const[a,b]of[[-70,150],[75,170],[-40,110],[45,120]]){c.beginPath();c.moveTo(w/2,h*.5);c.lineTo(w/2+a,b);c.stroke();}}
  const cx=w/2,cy=poplar?h*.36:h*.3,rx=poplar?52:118,ry=poplar?170:140;for(let i=0;i<(poplar?520:900);i++){const a=r()*TAU,d=Math.sqrt(r()),x=cx+Math.cos(a)*rx*d,y=cy+Math.sin(a)*ry*d,s=5+r()*11;const lit=.5+.5*((cx-x)/rx*.5+(cy-y)/ry*.9);const gr=70+lit*90+r()*30,rd=40+lit*70+r()*25;c.fillStyle=`rgba(${rd|0},${gr|0},${24+r()*30|0},.92)`;c.beginPath();c.ellipse(x,y,s,s*.8,r()*3,0,TAU);c.fill();}});}
function barCanvas(){return cv(1024,256,(c,w,h)=>{const r=rng(41);c.fillStyle='#cfc9bb';c.fillRect(0,0,w,h);for(let i=0;i<4;i++){const x=i*256;c.save();c.translate(x,0);c.beginPath();c.rect(0,0,60,h);c.clip();bricks(c,60,h,30,10,['#b5553e','#a84b36','#c06248'],'#d8cdb8',r);c.restore();
   c.fillStyle='#15171a';c.fillRect(x+70,10,176,40);c.fillStyle='#f3efe2';c.font='900 26px Impact,Arial Black,sans-serif';c.textAlign='center';c.fillText(i===1||i===3?'BAR VELA':i===0?'PANINERIA':'CAFFÈ',x+158,40);
   const g=c.createLinearGradient(x+70,60,x+246,h);g.addColorStop(0,'#27333a');g.addColorStop(.5,'#52636a');g.addColorStop(1,'#1c2428');c.fillStyle=g;c.fillRect(x+74,60,168,h-78);c.strokeStyle='#e9e6dc';c.lineWidth=5;c.strokeRect(x+74,60,168,h-78);if(i===1){c.fillStyle='#0c0e10';c.fillRect(x+120,64,76,h-82);}else{c.fillStyle='rgba(160,200,210,.35)';c.fillRect(x+80,170,156,h-190);}
   c.fillStyle='#8f8b82';c.fillRect(x,h-18,256,18);}c.fillStyle='#d8b21e';c.fillRect(0,h-6,w,6);grain(c,w,h,18,43);});}
function churchCanvas(){return cv(512,512,(c,w,h)=>{const r=rng(45);c.fillStyle='#a3a39b';c.fillRect(0,0,w,h);blotch(c,w,h,30,'70,72,66',40,140,.3,r);blotch(c,w,h,20,'200,200,192',30,120,.22,r);const g=c.createLinearGradient(0,h*.6,0,h);g.addColorStop(0,'rgba(210,210,205,0)');g.addColorStop(.4,'rgba(210,210,205,.5)');g.addColorStop(1,'rgba(120,120,112,.2)');c.fillStyle=g;c.fillRect(0,h*.6,w,h*.4);
  c.fillStyle='#6f6f68';const cx=330,cy=150;c.fillRect(cx-12,cy-90,24,230);c.fillRect(cx-60,cy-40,120,24);c.fillStyle='#8f8f88';for(let y=cy-86;y<cy+136;y+=14)c.fillRect(cx-8,y,16,8);for(let x=cx-56;x<cx+56;x+=14)c.fillRect(x,cy-36,8,16);
  c.fillStyle='#3d3f3c';c.fillRect(300,330,90,182);c.strokeStyle='#8c8f8a';c.lineWidth=2;for(let x=306;x<390;x+=12){c.beginPath();c.moveTo(x,330);c.lineTo(x,512);c.stroke();}for(let y=336;y<512;y+=12){c.beginPath();c.moveTo(300,y);c.lineTo(390,y);c.stroke();}grain(c,w,h,26,47);});}
function domeCanvas(){return cv(256,512,(c,w,h)=>{c.clearRect(0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#8f9aa6');g.addColorStop(1,'#b3bbc2');c.fillStyle=g;const x=w/2;
  c.fillRect(x-4,0,8,80);c.beginPath();c.moveTo(x-10,70);c.lineTo(x+10,70);c.lineTo(x+16,150);c.lineTo(x-16,150);c.fill();c.fillRect(x-22,150,44,46);c.beginPath();c.moveTo(x-30,196);c.quadraticCurveTo(x-34,250,x-46,300);c.lineTo(x+46,300);c.quadraticCurveTo(x+34,250,x+30,196);c.fill();c.fillRect(x-52,300,104,70);c.fillRect(x-62,370,124,40);c.fillRect(x-74,410,148,102);
  c.fillStyle='rgba(60,70,80,.35)';for(let k=-44;k<=44;k+=11)c.fillRect(x+k-2,306,4,58);for(let k=-54;k<=54;k+=12)c.fillRect(x+k-2,376,4,30);});}

/* facciate: una "campata" di 4 m x un piano di 3,1 m */
const STYLES={
 ocra:{wall:'#b9a646',band:'#9a8c3c',shut:'#2f3d33',frame:'#e6e2d2',base:'#8f8a78',mode:'pers'},
 beige:{wall:'#d6c096',band:'#b9a47c',shut:'#5a4335',frame:'#e9e4d6',base:'#a59a86',mode:'pers',peel:true},
 crema:{wall:'#e2d9b8',band:'#c9bf9c',shut:'#4d5a78',frame:'#efece2',base:'#b0a78f',mode:'pers',peel:true},
 salmone:{wall:'#c58e78',band:'#8a6248',shut:'#7f8f86',frame:'#d9d5c8',base:'#8d8a80',mode:'tapp',stone:true,balc:true},
 mattone:{wall:'#a8523d',band:'#d9d2bf',shut:'#c9c6ba',frame:'#e6e2d6',base:'#8f8a80',mode:'tapp',brick:true},
 grigio:{wall:'#c9cac4',band:'#a9aaa4',shut:'#8a9690',frame:'#efefe9',base:'#8c8c86',mode:'tapp',balc:true},
 scuola:{wall:'#d9c27a',band:'#b89f5a',shut:'#6a7f8c',frame:'#f1eee2',base:'#9a927c',mode:'band'},
 box:{wall:'#9c9a92',band:'#7f7d76',shut:'#5c6468',frame:'#777',base:'#77756e',mode:'box'},
 capannone:{wall:'#a9aeb0',band:'#7d8386',shut:'#566066',frame:'#888',base:'#80827f',mode:'shed'}};
function facade(st,ground,seed){return cv(512,512,(c,w,h)=>{const r=rng(seed);
  if(st.brick){bricks(c,w,h,32,11,['#a4543f','#9a4a38','#b05c45','#8e4635'],'#cfc6b3',r);}else{c.fillStyle=st.wall;c.fillRect(0,0,w,h);}
  blotch(c,w,h,26,'0,0,0',40,150,.07,r);blotch(c,w,h,18,'255,255,255',30,120,.08,r);
  if(st.peel)for(let i=0;i<(ground?5:2);i++){const x=r()*w,y=ground?h*(.55+r()*.4):r()*h;c.fillStyle=r()<.5?'#9c958a':shade(st.wall,.82);c.beginPath();for(let a=0;a<TAU;a+=.5){const d=14+r()*34;c.lineTo(x+Math.cos(a)*d*1.6,y+Math.sin(a)*d);}c.fill();}
  const win=(x,y,ww,wh,kind)=>{c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x-3,y-3,ww+10,wh+10);c.fillStyle=st.frame;c.fillRect(x-4,y-4,ww+8,wh+8);
   const g=c.createLinearGradient(x,y,x+ww,y+wh);g.addColorStop(0,'#2b3a45');g.addColorStop(.45,'#6f8794');g.addColorStop(.55,'#3a4a55');g.addColorStop(1,'#1d262c');c.fillStyle=g;c.fillRect(x,y,ww,wh);
   if(r()<.5){c.fillStyle='rgba(235,230,215,.55)';c.fillRect(x,y,ww*.32,wh);c.fillRect(x+ww*.7,y,ww*.3,wh);}
   c.fillStyle=st.frame;c.fillRect(x+ww/2-2,y,4,wh);
   if(kind==='pers'){const open=r()<.72;c.fillStyle=st.shut;if(open){for(const sx of[x-ww/2-6,x+ww+6]){c.fillStyle=shade(st.shut,.9+r()*.2);c.fillRect(sx,y-4,ww/2,wh+8);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;for(let yy=y;yy<y+wh;yy+=6){c.beginPath();c.moveTo(sx+3,yy);c.lineTo(sx+ww/2-3,yy);c.stroke();}}}else{c.fillRect(x,y,ww,wh);c.strokeStyle='rgba(0,0,0,.4)';for(let yy=y;yy<y+wh;yy+=6){c.beginPath();c.moveTo(x,yy);c.lineTo(x+ww,yy);c.stroke();}c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x+ww/2-1,y,2,wh);}}
   else{const k=r()<.25?1:r()<.5?.55:.2;c.fillStyle=st.shut;c.fillRect(x,y,ww,wh*k);c.strokeStyle='rgba(0,0,0,.28)';for(let yy=y;yy<y+wh*k;yy+=5){c.beginPath();c.moveTo(x,yy);c.lineTo(x+ww,yy);c.stroke();}}
   c.fillStyle=shade(st.frame,.92);c.fillRect(x-10,y+wh+4,ww+20,7);const s=c.createLinearGradient(0,y+wh+11,0,y+wh+90);s.addColorStop(0,'rgba(40,36,30,.3)');s.addColorStop(1,'rgba(40,36,30,0)');c.fillStyle=s;c.fillRect(x-4,y+wh+11,ww+8,80);};
  if(st.mode==='pers'||st.mode==='tapp'){for(let i=0;i<2;i++){const x0=i*256;if(ground&&i===1&&seed%3===0){c.fillStyle=st.frame;c.fillRect(x0+84,150,96,362);c.fillStyle='#3a2f28';c.fillRect(x0+90,156,84,356);c.fillStyle='rgba(120,140,150,.5)';c.fillRect(x0+98,170,68,120);c.fillStyle='#b9b4a6';c.fillRect(x0+70,130,124,14);}
    else if(st.balc&&!ground&&i===0){win(x0+76,120,104,300,st.mode);c.fillStyle=shade(st.band,.9);c.fillRect(x0+30,420,196,16);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x0+30,436,196,10);c.strokeStyle='#3d4244';c.lineWidth=3;c.strokeRect(x0+34,340,188,80);for(let xx=x0+44;xx<x0+222;xx+=12){c.beginPath();c.moveTo(xx,340);c.lineTo(xx,420);c.stroke();}}
    else win(x0+82,150,92,190,st.mode);}}
  else if(st.mode==='band'){c.fillStyle=st.frame;c.fillRect(20,140,472,200);const g=c.createLinearGradient(0,140,512,340);g.addColorStop(0,'#33444f');g.addColorStop(.5,'#7f97a3');g.addColorStop(1,'#26323a');c.fillStyle=g;c.fillRect(28,148,456,184);c.fillStyle=st.frame;for(let x=28+114;x<484;x+=114)c.fillRect(x-3,148,6,184);}
  else if(st.mode==='box'){if(ground){c.fillStyle='#6a7276';c.fillRect(60,140,392,372);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;for(let y=150;y<512;y+=16){c.beginPath();c.moveTo(60,y);c.lineTo(452,y);c.stroke();}}}
  else if(st.mode==='shed'){c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=2;for(let x=0;x<w;x+=18){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}if(!ground){c.fillStyle='#3d4a52';c.fillRect(40,120,432,110);}}
  c.fillStyle=st.band;c.fillRect(0,0,w,14);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,14,w,5);
  if(ground){if(st.stone){c.fillStyle='#8f8b80';c.fillRect(0,330,w,182);for(let i=0;i<60;i++){const x=r()*w,y=330+r()*182;c.fillStyle=shade('#a8a396',.75+r()*.45);c.beginPath();for(let a=0;a<TAU;a+=1.1){const d=18+r()*20;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d*.8);}c.fill();c.strokeStyle='rgba(50,48,44,.6)';c.lineWidth=2;c.stroke();}}
   else{c.fillStyle=st.base;c.fillRect(0,400,w,112);}const g=c.createLinearGradient(0,380,0,512);g.addColorStop(0,'rgba(30,28,24,0)');g.addColorStop(1,'rgba(30,28,24,.45)');c.fillStyle=g;c.fillRect(0,380,w,132);}
  grain(c,w,h,20,seed+5);});}

/* ---------------------------------------------------------------- geometria */
class Bucket{constructor(){this.p=[];this.n=[];this.u=[];this.c=[];}
 tri(a,b,c,ua,ub,uc,col,n){if(!n){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;n=[nx/l,ny/l,nz/l];}
  this.p.push(...a,...b,...c);this.n.push(...n,...n,...n);this.u.push(...ua,...ub,...uc);const k=col||[1,1,1];this.c.push(...k,...k,...k);}
 quad(a,b,c,d,u,col,n){u=u||[[0,0],[1,0],[1,1],[0,1]];this.tri(a,b,c,u[0],u[1],u[2],col,n);this.tri(a,c,d,u[0],u[2],u[3],col,n);}
 up(a,b,c,d,y,tile,col){ // quadrilatero orizzontale rivolto in alto, uv dal mondo
  const P=[a,b,c,d];if(area(P)>0)P.reverse();const v=P.map(q=>[q[0],y,q[1]]),u=P.map(q=>[q[0]/tile,-q[1]/tile]);this.quad(v[0],v[1],v[2],v[3],u,col,[0,1,0]);}
 box(cx,cy,cz,sx,sy,sz,rot,col,tile){const c=Math.cos(rot||0),s=Math.sin(rot||0),hx=sx/2,hy=sy/2,hz=sz/2;const V=(x,y,z)=>[cx+x*c+z*s,cy+y,cz-x*s+z*c];const t=tile||1;
  const f=(a,b,c2,d,w,h)=>this.quad(a,b,c2,d,[[0,0],[w/t,0],[w/t,h/t],[0,h/t]],col);
  f(V(-hx,-hy,hz),V(hx,-hy,hz),V(hx,hy,hz),V(-hx,hy,hz),sx,sy);f(V(hx,-hy,-hz),V(-hx,-hy,-hz),V(-hx,hy,-hz),V(hx,hy,-hz),sx,sy);
  f(V(hx,-hy,hz),V(hx,-hy,-hz),V(hx,hy,-hz),V(hx,hy,hz),sz,sy);f(V(-hx,-hy,-hz),V(-hx,-hy,hz),V(-hx,hy,hz),V(-hx,hy,-hz),sz,sy);
  f(V(-hx,hy,hz),V(hx,hy,hz),V(hx,hy,-hz),V(-hx,hy,-hz),sx,sz);}
 geo(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.u,2));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();return g;}}
function ribbon(bk,pts,hw,y,tile,col){for(let i=0;i<pts.length;i++){const p=pts[i];if(i<pts.length-1){const q=pts[i+1],dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz)||1,nx=-dz/l*hw,nz=dx/l*hw;bk.up([p[0]+nx,p[1]+nz],[p[0]-nx,p[1]-nz],[q[0]-nx,q[1]-nz],[q[0]+nx,q[1]+nz],y,tile,col);}
  const N=10;for(let k=0;k<N;k++){const a=k/N*TAU,b=(k+1)/N*TAU;const A=[p[0],y,p[1]],B=[p[0]+Math.cos(b)*hw,y,p[1]+Math.sin(b)*hw],C=[p[0]+Math.cos(a)*hw,y,p[1]+Math.sin(a)*hw];bk.tri(A,B,C,[A[0]/tile,-A[2]/tile],[B[0]/tile,-B[2]/tile],[C[0]/tile,-C[2]/tile],col,[0,1,0]);}}}
function fill(bk,poly,y,tile,col,uvRect){const c=poly.map(p=>new T.Vector2(p[0],p[1]));const tr=T.ShapeUtils.triangulateShape(c,[]);let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;if(uvRect)for(const p of poly){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);}
 const uv=p=>uvRect?[(p[0]-x0)/(x1-x0),1-(p[1]-z0)/(z1-z0)]:[p[0]/tile,-p[1]/tile];
 for(const t of tr){let a=poly[t[0]],b=poly[t[1]],d=poly[t[2]];if(area([a,b,d])>0){const s=b;b=d;d=s;}bk.tri([a[0],y,a[1]],[b[0],y,b[1]],[d[0],y,d[1]],uv(a),uv(b),uv(d),col,[0,1,0]);}}
function wall(bk,p,q,y0,y1,u0,u1,v0,v1,poly,col){ // parete verticale rivolta fuori dal poligono
 const dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz)||1;if(poly){const mx=(p[0]+q[0])/2-dz/l*.05,mz=(p[1]+q[1])/2+dx/l*.05;if(inPoly(mx,mz,poly)){const s=p;p=q;q=s;}}
 bk.quad([p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],[[u0,v0],[u1,v0],[u1,v1],[u0,v1]],col);}
function slab(bk,a,b,th,y0,y1,tileU,col){ // muro spesso tra due punti: due facce + testa
 const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1,nx=-dz/l*th/2,nz=dx/l*th/2,U=l/tileU;
 const A=[a[0]+nx,a[1]+nz],B=[b[0]+nx,b[1]+nz],C=[b[0]-nx,b[1]-nz],E=[a[0]-nx,a[1]-nz];
 bk.quad([A[0],y0,A[1]],[B[0],y0,B[1]],[B[0],y1,B[1]],[A[0],y1,A[1]],[[0,0],[U,0],[U,1],[0,1]],col);bk.quad([C[0],y0,C[1]],[E[0],y0,E[1]],[E[0],y1,E[1]],[C[0],y1,C[1]],[[0,0],[U,0],[U,1],[0,1]],col);
 bk.quad([A[0],y1,A[1]],[B[0],y1,B[1]],[C[0],y1,C[1]],[E[0],y1,E[1]],[[0,.9],[U,.9],[U,1],[0,1]],col);bk.quad([B[0],y0,B[1]],[C[0],y0,C[1]],[C[0],y1,C[1]],[B[0],y1,B[1]],[[0,0],[.05,0],[.05,1],[0,1]],col);bk.quad([E[0],y0,E[1]],[A[0],y0,A[1]],[A[0],y1,A[1]],[E[0],y1,E[1]],[[0,0],[.05,0],[.05,1],[0,1]],col);}
const hex=h=>{const n=parseInt(h.slice(1),16);return[((n>>16)/255)**2.2,((n>>8&255)/255)**2.2,((n&255)/255)**2.2];};

/* ---------------------------------------------------------------- il quartiere */
const PLACES={
 start:{x:118,z:428,name:'Via delle Rosette'},
 boroli:{x:77,z:505,name:'Giardino Boroli'},
 murales:{x:306,z:500,name:'Murales delle Ferrovie Nord'},
 gobetti:{x:212,z:377,name:'Parchetto di via Gobetti'},
 vela:{x:262,z:322,name:'Bar Vela'},
 tarantola:{x:221,z:238,name:'Parchetto di via Tarantola'},
 kiesetta:{x:300,z:150,name:'Chiesetta Regina Pacis'},
 beltrami:{x:215,z:137,name:'Parco di via Beltrami'},
 rosette:{x:104,z:268,name:'Via delle Rosette'}};
function build(scene,img,opt){opt=opt||{};const M=parse(window.CHURCH_OSM),R=rng(2027);makeTextures();
 const B={};const bk=n=>B[n]||(B[n]=new Bucket());
 const solid=cv(900,1140,c=>{c.fillStyle='#000';c.fillRect(0,0,900,1140);}),sc=solid.getContext('2d');sc.fillStyle='#fff';sc.strokeStyle='#fff';sc.lineCap='round';
 const mini=cv(900,1140,c=>{c.fillStyle='#2a2f2b';c.fillRect(0,0,900,1140);}),mc=mini.getContext('2d');mc.lineCap='round';mc.lineJoin='round';
 const path2=(c,p,close)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0]*2,q[1]*2):c.moveTo(q[0]*2,q[1]*2));if(close)c.closePath();};
 const solidLine=(a,b,th)=>{sc.lineWidth=th*2;sc.beginPath();sc.moveTo(a[0]*2,a[1]*2);sc.lineTo(b[0]*2,b[1]*2);sc.stroke();};
 const solidBox=(x,z,r)=>{sc.beginPath();sc.arc(x*2,z*2,r*2,0,TAU);sc.fill();};
 // ---- terreno
 bk('dirt').up([-200,-200],[W+200,-200],[W+200,D+200],[-200,D+200],0,7);
 const gcol={park:'#3f5a36',grass:'#3c5633',dog_park:'#4a5b36',brownfield:'#4a4a3c',pitch:'#3d6b4f','track/athletics':'#8a4b46',water:'#3f5d63',parking:'#55575a',recreation_ground:'#b98a2e'};
 for(const g of M.g){const k=g.k;path2(mc,g.p,true);mc.fillStyle=gcol[k]||'#3c5633';mc.fill();
  if(k==='water')fill(bk('water'),g.p,.02,6);else if(k==='parking')fill(bk('asphalt'),g.p,.03,6,[.85,.85,.85]);else if(k==='pitch')fill(bk('pitch'),g.p,.07,3);else if(k==='track/athletics')fill(bk('court'),g.p,.07,3);
  else if(k==='recreation_ground')fill(bk('color'),g.p,.08,1,null,true);else if(k==='brownfield')fill(bk('grass'),g.p,.03,6,[.8,.74,.55]);else fill(bk('grass'),g.p,.04,5);}
 // ---- strade: marciapiede in autobloccanti, cordolo, asfalto
 const HWv={r:3.3,t:4.6,s:5.6,v:2.2,p:3.5};
 for(const r of M.r){if(r.k==='p')continue;const hw=HWv[r.k];if(r.k!=='v'){ribbon(bk('pavers'),r.p,hw+2.5,.05,2);ribbon(bk('kerb'),r.p,hw+.22,.085,1);}ribbon(bk('asphalt'),r.p,hw,r.k==='v'?.06:.1,6,r.k==='v'?[.9,.88,.84]:null);
  path2(mc,r.p);mc.strokeStyle='#8d8f8c';mc.lineWidth=hw*4;mc.stroke();}
 for(const r of M.r)if(r.k==='p'){const p=r.p.slice(0,-1);if(p.length>2){fill(bk('pavers'),p,.11,2,[1.1,1.05,1]);path2(mc,p,true);mc.fillStyle='#a08a7c';mc.fill();}}
 for(const r of M.r)if(r.k==='t'||r.k==='s'){for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/l,dz=(b[1]-a[1])/l;for(let s=1;s+3<l;s+=7){const p=[a[0]+dx*s,a[1]+dz*s],q=[a[0]+dx*(s+3),a[1]+dz*(s+3)];const nx=-dz*.08,nz=dx*.08;bk('paint').up([p[0]+nx,p[1]+nz],[p[0]-nx,p[1]-nz],[q[0]-nx,q[1]-nz],[q[0]+nx,q[1]+nz],.115,1,[.8,.8,.76]);}}}
 // ---- ferrovia a ovest, sentiero delle Ferrovie Nord a est
 for(const l of M.l){if(l.k==='rail'){ribbon(bk('gravel'),l.p,2.1,.06,2,[.55,.52,.5]);for(const o of[-.72,.72]){const q=l.p.map((p,i)=>{const a=l.p[Math.max(0,i-1)],b=l.p[Math.min(l.p.length-1,i+1)],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1;return[p[0]-dz/L*o,p[1]+dx/L*o];});ribbon(bk('paint'),q,.05,.2,1,[.16,.14,.13]);}path2(mc,l.p);mc.strokeStyle='#55504a';mc.lineWidth=5;mc.stroke();}
  else{ribbon(bk('grass'),l.p,9,.035,5,[1.05,1.08,.95]);ribbon(bk('gravel'),l.p,1.7,.075,2);path2(mc,l.p);mc.strokeStyle='#3c5633';mc.lineWidth=36;mc.stroke();mc.strokeStyle='#c9bfa6';mc.lineWidth=5;mc.stroke();}}
 // ---- palazzi
 const FT={};const ftex=(name,g,seed)=>{const k=name+(g?'G':'U')+seed%3;return FT[k]||(FT[k]=tex(facade(STYLES[name],g,seed%3+(g?10:20)+name.length*7)));};
 const pal=opt.textures||{};
 const bInfo=[];
 M.b.forEach((b,i)=>{const p=b.p,A=Math.abs(area(p)),c=centroid(p),h=rng(i*7919+13);let style,lv;const hx=c[0]*2,hy=1140-c[1]*2;
  if(b.k==='c'){style='chiesa';lv=2;}else if(A<50){style='box';lv=1;}else if(b.k==='s'){style='scuola';lv=2;}else if(b.k==='i'){style='capannone';lv=2;}
  else{const q=h();if(hx>740)style=q<.4?'salmone':q<.7?'grigio':'mattone';else if(hy>860&&hy<970&&hx>250&&hx<480)style='foto';else style=q<.3?'ocra':q<.56?'beige':q<.72?'crema':q<.84?'foto':q<.93?'salmone':'grigio';
   lv=b.lv||(A>700?4:A<110?2:3+(h()<.45?1:0));if(hx>740)lv=b.lv||3+Math.floor(h()*3);}
  if(i===M.b.findIndex(x=>x.k==='a'&&x.lv===3)){style='bar';lv=4;}
  if(b.k==='a'&&c[0]>320&&c[0]<372&&c[1]<160&&c[1]>130){style='mattone';lv=7;}
  if(inPoly(221.5,216,p))style='crema';if(style==='foto'&&!pal.palUp)style='crema';
  const FH=3.1,Hh=style==='chiesa'?7:style==='capannone'?8:lv*FH;bInfo.push({p,c,h:Hh,style});
  path2(sc,p,true);sc.fill();path2(mc,p,true);mc.fillStyle=style==='chiesa'?'#d8d2c0':'#6b665c';mc.fill();
  const N=p.length;let run=h()*4;for(let e=0;e<N;e++){const a=p[e],q=p[(e+1)%N],l=Math.hypot(q[0]-a[0],q[1]-a[1]);if(l<.05)continue;
   if(style==='chiesa'){wall(bk('church'),a,q,0,Hh,0,1,0,1,p);continue;}
   let u0,u1;if(l<2.4){u0=0;u1=.05;}else{const n=Math.max(1,Math.round(l/4));u0=0;u1=n;}
   if(style==='foto'){const n=l<2.4?.04:Math.max(1,Math.round(l/5));wall(bk('palGr'),a,q,0,FH,0,n,0,1,p);if(lv>1)wall(bk('palUp'),a,q,FH,Hh,0,n,0,lv-1,p);}
   else if(style==='bar'){wall(bk('f_mattoneG'+i%3),a,q,0,FH,u0,u1,0,1,p);wall(bk('f_mattoneU'+i%3),a,q,FH,Hh,u0,u1,0,lv-1,p);}
   else{wall(bk('f_'+style+'G'+i%3),a,q,0,FH,u0,u1,0,1,p);if(lv>1)wall(bk('f_'+style+'U'+i%3),a,q,FH,Hh,u0,u1,0,lv-1,p);}
   run+=l;}
  // tetto con piccola gronda
  fill(bk(style==='capannone'||style==='box'||style==='chiesa'?'concrete':'roof'),p,Hh+.02,style==='roof'?3:4);
  if(style!=='chiesa'&&style!=='box'){const g=p.map(q=>{const dx=q[0]-c[0],dz=q[1]-c[1],L=Math.hypot(dx,dz)||1;return[q[0]+dx/L*.45,q[1]+dz/L*.45];});for(let e=0;e<N;e++)wall(bk('paint'),g[e],g[(e+1)%N],Hh-.25,Hh+.12,0,1,0,1,g,hex('#7d6a58'));fill(bk('roof'),g,Hh+.12,3);}});
 // ---- alberi: quelli veri di OSM (giovani, lungo le Ferrovie Nord) + quelli dei parchi
 const trees=[];for(const t of M.t)if(t[0]>2&&t[0]<W-2&&t[1]>2&&t[1]<D-2)trees.push({x:t[0],z:t[1],h:5.5+R()*3,pop:true});
 for(const g of M.g)if(g.k==='park'||g.k==='grass'||g.k==='dog_park'){const A=Math.abs(area(g.p)),n=Math.min(26,Math.floor(A/260));let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of g.p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);}
  for(let i=0,t=0;i<n&&t<400;t++){const x=x0+R()*(x1-x0),z=z0+R()*(z1-z0);if(!inPoly(x,z,g.p)||x<3||x>W-3||z<3||z>D-3)continue;if(g.name&&x>44&&x<78&&z>500&&z<538)continue;if(trees.some(q=>Math.hypot(q.x-x,q.z-z)<5))continue;trees.push({x,z,h:8+R()*5});i++;}}
 for(const t of trees){solidBox(t.x,t.z,.3);mc.fillStyle='#2f4a2a';mc.beginPath();mc.arc(t.x*2,t.z*2,t.pop?3:6,0,TAU);mc.fill();}
 // ---- luoghi
 const P=bk('paint'),C=bk('concrete');
 const bench=(x,z,rot,col)=>{const k=hex(col||'#2f5a3c');P.box(x,.45,z,1.8,.06,.45,rot,k);P.box(x-Math.sin(rot)*.24,.75,z-Math.cos(rot)*.24,1.8,.34,.05,rot,k);for(const o of[-.75,.75])P.box(x+Math.cos(rot)*o,.22,z-Math.sin(rot)*o,.06,.44,.4,rot,hex('#30302e'));solidBox(x,z,.7);};
 const lamp=(x,z,modern)=>{P.box(x,2.6,z,.11,5.2,.11,0,hex(modern?'#1c1d1f':'#5d625f'));P.box(x,5.25,z,modern?.5:.7,.12,.3,R()*3,hex('#26282a'));solidBox(x,z,.18);};
 const bin=(x,z)=>{P.box(x,.5,z,.42,1,.42,R(),hex('#3a5d44'));solidBox(x,z,.35);};
 const rail=(a,b,col,y)=>{const k=hex(col||'#3f6b52'),dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),rot=Math.atan2(-dz,dx),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,y0=y||0;P.box(mx,y0+1,mz,l,.06,.06,rot,k);P.box(mx,y0+.55,mz,l,.05,.05,rot,k);for(let s=0;s<=l;s+=2)P.box(a[0]+dx/l*s,y0+.5,a[1]+dz/l*s,.06,1,.06,rot,k);solidLine(a,b,.15);};
 const lowWall=(a,b,h,th)=>{slab(C,a,b,th||.3,0,h,4);solidLine(a,b,(th||.3)/2+.1);};
 const boards=(x,z,rot)=>{[['#6e2f22',0],['#7d3a28',.35],['#c9a45a',.7]].forEach(([c,o],i)=>P.box(x+Math.cos(rot)*o,.95,z-Math.sin(rot)*o,.5,1.9,.05,rot+.05*i,hex(c)));solidBox(x,z,.6);};
 const chair=(x,z,rot,col)=>{const k=hex(col||'#7a4a2c');P.box(x,.45,z,.42,.04,.42,rot,k);P.box(x-Math.sin(rot)*.2,.72,z-Math.cos(rot)*.2,.42,.5,.04,rot,k);for(const[ox,oz]of[[-.18,-.18],[.18,-.18],[-.18,.18],[.18,.18]])P.box(x+ox,.22,z+oz,.04,.44,.04,rot,k);};
 const sofa=(x,z,rot)=>{const k=hex('#2f8f95'),d=hex('#3a3350');P.box(x,.32,z,1.9,.4,.85,rot,k);P.box(x-Math.sin(rot)*.38,.7,z-Math.cos(rot)*.38,1.9,.6,.2,rot,d);for(const o of[-.9,.9])P.box(x+Math.cos(rot)*o,.5,z-Math.sin(rot)*o,.18,.6,.85,rot,k);P.box(x+Math.cos(rot)*.2,.6,z-Math.sin(rot)*.2,.9,.22,.6,rot+.2,k);solidBox(x,z,.9);};
 const cabinet=(x,z)=>{P.box(x,.75,z,.8,1.1,.4,.1,hex('#c9c9c2'));P.box(x,.15,z,.9,.3,.5,.1,hex('#8a8a84'));solidBox(x,z,.55);};
 const car=(x,z,rot,col)=>{const k=hex(col),g=hex('#1a2228'),t=hex('#141414');P.box(x,.62,z,4,.62,1.62,rot,k);P.box(x-Math.cos(rot)*.25,1.17,z+Math.sin(rot)*.25,2.15,.52,1.44,rot,g);P.box(x-Math.cos(rot)*.25,1.45,z+Math.sin(rot)*.25,2.05,.06,1.4,rot,k);for(const[ox,oz]of[[1.25,.8],[1.25,-.8],[-1.25,.8],[-1.25,-.8]])P.box(x+Math.cos(rot)*ox+Math.sin(rot)*oz,.32,z-Math.sin(rot)*ox+Math.cos(rot)*oz,.62,.62,.2,rot,t);
  sc.save();sc.translate(x*2,z*2);sc.rotate(-rot);sc.fillRect(-4.2,-1.9,8.4,3.8);sc.restore();mc.save();mc.translate(x*2,z*2);mc.rotate(-rot);mc.fillStyle='#b9b4a6';mc.fillRect(-4,-1.7,8,3.4);mc.restore();};
 // Giardino Boroli: campo rosso, panchine verdi, blocchi di cemento, lampioni scuri
 {const q=[[46,506],[76,506],[76,534],[46,534]];fill(bk('court'),q,.09,3);mc.fillStyle='#a8414a';path2(mc,q,true);mc.fill();for(let i=0;i<4;i++){bench(50+i*7.5,503.6,0);bench(50+i*7.5,536.6,Math.PI);}
  for(const[x,z]of[[82,512],[86,512],[84,520],[92,528]]){C.box(x,.3,z,2.6,.6,1,.2);solidBox(x,z,1.2);}for(const[x,z]of[[80,500],[98,515],[70,540],[100,470],[60,480]])lamp(x,z,true);bin(79,504);bin(44,520);
  ribbon(bk('gravel'),[[108,520],[92,522],[80,518],[60,498],[40,490]],1.2,.08,2,[1.05,1.02,.98]);ribbon(bk('gravel'),[[92,522],[96,480],[88,455]],1.2,.08,2,[1.05,1.02,.98]);}
 // rete arancione di cantiere lungo via delle Rosette
 {const a=[112.5,470],b=[111,502];const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);bk('net').quad([a[0],0,a[1]],[b[0],0,b[1]],[b[0],1.2,b[1]],[a[0],1.2,a[1]],[[0,0],[l/2.4,0],[l/2.4,1],[0,1]]);for(let s=0;s<=l;s+=2.4)P.box(a[0]+dx/l*s,.65,a[1]+dz/l*s,.05,1.3,.05,0,hex('#6b665e'));solidLine(a,b,.12);}
 // Parchetto di via Gobetti: il muro "Sant'Andrea"
 {const a=H(459.5,371),b=H(458,397);slab(bk('brick'),a,b,.35,0,2.5,4);solidLine(a,b,.3);if(pal.santandrea){const n=a[1]<b[1]?[a,b]:[b,a];wall(bk('santandrea'),[n[0][0]-.2,n[0][1]],[n[1][0]-.2,n[1][1]],0,2.5,0,1,0,1,null);}
  for(const[x,y]of[[400,380],[430,400],[410,396]])bench(HX(x),HZ(y),R()*3);lamp(HX(392),HZ(392));bin(HX(445),HZ(408));
  const pq=[H(398,365),H(402,334),H(460,341),H(456,372)];rail(pq[0],pq[1],'#3f6b52');rail(pq[1],pq[2],'#3f6b52');for(const e of[[410,348],[450,358]]){P.box(HX(e[0]),1.6,HZ(e[1]),.12,3.2,.12,0,hex('#4a4d4f'));P.box(HX(e[0]),3,HZ(e[1])+.5,1.2,.9,.06,0,hex('#e8e4d6'));solidBox(HX(e[0]),HZ(e[1]),.2);}}
 // Parchetto di via Tarantola: muretto con ringhiera verde, mobili abbandonati, scritta sul muro
 {const a=H(398,636),b=H(482,648);lowWall(a,b,.75,.35);rail(a,b,'#3f6b52',.75);cabinet(HX(500),HZ(640));boards(HX(506),HZ(641),.2);chair(HX(511),HZ(639),1.1);sofa(HX(505),HZ(600),1.5);chair(HX(503),HZ(606),.4);bench(HX(430),HZ(668),.1);bench(HX(460),HZ(672),.1);lamp(HX(445),HZ(660));
  if(pal.scritta){const p=H(425,698.2),q=H(461,703);const dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz),m=[(p[0]+q[0])/2,(p[1]+q[1])/2],hw=3.3;const o=.08;const a2=[m[0]-dx/l*hw,m[1]-dz/l*hw+o],b2=[m[0]+dx/l*hw,m[1]+dz/l*hw+o];bk('scritta').quad([a2[0],.02,a2[1]],[b2[0],.02,b2[1]],[b2[0],3.3,b2[1]],[a2[0],3.3,a2[1]],[[0,0],[1,0],[1,1],[0,1]]);}}
 // Bar Vela su via Fratelli Di Dio
 {const z0=312.5,z1=332,x=267.3;P.box(268.9,1.55,(z0+z1)/2,3.1,3.1,z1-z0,0,hex('#b5553e'));bk('bar').quad([x,0,z0],[x,0,z1],[x,3.1,z1],[x,3.1,z0],[[0,0],[1,0],[1,1],[0,1]]);for(let z=z0+1;z<z1;z+=4.9)P.box(x-.9,2.75,z+1.4,1.9,.08,3.4,0,hex('#e9e6da'));
  for(const[zz,c]of[[316,'#2f5a3c'],[319,'#eeeeea'],[325,'#eeeeea'],[328,'#2f5a3c']]){P.box(x-1.6,.72,zz,.8,.05,.8,.3,hex(c));P.box(x-1.6,.36,zz,.08,.72,.08,0,hex('#888'));chair(x-1.6,zz-.8,0,c);chair(x-1.6,zz+.8,Math.PI,c);solidBox(x-1.6,zz,.6);}bin(x-.6,z0+.6);}
 // Chiesetta Regina Pacis: croce sul lato della piazza
 {const b=bInfo.find(q=>q.style==='chiesa');if(b){const x0=Math.min(...b.p.map(q=>q[0]))-.06,zc=b.c[1];P.box(x0,4.4,zc,.1,3,.34,0,hex('#6f6f68'));P.box(x0,5,zc,.1,.34,1.5,0,hex('#6f6f68'));for(const dz of[-6,-3,3,6]){C.box(x0-6,.25,zc+dz,.5,.5,2.2,0);solidBox(x0-6,zc+dz,1);}}}
 // Parco di via Beltrami: campo colorato con ringhiera blu
 {const q=[H(408,886),H(436,893),H(451,846),H(419,839)];for(let i=0;i<4;i++)if(i!==1)rail(q[i],q[(i+1)%4],'#2a5fb5');for(const[x,y]of[[470,858],[500,860],[530,858]])bench(HX(x),HZ(y),R()*.4+3);lamp(HX(480),HZ(850));lamp(HX(540),HZ(852));bin(HX(455),HZ(870));}
 // Parco delle Ferrovie Nord: muro dei murales a ovest, gabbioni a est, blocchi bianchi
 {const ab=M.l.find(l=>l.k==='abandoned');const a=ab.p[ab.p.length-1],b=ab.p[ab.p.length-2];const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L;const at=(s,o)=>[a[0]+ux*s+uz*o,a[1]+uz*s-ux*o];
  const s0=(a[1]-556)/-uz;const side=at(100,10)[0]<at(100,-10)[0]?1:-1; // side: lato ovest
  const w0=at(s0,10*side),w1=at(s0+118,10*side);slab(C,w0,w1,.3,0,2.7,4);solidLine(w0,w1,.3);
  const mur=[['mur1',12,7.4],['mur2',34,6.2],['mur3',54,7.2],['mur1',78,7.4],['mur3',98,7.2]];for(const[n,s,wd]of mur){if(!pal[n])continue;const p=at(s0+s,10*side-.2*side),q=at(s0+s+wd,10*side-.2*side);const f=side>0?[p,q]:[q,p];bk(n).quad([f[0][0],.05,f[0][1]],[f[1][0],.05,f[1][1]],[f[1][0],2.65,f[1][1]],[f[0][0],2.65,f[0][1]],[[0,0],[1,0],[1,1],[0,1]]);}
  const g0=at(s0+6,-9*side),g1=at(s0+96,-9*side);slab(bk('gabion'),g0,g1,.9,0,1.9,2);solidLine(g0,g1,.6);
  for(let s=20;s<120;s+=34){const p=at(s0+s,-4.5*side);C.box(p[0],.3,p[1],2.4,.6,.9,Math.atan2(-uz,ux),hex('#e9e6dc'));solidBox(p[0],p[1],1);const q=at(s0+s+12,3.2*side);lamp(q[0],q[1],true);}}
 // ---- arredo lungo le vie: lampioni, auto in sosta, cestini
 const CARCOL=['#b9b9b4','#2b2f36','#7a1f1f','#e6e4dc','#3d5a78','#56605a','#8a8f94','#1c1c1e','#a39a82'];
 const free=(x,z,r)=>{if(x<4||x>W-4||z<4||z>D-4)return false;for(const b of bInfo){if(Math.hypot(b.c[0]-x,b.c[1]-z)<60&&(inPoly(x,z,b.p)||inPoly(x+r,z,b.p)||inPoly(x-r,z,b.p)||inPoly(x,z+r,b.p)||inPoly(x,z-r,b.p)))return false;}return true;};
 for(const r of M.r){if(r.k==='p'||r.k==='v')continue;const hw=HWv[r.k];let acc=R()*20,side=1;for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<1)continue;const dx=(b[0]-a[0])/l,dz=(b[1]-a[1])/l,rot=Math.atan2(-dz,dx);
   for(let s=acc%28;s<l;s+=28){side=-side;const x=a[0]+dx*s-dz*(hw+1.1)*side,z=a[1]+dz*s+dx*(hw+1.1)*side;if(free(x,z,.5))lamp(x,z);}
   if(r.k==='r')for(let s=6;s<l-6;s+=6.2){if(R()<.42){const sd=R()<.5?1:-1,x=a[0]+dx*s-dz*(hw-1.05)*sd,z=a[1]+dz*s+dx*(hw-1.05)*sd;if(free(x,z,2)&&!M.r.some(o=>o!==r&&o.k!=='p'&&o.p.some(q=>Math.hypot(q[0]-x,q[1]-z)<9)))car(x,z,rot+(sd>0?0:Math.PI),CARCOL[Math.floor(R()*CARCOL.length)]);}}
   acc+=l;}}
 // ---- materiali e mesh
 const mat=(map,o={})=>new T.MeshStandardMaterial(Object.assign({map,roughness:.93,metalness:0,vertexColors:true},o));
 const photo=n=>{const t=new T.Texture(pal[n]);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;return t;};
 const MATS={dirt:mat(TX.dirt),grass:mat(TX.grass),asphalt:mat(TX.asphalt,{roughness:.86}),pavers:mat(TX.pavers),kerb:mat(TX.kerb),gravel:mat(TX.gravel),concrete:mat(TX.concrete),gabion:mat(TX.gabion),brick:mat(TX.brick),roof:mat(TX.roof),court:mat(TX.court),pitch:mat(TX.pitch),color:mat(TX.color),water:mat(TX.water,{roughness:.25,metalness:.1}),paint:mat(TX.metal,{roughness:.6}),net:mat(TX.net,{alphaTest:.5,side:T.DoubleSide}),bar:mat(TX.bar),church:mat(TX.church)};
 const order={dirt:0,grass:-1,water:-1,asphalt:-4,pavers:-2,kerb:-3,gravel:-5,court:-5,pitch:-5,color:-5};
 for(const n in B){let m=MATS[n];if(!m){if(n.startsWith('f_')){const mm=n.match(/^f_(\w+?)([GU])(\d)$/);m=mat(ftex(mm[1],mm[2]==='G',+mm[3]));}else if(pal[n])m=mat(photo(n));else continue;MATS[n]=m;}
  if(n in order&&order[n]){m.polygonOffset=true;m.polygonOffsetFactor=order[n];m.polygonOffsetUnits=order[n]*2;}
  const mesh=new T.Mesh(B[n].geo(),m);mesh.receiveShadow=true;mesh.castShadow=!(n in order)&&n!=='net';mesh.name=n;scene.add(mesh);}
 // alberi a piani incrociati
 {const g=new T.BufferGeometry();const v=[],u=[],nn=[];for(const a of[0,Math.PI/2]){const c=Math.cos(a)*.5,s=Math.sin(a)*.5;const q=[[-c,0,-s],[c,0,s],[c,1,s],[-c,1,-s]],uv=[[0,0],[1,0],[1,1],[0,1]];for(const i of[0,1,2,0,2,3,0,2,1,0,3,2]){v.push(...q[i]);u.push(...uv[i]);nn.push(0,1,0);}}
  g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setAttribute('normal',new T.Float32BufferAttribute(nn,3));
  for(const pop of[true,false]){const L=trees.filter(t=>!!t.pop===pop);const m=new T.MeshStandardMaterial({map:pop?TX.poplar:TX.tree,alphaTest:.5,roughness:1,shadowSide:T.DoubleSide});const im=new T.InstancedMesh(g,m,L.length);const o=new T.Object3D();L.forEach((t,i)=>{o.position.set(t.x,0,t.z);o.rotation.y=R()*3;o.scale.set(t.h*(pop?.42:.95),t.h,t.h*(pop?.42:.95));o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.castShadow=true;im.frustumCulled=false;scene.add(im);}}
 // cielo e cupola di San Gaudenzio in lontananza, a sud
 const sky=new T.Mesh(new T.SphereGeometry(1800,24,12),new T.MeshBasicMaterial({map:TX.sky,side:T.BackSide,fog:false,depthWrite:false,toneMapped:false}));sky.renderOrder=-10;scene.add(sky);
 const dome=new T.Mesh(new T.PlaneGeometry(62,124),new T.MeshBasicMaterial({map:TX.dome,transparent:true,fog:false,depthWrite:false,toneMapped:false}));dome.position.set(250,60,D+760);dome.rotation.y=Math.PI;dome.renderOrder=-9;scene.add(dome);
 // ---- griglie: ostacoli (0,5 m) e campo di flusso (2 m)
 const sd=sc.getImageData(0,0,900,1140).data,SOL=new Uint8Array(900*1140);for(let i=0;i<SOL.length;i++)SOL[i]=sd[i*4]>100?1:0;
 const isSolid=(x,z)=>{if(x<1.5||z<1.5||x>W-1.5||z>D-1.5)return true;return SOL[(z*2|0)*900+(x*2|0)]===1;};
 const blocked=(x,z,r)=>{if(isSolid(x,z))return true;for(let a=0;a<8;a++)if(isSolid(x+Math.cos(a*.785)*r,z+Math.sin(a*.785)*r))return true;return false;};
 const los=(x0,z0,x1,z1)=>{const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/.5);for(let i=1;i<n;i++){const t=i/n;if(isSolid(x0+(x1-x0)*t,z0+(z1-z0)*t))return false;}return true;};
 const GW=225,GH=285,CELL=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){let b=0;for(let a=0;a<4&&!b;a++)for(let c=0;c<4;c++)if(SOL[(j*4+a)*900+i*4+c]){b=1;break;}CELL[j*GW+i]=b;}
 const dist=new Uint16Array(GW*GH),queue=new Int32Array(GW*GH);
 function flow(px,pz){dist.fill(65535);let s=(pz/2|0)*GW+(px/2|0);if(CELL[s]){let best=-1,bd=1e9;for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const x=(px/2|0)+i,z=(pz/2|0)+j;if(x<0||z<0||x>=GW||z>=GH||CELL[z*GW+x])continue;const d=i*i+j*j;if(d<bd){bd=d;best=z*GW+x;}}if(best<0)return;s=best;}
  let h=0,t=0;queue[t++]=s;dist[s]=0;while(h<t){const c=queue[h++],d=dist[c]+1,x=c%GW,z=c/GW|0;if(x>0&&!CELL[c-1]&&dist[c-1]>d){dist[c-1]=d;queue[t++]=c-1;}if(x<GW-1&&!CELL[c+1]&&dist[c+1]>d){dist[c+1]=d;queue[t++]=c+1;}if(z>0&&!CELL[c-GW]&&dist[c-GW]>d){dist[c-GW]=d;queue[t++]=c-GW;}if(z<GH-1&&!CELL[c+GW]&&dist[c+GW]>d){dist[c+GW]=d;queue[t++]=c+GW;}}}
 function flowDir(x,z){const cx=x/2|0,cz=z/2|0;let best=dist[cz*GW+cx],bx=0,bz=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){if(!i&&!j)continue;const X=cx+i,Z=cz+j;if(X<0||Z<0||X>=GW||Z>=GH)continue;const c=Z*GW+X;if(CELL[c])continue;if(i&&j&&(CELL[cz*GW+X]||CELL[Z*GW+cx]))continue;if(dist[c]<best){best=dist[c];bx=X*2+1-x;bz=Z*2+1-z;}}const l=Math.hypot(bx,bz);return l?[bx/l,bz/l,best]:[0,0,65535];}
 const freeSpot=(x,z,rad)=>{for(let k=0;k<60;k++){const a=R()*TAU,d=R()*rad,X=x+Math.cos(a)*d,Z=z+Math.sin(a)*d;if(!blocked(X,Z,.6))return[X,Z];}return[x,z];};
 const roadName=(x,z)=>{let best=null,bd=16;for(const r of M.r){if(!r.name)continue;for(let i=0;i<r.p.length-1;i++){const a=r.p[i],b=r.p[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/L)),d=Math.hypot(a[0]+dx*t-x,a[1]+dz*t-z);if(d<bd){bd=d;best=r.name;}}}return best;};
 const road=n=>M.r.filter(r=>r.name===n).sort((a,b)=>b.p.length-a.p.length)[0];
 return{W,D,PLACES,mini,isSolid,blocked,los,flow,flowDir,freeSpot,roadName,road,dist,GW,sky,MATS,M};}

/* Renault 4 rossa: modello a scatole */
function renault4(){const g=new T.Group(),b=new Bucket(),red=hex('#c8140c'),dk=hex('#12161a'),gl=hex('#1d2a32'),gr=hex('#8a8d8f'),wh=hex('#e9e2c8');
 b.box(0,.62,0,3.66,.5,1.48,0,red);b.box(-.32,1.12,0,2.5,.52,1.4,0,red);b.box(-.32,1.42,0,2.44,.07,1.36,0,red);b.box(1.36,.84,0,.94,.1,1.4,0,red);
 b.box(-.32,1.13,.705,2.2,.36,.02,0,gl);b.box(-.32,1.13,-.705,2.2,.36,.02,0,gl);b.box(.94,1.13,0,.02,.36,1.2,0,gl);b.box(-1.575,1.15,0,.02,.3,1.1,0,gl);
 b.box(1.84,.5,0,.08,.14,1.52,0,gr);b.box(-1.84,.5,0,.08,.14,1.52,0,gr);b.box(1.835,.72,.52,.04,.16,.16,0,wh);b.box(1.835,.72,-.52,.04,.16,.16,0,wh);b.box(1.835,.7,0,.03,.14,.6,0,dk);
 for(const[x,z]of[[1.2,.72],[1.2,-.72],[-1.2,.72],[-1.2,-.72]]){b.box(x,.3,z,.6,.6,.17,0,dk);b.box(x,.3,z+(z>0?.09:-.09),.26,.26,.02,0,gr);}
 const m=new T.Mesh(b.geo(),new T.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.15}));m.castShadow=true;g.add(m);return g;}
window.ChurchFPSWorld={build,renault4,rng,PLACES,cv,tex};
})();
