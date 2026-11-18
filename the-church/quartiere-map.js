/* The Church — Quartiere: mappa di Sant'Andrea vista dall'alto.
 * La mappa incorporata è una PIANTA SCENOGRAFICA con i nomi dei luoghi del gioco:
 * le posizioni sono plausibili, non cartografiche. Per la geometria vera si può
 * caricare un'esportazione di OpenStreetMap (file .osm, licenza ODbL) dal menu:
 * strade, edifici, parchi e ferrovia vengono letti dal file.
 */
(function(root){'use strict';
const ROAD_W={motorway:34,trunk:30,primary:28,secondary:24,tertiary:20,residential:16,unclassified:15,living_street:12,service:10,pedestrian:9,footway:5,path:4,cycleway:5,track:7};
function shade(hex,f){const n=parseInt(hex.slice(1,7),16);let r=n>>16,g=n>>8&255,b=n&255;const t=f<0?0:255,p=Math.abs(f);r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
// ------------------------------------------------------------------ mappa incorporata
function builtin(){const W=2560,H=1920,R=rng(1986);const roads=[],buildings=[],areas=[],pois=[],trees=[],decor=[];
 const road=(name,pts,w=42,kind='residential')=>roads.push({name,pts,w,kind});
 road('Via Tarantola',[[0,420],[2240,420]],44);
 road('Via Fratelli Di Dio',[[0,900],[2560,900]],64,'primary');
 road('Via delle Rosette',[[820,1160],[2050,1160]],40);
 road('Via San Rocco',[[0,1420],[600,1420],[820,1440],[2050,1420]],42);
 road('Via Maestra',[[300,190],[820,190]],34);
 road('Via Gobetti',[[820,0],[820,1920]],48,'secondary');
 road('Via Regina Pacis',[[1450,900],[1450,1640]],40);
 road('Via Redi',[[2050,0],[2050,1920]],44);
 road('',[[360,420],[360,1420]],30,'service');
 road('',[[2050,1650],[2300,1650],[2420,1560]],34,'service');
 road('',[[820,1760],[1300,1760]],30,'service');
 // ferrovia sul lato est, con sottopasso su Via Fratelli Di Dio
 const rail={pts:[[2235,0],[2235,1920]],w:46};
 const area=(kind,pts,name)=>areas.push({kind,pts,name});
 // Blocchi residenziali: palazzine lungo i lati, cortili all'interno.
 const fill=(x0,y0,x1,y1,palette=['#c9b98f','#b99b70','#a9aaa0','#c7a07a','#bfb39b'])=>{const m=34;let x=x0+m;while(x<x1-m-60){const w=90+R()*120;const ww=Math.min(w,x1-m-x);if(ww<60)break;const depth=60+R()*40;const col=palette[Math.floor(R()*palette.length)];buildings.push({pts:rect(x,y0+m,ww,depth),color:col,h:18+R()*16});if(y1-y0>260)buildings.push({pts:rect(x,y1-m-depth,ww,depth),color:palette[Math.floor(R()*palette.length)],h:18+R()*16});x+=ww+18+R()*30;}
  if(y1-y0>380){for(let i=0;i<3;i++){const tx=x0+60+R()*(x1-x0-120),ty=y0+150+R()*(y1-y0-300);trees.push([tx,ty,18+R()*10]);}}};
 // Nord: Via Maestra e campetto
 area('pitch',rect(420,60,300,104),'Campetto di Via Maestra');pois.push({id:'maestra',name:'Campetto di Via Maestra',x:570,y:112});
 fill(0,0,300,420);fill(820,0,2050,420);
 // Bar Vela su Via Tarantola, lato nord
 buildings.push({pts:rect(1080,300,240,92),color:'#beb5a1',h:26,label:'BAR VELA',awning:'#e5e2c9'});pois.push({id:'vela',name:'Bar Vela',x:1200,y:402,street:'Via Tarantola'});
 // Parchetto Rosa: murale a terra rosso, blu, giallo e nero
 area('park',rect(360,420,460,480),'Parchetto Rosa');decor.push({kind:'mural-floor',x:430,y:520,w:330,h:300});decor.push({kind:'gym',x:600,y:770});pois.push({id:'rosa',name:'Parchetto Rosa',x:590,y:670});
 for(const [x,y] of [[400,470],[780,470],[400,860],[780,860]])trees.push([x,y,22]);
 // Parchetto Gobetti: campo da basket blu/rosso, recinzione verde, palma
 area('park',rect(820,420,630,480),'Parchetto Via Gobetti');decor.push({kind:'court',x:930,y:520,w:420,h:260});decor.push({kind:'palm',x:1400,y:480});pois.push({id:'gobetti',name:'Parchetto Via Gobetti',x:1140,y:650,street:'Via Gobetti'});
 buildings.push({pts:rect(880,820,200,64),color:'#d2d3c8',h:14,roof:'tin'});
 // Parco di Via Redi: asilo in mattoni, altalene
 area('park',rect(1450,420,600,480),'Parchetto Via Redi');buildings.push({pts:rect(1500,470,260,150),color:'#a7755e',h:24,label:'ASILO'});decor.push({kind:'swings',x:1840,y:520});decor.push({kind:'plaza-red',x:1520,y:680,w:420,h:170});pois.push({id:'redi',name:'Parchetto Via Redi',x:1730,y:760,street:'Via Redi'});
 for(let i=0;i<6;i++)trees.push([1480+i*95,880-((i%2)*30),20]);
 // Ovest: palazzoni e scuola Thouar
 fill(0,420,360,900);
 buildings.push({pts:rect(40,960,280,140),color:'#d1c7a6',h:30,label:'SCUOLA THOUAR'});area('plaza',rect(40,1120,280,240),'Cortile Thouar');pois.push({id:'thouar',name:'La Thouar e i palazzoni',x:180,y:1240});
 fill(360,900,820,1420);
 // Ferrovie Nord: prato e murales (i cinque murales originali del pacchetto)
 area('park',rect(820,1160,630,280),'Ferrovie Nord');for(let i=0;i<5;i++)decor.push({kind:'mural',img:'mural-'+i,x:860+i*118,y:1190,w:104,h:58});pois.push({id:'murales',name:'Ferrovie Nord',x:1135,y:1320});
 for(const [x,y] of [[870,1400],[1050,1395],[1250,1400],[1410,1380]])trees.push([x,y,20]);
 // Via Fratelli Di Dio sud: negozi e palazzine
 pois.push({id:'rosette',name:'Via delle Rosette',x:1080,y:1160,street:'Via delle Rosette'});
 fill(820,900,1450,1160,['#c8bb86','#d4bb70','#b4aa7d']);fill(1450,900,2050,1160,['#c8bb86','#a9aaa0','#bfb39b']);
 // Presto Fresco con parcheggio
 buildings.push({pts:rect(1500,1190,330,170),color:'#cdd5cc',h:16,label:'PRESTO FRESCO',stripe:'#2e8d66'});area('parking',rect(1850,1190,180,210),'Parcheggio');pois.push({id:'presto',name:'Presto Fresco',x:1940,y:1300});
 // La Kiesetta e piazzale in porfido
 area('plaza',rect(1280,1600,360,260),'Piazzale della Kiesetta');buildings.push({pts:[[1370,1700],[1500,1660],[1560,1700],[1560,1820],[1370,1820]],color:'#b9bcb2',h:34,label:'KIESETTA',cross:true});pois.push({id:'kiesetta',name:'La Kiesetta',x:1450,y:1640,street:'Via Regina Pacis'});
 for(const x of [1300,1610])trees.push([x,1620,16]);
 fill(0,1420,820,1920);fill(820,1440,1280,1760);fill(1640,1440,2050,1920);fill(820,1760,1280,1920);
 // De Agostini: complesso industriale oltre la ferrovia
 buildings.push({pts:rect(2300,980,240,520),color:'#7d6260',h:40,label:'DE AGOSTINI',stairs:true});area('plaza',rect(2290,1520,260,200),'Cortile De Agostini');pois.push({id:'deagostini',name:'De Agostini',x:2420,y:1610});
 fill(2260,0,2560,880,['#a9aaa0','#9a9d93']);fill(2260,1760,2560,1920);
 return{name:'Sant’Andrea (pianta scenografica)',w:W,h:H,roads,buildings,areas,pois,trees,decor,rails:[rail],source:'builtin'};}

// ------------------------------------------------------------------ importazione OSM
function parseOSM(text,{maxSide=3400}={}){const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.querySelector('parsererror'))throw Error('Il file non è un XML di OpenStreetMap valido.');
 const nodes=new Map();for(const n of doc.getElementsByTagName('node'))nodes.set(n.getAttribute('id'),[+n.getAttribute('lat'),+n.getAttribute('lon')]);if(!nodes.size)throw Error('Nessun punto nel file: esporta un’area da openstreetmap.org.');
 let b=doc.querySelector('bounds');let minlat,maxlat,minlon,maxlon;if(b){minlat=+b.getAttribute('minlat');maxlat=+b.getAttribute('maxlat');minlon=+b.getAttribute('minlon');maxlon=+b.getAttribute('maxlon');}else{const v=[...nodes.values()];minlat=Math.min(...v.map(p=>p[0]));maxlat=Math.max(...v.map(p=>p[0]));minlon=Math.min(...v.map(p=>p[1]));maxlon=Math.max(...v.map(p=>p[1]));}
 const lat0=(minlat+maxlat)/2,mx=111320*Math.cos(lat0*Math.PI/180),my=110540;const wm=(maxlon-minlon)*mx,hm=(maxlat-minlat)*my;const S=Math.min(2.2,maxSide/Math.max(wm,hm));
 const proj=([la,lo])=>[(lo-minlon)*mx*S,(maxlat-la)*my*S];const W=Math.ceil(wm*S),H=Math.ceil(hm*S);
 const roads=[],buildings=[],areas=[],rails=[],pois=[],trees=[];const R=rng(7);
 const roofs=['#c9b98f','#b99b70','#a9aaa0','#c7a07a','#bfb39b','#b4aa7d','#a7755e'];
 for(const w of doc.getElementsByTagName('way')){const tags={};for(const t of w.getElementsByTagName('tag'))tags[t.getAttribute('k')]=t.getAttribute('v');const pts=[];for(const nd of w.getElementsByTagName('nd')){const p=nodes.get(nd.getAttribute('ref'));if(p)pts.push(proj(p));}if(pts.length<2)continue;
  if(tags.highway&&ROAD_W[tags.highway]){roads.push({name:tags.name||'',pts,w:Math.max(5,ROAD_W[tags.highway]*S*.62),kind:tags.highway,foot:['footway','path','cycleway','pedestrian'].includes(tags.highway)});continue;}
  if(tags.railway==='rail'||tags.railway==='light_rail'){if(tags.tunnel!=='yes')rails.push({pts,w:Math.max(10,8*S)});continue;}
  if(tags.building){const lv=+tags['building:levels']||3;buildings.push({pts,color:tags.amenity==='place_of_worship'||tags.building==='church'?'#b9bcb2':roofs[Math.floor(R()*roofs.length)],h:Math.min(44,6+lv*5),label:tags.name?tags.name.toUpperCase().slice(0,22):'',cross:tags.building==='church'||tags.amenity==='place_of_worship'});if(tags.name)pois.push({name:tags.name,x:pts.reduce((a,p)=>a+p[0],0)/pts.length,y:pts.reduce((a,p)=>a+p[1],0)/pts.length,osm:true,amenity:tags.amenity,shop:tags.shop});continue;}
  const k=tags.leisure==='pitch'?'pitch':['park','playground','garden','recreation_ground'].includes(tags.leisure)||['grass','recreation_ground','meadow','village_green'].includes(tags.landuse)?'park':tags.amenity==='parking'?'parking':tags.place==='square'||tags.highway==='pedestrian'?'plaza':['railway'].includes(tags.landuse)?'railyard':null;
  if(k){areas.push({kind:k,pts,name:tags.name||''});if(k==='park'&&pts.length>2){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const area=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys));for(let i=0;i<Math.min(14,area/18000);i++){const tx=Math.min(...xs)+R()*(Math.max(...xs)-Math.min(...xs)),ty=Math.min(...ys)+R()*(Math.max(...ys)-Math.min(...ys));if(pointIn([tx,ty],pts))trees.push([tx,ty,12+R()*10]);}}if(tags.name)pois.push({name:tags.name,x:pts.reduce((a,p)=>a+p[0],0)/pts.length,y:pts.reduce((a,p)=>a+p[1],0)/pts.length,osm:true,leisure:tags.leisure});}
 }
 for(const n of doc.getElementsByTagName('node')){let name='',amen='';for(const t of n.getElementsByTagName('tag')){if(t.getAttribute('k')==='name')name=t.getAttribute('v');if(['amenity','shop'].includes(t.getAttribute('k')))amen=t.getAttribute('v');if(t.getAttribute('k')==='natural'&&t.getAttribute('v')==='tree'){const [x,y]=proj([+n.getAttribute('lat'),+n.getAttribute('lon')]);trees.push([x,y,14]);}}if(name&&amen){const [x,y]=proj([+n.getAttribute('lat'),+n.getAttribute('lon')]);pois.push({name,x,y,osm:true,amenity:amen});}}
 if(!roads.length)throw Error('Nessuna strada trovata: l’area esportata è troppo piccola?');
 return{name:'OpenStreetMap · area importata',w:W,h:H,roads,buildings,areas,pois,trees,decor:[],rails,source:'osm',scale:S};}
