/* The Church 2.6 — il cavallo dell'Innominato.
 * assets/cavallo-lato.png: 4 pose di galoppo (320x232 ciascuna); assets/cavallo-alto.png: 2 pose viste dall'alto (200x80).
 * drawSide/drawTop disegnano il cavallo con gli zoccoli (o il centro) nel punto dato e restituiscono
 * l'altezza della sella, così chi lo cavalca si siede al posto giusto.
 */
(function(){'use strict';
const side=new Image(),top=new Image();let ok=0;side.onload=top.onload=()=>{ok++;};side.src='assets/cavallo-lato.png';top.src='assets/cavallo-alto.png';
const SW=320,SH=232,SEAT=72; // la sella nell'immagine di lato è a 72 px dall'alto
function frame(t,moving){return moving?Math.floor(t*11)%4:0;}
/* x,y = punto a terra sotto la pancia; dir = 1 destra, -1 sinistra; s = scala */
function drawSide(c,x,y,dir,s,t,moving){const h=SH*s;if(!side.complete||!side.naturalWidth)return h*.62;const f=frame(t,moving);c.save();c.translate(x,y);c.scale(dir,1);c.imageSmoothingEnabled=false;
 c.drawImage(side,f*SW,0,SW,SH,-SW*s*.5,-h,SW*s,h);c.restore();return (SH-SEAT)*s;}
/* vista dall'alto: x,y centro, ang direzione */
function drawTop(c,x,y,ang,s,t,moving){if(!top.complete||!top.naturalWidth)return;const f=moving?Math.floor(t*8)%2:0;c.save();c.translate(x,y);c.rotate(ang);c.imageSmoothingEnabled=false;
 c.fillStyle='#00000040';c.beginPath();c.ellipse(4,5,48*s,14*s,0,0,6.3);c.fill();c.drawImage(top,f*200,0,200,80,-100*s*.5,-80*s*.5,200*s*.5,80*s*.5);c.restore();}
window.ChurchHorse={drawSide,drawTop,get ready(){return ok>=2}};
})();
