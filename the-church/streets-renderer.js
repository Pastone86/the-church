(function(root){'use strict';
class StreetRenderer{
 constructor(canvas){this.c=canvas.getContext('2d');this.canvas=canvas;this.images={};this.backdrops={};this.bs=1;}
 async load(roster){await Promise.all([...roster.map(r=>r.id),'animals-dogs',...Array.from({length:5},(_,i)=>'mural-'+i)].map(id=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{this.images[id]=i;resolve();};i.onerror=()=>reject(Error('Impossibile caricare '+id));i.src='assets/'+id+'.webp';})));}
 rect(x,y,w,h,color){this.c.fillStyle=color;this.c.fillRect(x,y,w,h);}
 line(x,y,xx,yy,color,width=2){const c=this.c;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
 poly(points,color){const c=this.c;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 ellipse(x,y,rx,ry,color){const c=this.c;c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 text(t,x,y,size=16,color='#f4e5c5',align='left'){const c=this.c;c.font=`bold ${size}px ui-monospace,monospace`;c.textAlign=align;c.fillStyle=color;c.fillText(t,x,y);}
 building(x,y,w,h,color,seed){this.rect(x+8,y+8,w,h,'#283a40');this.rect(x,y,w,h,color);this.rect(x-5,y-8,w+10,10,'#4a4846');for(let yy=y+22;yy<y+h-20;yy+=45)for(let xx=x+17;xx<x+w-20;xx+=38){this.rect(xx,yy,19,28,'#34454a');this.rect(xx+3,yy+3,6,22,(xx+yy+seed)%3?'#b6a993':'#ebcb7f');this.rect(xx-3,yy+30,26,3,'#786d61');}this.rect(x+w*.4,y+h-45,28,45,'#26373a');}
 tree(x,y,s=1){this.rect(x-6*s,y-110*s,12*s,110*s,'#6d6553');this.line(x,y-70*s,x-28*s,y-117*s,'#6d6553',7*s);for(let i=0;i<5;i++)this.ellipse(x+Math.sin(i*2)*32*s,y-120*s+Math.cos(i*2)*22*s,42*s,34*s,i%2?'#596d57':'#475e4e');}
 fence(x,y,w,color='#597b87'){for(let i=0;i<w;i+=22)this.line(x+i,y,x+i,y+75,color,3);this.line(x,y+8,x+w,y+8,color,5);this.line(x,y+65,x+w,y+65,color,5);}
 bench(x,y){this.rect(x,y-27,105,9,'#b49b75');this.rect(x+5,y-48,95,14,'#887f69');this.rect(x+12,y-17,7,17,'#3f4b48');this.rect(x+85,y-17,7,17,'#3f4b48');}
 lamp(x){this.line(x,410,x,215,'#424c50',7);this.line(x,215,x+30,215,'#424c50',5);this.ellipse(x+30,219,15,5,'#f3d69a');}
 makeStage(stage){const bs=this.bs||1,off=document.createElement('canvas');off.width=Math.round(2800*bs);off.height=Math.round(672*bs);const old=this.c;this.c=off.getContext('2d');this.c.scale(bs,bs);const c=this.c,k=stage.kind;let g=c.createLinearGradient(0,0,0,430);g.addColorStop(0,'#75858f');g.addColorStop(.55,'#d9b49a');g.addColorStop(1,'#e5c1a0');this.rect(0,0,2800,672,g);this.ellipse(2170,146,61,61,'#f2cf91');for(let i=0;i<16;i++)this.building(i*195-60,140+(i%4)*23,165,240-(i%4)*23,['#a79d8c','#c2aa91','#999e93'][i%3],i);this.rect(0,363,2800,66,'#72786b');this.rect(0,425,2800,247,k==='gym'?'#b58281':k==='basket'?'#64828b':k==='church'?'#98847c':k==='rail'?'#95917d':'#656d6b');
 for(let y=435;y<672;y+=18){const step=25+(y-430)*.11;for(let x=-(y%36);x<2800;x+=step){if(k==='church'){this.rect(x,y,step-2,15,(Math.floor(x/step)+y)%3?'#a89383':'#8a7f79');}else this.line(x,y,x+8,y+2,'#ffffff0b',1);}}
 this.rect(0,410,2800,15,'#d0b79a');this.line(0,425,2800,425,'#3d4c4c',4);
 if(k==='gym'){
 const sky=c.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#4c8fc7');sky.addColorStop(1,'#b5d7df');this.rect(0,0,2800,430,sky);
 for(let i=0;i<9;i++){const x=i*350-70,y=150+(i%3)*20;this.building(x,y,285,255-(i%3)*20,i%3===0?'#d9c768':i%3===1?'#cbbd95':'#b4ac87',i);this.poly([[x-10,y-9],[x+50,y-37],[x+275,y-37],[x+295,y-9]],'#776a59');for(let j=0;j<4;j++){this.rect(x+28+j*65,y-46,9,20,'#a28d73');this.line(x+35+j*65,y-48,x+35+j*65,y-61,'#65737a',1);}for(let yy=y+60;yy<385;yy+=57){this.rect(x+9,yy,265,5,'#a49372');for(let bx=x+18;bx<x+270;bx+=62){this.rect(bx,yy-18,32,18,'#9c9f8c');for(let z=0;z<32;z+=6)this.line(bx+z,yy-18,bx+z,yy,'#656b61',1);}}}
 for(const [x,z] of [[340,1.3],[930,1.2],[1450,1.45],[2050,1.2],[2570,1.5]])this.tree(x,414,z);
 this.rect(0,420,2800,252,'#ead28c');
 for(let i=0;i<4;i++){const x=i*760;
 this.poly([[x,429],[x+240,429],[x+380,672],[x+55,672]],'#158ac3');
 this.poly([[x+235,429],[x+470,429],[x+310,560],[x+540,672],[x+380,672]],'#292e34');
 this.poly([[x+470,429],[x+680,429],[x+570,560],[x+740,672],[x+540,672]],'#e8af38');
 c.fillStyle='#ec696f';c.beginPath();c.moveTo(x+90,440);c.bezierCurveTo(x+360,414,x+105,520,x+360,556);c.bezierCurveTo(x+610,595,x+510,665,x+650,672);c.lineTo(x+405,672);c.bezierCurveTo(x+200,615,x+290,590,x+140,557);c.bezierCurveTo(x-40,510,x+5,467,x+90,440);c.fill();
 c.save();c.beginPath();c.rect(x+460,450,180,155);c.clip();for(let j=-120;j<260;j+=20)this.line(x+460+j,450,x+340+j,605,'#fff0b1',7);c.restore();
 }
 c.save();c.translate(1220,550);c.scale(1,.44);this.ellipse(0,0,180,80,'#e96570');this.ellipse(145,-5,62,57,'#198ac2');this.poly([[175,-43],[198,-91],[205,-21]],'#292e34');this.poly([[115,-44],[104,-80],[147,-42]],'#e9c779');this.ellipse(161,-17,13,16,'#ecd28b');this.ellipse(163,-17,5,7,'#252c33');this.poly([[-120,50],[-160,106],[-220,114],[-205,94],[-175,90],[-145,29]],'#168bc3');this.poly([[50,55],[75,106],[150,121],[157,100],[101,91],[89,32]],'#292e34');c.restore();
 for(let yy=445;yy<672;yy+=47)this.line(0,yy,2800,yy,'#343b3b16',1);
 this.fence(0,353,2800,'#2779a0');
 const box=(x,y,w,h)=>{this.poly([[x,y-h],[x+18,y-h-12],[x+w+18,y-h-12],[x+w,y-h]],'#363d3d');this.rect(x,y-h,w,h,'#333236');this.poly([[x+w,y-h],[x+w+18,y-h-12],[x+w+18,y-12],[x+w,y]],'#202a30');this.rect(x,y-h,w,5,'#e8b33a');this.rect(x,y-h,5,h,'#d99f28');this.rect(x+w-5,y-h,5,h,'#d99f28');this.rect(x,y-5,w,5,'#bc8a28');for(const xx of [x+10,x+w-10])for(const yy of [y-h+12,y-14])this.ellipse(xx,yy,1.8,1.8,'#b6b5a5');};
 box(245,413,120,63);box(400,408,175,131);box(605,414,69,94);box(726,416,145,43);
 box(1310,412,155,79);box(1500,405,160,138);box(1730,414,70,97);box(1850,416,125,48);
 box(2480,414,145,76);
 for(let x of [65,1050,2170]){for(let j=0;j<3;j++){let bx=x+j*65;this.line(bx,415,bx,280+j*23,'#daa62b',7);this.line(bx,280+j*23,bx+65,280+j*23,'#343f43',6);}this.line(x+195,415,x+195,326,'#daa62b',7);}
 this.rect(20,393,190,29,'#234550');this.text('PARCHETTO ROSA',33,413,16,'#f8d788');
 }
 else if(k==='basket'){
 const sky=c.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#7ca8d6');sky.addColorStop(1,'#c4d5df');this.rect(0,0,2800,430,sky);
 this.building(0,42,330,375,'#a9aaa0',0);this.rect(125,44,95,370,'#555e61');for(let y=70;y<365;y+=65){for(const x of [145,184]){this.rect(x,y,25,40,'#e5ded0');this.rect(x+3,y+3,19,34,'#354950');}for(const x of [12,235]){this.rect(x,y+30,80,24,'#b9b7a8');for(let xx=x;xx<x+80;xx+=8)this.line(xx,y+25,xx,y+52,'#515e5e',2);this.line(x,y+25,x+80,y+25,'#515e5e',3);}}
 for(const x of [340,1580]){this.rect(x,258,650,156,'#d2d3c8');this.poly([[x-15,260],[x+34,215],[x+603,215],[x+667,260]],'#515b5c');for(let xx=x;xx<x+650;xx+=13)this.line(xx,254,xx+27,223,'#90958c',2);for(let xx=x+50;xx<x+640;xx+=125){this.rect(xx,280,29,42,'#365652');this.rect(xx,348,26,47,'#465e59');}}
 for(const x of [1000,2250]){this.rect(x,0,550,418,'#90958b');for(let i=0;i<38;i++){let xx=x+(i*97)%535;this.rect(xx,20+(i*67)%270,4+(i%5)*6,95+(i%4)*18,i%2?'#b5b6a344':'#59665c33');}this.rect(x,315,550,100,'#525d56');for(let i=0;i<6;i++){const xx=x+20+i*85;c.strokeStyle='#dddcd2';c.lineWidth=7;c.beginPath();c.moveTo(xx,383);c.lineTo(xx+15,332);c.lineTo(xx+60,340);c.lineTo(xx+30,362);c.lineTo(xx+65,392);c.stroke();this.line(xx-4,391,xx+72,392,'#212c2b',3);}this.text('GOBETTI',x+110,406,18,'#c2c6b5');}
 for(const x of [958,2195]){this.line(x,300,x-8,92,'#85765a',17);for(let y=105;y<280;y+=11)this.line(x-9,y,x+5,y+5,'#5d5a45',3);for(let i=0;i<11;i++){let angle=i*Math.PI*2/11,xx=x+Math.cos(angle)*65,yy=85+Math.sin(angle)*39;this.poly([[x-8,86],[xx,yy],[x+Math.cos(angle+.2)*34,108+Math.sin(angle)*28]],i%2?'#607945':'#3b5c3b');}}
 this.rect(0,421,2800,251,'#347fc2');
 for(const x of [660,1980]){this.ellipse(x,508,550,148,'#d9bd74');this.ellipse(x-270,534,112,53,'#c56d41');this.poly([[x-225,441],[x+225,441],[x+310,585],[x-310,585]],'#a7473b');c.strokeStyle='#f4edcf';c.lineWidth=4;c.beginPath();c.moveTo(x-225,441);c.lineTo(x-310,585);c.lineTo(x+310,585);c.lineTo(x+225,441);c.closePath();c.stroke();}
 this.line(1320,424,1320,672,'#f0e5c9',3);c.strokeStyle='#f0e5c9';c.lineWidth=3;c.beginPath();c.ellipse(1320,540,98,48,0,0,Math.PI*2);c.stroke();
 for(let i=0;i<3200;i++){const xx=(i*137.3)%2800,yy=430+(i*53.7)%242;this.rect(xx,yy,1.5,1,i%2?'#eee2b51c':'#1a354224');}
 this.rect(0,410,2800,14,'#b04f3e');this.rect(0,400,2800,10,'#c0b8a0');
 c.save();c.beginPath();c.rect(0,133,2800,267);c.clip();for(let x=-280;x<3100;x+=20){this.line(x,133,x+265,400,'#36575155',1);this.line(x,133,x-265,400,'#36575155',1);}c.restore();for(let x=20;x<2800;x+=150)this.line(x,124,x,410,'#294c48',5);this.line(0,140,2800,140,'#355a50',2);this.line(0,330,2800,330,'#355a50',3);
 for(const x of [660,1980]){this.rect(x+43,322,13,100,'#c0c0b3');this.line(x+50,325,x-16,253,'#6c6b62',12);this.line(x+45,322,x-22,250,'#a49e90',4);this.rect(x-69,178,135,92,'#202c2b');this.rect(x-65,182,127,84,'#eeeee4');c.strokeStyle='#242e2b';c.lineWidth=4;c.strokeRect(x-25,226,43,35);this.ellipse(x-5,268,29,6,'#bb592d');for(let j=0;j<7;j++){this.line(x-30+j*8,270,x-21+j*5,293,'#e9e6ce',1.5);this.line(x-30+j*8,270,x-12+j*4,293,'#e9e6ce',1);}this.line(x-21,292,x+12,292,'#e9e6ce',1.5);}
 }
 else if(k==='rail'){
 const sky=c.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#88b7d5');sky.addColorStop(1,'#e1e8df');this.rect(0,0,2800,430,sky);
 for(let i=0;i<12;i++)this.building(i*245,195+(i%3)*14,220,180,'#bdb39b',i);
 this.rect(1540,153,55,155,'#aaa99c');this.ellipse(1567,155,29,48,'#939d9d');for(let x=1548;x<1595;x+=9)this.line(x,152,x,213,'#d6d3bc',2);this.rect(1563,68,8,56,'#8f9894');this.line(1567,68,1567,34,'#7e8c8c',3);this.rect(1537,191,61,7,'#ded6bc');
 this.rect(185,186,470,172,'#d2b5a0');this.rect(500,115,280,243,'#a7755e');this.poly([[478,115],[632,65],[802,115]],'#a56748');this.rect(493,118,294,13,'#d2c5a8');
 for(const x of [504,756])this.rect(x,132,17,224,'#d5c5ab');
 for(let x=537;x<750;x+=78){this.rect(x-6,157,47,91,'#d6c3a6');this.rect(x,163,35,78,'#354c51');this.line(x+17,163,x+17,241,'#9c9987',3);this.line(x,202,x+35,202,'#9c9987',3);this.rect(x-7,257,49,9,'#e0cbb1');this.rect(x,284,35,64,'#c2b29c');}
 for(let x=205;x<490;x+=51){this.rect(x,207,32,47,'#364c52');this.rect(x+3,210,26,39,'#84a6ae');this.rect(x,281,33,56,'#e0d6bd');}
 this.rect(115,328,740,70,'#779ab3');c.strokeStyle='#efe4bd';c.lineWidth=17;c.beginPath();c.moveTo(120,373);for(let x=130;x<850;x+=20)c.lineTo(x,365+Math.sin(x/66)*23);c.stroke();c.strokeStyle='#bf5954';c.lineWidth=8;c.beginPath();c.ellipse(465,361,89,23,0,0,Math.PI*2);c.stroke();for(let i=0;i<22;i++){let t=i*Math.PI/11;this.line(465+Math.cos(t)*81,361+Math.sin(t)*20,465+Math.cos(t)*97,361+Math.sin(t)*27,'#f1e3bc',4);}for(let x of [180,680,770]){this.ellipse(x,371,24,17,'#e9d9a9');this.ellipse(x+21,354,10,13,'#e9d9a9');this.ellipse(x+23,351,3,3,'#354641');}
 this.rect(1930,274,870,147,'#8d9384');for(let x=1940;x<2800;x+=36)this.rect(x,280,10,23,'#776e5c');this.line(1930,281,2800,281,'#c5c4b4',4);this.line(1930,299,2800,299,'#c5c4b4',4);this.fence(1930,221,870,'#4e716a');
 this.poly([[2210,420],[2255,332],[2400,332],[2470,420]],'#172f31');for(let i=0;i<9;i++){let y=346+i*8;this.poly([[2250-i*4,y],[2407+i*5,y],[2411+i*5,y+4],[2246-i*4,y+4]],i%2?'#7c8780':'#a5aca1');}for(const x of [2205,2440]){this.line(x,414,x+28,332,'#547d73',6);this.line(x+12,414,x+40,337,'#9e8462',2);for(let i=0;i<5;i++)this.line(x+6+i*5,402-i*15,x+6+i*5,420,'#587d72',3);}for(let i=0;i<140;i++){const x=1950+(i*71)%840,y=307+(i*31)%105;if(x>2220&&x<2430&&y>329)continue;this.ellipse(x,y,9,5,i%3?'#486e4c':'#668157');}
 this.rect(0,399,2800,48,'#709b50');this.poly([[880,399],[935,399],[1250,447],[1040,447]],'#dfdec6');this.poly([[1530,399],[1560,399],[1390,447],[1240,447]],'#e7e2cb');
 this.rect(0,443,2800,229,'#b45865');this.poly([[930,443],[1210,443],[1790,672],[1320,672]],'#dedbc9');this.poly([[1650,443],[2800,443],[2800,672],[2120,672]],'#7c9c5b');this.poly([[2070,443],[2130,443],[2690,672],[2460,672]],'#e4dfc9');this.line(0,491,1044,491,'#e6c1b2',3);this.line(0,606,1244,606,'#dfb9ae',3);
 const greenBench=(x,y)=>{for(let j=0;j<5;j++)this.rect(x,y-43+j*5,110,3,'#245950');this.rect(x-3,y-15,116,8,'#346c5a');for(const xx of [x+9,x+97])this.line(xx,y-16,xx-3,y+8,'#7b8a7a',4);};
 for(const x of [90,440,800,1435,1810,2625])greenBench(x,425);
 for(const x of [1090,1650,2490]){this.rect(x,412,64,22,'#b6c0a5');this.rect(x-4,409,72,6,'#d4dac2');this.rect(x+76,419,29,16,'#a8b69c');}
 for(const [x,z] of [[30,1.8],[910,1.7],[1320,1.1],[1750,1.6],[2640,1.3]])this.tree(x,411,z);
 for(const x of [375,1140,1600,2050,2740]){this.line(x,420,x,258,'#3c504b',4);this.ellipse(x,258,13,4,'#394e4a');this.poly([[x-7,260],[x+7,260],[x+4,279],[x-4,279]],'#a9b9a7');this.rect(x+10,400,14,22,'#354f45');}
 for(const x of [260,630]){this.line(x,398,x+28,306,'#c4c6a1',5);this.line(x+90,398,x+64,306,'#688f9f',5);this.line(x+28,306,x+64,306,'#a9bba4',4);for(const xx of [x+35,x+57])this.line(xx,308,xx,376,'#495b51',1);this.rect(x+32,376,28,5,'#6b6552');}
 }
 else if(k==='church'){
 const sky=c.createLinearGradient(0,0,0,420);sky.addColorStop(0,'#a1aeb3');sky.addColorStop(1,'#d4d6cc');this.rect(0,0,2800,430,sky);
 for(let i=0;i<9;i++){const x=i*340-90;this.building(x,140+(i%3)*25,300,270-(i%3)*25,i%2?'#baaf8e':'#c4b99a',i);for(let y=205;y<365;y+=52){this.rect(x+10,y,280,6,'#857f70');for(let xx=x+15;xx<x+285;xx+=10)this.line(xx,y-17,xx,y,'#6f7a70',1);}}
 this.rect(0,407,2800,265,'#a29d8e');
 for(let y=426;y<672;y+=9)for(let x=0;x<2800;x+=12){let n=(x*13+y*17)%7;this.rect(x+(y%2)*4,y,9,6,['#b9b3a0','#8c8b7d','#c8c1aa','#9b9989','#777d75','#ada992','#d0c9b3'][n]);}
 for(let x=0;x<2800;x+=360)this.poly([[x+90,425],[x+105,425],[x+180,672],[x+150,672]],'#c7c5b6');for(const y of [441,559,652])this.rect(0,y,2800,8,'#c3c0af');
 const x=135;
 this.rect(x+245,50,225,133,'#9a6c4c');this.rect(x+325,48,64,140,'#96998e');this.rect(x+354,65,13,49,'#d0cdb9');this.rect(x+357,70,7,40,'#4b5b53');this.poly([[x+230,50],[x+244,27],[x+464,27],[x+481,50],[x+474,66],[x+235,66]],'#676f65');this.rect(x+245,25,218,7,'#4f5b53');for(let xx=x+250;xx<x+465;xx+=7)this.line(xx,32,xx-3,48,'#919285',2);
 this.poly([[x,410],[x,228],[x+293,102],[x+357,144],[x+435,100],[x+498,217],[x+498,409]],'#b9bcb2');this.poly([[x+357,144],[x+435,100],[x+498,217],[x+498,409],[x+357,409]],'#a4aaa0');this.poly([[x+498,217],[x+543,193],[x+543,383],[x+498,409]],'#929e94');
 for(const d of [0,8]){this.line(x,228+d,x+293,102+d,d?'#cbd0c2':'#78847b',5);this.line(x+293,102+d,x+357,144+d,d?'#cbd0c2':'#78847b',5);this.line(x+357,144+d,x+435,100+d,d?'#cbd0c2':'#78847b',5);this.line(x+435,100+d,x+498,217+d,d?'#cbd0c2':'#78847b',5);}
 this.rect(x,338,355,65,'#c6c9bd');this.rect(x,402,498,10,'#6d7970');for(let i=0;i<37;i++){let xx=x+10+(i*71)%475,yy=235+(i*43)%142;this.rect(xx,yy,2,14+i%18,'#7b8a7d12');}
 this.rect(x+333,180,8,102,'#5d6854');this.rect(x+317,199,39,8,'#5d6854');for(let yy=185;yy<280;yy+=13)this.line(x+333,yy,x+341,yy,'#a0a68f',2);this.rect(x+271,124,13,6,'#525d55');
 this.rect(x+360,310,75,94,'#455c55');for(let j=0;j<8;j++)this.line(x+364+j*10,312,x+364+j*10,402,'#b8beb0',2);for(let j=0;j<10;j++)this.line(x+362,314+j*10,x+434,314+j*10,'#b8beb0',2);this.poly([[x+346,311],[x+372,281],[x+450,281],[x+435,311]],'#556b57');for(let j=0;j<10;j++)this.line(x+375+j*7,284,x+353+j*8,308,'#9aab88',2);this.line(x+346,312,x+437,312,'#d0d2c2',5);this.rect(x+519,276,15,68,'#4c6359');
 const stoneBench=(bx)=>{this.rect(bx,398,93,10,'#b6b5a3');this.rect(bx+4,408,12,15,'#878f7f');this.rect(bx+74,408,12,15,'#878f7f');this.line(bx,398,bx+93,398,'#d0cbb9',3);};stoneBench(x+22);stoneBench(x+190);this.rect(x+131,387,29,36,'#818b7e');this.rect(x+128,384,36,7,'#c1beaa');this.rect(x+137,394,18,26,'#525f55');
 for(const tx of [735,1770,2520]){this.rect(tx-7,242,14,168,'#686e56');for(let i=0;i<5;i++)this.ellipse(tx,190+i*38,24+i*9,60,'#3d5845');}
 for(const bx of [915,1330,1990,2320]){stoneBench(bx);this.lamp(bx+140);}
 this.fence(810,337,1850,'#637b6a');
 }
 else if(stage.kind==='muralpark'){
 // Ferrovie Nord: scenario dedicato ai murales. In fondo il muro con i cinque murales, poi marciapiede, strada e, davanti, il campo d'erba.
 const sky=c.createLinearGradient(0,0,0,300);sky.addColorStop(0,'#7fb3d6');sky.addColorStop(1,'#d9e4dc');this.rect(0,0,2800,430,sky);
 for(let i=0;i<14;i++){const x=i*215-40,h=110+(i*37)%70;this.rect(x,250-h,180,h+20,['#c9c3b0','#bfb8a6','#d3cbb6'][i%3]);for(let yy=268-h;yy<250;yy+=26)for(let xx=x+14;xx<x+166;xx+=30)this.rect(xx,yy,14,15,'#9aa3a2');}
 this.rect(0,215,2800,60,'#d9e4dc55');
 for(let i=0;i<22;i++){const x=40+i*131;this.ellipse(x,182+(i%3)*6,46,30,i%2?'#6f8a5b':'#5f7a4f');this.ellipse(x+30,176,34,26,'#7c9764');}
 // muro di cemento con copertina e pilastri
 this.rect(0,140,2800,232,'#a9a596');this.rect(0,132,2800,12,'#c8c3b2');this.rect(0,144,2800,4,'#8d897b');
 for(let i=0;i<2800;i+=4){const n=(i*37)%11;if(n<3)this.rect(i,150+(i*13)%200,2,8+n*6,'#00000010');}
 const crops=[[0,.16,1,.61],[.02,.28,.96,.48],[0,.19,1,.63],[0,0,1,.91],[.02,.23,.96,.32]];
 const W=470,H=196,y0=158,gap=(2800-5*W)/6;
 for(let mi=0;mi<5;mi++){const img=this.images['mural-'+mi];const px=Math.round(gap+mi*(W+gap));
  this.rect(px-4,y0-4,W+8,H+8,'#97927f');
  if(img){let [sx,sy,sw,sh]=crops[mi];sx*=img.width;sy*=img.height;sw*=img.width;sh*=img.height;const want=W/H;if(sw/sh>want){const nw=sh*want;sx+=(sw-nw)/2;sw=nw;}else{const nh=sw/want;sy+=(sh-nh)/2;sh=nh;}c.imageSmoothingEnabled=false;c.drawImage(img,sx,sy,sw,sh,px,y0,W,H);c.imageSmoothingEnabled=true;}
  else this.rect(px,y0,W,H,'#c46b5b');
  const sh2=c.createLinearGradient(0,y0,0,y0+H);sh2.addColorStop(0,'#ffffff12');sh2.addColorStop(1,'#00000022');this.rect(px,y0,W,H,sh2);
  this.rect(px+W/2-46,y0+H+16,92,18,'#2b3530');this.text('MURALE '+(mi+1),px+W/2,y0+H+30,11,'#e7dcc0','center');}
 for(let i=0;i<=5;i++){const x=Math.round(gap/2+i*(W+gap))-9;if(x<0||x>2790)continue;this.rect(x,128,18,246,'#b9b4a3');this.rect(x-3,124,24,8,'#d4cfbd');this.lamp(x+9);}
 this.rect(0,366,2800,8,'#7a7769');
 // marciapiede in autobloccanti, cordolo
 this.rect(0,374,2800,52,'#b8b2a0');for(let y=378;y<424;y+=12)for(let x=(y%24?0:14);x<2800;x+=28){this.rect(x,y,26,10,(x+y)%3?'#c2bca9':'#aea895');}
 this.rect(0,424,2800,7,'#d6d1c0');this.rect(0,431,2800,3,'#6b6a62');
 // strada: asfalto con grana, mezzeria tratteggiata, strisce pedonali e tombino
 this.rect(0,434,2800,118,'#4a4d50');for(let i=0;i<9000;i++){const x=(i*137.7)%2800,y=434+(i*61.3)%118;this.rect(x,y,1.6,1.4,i%3?'#5a5d60':'#3b3e41');}
 for(let x=20;x<2800;x+=90)this.rect(x,491,48,5,'#e9e3c8');
 for(const cx of [700,2050])for(let k=0;k<6;k++)this.rect(cx+k*30,438,18,110,'#e9e3c8d0');
 for(const mx of [380,1500,2420]){this.ellipse(mx,520,20,7,'#2f3234');this.ellipse(mx,519,16,5,'#3f4245');}
 this.rect(0,552,2800,8,'#d6d1c0');this.rect(0,560,2800,3,'#8c8878');
 // campo d'erba con strisce di taglio, linea bianca e qualche fiore
 this.rect(0,563,2800,109,'#6f9a4c');for(let x=0;x<2800;x+=140)this.rect(x,563,70,109,'#78a453');
 for(let i=0;i<5200;i++){const x=(i*97.3)%2800,y=566+(i*41.7)%104;this.line(x,y,x+(i%3-1)*1.5,y-3-(i%4),i%2?'#8fbb62':'#5d8640',1);}
 this.rect(0,598,2800,4,'#eef0dccc');
 for(let i=0;i<70;i++){const x=(i*211)%2800,y=610+(i*29)%56;this.ellipse(x,y,2.5,2.5,i%3?'#f4f1e2':'#f3d35a');}
 for(const gx of [260,2560]){this.line(gx,640,gx,588,'#f2f2ea',5);this.line(gx+70,640,gx+70,588,'#f2f2ea',5);this.line(gx,590,gx+70,590,'#f2f2ea',5);for(let k=0;k<7;k++)this.line(gx+k*10,592,gx+k*10+6,636,'#ffffff55',1);}
 }
 else if(stage.id==='deagostini'){
 const sky=c.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#8dbdd0');sky.addColorStop(1,'#c6d3cc');this.rect(0,0,2800,430,sky);
 this.rect(0,0,2800,337,'#7d6260');
 for(let bx=0;bx<2800;bx+=330){this.rect(bx+18,0,82,329,'#667f7f');this.rect(bx+104,0,123,329,'#885f58');this.rect(bx+233,0,69,329,'#425d61');for(let y=25;y<330;y+=73){this.rect(bx+24,y,69,44,'#36535a');this.rect(bx+238,y,58,44,'#3a565b');this.line(bx+58,y,bx+58,y+44,'#a2b6b3',2);this.rect(bx,y+56,328,10,'#62797b');}}
 for(let xx=0;xx<2800;xx+=29){this.rect(xx,0,4,337,'#adbfc0');this.rect(xx+4,0,2,337,'#49636b');}for(let y=51;y<330;y+=73){this.rect(0,y,2800,6,'#9fafac');this.line(0,y-21,2800,y-21,'#b0c0ba',3);this.line(0,y-11,2800,y-11,'#9daea9',2);}
 for(const sx of [570,1710,2410]){for(let j=0;j<4;j++){const y=25+j*75,flip=j%2,ax=sx+(flip?132:0),bx=sx+(flip?0:132);this.line(ax,y,bx,y+70,'#637e83',9);for(let t=0;t<13;t++){const q=t/12,xx=ax+(bx-ax)*q,yy=y+70*q;this.line(xx-10,yy,xx+10,yy,'#a9b9b6',3);this.line(xx,yy,xx,yy-25,'#93aaa9',2);}this.line(ax,y-25,bx,y+45,'#a7bcba',3);this.rect(sx-18,y+68,170,7,'#90a5a1');}this.line(sx-15,0,sx-15,337,'#9fb4b1',5);this.line(sx+150,0,sx+150,337,'#9fb4b1',5);}
 this.rect(40,331,500,87,'#a9c2bd');for(let xx=52;xx<527;xx+=62){this.rect(xx,341,54,42,'#3a5d60');this.poly([[xx+2,344],[xx+17,344],[xx+50,378],[xx+38,378]],'#95b4aa55');}this.rect(32,326,515,10,'#d0d4c7');this.rect(670,307,2040,113,'#3f5957');this.rect(1390,316,500,90,'#527b69');
 this.poly([[350,258],[2650,208],[2770,278],[475,322]],'#566d6d');for(let xx=440;xx<2650;xx+=125){this.line(xx,264,xx+105,307,'#9eaaa0',3);this.line(xx+105,264,xx,307,'#788c84',3);}this.poly([[350,242],[2650,192],[2650,218],[350,270]],'#b4c5c0');this.line(350,269,2650,218,'#748e8d',4);for(const px of [470,1120,1850,2630])this.rect(px,288,12,137,'#a5b8af');
 this.rect(560,409,2180,13,'#b9c9c1');this.line(560,335,2740,335,'#c3cfc7',5);for(let xx=563;xx<2740;xx+=14)this.line(xx,336,xx,410,'#a8beb7',3);for(const px of [560,985,1450,1930,2370,2740])this.rect(px,328,8,98,'#d1d7c9');this.line(990,340,1445,406,'#c0cdc3',4);this.line(1445,340,990,406,'#c0cdc3',4);this.rect(600,351,19,24,'#ced3b6');this.rect(604,355,11,7,'#e0c562');this.rect(1980,348,25,23,'#dad9ba');this.text('DE AGOSTINI',2020,311,24,'#d4dfcf');
 for(const lx of [415,2170]){this.line(lx,430,lx,238,'#a9c6c2',4);this.line(lx,238,lx-21,226,'#a9c6c2',4);this.ellipse(lx-23,225,11,4,'#e2e2ca');}
 this.rect(0,425,2800,247,'#6b7d77');for(let i=0;i<2700;i++)this.rect((i*139)%2800,431+(i*71)%240,2,1,i%2?'#d4d7b81b':'#253c3525');this.rect(0,427,2800,5,'#b0bba8');for(let xx=100;xx<2800;xx+=370)this.rect(xx,620,150,4,'#c7c6a4');for(let xx=0;xx<350;xx+=23)this.ellipse(xx,410,28,18,xx%2?'#526b4e':'#657d52');
 const wallX=1660;this.rect(wallX,104,1140,316,'#8e9386');this.rect(wallX,98,1140,12,'#647267');
 for(let yy=112;yy<355;yy+=31){this.line(wallX,yy,2800,yy,'#707d70',2);for(let xx=wallX+(yy%62?0:66);xx<2800;xx+=132)this.line(xx,yy,xx,yy+31,'#758174',2);}
 this.rect(wallX,354,1140,67,'#9b9f90');for(let i=0;i<220;i++){const xx=wallX+(i*83)%1140,yy=110+(i*47)%302;this.rect(xx,yy,2+(i%6),9+(i%19),'#485d4916');}
 for(const xx of [1765,2200,2660]){this.line(xx,112,xx+7,354,'#596a5c',3);this.line(xx+7,354,xx-4,377,'#687465',2);this.line(xx-4,377,xx+5,399,'#687465',2);this.line(xx+5,399,xx+2,420,'#687465',2);}
 this.poly([[2360,419],[2403,393],[2455,384],[2490,365],[2530,373],[2560,359],[2610,372],[2640,408],[2680,419]],'#727d6b');
 for(let i=0;i<18;i++){const xx=wallX+25+i*62,yy=248+(i%3)*30;c.strokeStyle=i%4?'#46564a55':'#87594b55';c.lineWidth=3;c.beginPath();c.moveTo(xx,yy+30);c.lineTo(xx+9,yy-13);c.lineTo(xx+34,yy+22);c.lineTo(xx+45,yy-9);c.stroke();}
 for(let xx=wallX+25;xx<2800;xx+=185)this.line(xx,99,xx+19,35,'#65756a',4);
 for(const yy of [46,67,88]){this.line(wallX,yy,2800,yy+3,'#6b786b',1);for(let xx=wallX+8;xx<2800;xx+=24){this.line(xx-2,yy-3,xx+3,yy+3,'#657165',1);this.line(xx-3,yy+2,xx+3,yy-2,'#657165',1);}}
 const slogan='DISARMIAMO IL PATRIARCATO';let px=wallX+32;for(let i=0;i<slogan.length;i++){const letter=slogan[i];if(letter===' '){px+=20;continue;}const py=278+(i%3-1)*3;c.save();c.translate(px,py);c.rotate((i%5-2)*.012);this.rect(0,0,43,57,'#d8dcd2');this.text(letter,21,45,43,'#263c35','center');c.restore();px+=46;}
 this.rect(2740,254,21,39,'#34473e');for(let j=0;j<5;j++)this.line(2743,260+j*5,2757,260+j*5,'#cad1bf',1);
 for(let xx=wallX+10;xx<2800;xx+=47){this.line(xx,422,xx-5,410,'#536e43',2);this.line(xx,422,xx+7,412,'#69834d',2);}
 }
 else if(stage.id==='rosette'){
 const sky=c.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#b1b9b9');sky.addColorStop(1,'#dcddd1');this.rect(0,0,2800,430,sky);
 for(let i=0;i<5;i++){const bx=i*280-35;this.rect(bx,0,272,408,i%2?'#b4aa7d':'#b99b70');this.rect(bx,314,272,96,'#8e998a');
 for(let yy=318;yy<408;yy+=17)for(let xx=bx;xx<bx+272;xx+=19){let n=Math.abs(Math.floor(xx+yy))%4;this.poly([[xx,yy+3],[xx+12,yy],[xx+18,yy+10],[xx+9,yy+16],[xx,yy+12]],['#adb4a0','#c4bd9e','#85998b','#a3a889'][n]);}
 for(let xx=bx+19;xx<bx+240;xx+=82){this.rect(xx,324,48,26,'#334c43');for(let j=0;j<7;j++)this.line(xx+3+j*6,326,xx+3+j*6,348,'#668176',1);for(let yy=37;yy<302;yy+=91){this.rect(xx,yy,48,68,'#657e72');this.rect(xx+3,yy+3,42,36,'#afb6a2');for(let j=0;j<9;j++)this.line(xx+4,yy+5+j*4,xx+43,yy+5+j*4,'#788e80',1);this.rect(xx-5,yy+68,58,5,'#d0c6aa');if(xx>bx+70){this.poly([[xx-12,yy+71],[xx+55,yy+71],[xx+67,yy+60],[xx+5,yy+60]],'#939e8b');this.rect(xx-12,yy+71,67,9,'#b9b9a1');this.rect(xx-12,yy+42,67,27,'#6f8a7c');for(let j=0;j<8;j++)this.line(xx-10+j*9,yy+42,xx-10+j*9,yy+71,'#374f46',2);this.line(xx-12,yy+42,xx+55,yy+42,'#344e45',3);}}}
 this.rect(bx+5,0,12,315,'#ae9269');this.rect(bx+175,351,41,57,'#d1cbb0');this.rect(bx+182,355,27,53,'#435e50');}
 for(let i=0;i<5;i++){const bx=1430+i*285;this.tree(bx+100,365,1.6);this.tree(bx+220,366,1.2);this.rect(bx,347,260,64,'#c2c3ac');this.rect(bx-3,340,266,9,'#925c46');for(let j=0;j<27;j++)this.ellipse(bx+j*10,340,7,4,'#aa7556');this.rect(bx+55,350,65,60,'#7c5740');this.line(bx+87,352,bx+87,409,'#584a36',2);this.rect(bx+50,339,9,73,'#a56f4b');this.rect(bx+119,339,9,73,'#a56f4b');for(let j=0;j<8;j++)this.ellipse(bx+145+j*14,367,20,16,j%2?'#5e7950':'#6f824d');}
 this.rect(0,411,2800,28,'#a1a48f');for(let x=0;x<2800;x+=43)this.line(x,414,x-8,437,'#7e8778',1);this.rect(0,437,2800,5,'#c3c2aa');this.rect(0,442,2800,230,'#7c827c');
 for(let i=0;i<2600;i++)this.rect((i*139)%2800,446+(i*71)%226,2,1,i%2?'#bfc4b014':'#394a4020');for(let x=100;x<2800;x+=510){this.line(x,556,x+50,549,'#59655a',2);this.line(x+50,549,x+95,568,'#59655a',2);this.line(x+95,568,x+91,588,'#59655a',2);}
 for(const x of [1320,1810,2450]){this.line(x,429,x,233,'#586b60',4);this.line(x,233,x+13,228,'#586b60',4);this.ellipse(x+13,229,7,3,'#344c41');}
 const ax=1730;this.ellipse(ax+77,427,90,8,'#46554b55');this.poly([[ax,400],[ax+23,388],[ax+39,365],[ax+104,365],[ax+132,389],[ax+157,398],[ax+153,421],[ax+3,421]],'#b8c0b6');this.poly([[ax+38,387],[ax+47,369],[ax+101,369],[ax+121,387]],'#405c5b');this.line(ax+79,369,ax+79,388,'#a3b5a7',3);this.rect(ax+7,403,142,6,'#d9ddd0');for(const wx of [ax+30,ax+126]){this.ellipse(wx,419,14,14,'#303c36');this.ellipse(wx,419,7,7,'#a3afa0');}this.rect(ax+140,400,11,8,'#e0ded0');this.rect(ax+2,400,8,8,'#9e5d51');
 }
 else if(stage.id==='tarantola'){
 const sky=c.createLinearGradient(0,0,0,420);sky.addColorStop(0,'#abb9bd');sky.addColorStop(1,'#dce0d1');this.rect(0,0,2800,430,sky);
 for(let i=0;i<8;i++){const x=i*370-80;this.building(x,100+(i%3)*22,330,310-(i%3)*22,i%2?'#c8bb86':'#d4bb70',i);this.poly([[x-10,96+(i%3)*22],[x+55,69+(i%3)*22],[x+315,84+(i%3)*22],[x+340,100+(i%3)*22]],'#7f7463');for(let y=175;y<365;y+=58){this.rect(x+18,y,105,7,'#9c9c87');for(let xx=x+20;xx<x+120;xx+=10)this.line(xx,y-22,xx,y,'#58685e',2);}}
 this.rect(0,421,2800,251,'#727c79');for(let i=0;i<2400;i++)this.rect((i*137)%2800,440+(i*71)%230,2,1,i%2?'#bac0ad20':'#303e3c20');
 this.rect(0,373,2800,62,'#b1ac94');for(let y=376;y<435;y+=12)for(let x=0;x<2800;x+=27){this.line(x+(y%2)*12,y,x+25+(y%2)*12,y,'#817f6f',1);this.line(x,y,x,y+11,'#96937e',1);}this.rect(0,435,2800,7,'#d0c9b6');this.line(0,442,2800,442,'#56635e',3);
 const x=400;this.rect(x,0,660,383,'#bb7e60');this.rect(x+20,71,640,311,'#a85e43');
 for(let y=75;y<380;y+=8){this.line(x+20,y,x+660,y,'#694d3d',1);for(let xx=x+20+(y%16?0:14);xx<x+660;xx+=30)this.line(xx,y,xx,y+8,'#c58864',1);}
 this.rect(x+40,0,610,12,'#5c625a');this.rect(x+78,21,45,54,'#4d5550');this.rect(x+95,25,4,48,'#91816b');this.rect(x+215,0,9,100,'#655c4d');
 this.rect(x+109,160,55,151,'#333e3b');this.rect(x+117,166,39,143,'#686a58');this.line(x+136,167,x+136,308,'#292f2b',4);
 this.poly([[x+278,138],[x+442,101],[x+442,387],[x+278,387]],'#694c3d');this.poly([[x+278,138],[x+317,156],[x+317,367],[x+278,387]],'#a67d62');this.rect(x+320,155,120,208,'#544c40');this.poly([[x+337,322],[x+356,301],[x+361,315],[x+383,308],[x+378,330],[x+354,347]],'#b2ab96');
 for(let j=0;j<5;j++){this.poly([[x+310-j*9,363+j*12],[x+439+j*6,363+j*12],[x+445+j*6,372+j*12],[x+301-j*9,372+j*12]],'#bdbdb0');this.line(x+302-j*9,373+j*12,x+445+j*6,373+j*12,'#777f74',3);}
 this.rect(x+484,70,137,253,'#9fa59a');for(let i=0;i<26;i++)this.rect(x+487+(i*37)%130,73+(i*53)%245,9,17,'#b8bcaa25');this.rect(x+20,323,258,8,'#b7b39d');this.rect(x+443,323,217,8,'#b7b39d');this.rect(x+20,374,258,24,'#a0a899');this.rect(x+443,374,217,24,'#a0a899');
 for(let i=0;i<15;i++)this.line(x+470+i*7,353+Math.sin(i)*5,x+481+i*7,362+Math.cos(i)*5,'#d7d4bb88',3);
 this.line(x+466,429,x+466,144,'#364946',7);this.ellipse(x+466,163,34,40,'#d4dcd0');this.ellipse(x+466,163,31,37,'#266c9a');this.poly([[x+460,191],[x+472,191],[x+472,153],[x+485,153],[x+466,131],[x+447,153],[x+460,153]],'#e6e9d6');
 const hedge=(hx,w)=>{for(let i=0;i<w;i+=24){this.ellipse(hx+i,350+(i%5)*4,32,31,i%3?'#4e7050':'#3e5f49');this.ellipse(hx+i+10,326+(i%4)*5,25,29,'#627c50');}};
 hedge(0,370);hedge(1090,700);hedge(2020,760);
 for(const bx of [1140,2020]){this.rect(bx,365,570,38,'#858e7b');this.rect(bx,361,570,7,'#bec1aa');this.fence(bx,302,570,'#607c6d');for(const px of [bx+140,bx+300]){this.rect(px,342,32,67,'#969a82');this.rect(px-6,337,44,9,'#bcbda5');}this.rect(bx+178,367,116,40,'#667662');}
 for(const bx of [1190,2110]){this.poly([[bx,417],[bx+26,327],[bx+68,333],[bx+48,420]],'#ae8a60');this.poly([[bx+9,407],[bx+30,337],[bx+57,340],[bx+41,410]],'#514a3b');this.poly([[bx+67,418],[bx+56,316],[bx+95,314],[bx+112,418]],'#945b3d');this.line(bx+61,341,bx+98,340,'#b7875a',2);this.poly([[bx+108,419],[bx+88,309],[bx+108,307],[bx+133,419]],'#d9c18b');this.rect(bx-52,378,45,40,'#c5c9b6');this.rect(bx-48,383,36,29,'#9fae9f');this.line(bx-31,384,bx-31,411,'#647b70',2);this.poly([[bx+126,417],[bx+139,384],[bx+181,386],[bx+177,415]],'#8b775a');this.rect(bx+138,380,43,9,'#b6a482');}
 for(const tx of [65,1810,2700])this.tree(tx,391,1.5);
 for(const lx of [260,1880,2640])this.lamp(lx);
 for(let i=0;i<26;i++){let xx=(i*111)%2800;this.poly([[xx,430],[xx+9,427],[xx+12,433],[xx+2,436]],i%3?'#9d9365':'#c9c5ac');}
 const barX=1980;this.rect(barX,96,790,328,'#beb5a1');this.rect(barX,96,790,33,'#7c7c6b');
 for(const px of [barX+30,barX+250,barX+470,barX+690]){this.rect(px,164,63,249,'#ae6749');for(let yy=168;yy<412;yy+=11){this.line(px,yy,px+63,yy,'#d2b28c',1);for(let xx=px+(yy%22?0:16);xx<px+63;xx+=31)this.line(xx,yy,xx,yy+11,'#d2b28c',1);}}
 for(let i=0;i<3;i++){const wx=barX+96+i*220;this.rect(wx-5,187,147,226,'#e8e5d4');this.rect(wx,193,137,214,i===1?'#693b31':'#263e42');this.rect(wx,193,137,28,'#344a4c');this.rect(wx-3,222,143,7,'#e9e7d9');if(i!==1){this.poly([[wx+4,235],[wx+59,235],[wx+129,360],[wx+129,380]],'#77939444');this.rect(wx+2,350,133,7,'#a9473b');this.rect(wx+1,370,135,35,'#b9d0c6');this.rect(wx+64,229,5,177,'#e6e7d9');}}
 const door=barX+316;this.rect(door,230,137,174,'#8e3732');this.poly([[door,370],[door+137,363],[door+137,404],[door,404]],'#aa7a59');for(let yy=377;yy<404;yy+=10)this.line(door,yy,door+137,yy,'#6c5546',1);this.rect(door+2,315,91,63,'#af302c');this.rect(door,307,98,9,'#e4e3ce');this.rect(door+9,322,4,45,'#e9705533');this.rect(door+100,240,32,24,'#172526');
 this.rect(door+5,247,37,58,'#6d7360');for(let yy=250;yy<303;yy+=9)for(let xx=door+7;xx<door+40;xx+=9){this.rect(xx,yy,7,7,(xx+yy)%3?'#e6c776':'#8cb18b');this.line(xx,yy+3,xx+6,yy+3,'#e7e6d3',1);}this.rect(door+50,287,27,19,'#a7b6aa');this.rect(door+54,291,18,10,'#354d47');for(let j=0;j<3;j++){this.rect(door+84+j*12,291-j%2*5,6,15+j%2*5,'#5d8761');this.rect(door+85+j*12,287-j%2*5,4,4,'#c4b581');}
 for(let i=0;i<3;i++){let sx=barX+80+i*220;this.rect(sx,144,168,39,'#e0decb');this.rect(sx+3,147,162,33,'#1c2d2c');this.text(['PANINERIA','BAR VELA','CAFFÈ'][i],sx+84,169,i===1?20:15,'#e8dbb8','center');}
 this.poly([[barX-12,118],[barX+787,118],[barX+772,142],[barX-24,142]],'#e5e2c9');for(let ax=barX-24;ax<barX+770;ax+=23){this.rect(ax,141,23,7,'#e8e5ce');this.ellipse(ax+11,148,11,7,'#e8e5ce');this.line(ax+5,121,ax,142,'#b6bba6',1);}
 const chair=(cx,cy,color)=>{c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.moveTo(cx,cy+32);c.lineTo(cx+3,cy-15);c.quadraticCurveTo(cx+23,cy-36,cx+43,cy-15);c.lineTo(cx+48,cy+32);c.stroke();for(let j=0;j<5;j++)this.line(cx+9+j*7,cy-15,cx+12+j*6,cy+7,color,3);this.rect(cx+1,cy+8,45,6,color);this.line(cx+9,cy+14,cx+4,cy+40,color,4);this.line(cx+39,cy+14,cx+44,cy+40,color,4);};
 for(const tx of [barX+190,barX+520]){this.poly([[tx-15,369],[tx+81,369],[tx+92,378],[tx-23,378]],'#b7c7b9');this.line(tx+8,378,tx+3,423,'#3d6251',5);this.line(tx+65,378,tx+72,423,'#3d6251',5);this.rect(tx+27,354,12,15,'#dddfc4');this.rect(tx+29,356,8,10,'#678c9d');}chair(barX+137,382,'#285846');chair(barX+241,379,'#315e4b');chair(barX+469,380,'#e8e9d9');chair(barX+569,382,'#e8e9d9');chair(barX+713,381,'#e8e9d9');this.rect(barX+18,385,15,35,'#aeb9a7');this.ellipse(barX+25,385,8,4,'#d1d3be');this.rect(barX+21,392,6,11,'#3f5048');this.rect(barX+5,435,730,5,'#e1bb38');
 }
 else this.streetFront(stage);
 if(k==='supermarket'){
 this.rect(0,0,2800,672,'#c9cec1');this.rect(0,0,2800,105,'#dde0d4');
 for(let x=0;x<2800;x+=280){this.line(x,0,x+100,105,'#a8b2a7',6);this.rect(x+30,26,195,12,'#72837e');this.rect(x+34,28,187,7,'#f8fff0');}
 this.rect(0,105,2800,320,'#667b71');
 const colors=['#dfb84b','#ac3f32','#5a8260','#e7dfbf','#ce8540','#799aaf'];
 for(let bay=0;bay<9;bay++){let x=bay*315+12;
 this.rect(x,126,296,289,'#303f3d');this.rect(x,118,296,28,'#275b4c');this.text(['PASTA E RISO','CONSERVE','BIBITE'][bay%3],x+148,138,15,'#fff0ca','center');
 for(let row=0;row<4;row++){let y=156+row*61;for(let j=0;j<13;j++){let bx=x+8+j*22,h=28+(j+row)%3*7;this.rect(bx,y+44-h,17,h,colors[(j+row+bay)%colors.length]);this.rect(bx+2,y+29-h,13,6,'#dce2ce');this.rect(bx+2,y+26,13,10,'#ece1b7');this.line(bx+4,y+30,bx+12,y+30,'#53605c',2);}this.rect(x,y+45,296,7,'#c7cfc5');this.rect(x,y+52,296,7,'#f4e9ad');for(let j=0;j<9;j++)this.text('1,99',x+6+j*32,y+58,6,'#263e36');}
 this.rect(x,145,5,267,'#9aa89e');this.rect(x+291,145,5,267,'#9aa89e');}
 this.rect(0,425,2800,247,'#d8d8c6');for(let y=425;y<672;y+=31)this.line(0,y,2800,y,'#a3afa4',1);for(let x=-400;x<3200;x+=65)this.line(1400+(x-1400)*.74,425,x,672,'#a3afa4',1);
 for(const x of [910,2040]){this.rect(x,75,150,35,'#2e8d66');this.text('USCITA →',x+75,99,20,'#f4fff0','center');}
 this.rect(2510,337,230,85,'#6e8e7b');this.rect(2502,327,245,16,'#303f3e');this.rect(2615,279,57,43,'#253637');this.rect(2621,285,45,30,'#a8d6a8');this.rect(2637,319,13,10,'#303f3e');this.text('CASSA 3',2535,373,18,'#fff0d2');
 }
 const crops=[[0,.16,1,.61],[.02,.28,.96,.48],[0,.19,1,.63],[0,0,1,.91],[.02,.23,.96,.32]];
 const slots=stage.kind==='muralpark'?[70,610,1150,1690,2230]:[30,590,1150,1710,2270];
 for(let mi=0;false&&mi<5;mi++){const img=this.images['mural-'+mi];if(!img)continue;const [sx,sy,sw,sh]=crops[mi],px=slots[mi],h=stage.kind==='supermarket'?48:stage.kind==='muralpark'?188:126,py=stage.kind==='supermarket'?58:414-h,w=490;
 this.rect(px-5,py-7,w+10,h+12,'#67776c');c.drawImage(img,sx*img.width,sy*img.height,sw*img.width,sh*img.height,px,py,w,h);this.rect(px-7,py-10,w+14,6,'#9ca48b');this.rect(px-4,py+h,w+8,6,'#6c7964');
 }
 this._front=false;this.c=old;return off;}

 // Strada a misura d'uomo (stile Final Fight / Double Dragon): piano terra con negozi e portoni
 // alti quanto i personaggi, primo piano tagliato in alto, marciapiede e asfalto dove si combatte.
 streetFront(stage){const c=this.c;this._front=true;let seed=0;for(const ch of stage.id)seed=(seed*31+ch.charCodeAt(0))>>>0;const R=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const plaster=['#c9b48f','#b98f6e','#a7aa9e','#d3c4a0','#b9a08a','#a98f7c','#c4a27c','#9fa9a8'],
   shops=['ALIMENTARI','TABACCHI','PARRUCCHIERE','LAVANDERIA','FERRAMENTA','PIZZERIA','BAR SPORT','EDICOLA','KEBAB','PANETTERIA','PHONE CENTER','COMPRO ORO','MACELLERIA','CALZOLAIO'];
  const sky=c.createLinearGradient(0,0,0,120);sky.addColorStop(0,'#8fb3cc');sky.addColorStop(1,'#cfd8d2');this.rect(0,0,2800,40,sky);
  let x=-30;const lamps=[];
  while(x<2800){const w=Math.round(380+R()*190),col=plaster[Math.floor(R()*plaster.length)],dark=this.shade(col,-.18),light=this.shade(col,.12);
   // muro, zoccolo e cornicione
   this.rect(x,24,w,390,col);this.rect(x,24,w,10,dark);for(let k=0;k<40;k++)this.rect(x+R()*w,30+R()*370,2+R()*6,6+R()*20,'#00000010');
   this.rect(x,214,w,16,light);this.rect(x,228,w,4,dark);this.rect(x,372,w,40,this.shade(col,-.3));this.rect(x,370,w,4,this.shade(col,-.4));
   // primo piano: finestre con persiane e, a volte, balcone
   const nWin=w>480?3:2;for(let n=0;n<nWin;n++){const wx=x+Math.round((n+.5)*w/nWin)-36,shut=R()<.5?'#476f55':'#7a5236';
    this.rect(wx-4,46,80,124,this.shade(col,-.25));this.rect(wx,50,72,116,'#2c3a3e');this.rect(wx+4,54,64,108,R()<.35?'#e9d79b':'#41545a');this.rect(wx+35,54,2,108,'#2c3a3e');this.rect(wx,104,72,3,'#2c3a3e');
    if(R()<.6){for(const sx of [wx-30,wx+74]){this.rect(sx,48,28,120,shut);for(let yy=54;yy<164;yy+=7)this.rect(sx+3,yy,22,3,this.shade(shut,-.25));}}
    this.rect(wx-8,168,88,8,light);
    if(R()<.45){this.rect(wx-22,180,116,6,'#3c4142');for(let bx=wx-20;bx<wx+94;bx+=9)this.rect(bx,186,3,26,'#3c4142');this.rect(wx-22,208,116,5,'#3c4142');if(R()<.6){this.rect(wx+60,166,22,16,'#9a5a3c');this.ellipse(wx+71,162,16,10,'#4f7a3d');}}}
   if(R()<.5){const ax=x+20+R()*(w-90);this.rect(ax,120,56,40,'#d9dcd6');this.rect(ax,154,56,6,'#a7aba5');this.ellipse(ax+28,140,13,13,'#9ea39d');}
   // piano terra: negozio con insegna e vetrina o serranda, portone di casa
   const shopW=Math.round(w*.55),sx=x+18,shopName=shops[Math.floor(R()*shops.length)],signCol=['#7d2f2b','#24485a','#2f5a3a','#5a3a6b','#1f2a2e'][Math.floor(R()*5)];
   this.rect(sx-6,236,shopW+12,30,signCol);this.rect(sx-6,236,shopW+12,4,'#ffffff22');this.text(shopName,sx+shopW/2,258,Math.min(20,Math.floor(shopW/shopName.length*1.45)),'#f3e3b8','center');
   this.rect(sx,268,shopW,142,'#2b3437');
   if(R()<.45){// serranda abbassata con tag
    this.rect(sx+4,272,shopW-8,138,'#8d9393');for(let yy=276;yy<408;yy+=6)this.rect(sx+4,yy,shopW-8,2,'#6f7575');this.rect(sx+4,398,shopW-8,10,'#5f6464');
    c.strokeStyle=['#d8463b','#3b86d8','#e8d23b','#e8e8e8'][Math.floor(R()*4)];c.lineWidth=5;c.beginPath();let gx=sx+20+R()*(shopW-160),gy=330+R()*40;c.moveTo(gx,gy);for(let k=0;k<7;k++){gx+=14+R()*14;gy+=(R()-.5)*44;c.lineTo(gx,gy);}c.stroke();
   }else{// vetrina illuminata con merce e porta a vetri
    this.rect(sx+6,274,shopW-80,124,'#9fc3c6');this.rect(sx+6,274,shopW-80,124,'#ffffff18');for(let k=0;k<6;k++){const px=sx+14+k*((shopW-100)/6);this.rect(px,350-k%3*12,((shopW-100)/6)-8,48+k%3*12,['#c55a3b','#e6c35a','#5f8a5a','#eae3cf','#6a7fa8','#b0763f'][k]);}
    this.line(sx+8,280,sx+60,330,'#ffffff55',3);this.rect(sx+shopW-68,274,62,136,'#5c7376');this.rect(sx+shopW-62,280,50,124,'#a9c8c9');this.rect(sx+shopW-20,334,5,18,'#d0b25a');}
   this.rect(sx-6,266,shopW+12,4,'#1e2629');
   const dx=x+w-110;this.rect(dx-8,250,92,162,this.shade(col,-.3));this.rect(dx,258,76,154,'#5b3a26');this.rect(dx+6,264,30,142,'#6d4630');this.rect(dx+40,264,30,142,'#6d4630');for(const yy of [300,350])this.rect(dx+6,yy,64,3,'#4a2f20');this.rect(dx+33,330,3,16,'#d0b25a');this.rect(dx+38,330,3,16,'#d0b25a');
   this.rect(dx+86,300,16,30,'#c9c6b8');for(let k=0;k<4;k++)this.rect(dx+89,304+k*6,10,3,'#6b6a62');this.rect(dx+20,236,36,16,'#2a5f8f');this.text(String(2+Math.floor(R()*60)),dx+38,249,12,'#ffffff','center');
   // manifesti e scritte sul muro
   if(R()<.6){const px=sx+shopW+18;if(px+60<dx-12){this.rect(px,282,58,80,['#e7d9b0','#d9584a','#5a86b8'][Math.floor(R()*3)]);this.rect(px+6,292,46,8,'#1e1e1e55');this.rect(px+6,306,34,5,'#1e1e1e40');this.poly([[px+40,362],[px+58,340],[px+58,362]],col);}}
   // pluviale tra le case
   this.rect(x+w-6,24,10,388,'#6f6f69');this.rect(x+w-9,24,16,8,'#5d5d58');
   if(R()<.55)lamps.push(x+w*.5);x+=w;}
  // marciapiede in autobloccanti e cordolo
  this.rect(0,412,2800,30,'#b9b3a1');for(let yy=414;yy<442;yy+=10)for(let xx=(yy%20?0:15);xx<2800;xx+=30)this.rect(xx,yy,28,8,(xx*7+yy)%3?'#c3bdaa':'#aea896');
  this.rect(0,440,2800,8,'#d8d3c3');this.rect(0,448,2800,3,'#6e6d65');
  // arredo: cassonetti, bici, motorino, paletti, lampioni (tutto dietro la linea dei combattenti)
  for(let k=0;k<6;k++){const bx=200+k*470+Math.floor(R()*120),kind=k%3;
   if(kind===0){for(let n=0;n<2;n++){const cx=bx+n*78,cc=n?'#4a6b4a':'#5d6668';this.rect(cx,362,72,66,cc);this.rect(cx-3,356,78,10,this.shade(cc,-.2));this.rect(cx+8,376,56,4,'#00000030');this.ellipse(cx+12,430,7,7,'#1d1d1d');this.ellipse(cx+60,430,7,7,'#1d1d1d');}}
   else if(kind===1){c.strokeStyle='#2f3a40';c.lineWidth=4;c.beginPath();c.arc(bx,412,24,0,7);c.arc(bx+70,412,24,0,7);c.stroke();this.line(bx,412,bx+30,384,'#b8402f',4);this.line(bx+30,384,bx+70,412,'#b8402f',4);this.line(bx+30,384,bx+58,384,'#b8402f',4);this.line(bx+58,384,bx+70,412,'#b8402f',4);this.line(bx+58,384,bx+54,372,'#2f3a40',4);this.rect(bx+44,370,20,4,'#2f3a40');}
   else{this.ellipse(bx+20,414,17,17,'#222');this.ellipse(bx+96,414,17,17,'#222');this.poly([[bx+8,404],[bx+30,368],[bx+80,372],[bx+108,402],[bx+92,410],[bx+30,410]],['#6f9fb5','#c94f3d','#e8dfc8'][Math.floor(R()*3)]);this.rect(bx+44,360,34,8,'#2a2a2a');this.line(bx+30,368,bx+18,340,'#555',4);this.rect(bx+8,336,22,5,'#333');}}
  for(let xx=120;xx<2800;xx+=260)this.rect(xx,404,8,38,'#4b4f50');
  for(const lx of lamps){this.rect(lx-4,40,8,402,'#3f4547');this.rect(lx-4,40,46,7,'#3f4547');this.rect(lx+28,47,26,8,'#2f3537');this.ellipse(lx+41,57,12,4,'#f6dfa0');}
  // asfalto: grana, tombini, linee
  this.rect(0,451,2800,221,'#5d6264');for(let k=0;k<9000;k++){const xx=(k*137.7)%2800,yy=452+(k*61.3)%220;this.rect(xx,yy,1.6,1.4,k%3?'#6a6f71':'#50555757');}
  for(let xx=40;xx<2800;xx+=120)this.rect(xx,640,64,6,'#e8e2c8');
  for(let k=0;k<5;k++){const mx=260+k*560;this.ellipse(mx,560,26,9,'#3c4042');this.ellipse(mx,559,21,7,'#4a4f51');for(let q=-14;q<16;q+=6)this.rect(mx+q,556,2,6,'#35393b');}
  for(let k=0;k<8;k++){const cx=(k*373)%2800;this.line(cx,470+(k*37)%150,cx+40,478+(k*37)%150,'#4b5052',2);}
 }
 shade(hex,f){const n=parseInt(hex.slice(1,7),16);let r=n>>16,g=n>>8&255,b=n&255;const t=f<0?0:255,p=Math.abs(f);r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}
 sprite(e,time,camera){const c=this.c,img=this.images[e.def.id];if(!img)return;if(e.action!==e._la){if(e.action==='punch'||e.action==='kick')e._alt=!e._alt;e._la=e.action;}
 let f=e.dead?14:e.action==='hurt'?13:e.guard?12:e.z>0?11:e.action==='walk'?2+Math.floor(time*8)%2:e.action==='kick'?(e._alt?8:9):e.action==='punch'?(e._alt?5:7):e.action==='super'?(e.time>.25?15:7):e.action==='special'?(e._alt?7:5):e.action==='windup'?(e._alt?4:6):e.action==='down'?14:Math.floor(time*2)%2;let x=e.x-camera;const size=226,K=size/190;const horse=!e.dead&&e.dash?.m?.visual==='horse'&&window.ChurchHorse;let lift=0;if(horse){this.ellipse(x,e.y,90,14,'#182b2a65');lift=ChurchHorse.drawSide(c,x,e.y-e.z+8,e.dir,1,time,true)-50;f=10;}else this.ellipse(x,e.y,46,11,'#182b2a65');if(window.ChurchAnim)f=ChurchAnim.frame(e.def.id,f,time);c.save();c.globalAlpha=e.dead?Math.max(0,e.time):e.invuln>0&&Math.floor(time*20)%2?.55:1;c.translate(x,e.y-e.z+11-lift);c.scale(e.dir,1);c.drawImage(img,f%4*img.width/4,Math.floor(f/4)*img.height/4,img.width/4,img.height/4,-size/2,-size*.94,size,size);c.restore();if(e.enemy&&!e.dead){this.rect(x-32,e.y-e.z-163*K,64,5,'#25363a');this.rect(x-32,e.y-e.z-163*K,64*e.hp/e.maxHp,5,e.boss?'#efbc63':'#be766b');if(e.boss)this.text(e.def.nome,x,e.y-e.z-174*K,11,'#ffe2a3','center');if(e.action==='windup'){this.text('!',x,e.y-e.z-190*K,28,'#ff7463','center');c.strokeStyle='#e56e64';c.lineWidth=2;c.beginPath();c.ellipse(x+e.dir*25,e.y,70,22,0,0,Math.PI*2);c.stroke();}}}
 draw(g,previewStage=0){const c=this.c,stage=ChurchStreets.STAGES[g.mode==='menu'?previewStage:g.stage||0];if(!this.backdrops[stage.id])this.backdrops={[stage.id]:this.makeStage(stage)};const cam=g.camera||0,bs=this.bs||1;c.drawImage(this.backdrops[stage.id],cam*bs,0,1152*bs,672*bs,0,0,1152,672);if(g.mode==='menu')return;
 if(stage.kind==='rail'){const x=(g.time*85)%3700-700-cam;c.save();c.beginPath();c.rect(1930-cam,240,870,60);c.clip();this.rect(x,249,510,29,'#b1c2bd');for(let i=0;i<12;i++)this.rect(x+10+i*41,253,28,15,'#3c5d61');c.restore();}
 for(const f of g.pickups){this.ellipse(f.x-cam,f.y,18,6,'#344d44');this.rect(f.x-cam-6,f.y-29,12,25,'#a4d6a5');this.rect(f.x-cam-3,f.y-35,6,7,'#c8ecaf');}
 if(g.spawned&&g.enemies.some(e=>!e.dead)&&g.runMode!=='survival'){let x=g.gate-cam;if(x<1152){c.globalAlpha=.25;this.rect(x,430,5,180,'#f9c36a');c.globalAlpha=1;this.text('LIBERA IL PASSAGGIO',Math.min(x-10,1130),452,11,'#ffce86','right');}}
 // cani del quartiere sullo sfondo: disegnati PRIMA dei combattenti, così non li coprono
 if(this.images['animals-dogs'])for(let i=0;i<4;i++){let x=320+i*650-cam;if(x<-80||x>1250)continue;const img=this.images['animals-dogs'];c.drawImage(img,0,i*img.height/4,img.width/4,img.height/4,x,330,96,96);}
 const entities=[g.player,...g.enemies].sort((a,b)=>a.y-b.y);for(const e of entities)this.sprite(e,g.time,cam);
 for(const s of g.shots){const x=s.x-cam,y=s.y-s.z;this.ellipse(x,y,12,12,s.id==='zanfo'?'#aaa69b':s.id==='mariolino'?'#9adddc':'#eee4c9');if(s.id==='mario'||s.id==='baggio'){this.rect(x-4,y-4,8,8,'#334445');}this.line(x-s.dir*32,y,x-s.dir*15,y,'#f6d396',4);}
 for(const f of g.particles){if(f.comic&&window.ChurchSFX){ChurchSFX.drawPop(c,f.x-cam,f.y,f.text,f.size,f.life,f.seed);continue;}c.globalAlpha=Math.min(1,f.life*3);if(f.text)this.text(f.text,f.x-cam,f.y,20,f.color,'center');else{c.strokeStyle=f.color;c.lineWidth=3;c.beginPath();c.ellipse(f.x-cam,f.y,f.ring*(1-f.life),f.ring*.3*(1-f.life),0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;}
 const p=g.player;this.rect(20,18,340,75,'#14252ce8');this.text(p.def.nome.toUpperCase(),34,40,17);this.rect(34,51,310,12,'#634b4a');this.rect(34,51,310*p.hp/p.maxHp,12,'#f4c475');this.rect(34,72,310,6,'#34494b');this.rect(34,72,310*p.meter/100,6,'#8bd5cd');this.text(Math.ceil(p.hp)+' / '+p.maxHp,345,40,11,'#dec9a6','right');this.rect(800,18,332,75,'#14252ce8');this.text(stage.name.toUpperCase(),1117,40,16,'#f4c475','right');this.text((g.runMode==='survival'?'ONDATA '+(g.wave+1):'INCONTRO '+(g.wave+1)+' / 3')+'  •  '+g.enemies.filter(e=>!e.dead).length+' AVVERSARI',1117,61,12,'#d3cdb7','right');this.text('PUNTI '+g.score,1117,80,12,'#a4d4c9','right');if(p.combo>1)this.text(p.combo+' HIT',40,123,23,'#f4c475');this.rect(20,648,1112,5,'#233a40');this.rect(20,648,1112*p.x/2800,5,'#d8b77e');if(g.bossDone)this.text('USCITA →',1095,365,25,'#ffe1a0','right');if(g.toastTime>0){this.rect(350,105,452,40,'#17262cd9');this.text(g.toast,576,132,19,'#ffe1a0','center');}}
}
root.StreetRenderer=StreetRenderer;
})(window);