function pointIn(p,poly){let ins=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>p[1])!==(yj>p[1])&&p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi)ins=!ins;}return ins;}
// Luoghi del gioco: nella mappa importata si cercano per nome della via o del luogo.
const PLACES=[{id:'vela',name:'Bar Vela',find:['Bar Vela','Vela'],street:'Tarantola'},{id:'kiesetta',name:'La Kiesetta',find:['Sant\'Andrea','S. Andrea','Chiesa'],street:'Regina Pacis'},{id:'gobetti',name:'Parchetto Via Gobetti',street:'Gobetti'},{id:'redi',name:'Parchetto Via Redi',street:'Redi'},{id:'rosa',name:'Parchetto Rosa',street:'Fratelli Di Dio'},{id:'presto',name:'Presto Fresco',find:['Presto Fresco','Carrefour','Supermercato'],street:'Rosette'},{id:'deagostini',name:'De Agostini',find:['De Agostini','Agostini'],street:'Vittoria'},{id:'murales',name:'Ferrovie Nord',find:['Ferrovie Nord','Ferrovienord'],street:'San Rocco'},{id:'thouar',name:'La Thouar e i palazzoni',find:['Thouar'],street:'Thouar'},{id:'maestra',name:'Campetto di Via Maestra',street:'Maestra'},{id:'rosette',name:'Via delle Rosette',street:'Rosette'}];
function resolvePlaces(map){if(map.source==='builtin')return map.pois;const out=[];const used=new Set();const R=rng(42);
 const roadsMain=map.roads.filter(r=>!r.foot);
 const along=(r,t)=>{let L=0;const seg=[];for(let i=1;i<r.pts.length;i++){const l=Math.hypot(r.pts[i][0]-r.pts[i-1][0],r.pts[i][1]-r.pts[i-1][1]);seg.push(l);L+=l;}let d=L*t;for(let i=0;i<seg.length;i++){if(d<=seg[i]||i===seg.length-1){const k=seg[i]?Math.min(1,d/seg[i]):0;return{x:r.pts[i][0]+(r.pts[i+1][0]-r.pts[i][0])*k,y:r.pts[i][1]+(r.pts[i+1][1]-r.pts[i][1])*k};}d-=seg[i];}return{x:r.pts[0][0],y:r.pts[0][1]};};
 const far=q=>out.every(o=>Math.hypot(o.x-q.x,o.y-q.y)>160);
 for(const P of PLACES){let hit=null;for(const f of P.find||[]){hit=map.pois.find(p=>p.name.toLowerCase().includes(f.toLowerCase())&&!used.has(p));if(hit)break;}
  if(!hit){const r=roadsMain.find(r=>r.name.toLowerCase().includes(P.street.toLowerCase()));if(r){for(const t of [.5,.3,.7,.15,.85]){const q=along(r,t);if(far(q)){hit=q;break;}}}}
  if(!hit){for(let k=0;k<60&&!hit;k++){const r=roadsMain[Math.floor(R()*roadsMain.length)];const q=along(r,.1+R()*.8);if(far(q)&&q.x>60&&q.y>60&&q.x<map.w-60&&q.y<map.h-60)hit=q;}}
  if(!hit)hit={x:map.w/2,y:map.h/2};
  used.add(hit);out.push({id:P.id,name:P.name,x:hit.x,y:hit.y,real:!!hit.name});}
 return out;}

// ------------------------------------------------------------------ cottura (disegno + collisioni)
const CELL=8;
// ---- trame (asfalto, marciapiede, erba, terra, ghiaia dei tetti): disegnate una volta, usate come pattern
const TEX={};
function tex(name,w,h,fn){if(TEX[name])return TEX[name];const k=document.createElement('canvas');k.width=w;k.height=h;fn(k.getContext('2d'),w,h,rng(name.length*977+w));return TEX[name]=k;}
function speckle(x,w,h,r,base,cols,n,sz=1.6){x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){x.fillStyle=cols[Math.floor(r()*cols.length)];x.fillRect(r()*w,r()*h,.6+r()*sz,.6+r()*sz);}}
function textures(){return{
 asphalt:tex('asphalt',128,128,(x,w,h,r)=>{speckle(x,w,h,r,'#4a4d50',['#56595c','#3e4144','#5f6264','#444749','#6a6b6a'],2600,1.4);x.strokeStyle='#34373a88';x.lineWidth=.8;for(let i=0;i<3;i++){x.beginPath();let px=r()*w,py=r()*h;x.moveTo(px,py);for(let j=0;j<5;j++){px+=(r()-.5)*26;py+=(r()-.5)*26;x.lineTo(px,py);}x.stroke();}}),
 walk:tex('walk',48,48,(x,w,h,r)=>{speckle(x,w,h,r,'#bdb7a6',['#c6c0ae','#b3ad9c','#cbc5b3'],500,1.2);x.strokeStyle='#a39d8c';x.lineWidth=1;for(let i=0;i<=w;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}}),
 ground:tex('ground',160,160,(x,w,h,r)=>{speckle(x,w,h,r,'#8f8c7f',['#98958a','#85827a','#a09d90','#7d7a70'],3200,2);}),
 grass:tex('grass',96,96,(x,w,h,r)=>{speckle(x,w,h,r,'#7f9b58',['#8aa862','#738f4f','#94b06a','#6c8749','#9cb874'],2400,1.4);for(let i=0;i<90;i++){x.strokeStyle=r()<.5?'#a3bd7a88':'#5f7a4288';x.lineWidth=1;const px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);x.lineTo(px+(r()-.5)*3,py-2-r()*3);x.stroke();}}),
 pitch:tex('pitch',96,96,(x,w,h,r)=>{speckle(x,w,h,r,'#5f8f4e',['#679856','#588648','#6ea05c'],1600,1.2);}),
 gravel:tex('gravel',64,64,(x,w,h,r)=>{speckle(x,w,h,r,'#00000000',['#ffffff14','#0000001c','#ffffff0c'],700,1.6);}),
};}
function path(c,pts,close=true){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();}
function bake(map,images={},opt={}){const {w:W,h:H}=map;
 const TX=textures();
 const paint=c=>{const P=k=>c.createPattern(k,'repeat');
 // terreno
 c.fillStyle=P(TX.ground);c.fillRect(0,0,W,H);const R=rng(3);for(let i=0;i<W*H/900;i++){c.fillStyle=R()<.5?'#97948622':'#7d7a6e22';c.fillRect(R()*W,R()*H,3,3);}
 const AREA={park:'#7f9b58',pitch:'#5f8f4e',plaza:'#b2ab98',parking:'#77756e',railyard:'#8a8577'};
 for(const a of map.areas){c.fillStyle=a.kind==='park'?P(TX.grass):a.kind==='pitch'?P(TX.pitch):(AREA[a.kind]||'#8f8c7f');path(c,a.pts);c.fill();if(a.kind==='park'){c.save();c.strokeStyle='#5d7442';c.lineWidth=3;path(c,a.pts);c.stroke();c.restore();}if(a.kind==='park'){c.fillStyle='#93ad6a33';for(let i=0;i<60;i++){const xs=a.pts.map(p=>p[0]),ys=a.pts.map(p=>p[1]);const x=Math.min(...xs)+R()*(Math.max(...xs)-Math.min(...xs)),y=Math.min(...ys)+R()*(Math.max(...ys)-Math.min(...ys));c.fillRect(x,y,6,3);}}
  if(a.kind==='pitch'){const xs=a.pts.map(p=>p[0]),ys=a.pts.map(p=>p[1]);const x0=Math.min(...xs),y0=Math.min(...ys),x1=Math.max(...xs),y1=Math.max(...ys);c.strokeStyle='#e8e6d0aa';c.lineWidth=2;c.strokeRect(x0+8,y0+8,x1-x0-16,y1-y0-16);c.beginPath();c.moveTo((x0+x1)/2,y0+8);c.lineTo((x0+x1)/2,y1-8);c.stroke();}
  if(a.kind==='plaza'){c.save();path(c,a.pts);c.clip();for(let y=0;y<H;y+=9)for(let x=0;x<W;x+=12){if(!pointIn([x,y],a.pts))continue;c.fillStyle=['#b9b3a0','#a8a28f','#c3bca8'][(x*13+y*7)%3];c.fillRect(x+(y%18?0:5),y,10,7);}c.restore();}
  if(a.kind==='parking'){c.strokeStyle='#e8e6d088';c.lineWidth=2;const xs=a.pts.map(p=>p[0]),ys=a.pts.map(p=>p[1]);for(let y=Math.min(...ys)+10;y<Math.max(...ys)-20;y+=34){c.beginPath();c.moveTo(Math.min(...xs)+10,y);c.lineTo(Math.min(...xs)+70,y);c.stroke();}}}
 // binari
 for(const r of map.rails||[]){c.strokeStyle='#6d6a5f';c.lineWidth=r.w;c.lineCap='butt';path(c,r.pts,false);c.stroke();c.strokeStyle='#5a4a3a';c.lineWidth=r.w*.7;c.setLineDash([4,7]);path(c,r.pts,false);c.stroke();c.setLineDash([]);for(const off of [-.22,.22]){c.strokeStyle='#b8b9b0';c.lineWidth=2.5;c.beginPath();r.pts.forEach(([x,y],i)=>{const [nx,ny]=r.pts[Math.min(i+1,r.pts.length-1)],[px,py]=r.pts[Math.max(i-1,0)];const dx=nx-px,dy=ny-py,l=Math.hypot(dx,dy)||1;const ox=-dy/l*r.w*off,oy=dx/l*r.w*off;i?c.lineTo(x+ox,y+oy):c.moveTo(x+ox,y+oy);});c.stroke();}}
 // strade: marciapiede, asfalto, mezzeria
 c.lineJoin='round';c.lineCap='round';
 for(const r of map.roads)if(!r.foot){c.strokeStyle='#8e897c';c.lineWidth=r.w+18;path(c,r.pts,false);c.stroke();c.strokeStyle=P(TX.walk);c.lineWidth=r.w+14;path(c,r.pts,false);c.stroke();}
 for(const r of map.roads)if(!r.foot){c.strokeStyle='#d9d3c2';c.lineWidth=r.w+3;path(c,r.pts,false);c.stroke();}
 for(const r of map.roads){c.strokeStyle=r.foot?'#c9c2ad':P(TX.asphalt);c.lineWidth=r.w;path(c,r.pts,false);c.stroke();}
 for(const r of map.roads)if(!r.foot&&r.w>=36){c.strokeStyle='#e8e2c8bb';c.lineWidth=2;c.setLineDash([18,16]);path(c,r.pts,false);c.stroke();c.setLineDash([]);}
 // decorazioni del gioco
 for(const d of map.decor||[]){
  if(d.kind==='mural-floor'){c.fillStyle='#ead28c';c.fillRect(d.x,d.y,d.w,d.h);c.fillStyle='#158ac3';c.beginPath();c.moveTo(d.x,d.y);c.lineTo(d.x+d.w*.4,d.y);c.lineTo(d.x+d.w*.55,d.y+d.h);c.lineTo(d.x,d.y+d.h);c.fill();c.fillStyle='#292e34';c.beginPath();c.moveTo(d.x+d.w*.4,d.y);c.lineTo(d.x+d.w*.7,d.y);c.lineTo(d.x+d.w*.6,d.y+d.h*.55);c.lineTo(d.x+d.w*.8,d.y+d.h);c.lineTo(d.x+d.w*.55,d.y+d.h);c.fill();c.fillStyle='#e8af38';c.fillRect(d.x+d.w*.72,d.y,d.w*.28,d.h);c.fillStyle='#ec696f';c.beginPath();c.ellipse(d.x+d.w*.45,d.y+d.h*.55,d.w*.3,d.h*.16,-.5,0,7);c.fill();}
  if(d.kind==='gym'){for(let i=0;i<4;i++){c.fillStyle='#333236';c.fillRect(d.x+i*44,d.y,34,26);c.strokeStyle='#e8b33a';c.lineWidth=3;c.strokeRect(d.x+i*44,d.y,34,26);}}
  if(d.kind==='court'){c.fillStyle='#347fc2';c.fillRect(d.x,d.y,d.w,d.h);c.fillStyle='#a7473b';c.fillRect(d.x,d.y+d.h*.3,d.w*.2,d.h*.4);c.fillRect(d.x+d.w*.8,d.y+d.h*.3,d.w*.2,d.h*.4);c.strokeStyle='#f4edcf';c.lineWidth=3;c.strokeRect(d.x+4,d.y+4,d.w-8,d.h-8);c.beginPath();c.moveTo(d.x+d.w/2,d.y+4);c.lineTo(d.x+d.w/2,d.y+d.h-4);c.stroke();c.beginPath();c.arc(d.x+d.w/2,d.y+d.h/2,34,0,7);c.stroke();for(const xx of [d.x+6,d.x+d.w-6]){c.beginPath();c.arc(xx,d.y+d.h/2,d.h*.38,xx<d.x+d.w/2?-1.5:1.64,xx<d.x+d.w/2?1.5:4.64);c.stroke();c.fillStyle='#bb592d';c.beginPath();c.arc(xx+(xx<d.x+d.w/2?14:-14),d.y+d.h/2,6,0,7);c.fill();}c.strokeStyle='#294c48';c.lineWidth=4;c.strokeRect(d.x-14,d.y-14,d.w+28,d.h+28);}
  if(d.kind==='palm'){for(let i=0;i<9;i++){const a=i*.7;c.strokeStyle=i%2?'#607945':'#3b5c3b';c.lineWidth=8;c.beginPath();c.moveTo(d.x,d.y);c.lineTo(d.x+Math.cos(a)*42,d.y+Math.sin(a)*42);c.stroke();}c.fillStyle='#85765a';c.beginPath();c.arc(d.x,d.y,7,0,7);c.fill();}
  if(d.kind==='swings'){c.strokeStyle='#c4c6a1';c.lineWidth=5;c.strokeRect(d.x,d.y,120,40);c.fillStyle='#6b6552';for(let i=0;i<3;i++)c.fillRect(d.x+18+i*36,d.y+14,16,12);}
  if(d.kind==='plaza-red'){c.fillStyle='#b45865';c.fillRect(d.x,d.y,d.w,d.h);c.strokeStyle='#dfdbc9';c.lineWidth=10;c.beginPath();c.moveTo(d.x,d.y+d.h*.4);c.lineTo(d.x+d.w,d.y+d.h*.7);c.stroke();}
  if(d.kind==='mural'){c.fillStyle='#67776c';c.fillRect(d.x-4,d.y-4,d.w+8,d.h+8);const img=images[d.img];if(img)c.drawImage(img,0,img.height*.2,img.width,img.height*.55,d.x,d.y,d.w,d.h);else{c.fillStyle='#c46b5b';c.fillRect(d.x,d.y,d.w,d.h);}c.fillStyle='#00000055';c.fillRect(d.x,d.y+d.h,d.w,6);}
 }
 // alberi (ombra), poi edifici con ombra proiettata e tetto
 c.save();c.shadowColor='#00000040';c.shadowBlur=8;for(const [x,y,r] of map.trees){c.fillStyle='#00000030';c.beginPath();c.arc(x+7,y+9,r,0,7);c.fill();}c.restore();
 c.save();c.shadowColor='#0000004d';c.shadowBlur=10;for(const b of map.buildings){const h=b.h||20;c.fillStyle='#00000040';path(c,b.pts.map(([x,y])=>[x+h*.45,y+h*.6]));c.fill();}c.restore();
 let bi=0;for(const b of map.buildings){bi++;const xs=b.pts.map(p=>p[0]),ys=b.pts.map(p=>p[1]),x0=Math.min(...xs),y0=Math.min(...ys),x1=Math.max(...xs),y1=Math.max(...ys);
  const gr=c.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,b.color);gr.addColorStop(.55,b.color);gr.addColorStop(1,shade(b.color,-.16));c.fillStyle=gr;path(c,b.pts);c.fill();c.strokeStyle='#00000059';c.lineWidth=3;c.stroke();c.save();path(c,b.pts);c.clip();
  c.fillStyle=P(TX.gravel);c.fillRect(x0,y0,x1-x0,y1-y0);c.strokeStyle=shade(b.color,-.22);c.lineWidth=12;path(c,b.pts);c.stroke();c.strokeStyle=shade(b.color,.18);c.lineWidth=5;path(c,b.pts);c.stroke();
  if(!b.roof&&!b.stairs&&!b.cross&&!b.label&&x1-x0>60&&y1-y0>50){const R2=rng(bi*31);const n=1+Math.floor(R2()*3);for(let i=0;i<n;i++){const w=12+R2()*14,h=10+R2()*10,px=x0+14+R2()*Math.max(1,x1-x0-28-w),py=y0+14+R2()*Math.max(1,y1-y0-28-h);c.fillStyle='#00000033';c.fillRect(px+3,py+4,w,h);c.fillStyle='#c9ccc6';c.fillRect(px,py,w,h);c.fillStyle='#9fa39d';c.fillRect(px,py+h-3,w,3);c.strokeStyle='#7d817c';c.lineWidth=1;c.beginPath();c.arc(px+w/2,py+h/2-1,Math.min(w,h)*.3,0,7);c.stroke();}
   if(R2()<.35&&x1-x0>110){const pw=Math.min(70,(x1-x0)*.4),ph=Math.min(44,(y1-y0)*.35),px=x1-pw-16,py=y0+16;c.fillStyle='#24344a';c.fillRect(px,py,pw,ph);c.strokeStyle='#5b7398';c.lineWidth=1;for(let q=px;q<=px+pw;q+=pw/4){c.beginPath();c.moveTo(q,py);c.lineTo(q,py+ph);c.stroke();}c.beginPath();c.moveTo(px,py+ph/2);c.lineTo(px+pw,py+ph/2);c.stroke();}}
  if(b.roof==='tin'){c.strokeStyle='#90958c';c.lineWidth=2;for(let x=x0;x<x1;x+=9){c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();}}
  else if(b.stairs){c.strokeStyle='#adbfc0';c.lineWidth=2;for(let x=x0;x<x1;x+=22){c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();}c.fillStyle='#425d61';for(let y=y0+30;y<y1;y+=90)c.fillRect(x0+20,y,x1-x0-40,14);}
  else{c.fillStyle='#00000018';c.fillRect((x0+x1)/2-1,y0,3,y1-y0);if(x1-x0>70){c.fillStyle='#6d6f6a';c.fillRect(x0+12,y0+12,10,10);c.fillRect(x1-24,y1-22,8,8);}}
  if(b.stripe){c.fillStyle=b.stripe;c.fillRect(x0,y1-16,x1-x0,16);}
  if(b.cross){const cx=(x0+x1)/2,cy=(y0+y1)/2;c.fillStyle='#5d6854';c.fillRect(cx-4,cy-26,8,52);c.fillRect(cx-18,cy-12,36,8);}
  c.restore();if(b.awning){c.fillStyle=b.awning;c.fillRect(x0-6,y1,x1-x0+12,12);for(let x=x0-6;x<x1+6;x+=16){c.beginPath();c.arc(x+8,y1+12,8,0,Math.PI);c.fill();}}
  if(b.label){c.font='bold 15px ui-monospace,monospace';c.textAlign='center';c.fillStyle='#1c2d2c';c.fillText(b.label,(x0+x1)/2+1,(y0+y1)/2+6);c.fillStyle='#f6ecd0';c.fillText(b.label,(x0+x1)/2,(y0+y1)/2+5);}}
 {let ti=0;for(const [x,y,r] of map.trees){const R3=rng(++ti*17);c.fillStyle='#34502f';c.beginPath();c.arc(x,y,r,0,7);c.fill();for(let k=0;k<6;k++){const a=R3()*7,d=r*.45*R3();c.fillStyle=k%2?'#46663c':'#3d5c36';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,r*(.45+R3()*.25),0,7);c.fill();}const g=c.createRadialGradient(x-r*.35,y-r*.4,1,x-r*.2,y-r*.2,r*.9);g.addColorStop(0,'#8fb06aaa');g.addColorStop(1,'#8fb06a00');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}}
 // nomi delle vie, lungo il tratto più lungo
 c.font='bold 13px ui-monospace,monospace';c.textAlign='center';const seen=new Set();
 for(const r of map.roads){if(!r.name||r.foot)continue;let best=null,bl=0;for(let i=1;i<r.pts.length;i++){const [ax,ay]=r.pts[i-1],[bx,by]=r.pts[i];const l=Math.hypot(bx-ax,by-ay);if(l>bl){bl=l;best=[ax,ay,bx,by];}}if(!best||bl<120)continue;const key=r.name+Math.round(best[0]/400);if(seen.has(key))continue;seen.add(key);const [ax,ay,bx,by]=best;let a=Math.atan2(by-ay,bx-ax);if(a>Math.PI/2)a-=Math.PI;if(a<-Math.PI/2)a+=Math.PI;const n=Math.max(1,Math.floor(bl/700));for(let k=0;k<n;k++){const t=(k+.5)/n;c.save();c.translate(ax+(bx-ax)*t,ay+(by-ay)*t);c.rotate(a);c.fillStyle='#1e2a2a';c.fillText(r.name.toUpperCase(),1,5);c.fillStyle='#f3e7c4';c.fillText(r.name.toUpperCase(),0,4);c.restore();}}
 };
 // disegno a riquadri ad alta densità (nitido su retina/telefono) + panoramica per minimappa e mappa grande
 const S=Math.max(1,Math.min(opt.scale||1,2,Math.sqrt(22e6/(W*H)))),T=1024,tiles=[];
 for(let ty=0;ty<H;ty+=T)for(let tx=0;tx<W;tx+=T){const x=tx-2,y=ty-2,w=Math.min(T,W-tx)+4,h=Math.min(T,H-ty)+4;const k=document.createElement('canvas');k.width=Math.ceil(w*S);k.height=Math.ceil(h*S);const kc=k.getContext('2d');kc.scale(S,S);kc.translate(-x,-y);paint(kc);tiles.push({x,y,w,h,canvas:k});}
 const OS=Math.min(.75,1600/Math.max(W,H)),cv=document.createElement('canvas');cv.width=Math.round(W*OS);cv.height=Math.round(H*OS);{const oc=cv.getContext('2d');oc.scale(OS,OS);paint(oc);}
 // griglia delle collisioni: 1 edificio, 2 strada, 3 verde, 4 ferrovia
 const gw=Math.ceil(W/CELL),gh=Math.ceil(H/CELL);const grid=new Uint8Array(gw*gh);
 const layer=(draw,val)=>{const k=document.createElement('canvas');k.width=gw;k.height=gh;const x=k.getContext('2d');x.scale(1/CELL,1/CELL);x.lineCap='round';x.lineJoin='round';draw(x);const d=x.getImageData(0,0,gw,gh).data;for(let i=0;i<gw*gh;i++)if(d[i*4+3]>110)grid[i]=val;};
 layer(x=>{x.fillStyle='#000';for(const a of map.areas)if(a.kind==='park'||a.kind==='pitch'){path(x,a.pts);x.fill();}},3);
 layer(x=>{x.strokeStyle='#000';for(const r of map.roads)if(!r.foot){x.lineWidth=r.w+10;path(x,r.pts,false);x.stroke();}},2);
 layer(x=>{x.strokeStyle='#000';for(const r of map.rails||[]){x.lineWidth=r.w;path(x,r.pts,false);x.stroke();}},4);
 layer(x=>{x.strokeStyle='#000';for(const r of map.roads)if(!r.foot&&r.kind==='primary'){x.lineWidth=r.w;path(x,r.pts,false);x.stroke();}},2);// sottopasso: la strada principale attraversa i binari
 layer(x=>{x.fillStyle='#000';for(const b of map.buildings){path(x,b.pts);x.fill();}},1);
 return{canvas:cv,tiles,scale:S,grid,gw,gh,cell:CELL,w:W,h:H};}
function drawTiles(baked,c,x,y,w,h){for(const t of baked.tiles){if(t.x>x+w||t.y>y+h||t.x+t.w<x||t.y+t.h<y)continue;c.drawImage(t.canvas,t.x,t.y,t.w,t.h);}}
function cellAt(baked,x,y){if(x<0||y<0||x>=baked.w||y>=baked.h)return 1;return baked.grid[Math.floor(y/CELL)*baked.gw+Math.floor(x/CELL)];}
function randomRoadPoint(map,R=Math.random){const rs=map.roads.filter(r=>!r.foot);const r=rs[Math.floor(R()*rs.length)];const i=Math.floor(R()*(r.pts.length-1));const t=R();const [ax,ay]=r.pts[i],[bx,by]=r.pts[Math.min(i+1,r.pts.length-1)];return{x:ax+(bx-ax)*t,y:ay+(by-ay)*t,road:r};}
root.ChurchMap={builtin,parseOSM,bake,drawTiles,cellAt,resolvePlaces,randomRoadPoint,pointIn,PLACES};
})(window);
