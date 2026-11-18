/* The Church — poteri dei 41 combattenti (versione 2.2).
 * Un unico sistema usato da "Strade di S. Andrea" (vista laterale) e da
 * "Quartiere" (vista dall'alto). Ogni personaggio ha 1-3 speciali, una super
 * e una passiva. I numeri sono tarati per il combattimento contro più nemici.
 */
(function(root){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Abbreviazioni dei tipi di mossa:
// shot = proiettile, melee = colpo frontale, dash = carica, aoe = onda circolare,
// aura = campo che segue, summon = alleato, buff = potenziamento, sweep = veicolo che
// attraversa lo schermo, rain = oggetti dal cielo, counter = contrattacco,
// teleport, finisher, random, copy, multi (più effetti insieme).
const S=(name,o)=>({name,...o});
const P={
baggio:{passive:{speed:1.08,label:'Bici nera: +8% velocità'},moves:[
 S('Foglia Morta',{kind:'shot',dmg:110,homing:true,visual:'ball',life:2.2,desc:'Pallone a giro che insegue il bersaglio'}),
 S('Bici nera',{kind:'dash',dmg:70,dist:380,visual:'bicycle',invuln:true,desc:'Sfreccia in bici, invulnerabile'})],
 sup:S("Il Rigore del '94",{kind:'random',outcomes:[{w:85,move:{kind:'shot',dmg:400,speed:950,pierce:true,size:1.8,visual:'ball'}},{w:15,move:{kind:'fail',text:'ALLE STELLE!',stun:.9}}],desc:'85%: bomba che trapassa tutti. 15%: alle stelle'})},
delpiero:{passive:{label:'Sempre lì: colpi critici +10%',crit:.1},moves:[
 S("Chiave all'angolino",{kind:'shot',dmg:100,low:true,visual:'wrench',desc:'Chiave inglese bassa e precisa'}),
 S('Cassetta degli attrezzi',{kind:'aoe',dmg:80,radius:150,status:{stun:.8},visual:'tools',desc:'Rovescia gli attrezzi: stordisce chi è vicino'})],
 sup:S('Tripla chiave inglese',{kind:'shot',dmg:130,perShot:true,count:3,gap:.14,pierce:true,visual:'wrench',desc:'Tre chiavi che trapassano la fila'})},
ronaldo:{passive:{speed:1.15,label:'Il fenomeno: +15% velocità'},moves:[
 S('Elastico',{kind:'counter',dur:1.15,dmg:110,desc:'Finta: se ti colpiscono, contrattacco garantito'}),
 S('Doppio Passo',{kind:'dash',dmg:60,dist:320,invuln:true,cost:15,cd:.8,desc:'Scatto invulnerabile'})],
 sup:S('Il Fenomeno',{kind:'dash',dmg:60,dist:900,time:.9,rehit:.14,zigzag:true,invuln:true,desc:'Sei dribbling in corsa, ogni tocco colpisce'})},
ciabatta:{passive:{label:'Impermeabile: -8% danni',def:.92},moves:[
 S('Ciabattata Rasoterra',{kind:'shot',dmg:85,low:true,boomerang:true,visual:'slipper',desc:'La ciabatta va e torna, colpisce due volte'}),
 S('Impermeabile nero',{kind:'buff',dur:5,self:{def:.55},desc:'Per 5 s subisci quasi metà dei danni'})],
 sup:S('Le Due Ciabatte',{kind:'multi',steps:[{kind:'shot',dmg:150,count:2,gap:.2,boomerang:true,visual:'slipper'},{kind:'buff',dur:12,self:{speed:1.3}}],desc:'Lancia entrambe e gioca scalzo: +30% velocità'})},
maradona:{passive:{speed:1.06,label:'Baricentro basso: +6% velocità'},moves:[
 S('Mano de Dios',{kind:'counter',dur:1.25,dmg:90,catchShots:true,desc:'Para anche i proiettili e risponde'}),
 S('Dribbling',{kind:'dash',dmg:70,dist:300,invuln:true,desc:'Salta l’avversario'})],
 sup:S('Il Gol del Secolo',{kind:'dash',dmg:140,dist:760,time:.85,rehit:.25,invuln:true,desc:'Attraversa tutti, invulnerabile'})},
marlboro:{passive:{label:'Fumatore: la nube dura di più',auraMul:1.3},moves:[
 S('Nube Tossica',{kind:'aura',radius:150,dur:4,pulse:.5,dmg:22,status:{blind:1.2},visual:'smoke',desc:'Fumo che acceca e consuma'}),
 S('Colpo di tosse',{kind:'aoe',dmg:65,radius:130,knock:260,visual:'smoke',desc:'Respinge chi è troppo vicino'})],
 sup:S('Il Quarto Pacchetto',{kind:'aura',radius:620,dur:6,pulse:.5,dmg:28,status:{blind:1},visual:'smoke',desc:'Tutta la strada si riempie di fumo'})},
zozza:{passive:{def:.88,label:'Unta: non si fa afferrare, -12% danni'},moves:[
 S('Mani Unte',{kind:'melee',dmg:130,hits:2,reach:115,unblockable:true,status:{slow:[.5,6]},desc:'Presa unta: il nemico scivola e rallenta'}),
 S("L'Urlo",{kind:'aoe',dmg:75,radius:270,knock:220,status:{stun:1},visual:'sound',desc:'Urla: stordisce tutto intorno'}),
 S('Panino Unto',{kind:'shot',dmg:40,status:{slow:[.55,6]},visual:'sandwich',desc:'Chi lo prende diventa pesante'})],
 sup:S('La Frittura delle Tre di Notte',{kind:'aura',radius:620,dur:6,pulse:.6,dmg:30,status:{slow:[.45,1]},visual:'oil',desc:'Olio bollente su tutta la strada'})},
baglioni:{passive:{label:'Doppia identità: guarisce colpendo',lifesteal:.08},moves:[
 S('La Vita È Adesso',{kind:'shot',dmg:80,pierce:true,status:{stun:.75},visual:'sound',desc:'Onda sonora che stordisce'}),
 S('Acuto',{kind:'aoe',dmg:60,radius:210,status:{confused:2.5},visual:'sound',desc:'I nemici, nostalgici, vagano confusi'})],
 sup:S('Questo Piccolo Grande Amore',{kind:'rain',dmg:120,visual:'tray',desc:'La Monica tira vassoi su tutti'})},
cavallo:{passive:{label:'Giovanili del Marocco: +10% danni',atk:1.1},moves:[
 S('Scuola Marocco',{kind:'melee',dmg:105,reach:150,unblockable:true,visual:'ball',desc:'Tecnica pulita: passa la guardia'}),
 S('Calcio del Cavallo',{kind:'melee',dmg:150,hits:2,reach:130,back:true,knock:330,desc:'Doppio calcio all’indietro'}),
 S('Galoppo',{kind:'dash',dmg:70,dist:340,desc:'Carica orizzontale'})],
 sup:S('Le Giovanili',{kind:'multi',steps:[{kind:'aoe',dmg:110,radius:180,knock:200},{kind:'buff',dur:10,self:{atk:2}}],desc:'Per 10 s tutti i colpi valgono il doppio'})},
gargoyle:{passive:{def:.82,label:'Di pietra: -18% danni'},moves:[
 S('Sguardo che Pietrifica',{kind:'melee',dmg:50,reach:280,width:90,status:{root:2.5},visual:'stone',desc:'Chi lo guarda resta immobile'}),
 S('Statua',{kind:'counter',dur:1.5,dmg:100,desc:'Assorbe tutto, poi risponde'})],
 sup:S('Il Muretto',{kind:'buff',dur:6,self:{reflect:.7,armor:1,def:.2},desc:'Chi lo colpisce si fa male da solo'})},
'4mani':{passive:{label:'Mani veloci: pugni più rapidi',fastPunch:true},moves:[
 S('Quattro Mani',{kind:'melee',dmg:100,hits:4,reach:130,desc:'Quattro pugni in un frame'}),
 S('Forbici e pettine',{kind:'melee',dmg:70,hits:2,reach:120,status:{bleed:[3,8]},visual:'scissors',desc:'Tagli che sanguinano'})],
 sup:S('Otto Mani',{kind:'melee',dmg:300,hits:8,reach:185,around:true,desc:'Il doppio, ovviamente, tutto intorno'})},
renegade:{passive:{speed:1.1,label:'Sempre in moto: +10% velocità'},moves:[
 S('Carica della Chiesetta',{kind:'dash',dmg:120,dist:540,visual:'motorbike',armor:true,knock:260,desc:'Entra in moto attraverso la strada'}),
 S('Graziella Drift',{kind:'aoe',dmg:90,hits:3,radius:160,visual:'bicycle',desc:'Pedalata circolare, tre colpi'})],
 sup:S('Il Diavolo nei Muri',{kind:'sweep',dmg:95,count:4,visual:'motorbike',desc:'Quattro passaggi in moto'})},
marines:{passive:{label:'Tacco 12: i calci stordiscono',kickStun:.25},moves:[
 S('Tacco 12',{kind:'melee',dmg:115,reach:125,status:{stun:.7},self:{invuln:.45},desc:'Stiletto ascendente'}),
 S('Mimetica',{kind:'aoe',dmg:0,radius:620,status:{blind:3},visual:'camo',desc:'Tuta verde: i nemici ti perdono di vista'})],
 sup:S('Sensualità a Cascate',{kind:'aoe',dmg:200,radius:460,status:{noAttack:4},visual:'hearts',desc:'Si distraggono e alla fine chiedono scusa'})},
nunzio:{passive:{label:'Gratta e vinci: +energia a ogni KO',koMeter:6},moves:[
 S('Rasoio a Mano Libera',{kind:'melee',dmg:75,hits:3,reach:115,status:{bleed:[5,7]},visual:'scissors',desc:'Tre tagli, poi sanguinamento'}),
 S('Teoria del Complotto',{kind:'aoe',dmg:30,radius:270,status:{confused:4},visual:'sound',desc:'Monologo: i nemici si confondono'}),
 S('Gratta e Vinci',{kind:'random',cost:15,outcomes:[{w:2,move:{kind:'buff',self:{heal:150},text:'VINTO: VITA!'}},{w:2,move:{kind:'buff',self:{meter:45},text:'VINTO: ENERGIA!'}},{w:3,move:{kind:'fail',text:'NON HAI VINTO'}},{w:1,move:{kind:'rain',dmg:90,visual:'card',text:'JACKPOT!'}}],desc:'Prova la fortuna'})],
 sup:S('Il Monologo',{kind:'aoe',dmg:120,radius:620,status:{confused:8,slow:[.5,8]},visual:'sound',desc:'Confusi e rallentati a lungo'})},
petrone:{passive:{def:.9,label:'Picchiatore: -10% danni'},moves:[
 S('Portiera della Smart',{kind:'melee',dmg:125,reach:120,knock:360,visual:'car',desc:'Portiera in faccia'}),
 S('Testata di Via',{kind:'melee',dmg:160,reach:85,unblockable:true,status:{stun:1},desc:'Presa e testata, imparabile'})],
 sup:S('Non Ci Sto Più Dentro',{kind:'melee',dmg:400,hits:5,reach:120,unblockable:true,status:{stun:1.5},desc:'Cinque testate consecutive'})},
ceravolo:{passive:{label:'Sauron sempre al guinzaglio',pet:'sauron'},moves:[
 S('Sguinzaglia',{kind:'summon',sprite:'sauron',dur:8,pulse:.8,dmg:32,speed:300,desc:'Sauron attacca per 8 s'}),
 S('Michelinooo!',{kind:'aoe',dmg:45,radius:290,status:{stun:1.2},visual:'sound',desc:'Il richiamo dal balcone stordisce'})],
 sup:S('Il Guinzaglio Slacciato',{kind:'multi',steps:[{kind:'aoe',dmg:150,radius:200},{kind:'summon',sprite:'sauron',dur:20,pulse:.45,dmg:40,speed:360}],desc:'Il rottweiler non si ferma più'})},
luigina:{passive:{label:'Bidella: i nemici attaccano più piano',enemySlowAttack:1.15},moves:[
 S('Ciabatta Drone',{kind:'shot',dmg:100,homing:true,life:3,visual:'slipper',desc:'La ciabatta insegue il bersaglio'}),
 S('Silenzio in corridoio!',{kind:'aoe',dmg:30,radius:230,status:{noAttack:3},visual:'sound',desc:'Per 3 s nessuno attacca'})],
 sup:S('Rispetto per la Scuola',{kind:'aoe',dmg:120,radius:620,status:{noAttack:6,root:6},visual:'school',desc:'Tutti in fila per due, fermi'})},
loste:{passive:{label:'Alto rischio: critici +15%',crit:.15},moves:[
 S('Bustina',{kind:'random',outcomes:[{w:1,move:{kind:'aoe',dmg:40,radius:260,status:{slow:[.4,5]},visual:'smoke',text:'ROBA BUONA'}},{w:1,move:{kind:'fail',text:'ROBA TAGLIATA'}},{w:1,move:{kind:'fail',text:'TORNA INDIETRO',selfDmg:80}}],desc:'Rallenta tutti… o niente… o ti fa male'}),
 S('Ombra nella Notte',{kind:'random',outcomes:[{w:1,move:{kind:'teleport',dmg:90,status:{stun:.6}}},{w:1,move:{kind:'fail',text:'SCOPERTO',stun:.7}}],desc:'50%: riappare alle spalle'})],
 sup:S('La Roba Buona',{kind:'random',outcomes:[{w:1,move:{kind:'aoe',dmg:420,radius:620,visual:'smoke',text:'ROBA BUONA!'}},{w:1,move:{kind:'fail',text:'ERA TAGLIATA'}}],desc:'50%: devastante. 50%: niente'})},
gigi:{passive:{label:'Partigiano: non si arrende sotto il 20%',lastStand:.2},moves:[
 S('Staffetta',{kind:'dash',dmg:85,dist:460,visual:'bicycle',invuln:true,desc:'In bici, invulnerabile'}),
 S('Grappa del partigiano',{kind:'buff',dur:6,self:{heal:110,atk:1.25},desc:'Cura e attacco +25%'})],
 sup:S('Bella Ciao',{kind:'multi',steps:[{kind:'aoe',dmg:90,radius:220,knock:240},{kind:'buff',dur:20,self:{atk:1.4,def:.6}}],desc:'Attacco +40% e difesa +40% per 20 s'})},
pannella:{passive:{label:'Reduce del ’68: rigenera piano',regen:2},moves:[
 S('Megafono',{kind:'shot',dmg:80,pierce:true,knock:260,status:{stun:.4},visual:'sound',desc:'Onda d’urto che respinge'}),
 S('Sciopero della Fame',{kind:'buff',dur:4,self:{regen:32,armor:1},desc:'Recupera vita e assorbe i colpi'})],
 sup:S("L'Assemblea",{kind:'aoe',dmg:150,radius:620,status:{noAttack:6},visual:'sound',desc:'Discorso: per 6 s nessuno attacca'})},
luigi:{passive:{label:'Il Radar: mai colpito alle spalle',backAware:true},moves:[
 S('Memoria Assoluta',{kind:'copy',mul:1.3,fallback:{kind:'melee',dmg:90,reach:130},desc:'Ripete la tua ultima speciale, +30%'}),
 S('Il Radar',{kind:'buff',dur:6,self:{dodge:.6},desc:'Per 6 s schiva il 60% dei colpi'})],
 sup:S('Il Quartiere',{kind:'finisher',bossDmg:520,visual:'crowd',text:'TUTTO S. ANDREA!',desc:'Tutto il quartiere entra in scena'})},
mario:{passive:{label:'Fumo passivo + scimmia sotto il 25%',smoke:{radius:95,dmg:6,pulse:.5},autoSummon:{below:.25,move:{kind:'summon',sprite:'monkey',dur:10,pulse:.35,dmg:26,speed:380}}},moves:[
 S('Pallonata Mach 3',{kind:'shot',dmg:120,speed:1150,pierce:true,visual:'ball',desc:'Il proiettile più veloce del gioco'}),
 S('Fumo Passivo',{kind:'aura',radius:155,dur:5,pulse:.4,dmg:18,status:{blind:.6},visual:'smoke',desc:'Fuma addosso agli altri'})],
 sup:S('La Scimmia dal Giubbotto',{kind:'summon',sprite:'monkey',dur:12,pulse:.32,dmg:30,speed:400,desc:'La scimmia combatte con te'})},
american:{passive:{label:'Guardia Alta: -15% danni frontali',frontDef:.85},moves:[
 S('Gancio Americano',{kind:'melee',dmg:165,reach:120,knock:420,status:{stun:1},desc:'Il colpo singolo più potente'}),
 S('Uno-Due',{kind:'melee',dmg:65,hits:2,reach:110,cost:10,cd:.45,desc:'Jab-diretto rapidissimo'})],
 sup:S('The American Dream',{kind:'dash',dmg:32,dist:520,time:1,rehit:.08,armor:true,desc:'Dodici pugni in corsa'})},
bruce:{passive:{def:.88,label:'Quattro per quattro: -12% danni',pet:'threehead'},moves:[
 S('Il guinzaglio a tre teste',{kind:'summon',sprite:'threehead',dur:8,pulse:.7,dmg:35,speed:320,desc:'Il doberman a tre teste attacca'}),
 S('Sgasata',{kind:'dash',dmg:140,dist:620,visual:'4x4',armor:true,knock:320,desc:'4x4 a tutto gas'})],
 sup:S("Via delle Rosette a Cento all'Ora",{kind:'multi',steps:[{kind:'sweep',dmg:130,count:3,visual:'4x4'},{kind:'summon',sprite:'threehead',dur:8,pulse:.6,dmg:35,speed:320}],desc:'Tre passaggi col 4x4 e il cane libero'})},
duzzi:{passive:{label:'Mancino: 15% di colpi imparabili',leftie:.15},moves:[
 S('Sinistro a Giro',{kind:'shot',dmg:105,homing:true,curve:true,visual:'ball',desc:'Curva al contrario di tutti'}),
 S('Lingua Fuori',{kind:'counter',dur:1.1,dmg:100,meterGain:30,desc:'Provoca: se attaccano, contrattacco e +30 energia'})],
 sup:S('Il Diavolo',{kind:'aura',radius:210,dur:4,pulse:.3,dmg:36,visual:'fire',desc:'Fiamme rossonere'})},
simonino:{passive:{reach:1.3,label:'Allungo: portata +30%, stile +20%',style:1.2},moves:[
 S('Il Diagonale',{kind:'shot',dmg:110,low:true,speed:760,visual:'ball',desc:'Rasoterra sul palo lontano'}),
 S('Voce Rauca',{kind:'aoe',dmg:70,radius:170,unblockable:true,visual:'sound',desc:'Non urla, graffia: passa sempre'}),
 S('Marlboro Light',{kind:'multi',steps:[{kind:'aura',radius:115,dur:4,pulse:.5,dmg:12,visual:'smoke'},{kind:'buff',dur:4,self:{regen:9}}],desc:'Fumo leggero e recupero'})],
 sup:S('Va-Va-Voom',{kind:'multi',steps:[{kind:'dash',dmg:70,dist:600,time:.6,rehit:.2},{kind:'shot',dmg:140,speed:900,visual:'ball',delay:.6}],desc:'Accelerazione, tre tocchi e conclusione'})},
abbabut:{passive:{dodge:.25,speed:1.12,label:'Piccolino: schiva il 25%'},moves:[
 S('Motorino',{kind:'dash',dmg:30,dist:300,invuln:true,cost:12,cd:.6,desc:'Velocità massima'}),
 S('Raddoppio',{kind:'dash',dmg:90,dist:420,low:true,status:{stun:.7},desc:'Scivolata che copre mezzo schermo'})],
 sup:S('Novanta Minuti',{kind:'dash',dmg:42,dist:900,time:1.1,rehit:.12,zigzag:true,invuln:true,desc:'Otto scivolate alternate'})},
ampebi:{passive:{def:.85,label:'Leggero: -15% danni'},moves:[
 S('Entrataccia',{kind:'dash',dmg:110,dist:360,low:true,status:{stun:1.2},desc:'Scivolata da dietro, netta'}),
 S('Planet Rock',{kind:'melee',dmg:85,reach:100,self:{armor:1},desc:'Colpo di testa, i ricci attutiscono'})],
 sup:S('Fallo da Ultimo Uomo',{kind:'dash',dmg:340,dist:620,status:{stun:2},desc:'Entrata a due piedi'})},
izza:{passive:{reach:1.25,label:'Tentacoli: portata +25%'},moves:[
 S('Parata Tentacolare',{kind:'counter',dur:1,dmg:60,catchShots:true,desc:'Ferma ogni proiettile'}),
 S('Uscita Bassa',{kind:'melee',dmg:130,reach:270,width:80,pull:true,visual:'tentacle',desc:'Presa a distanza: tira a sé'})],
 sup:S('La Saracinesca',{kind:'buff',dur:6,self:{armor:1,def:.15,reflect:.5},desc:'Da qui non passa niente'})},
beppone:{passive:{label:'Racconta: rigenera quando nessuno attacca',calmRegen:6},moves:[
 S('Storia Memorabile',{kind:'multi',steps:[{kind:'aoe',dmg:0,radius:300,status:{noAttack:4},visual:'story'},{kind:'buff',dur:4,self:{regen:20}}],desc:'Tutti ascoltano: niente attacchi, Beppone recupera'}),
 S('Zoccolata',{kind:'melee',dmg:110,reach:115,knock:300,desc:'Zoccolo di legno'})],
 sup:S('La Storia Definitiva',{kind:'finisher',bossDmg:380,visual:'story',text:'TUTTI SEDUTI A SENTIRE',desc:'Si siedono per terra: scontro vinto'})},
labbro:{passive:{label:'Fotografo: i colpi accecano',hitBlind:.4},moves:[
 S('Flash',{kind:'melee',dmg:50,reach:270,width:95,status:{blind:3},visual:'flash',desc:'Accecamento in pieno viso'}),
 S('Scatto Rubato',{kind:'copy',mul:1,fallback:{kind:'aoe',dmg:40,radius:200,status:{stun:1},visual:'flash'},desc:'Rifà identica la tua ultima speciale'})],
 sup:S('Il Servizio Fotografico',{kind:'aoe',dmg:280,radius:620,status:{blind:8},visual:'flash',desc:'Raffica di flash: nessuno ci vede più'})},
buccia:{passive:{label:'Sistema: -15% costo speciali',costMul:.85},moves:[
 S('Hack',{kind:'aoe',dmg:20,radius:320,status:{random:true},visual:'glitch',desc:'Un effetto a caso su ogni nemico'}),
 S('Overclock',{kind:'buff',dur:8,self:{speed:1.8,atk:1.2,burn:5},desc:'Velocità doppia, ma brucia vita'})],
 sup:S('Format C:',{kind:'aoe',dmg:200,radius:620,status:{stun:2,reset:true},visual:'glitch',desc:'Azzera tutto: si riparte da zero'})},
zulu:{passive:{label:'Reputazione: nessuno attacca per primo',hesitation:1.2},moves:[
 S('Dolby Surround',{kind:'aura',radius:210,dur:5,pulse:.5,dmg:12,ramp:2.4,visual:'sound',desc:'Bassi a tempo, sempre più forti'}),
 S('Finestrini Neri',{kind:'teleport',dmg:60,random:true,self:{invuln:1},desc:'Sparisce e riappare'}),
 S('La Peugeot',{kind:'dash',dmg:130,dist:520,visual:'peugeot',status:{stun:.5},desc:'Investe chi è davanti'})],
 sup:S("'A Chiamata",{kind:'sweep',dmg:190,count:2,visual:'headlights',desc:'Una telefonata. Si vedono solo i fari'})},
miguel:{passive:{label:'Famiglia: alleati più forti',summonMul:1.2},moves:[
 S('98 Fratelli',{kind:'summon',sprite:'brother',dur:6,pulse:.9,dmgRange:[50,140],speed:330,desc:'Un fratello a caso in aiuto'}),
 S('Equatore',{kind:'buff',dur:5,self:{regen:15,speed:1.2},desc:'Porta il suo equatore: cura e velocità'})],
 sup:S('Reunion Familiar',{kind:'summon',sprite:'brother',count:7,dur:7,pulse:.55,dmg:22,speed:360,desc:'Arrivano tutti'})},
lumumba:{passive:{label:'Turno di notte: +energia col tempo',meterRegen:1.6},moves:[
 S('Carrello della Spesa',{kind:'dash',dmg:60,dmgMax:160,dist:520,visual:'cart',desc:'Più corre, più fa male'}),
 S('Turno di Notte',{kind:'buff',dur:6,self:{unblockable:1,atk:1.25},desc:'I colpi passano la guardia'})],
 sup:S("Il Sogno dell'Africa",{kind:'aoe',dmg:360,radius:620,unblockable:true,visual:'africa',desc:'La strada diventa Abidjan'})},
mohamed:{passive:{label:'Pazienza: parare carica il contrattacco',patience:true},moves:[
 S('Tè alla Menta',{kind:'buff',dur:2,self:{regen:60},desc:'Beve e recupera'}),
 S('Birra Moretti',{kind:'shot',dmg:90,visual:'bottle',desc:'Bottiglia lanciata'})],
 sup:S('Chi Ha Pazienza',{kind:'multi',steps:[{kind:'counter',dur:2,dmg:240,patience:true},{kind:'buff',dur:2,self:{armor:1}}],desc:'Contrattacco moltiplicato dalla pazienza'})},
gaetano:{passive:{label:'Sotto il 30%: furia +50%',rage:{below:.3,atk:1.5}},moves:[
 S("L'Esilio",{kind:'melee',dmg:200,reach:125,knock:950,unblockable:true,desc:'Scaglia fuori dal quartiere'}),
 S('Furia Mitica',{kind:'buff',dur:5,self:{atk:1.4,armor:1},desc:'Imparabile e furioso'})],
 sup:S('Il Nome Completo',{kind:'aura',radius:330,dur:6,pulse:.4,dmg:30,unblockable:true,visual:'sound',desc:'Pronuncia tutto il nome'})},
venom:{passive:{reach:1.4,label:'Simbionte: portata +40%'},moves:[
 S('Simbionte',{kind:'melee',dmg:125,hits:3,reach:300,width:85,visual:'tentacle',desc:'Tentacoli, raggio doppio'}),
 S('Ni-Ni-Nico',{kind:'melee',dmg:40,hitsByHealth:[3,9],perHit:true,reach:140,desc:'Più è ferito, più colpi'})],
 sup:S("L'Esiliato Torna",{kind:'aoe',dmg:430,hits:8,radius:620,visual:'tentacle',desc:'Tentacoli da tutta la strada'})},
max4mani:{passive:{label:'Parrucchiere: tagli che sanguinano',bleedHits:true},moves:[
 S('Sforbiciata',{kind:'melee',dmg:110,hits:2,reach:125,status:{bleed:[3,8]},visual:'scissors',desc:'Due colpi di forbice'}),
 S('Pettine contropelo',{kind:'counter',dur:1.15,dmg:80,desc:'Para col pettine e risponde'}),
 S('Un bianchino',{kind:'buff',dur:3,self:{regen:30},desc:'Un sorso: recupera vita'})],
 sup:S('Taglio, piega e bianchino',{kind:'multi',steps:[{kind:'melee',dmg:340,hits:6,reach:180,around:true,visual:'scissors'},{kind:'buff',self:{heal:100}}],desc:'Sei colpi e brindisi'})},
mariolino:{passive:{reach:1.2,label:'Piffero: portata +20%'},moves:[
 S('Soffio del professore',{kind:'shot',dmg:95,visual:'music',desc:'Una nota attraversa la strada'}),
 S('Trillo stonato',{kind:'melee',dmg:55,reach:230,width:90,status:{root:1.5},visual:'music',desc:'Blocca chi lo sente'}),
 S('Fiato lungo',{kind:'buff',dur:3,self:{regen:20},desc:'Suona piano e recupera'})],
 sup:S('Concerto di quartiere',{kind:'aura',radius:320,dur:5,pulse:1,dmg:72,status:{stun:.35},visual:'music',desc:'Cinque frasi di piffero'})},
zanfo:{passive:{label:'Tiratore: proiettili +15%',shotMul:1.15},moves:[
 S('Sassata',{kind:'shot',dmg:90,visual:'stone',desc:'Pietra in linea retta'}),
 S('Sasso radente',{kind:'shot',dmg:70,low:true,status:{stun:.45},visual:'stone',desc:'Rasoterra, fa inciampare'}),
 S('Tre pietre',{kind:'shot',dmg:60,perShot:true,count:3,gap:.17,visual:'stone',desc:'Tre pietre in fila'})],
 sup:S("Frana di Sant'Andrea",{kind:'rain',dmg:180,waves:2,visual:'stone',desc:'Pietre dal cielo su tutti'})}
};
const COST=[20,30,35],CD=[1.1,1.8,2.6];
function kit(id){const k=P[id]||P.mario;return{passive:k.passive||{},sup:{...k.sup,cost:k.sup.cost??100,cd:k.sup.cd??3},moves:k.moves.map((m,i)=>({...m,cost:m.cost??COST[i],cd:m.cd??CD[i]}))};}

// ---------------------------------------------------------------- stati
const ST_LABEL={stun:'STORDITO',slow:'LENTO',blind:'ACCECATO',confused:'CONFUSO',root:'BLOCCATO',bleed:'FERITO',noAttack:'TREGUA'};
function applyStatus(e,st){if(!st||!e||e.dead)return;e.st=e.st||{};const imm=e.boss?.55:1;
 for(const [k,v] of Object.entries(st)){
  if(k==='reset'){e.buff={};continue;}
  if(k==='random'){const pick=[{stun:2},{confused:4},{noAttack:4},{root:3},{blind:3}][Math.floor(Math.random()*5)];applyStatus(e,pick);continue;}
  if(Array.isArray(v)){const [a,b]=v;if(k==='slow')e.st.slow={v:a,t:Math.max(e.st.slow?.t||0,b*imm)};else if(k==='bleed')e.st.bleed={t:a,dps:b};continue;}
  e.st[k]=Math.max(e.st[k]||0,v*imm);
 }}
const st=(e,k)=>{const v=e?.st?.[k];return v&&(typeof v==='number'?v>0:v.t>0);};
function canMove(e){return !(st(e,'stun')||st(e,'root'));}
function canAttack(e){return !(st(e,'stun')||st(e,'noAttack'));}
function speedMul(e){let m=e.st?.slow?.t>0?e.st.slow.v:1;if(e.buff?.speed?.t>0)m*=e.buff.speed.v;if(e.kit?.passive.speed)m*=e.kit.passive.speed;return m;}
function outMul(e){let m=1;if(e.buff?.atk?.t>0)m*=e.buff.atk.v;const p=e.kit?.passive||{};if(p.atk)m*=p.atk;if(p.rage&&e.hp<e.maxHp*p.rage.below)m*=p.rage.atk;if(p.style&&(e.cleanTime||0)>3)m*=p.style;if(e.patienceBonus){m*=1+e.patienceBonus;}if(st(e,'weak'))m*=.5;return m;}
function labelOf(e){if(!e.st)return'';for(const k of ['stun','root','noAttack','confused','blind','slow','bleed'])if(st(e,k))return ST_LABEL[k];return'';}

// ------------------------------------------------------------- uso mosse
function facing(u){return{x:u.fx??u.dir??1,y:u.fy??0};}
function inCone(g,u,t,reach,width=60,back=false,around=false){const f=facing(u),dx=t.x-u.x,dy=(t.y-u.y)*(g.depth||1);if(around)return Math.hypot(dx,dy)<reach;let along=dx*f.x+dy*f.y,perp=Math.abs(-dx*f.y+dy*f.x);if(back)along=-along;return along>-25&&along<reach&&perp<width;}
function hit(g,u,t,dmg,m,extra={}){if(!t||t.dead)return false;const ok=g.hurt(t,dmg*outMul(u)*(m.mulBoost||u.mulBoost||1),u,{power:true,unblockable:m.unblockable||u.buff?.unblockable?.t>0,knock:m.knock??80,stagger:true,...extra});if(ok){applyStatus(t,m.status);if(m.pull){t.x+=(u.x-t.x)*.65;t.y+=(u.y-t.y)*.65;}const p=u.kit?.passive;if(p?.lifesteal)u.hp=Math.min(u.maxHp,u.hp+dmg*p.lifesteal);if(p?.hitBlind)applyStatus(t,{blind:p.hitBlind});}return ok;}
function use(g,u,slot,opts={}){const k=u.kit||(u.kit=kit(u.def.id));const m=slot==='super'?k.sup:k.moves[slot];if(!m)return{ok:false,reason:'none'};
 u.cds=u.cds||{};const key=String(slot);if(!opts.free){if((u.cds[key]||0)>0)return{ok:false,reason:'cooldown',left:u.cds[key]};const cost=Math.round(m.cost*(k.passive.costMul||1));if((u.meter||0)<cost)return{ok:false,reason:'energy',need:cost};u.meter-=cost;}
 if(!canAttack(u)&&!opts.free)return{ok:false,reason:'stunned'};
 u.cds[key]=m.cd;run(g,u,m,slot);if(m.kind!=='copy')u.lastPower=m;g.emit?.(slot==='super'?'super':'special',u);
 return{ok:true,move:m};}
function run(g,u,m,slot){const foes=g.foes(u),f=facing(u);
 if(m.text)g.text(m.text,u.x,u.y-150,'#ffe08a');
 switch(m.kind){
 case 'shot':{const n=m.count||1;for(let i=0;i<n;i++)g.shots.push({team:u.team,owner:u,x:u.x+f.x*40,y:u.y+f.y*40+(m.spread?(i-(n-1)/2)*m.spread:0),z:m.low?18:58,vx:f.x*(m.speed||560),vy:f.y*(m.speed||560),delay:(m.delay||0)+i*(m.gap||0),life:m.life||1.7,age:0,dmg:m.dmg/(n>1&&!m.perShot?n:1)*(u.kit?.passive.shotMul||1),m,hit:new Set(),size:m.size||1,visual:m.visual||'energy'});break;}
 case 'melee':{let hits=m.hits||1;if(m.hitsByHealth)hits=Math.round(m.hitsByHealth[0]+(1-u.hp/u.maxHp)*(m.hitsByHealth[1]-m.hitsByHealth[0]));const reach=(m.reach||130)*(u.kit?.passive.reach||1)+25;
  const targets=foes.filter(t=>inCone(g,u,t,reach,m.width||60,m.back,m.around));const per=m.perHit?m.dmg:m.dmg/hits;
  for(let h=0;h<hits;h++)g.later(h*.09,()=>{for(const t of targets)hit(g,u,t,per,m,{knock:h===hits-1?(m.knock??120):20});});
  g.fx.push({type:m.around?'ring':'slash',x:u.x,y:u.y,fx:f.x,fy:f.y,r:reach,life:.3,max:.3,visual:m.visual,back:m.back});break;}
 case 'dash':{const d=m.dist||320,t=m.time||Math.max(.28,d/1300);u.dash={vx:f.x*d/t,vy:f.y*d/t,t,max:t,m,hitT:new Map(),zig:m.zigzag?1:0,ox:u.x};if(m.invuln)u.invuln=Math.max(u.invuln||0,t+.1);if(m.armor)u.armorT=t+.1;break;}
 case 'aoe':{const hits=m.hits||1;const targets=foes.filter(t=>g.dist(u,t)<m.radius);for(let h=0;h<hits;h++)g.later(h*.1,()=>{for(const t of targets){if(m.dmg>0)hit(g,u,t,m.dmg/hits,m,{knock:h===hits-1?(m.knock??60):0});else applyStatus(t,m.status);}});g.fx.push({type:'ring',x:u.x,y:u.y,r:m.radius,life:.5,max:.5,visual:m.visual});break;}
 case 'aura':g.auras.push({owner:u,team:u.team,m,radius:m.radius,life:m.dur*(u.kit?.passive.auraMul||1),age:0,next:.05,visual:m.visual});break;
 case 'summon':{const n=m.count||1;for(let i=0;i<n;i++)g.summons.push({owner:u,team:u.team,m,x:u.x-f.x*40+(i-(n-1)/2)*30,y:u.y+(i%2?25:-25)*(g.depth?1:1.5),life:m.dur,age:0,next:.4+i*.1,dir:f.x||1,sprite:m.sprite,variant:i});break;}
 case 'buff':{const s=m.self||{};u.buff=u.buff||{};for(const [k,v] of Object.entries(s)){if(k==='heal'){u.hp=Math.min(u.maxHp,u.hp+v);g.text('+'+v,u.x,u.y-130,'#a9ecc2');}else if(k==='meter')u.meter=Math.min(100,(u.meter||0)+v);else if(k==='invuln')u.invuln=Math.max(u.invuln||0,v);else u.buff[k]={v,t:m.dur||4};}g.fx.push({type:'glow',x:u.x,y:u.y,r:70,life:.6,max:.6,owner:u});break;}
 case 'sweep':{const tg=foes.length?foes:[{x:u.x+300,y:u.y}];for(let i=0;i<m.count;i++){const t=tg[i%tg.length];const fromLeft=i%2===0;g.sweeps.push({team:u.team,owner:u,m,y:t.y,x:g.view.left+(fromLeft?-200:g.view.width+200),vx:(fromLeft?1:-1)*(m.speed||1300),delay:i*(m.gap||.55),life:m.life||2.4,hit:new Set(),visual:m.visual});}break;}
 case 'rain':{const tg=foes.filter(t=>g.onScreen(t));const waves=m.waves||1;for(let w=0;w<waves;w++)for(const t of tg)g.rains.push({team:u.team,owner:u,m,target:t,x:t.x,y:t.y,h:520,delay:.15+w*.55+Math.random()*.3,dmg:m.dmg/waves,visual:m.visual});if(!tg.length)g.text('NESSUNO IN VISTA',u.x,u.y-120,'#ffcf8a');break;}
 case 'counter':u.counter={t:m.dur,m};g.fx.push({type:'glow',x:u.x,y:u.y,r:60,life:m.dur,max:m.dur,owner:u,color:'#99d6dd'});break;
 case 'teleport':{const t=foes.sort((a,b)=>g.dist(u,a)-g.dist(u,b))[0];if(t){const side=m.random?(Math.random()<.5?-1:1):(t.fx??t.dir??-1);g.fx.push({type:'ring',x:u.x,y:u.y,r:50,life:.3,max:.3,visual:'smoke'});u.x=t.x+side*-70;u.y=t.y;g.clampPos(u);u.dir=t.x>u.x?1:-1;if(u.fx!==undefined){const a=Math.atan2(t.y-u.y,t.x-u.x);u.fx=Math.cos(a);u.fy=Math.sin(a);}hit(g,u,t,m.dmg,m);}if(m.self?.invuln)u.invuln=Math.max(u.invuln||0,m.self.invuln);break;}
 case 'finisher':{g.fx.push({type:'flash',life:1.1,max:1.1,text:m.text,visual:m.visual});for(const t of foes.filter(x=>g.onScreen(x)))g.later(.5,()=>hit(g,u,t,t.boss||t.team==='p'?m.bossDmg:99999,{...m,unblockable:true,knock:300}));break;}
 case 'random':{let w=m.outcomes.reduce((a,o)=>a+o.w,0)*Math.random();const o=m.outcomes.find(o=>(w-=o.w)<0)||m.outcomes.at(-1);run(g,u,{...o.move},slot);break;}
 case 'fail':{if(m.selfDmg){u.hp=Math.max(1,u.hp-m.selfDmg);g.text('-'+m.selfDmg,u.x,u.y-110,'#f58270');}if(m.stun)applyStatus(u,{stun:m.stun});g.fx.push({type:'ring',x:u.x,y:u.y,r:40,life:.4,max:.4,visual:'smoke'});break;}
 case 'copy':{const last=u.lastPower&&u.lastPower.kind!=='copy'?u.lastPower:null;if(last){g.text('DI NUOVO: '+last.name.toUpperCase(),u.x,u.y-150,'#bfe7ff');run(g,u,{...last,dmg:(last.dmg||0)*m.mul,mulBoost:1},slot);}else run(g,u,m.fallback,slot);break;}
 case 'multi':for(const s of m.steps)run(g,u,s,slot);break;
 }}

// ------------------------------------------------------------ aggiornamento
function update(g,dt){
 for(const e of g.entities()){if(e.dead)continue;
  if(e.cds)for(const k in e.cds)e.cds[k]=Math.max(0,e.cds[k]-dt);
  if(e.st)for(const [k,v] of Object.entries(e.st)){if(typeof v==='number')e.st[k]=Math.max(0,v-dt);else{v.t=Math.max(0,v.t-dt);if(k==='bleed'&&v.t>0)g.hurt(e,v.dps*dt,null,{dot:true});}}
  if(e.buff)for(const [k,b] of Object.entries(e.buff)){b.t-=dt;if(b.t<=0){delete e.buff[k];continue;}if(k==='regen')e.hp=Math.min(e.maxHp,e.hp+b.v*dt);if(k==='burn')e.hp=Math.max(1,e.hp-b.v*dt);}
  if(e.counter){e.counter.t-=dt;if(e.counter.t<=0)e.counter=null;}
  if(e.armorT)e.armorT=Math.max(0,e.armorT-dt);
  e.cleanTime=(e.cleanTime||0)+dt;
  const p=e.kit?.passive;if(p){
   if(p.regen)e.hp=Math.min(e.maxHp,e.hp+p.regen*dt);
   if(p.meterRegen&&e.team==='p')e.meter=Math.min(100,(e.meter||0)+p.meterRegen*dt);
   if(p.calmRegen&&g.foes(e).every(t=>!t.windup&&!canAttack(t)||g.dist(e,t)>260))e.hp=Math.min(e.maxHp,e.hp+p.calmRegen*dt);
   if(p.smoke){e.smokeT=(e.smokeT||0)-dt;if(e.smokeT<=0){e.smokeT=p.smoke.pulse;for(const t of g.foes(e))if(g.dist(e,t)<p.smoke.radius)g.hurt(t,p.smoke.dmg,e,{dot:true});}}
   if(p.autoSummon&&!e.autoUsed&&e.hp>0&&e.hp<e.maxHp*p.autoSummon.below){e.autoUsed=true;g.text('LA SCIMMIA!',e.x,e.y-160,'#ffe08a');run(g,e,p.autoSummon.move,'auto');}
  }
  // carica
  const d=e.dash;if(d){d.t-=dt;let vy=d.vy;if(d.zig)vy+=Math.sin((d.max-d.t)*14)*260;e.x+=d.vx*dt;e.y+=vy*dt*(g.depth?1/1.6:1);g.clampPos(e);
   const prog=Math.min(1,Math.abs(e.x-d.ox)/((d.m.dist)||320));
   for(const t of g.foes(e)){if(g.dist(e,t)>75)continue;const last=d.hitT.get(t);if(last!==undefined&&(!d.m.rehit||d.max-d.t-last<d.m.rehit))continue;d.hitT.set(t,d.max-d.t);const dmg=d.m.dmgMax?d.m.dmg+(d.m.dmgMax-d.m.dmg)*prog:d.m.dmg;hit(g,e,t,dmg,d.m,{knock:d.m.knock??140});}
   if(d.t<=0)e.dash=null;}
 }
 for(const s of g.shots){if(s.delay>0){s.delay-=dt;if(s.delay<=0){s.x=s.owner.x+facing(s.owner).x*40;s.y=s.owner.y;}continue;}s.age+=dt;s.life-=dt;
  const tg=g.foes(s.owner).filter(t=>!s.hit.has(t));
  if(s.m.homing&&tg.length){const t=tg.sort((a,b)=>g.dist(s,a)-g.dist(s,b))[0];const sp=Math.hypot(s.vx,s.vy);let a=Math.atan2(s.vy,s.vx);const want=Math.atan2((t.y-s.y),(t.x-s.x));let da=((want-a+Math.PI*3)%(Math.PI*2))-Math.PI;a+=clamp(da,-4*dt,4*dt)*(s.m.curve?1.3:1);s.vx=Math.cos(a)*sp;s.vy=Math.sin(a)*sp;}
  if(s.m.boomerang&&!s.back&&s.age>.45){s.back=true;s.vx=-s.vx;s.vy=-s.vy;s.hit.clear();}
  s.x+=s.vx*dt;s.y+=s.vy*dt*(g.depth&&s.m.homing?.6:1);
  for(const t of tg){if(Math.abs(t.x-s.x)<40*s.size&&Math.abs(t.y-s.y)*(g.depth||1)<48*s.size&&!(t.z>70)){if(t.counter?.m.catchShots){s.life=0;g.text('PRESA!',t.x,t.y-140,'#bfe7ff');break;}s.hit.add(t);hit(g,s.owner,t,s.dmg,s.m);if(!s.m.pierce&&!s.m.boomerang){s.life=0;break;}}}
 }
 g.shots=g.shots.filter(s=>s.life>0&&g.inWorld(s));
 for(const a of g.auras){a.age+=dt;a.life-=dt;a.next-=dt;a.x=a.owner.x;a.y=a.owner.y;if(a.next<=0){a.next=a.m.pulse;const ramp=a.m.ramp?1+(a.m.ramp-1)*Math.min(1,a.age/a.m.dur):1;for(const t of g.foes(a.owner))if(g.dist(a,t)<a.radius&&(a.m.radius>600||g.onScreen(t)))hit(g,a.owner,t,a.m.dmg*ramp,{...a.m,knock:20});}}
 g.auras=g.auras.filter(a=>a.life>0&&!a.owner.dead);
 for(const s of g.summons){s.age+=dt;s.life-=dt;s.next-=dt;const tg=g.foes(s.owner);const t=tg.sort((a,b)=>g.dist(s,a)-g.dist(s,b))[0];if(t){const dx=t.x-s.x,dy=t.y-s.y,l=Math.hypot(dx,dy*(g.depth||1));s.dir=dx>0?1:-1;if(l>55){s.x+=dx/l*s.m.speed*dt;s.y+=dy/l*s.m.speed*dt*(g.depth?.6:1);s.moving=true;}else{s.moving=false;if(s.next<=0){s.next=s.m.pulse;const dmg=s.m.dmgRange?s.m.dmgRange[Math.floor(Math.random()*s.m.dmgRange.length)]/3:s.m.dmg;hit(g,s.owner,t,dmg*(s.owner.kit?.passive.summonMul||1),{...s.m,knock:60});s.bite=.18;}}}else{s.x+=((s.owner.x-s.dir*50)-s.x)*Math.min(1,dt*3);s.y+=(s.owner.y-s.y)*Math.min(1,dt*3);}s.bite=Math.max(0,(s.bite||0)-dt);g.clampPos(s);}
 g.summons=g.summons.filter(s=>s.life>0&&!s.owner.dead);
 for(const w of g.sweeps){if(w.delay>0){w.delay-=dt;continue;}w.life-=dt;w.x+=w.vx*dt;for(const t of g.foes(w.owner))if(!w.hit.has(t)&&Math.abs(t.x-w.x)<70&&Math.abs(t.y-w.y)*(g.depth||1)<60){w.hit.add(t);hit(g,w.owner,t,w.m.dmg,{...w.m,knock:Math.sign(w.vx)*500,unblockable:true});}}
 g.sweeps=g.sweeps.filter(w=>w.life>0);
 for(const r of g.rains){r.delay-=dt;if(r.delay<=0&&!r.done){r.done=true;r.x=r.target.x;r.y=r.target.y;if(!r.target.dead)hit(g,r.owner,r.target,r.dmg,{...r.m,knock:40,status:{stun:.5}});g.fx.push({type:'ring',x:r.x,y:r.y,r:45,life:.3,max:.3,visual:r.visual});}}
 g.rains=g.rains.filter(r=>!r.done);
 for(const f of g.fx)f.life-=dt;g.fx=g.fx.filter(f=>f.life>0);
}

// Intercetta i danni in arrivo: invulnerabilità, schivata, contrattacco, riflesso.
// Restituisce il danno effettivo (0 = annullato).
function incoming(g,t,src,amount,opts={}){if(opts.dot)return amount*(t.buff?.def?.v||1);
 if(t.invuln>0&&!(opts.power&&t.team==='e'))return 0;const p=t.kit?.passive||{};
 if(src&&p.backAware&&((src.x-t.x)*(t.dir||1)<0)){g.text('IL RADAR',t.x,t.y-130,'#bfe7ff');return 0;}
 const dodge=Math.max(p.dodge||0,t.buff?.dodge?.v||0);if(dodge&&Math.random()<dodge){g.text('SCHIVATA',t.x,t.y-130,'#bfe7ff');return 0;}
 if(t.counter&&src&&!src.dead){const c=t.counter.m;t.counter=null;let dmg=c.dmg;if(c.patience)dmg*=1+(t.patience||0);t.patience=0;if(c.meterGain)t.meter=Math.min(100,(t.meter||0)+c.meterGain);g.text('CONTRATTACCO!',t.x,t.y-150,'#99e4ff');g.fx.push({type:'ring',x:t.x,y:t.y,r:110,life:.35,max:.35,visual:'counter'});for(const f of g.foes(t))if(g.dist(t,f)<170)hit(g,t,f,dmg,{...c,unblockable:true,knock:260,status:{stun:.8}});return 0;}
 let m=1;if(t.buff?.def)m*=t.buff.def.v;if(p.def)m*=p.def;if(p.frontDef&&src&&(src.x-t.x)*(t.dir||1)>0)m*=p.frontDef;
 if(t.buff?.reflect&&src&&!src.dead&&!opts.reflected){g.hurt(src,amount*t.buff.reflect.v,t,{reflected:true,knock:120});}
 if(p.lastStand&&t.hp-amount*m<t.maxHp*p.lastStand&&!t.lastStandUsed){t.lastStandUsed=true;t.invuln=1.2;g.text('NON MOLLA!',t.x,t.y-140,'#ffe08a');}
 t.cleanTime=0;return amount*m;}
const armored=e=>(e.armorT>0)||e.buff?.armor?.t>0;

// ------------------------------------------------------------- disegno
function vehicle(c,kind,x,y,dir,top){if(kind==='poiana'&&root.ChurchPoiana){const T=performance.now()/1000,tv=typeof document!=='undefined'&&document.documentElement.dataset.view==='top';c.fillStyle='#0003';c.beginPath();c.ellipse(x,y+(tv?26:8),tv?34:70,tv?9:14,0,0,7);c.fill();root.ChurchPoiana.draw(c,x,y-(tv?10:38),tv?(Math.cos(top||0)>=0?1:-1):dir,tv?120:250,T,'super',12);return;}if(kind==='horse'&&root.ChurchHorse){const T=performance.now()/1000;if(typeof document!=='undefined'&&document.documentElement.dataset.view==='top')root.ChurchHorse.drawTop(c,x,y,top||0,1.05,T,true);else root.ChurchHorse.drawSide(c,x,y,dir,1,T,true);return;}c.save();c.translate(x,y);if(top){c.rotate(top);}else c.scale(dir,1);
 const col={bicycle:'#15191c',motorbike:'#7d2c2c','4x4':'#3e474a',peugeot:'#6f97ad',cart:'#9aa4a0',car:'#9d6353',r4:'#c8140c'}[kind]||'#9d6353';
 if(top){const L=kind==='bicycle'?34:kind==='motorbike'?42:kind==='cart'?40:70,W=kind==='bicycle'||kind==='motorbike'?12:kind==='cart'?28:36;c.fillStyle='#0006';c.fillRect(-L/2+4,-W/2+4,L,W);c.fillStyle=col;c.fillRect(-L/2,-W/2,L,W);if(W>20){c.fillStyle='#b5ccba';c.fillRect(L*.05,-W/2+4,L*.22,W-8);c.fillStyle='#f2d394';c.fillRect(L/2-4,-W/2+2,4,6);c.fillRect(L/2-4,W/2-8,4,6);}c.restore();return;}
 const wheel=(wx,r)=>{c.fillStyle='#142026';c.beginPath();c.arc(wx,-r,r,0,7);c.fill();c.fillStyle='#b8b9a6';c.beginPath();c.arc(wx,-r,r*.45,0,7);c.fill();};
 if(kind==='bicycle'){wheel(-34,22);wheel(36,22);c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.moveTo(-34,-22);c.lineTo(-6,-58);c.lineTo(14,-22);c.lineTo(-34,-22);c.moveTo(-6,-58);c.lineTo(26,-60);c.lineTo(36,-22);c.stroke();}
 else if(kind==='motorbike'){wheel(-44,24);wheel(48,24);c.fillStyle=col;c.fillRect(-40,-62,80,22);c.fillStyle='#222';c.fillRect(-10,-74,40,14);c.fillStyle='#f2d394';c.fillRect(44,-60,10,8);}
 else if(kind==='cart'){c.strokeStyle='#cfd6d0';c.lineWidth=4;for(let i=0;i<6;i++){c.beginPath();c.moveTo(-50+i*18,-80);c.lineTo(-44+i*16,-28);c.stroke();}c.strokeRect(-52,-82,96,54);wheel(-38,10);wheel(34,10);}
 else{const L=kind==='4x4'?150:130;wheel(-L*.3,20);wheel(L*.32,20);c.fillStyle=col;c.fillRect(-L/2,-74,L,40);c.fillRect(-L*.25,-106,L*.55,34);c.fillStyle='#b5ccba';c.fillRect(-L*.2,-100,L*.45,24);c.fillStyle='#f2d394';c.fillRect(L/2-6,-66,8,10);if(kind==='headlights'){c.globalAlpha=.25;c.fillStyle='#fff2b9';c.beginPath();c.moveTo(L/2,-62);c.lineTo(L/2+260,-140);c.lineTo(L/2+260,10);c.fill();}}
 c.restore();}
function glyph(c,v,x,y,s=1,t=0){c.save();c.translate(x,y);c.scale(s,s);
 switch(v){
 case 'ball':c.fillStyle='#f4f1e6';c.beginPath();c.arc(0,0,12,0,7);c.fill();c.fillStyle='#22282a';c.rotate(t*12);c.beginPath();c.arc(0,0,4.5,0,7);c.fill();for(let i=0;i<5;i++){const a=i*1.256;c.beginPath();c.arc(Math.cos(a)*10,Math.sin(a)*10,2.6,0,7);c.fill();}break;
 case 'wrench':c.rotate(t*16);c.fillStyle='#c6d0d4';c.fillRect(-14,-3,28,6);c.beginPath();c.arc(14,0,7,0,7);c.fill();c.fillStyle='#0000';c.clearRect?0:0;c.fillStyle='#384a50';c.fillRect(15,-2,6,4);break;
 case 'slipper':c.rotate(t*10);c.fillStyle='#d8986f';c.beginPath();c.ellipse(0,0,15,6,0,0,7);c.fill();c.fillStyle='#704943';c.fillRect(-4,-7,10,5);break;
 case 'stone':c.rotate(t*9);c.fillStyle='#353c40';c.beginPath();c.moveTo(-9,-3);c.lineTo(-4,-8);c.lineTo(5,-7);c.lineTo(9,0);c.lineTo(6,7);c.lineTo(-4,8);c.fill();c.fillStyle='#a5a7a0';c.beginPath();c.moveTo(-6,-2);c.lineTo(-3,-5);c.lineTo(4,-4);c.lineTo(6,0);c.lineTo(3,4);c.lineTo(-3,5);c.fill();break;
 case 'sandwich':c.fillStyle='#dab16c';c.beginPath();c.ellipse(0,0,15,8,0,0,7);c.fill();c.fillStyle='#69966b';c.fillRect(-14,0,28,3);break;
 case 'bottle':c.rotate(t*11);c.fillStyle='#3f7d4a';c.fillRect(-5,-12,10,20);c.fillRect(-2,-18,4,7);c.fillStyle='#e6d79a';c.fillRect(-5,-4,10,6);break;
 case 'tray':c.fillStyle='#c0c5ad';c.beginPath();c.ellipse(0,0,22,6,0,0,7);c.fill();c.fillStyle='#e5ddbb';c.fillRect(-14,-6,6,6);c.fillRect(4,-8,5,8);break;
 case 'card':c.rotate(t*6);c.fillStyle='#e6c776';c.fillRect(-10,-7,20,14);c.fillStyle='#8cb18b';c.fillRect(-7,-4,14,4);break;
 case 'music':c.fillStyle='#ffe16d';c.beginPath();c.ellipse(0,4,6,4,0,0,7);c.fill();c.fillRect(4,-14,3,18);c.fillRect(4,-14,10,3);break;
 case 'sound':c.strokeStyle='#99d6dd';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.arc(-8,0,8+i*7,-1,1);c.stroke();}break;
 default:c.fillStyle='#a5e4e1';c.beginPath();c.arc(0,0,10,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,0,4,0,7);c.fill();}
 c.restore();}
const VCOL={smoke:'#aabcb0',oil:'#d1a54e',fire:'#ef6859',sound:'#7fc6d4',music:'#ffe26b',flash:'#fff8d9',tentacle:'#916dac',glitch:'#9cf0a0',hearts:'#f08aa8',story:'#f1d09c',school:'#e7b778',africa:'#f1b665',camo:'#6f8a5a',counter:'#99e4ff',tools:'#c6d0d4',scissors:'#dfe6ea',stone:'#a5a7a0'};
// view: {top:false} per la vista laterale (y = piede, z = altezza), {top:true} per la vista dall'alto.
function draw(c,g,cam,r,view={}){const top=!!view.top,T=g.time||0;
 const P=(x,y,z=0)=>top?[x-cam.x,y-cam.y]:[x-cam.x,y-z];
 for(const a of g.auras){const [x,y]=P(a.x,a.y);const col=VCOL[a.visual]||'#7fc6d4';c.save();c.globalAlpha=.2;c.fillStyle=col;
  if(a.visual==='oil'&&!top){c.fillRect(0,y-30,view.width||1152,70);}else{for(let i=0;i<7;i++){const rr=Math.min(a.radius,top?a.radius:420);c.beginPath();c.ellipse(x+Math.sin(a.age*1.7+i)*rr*.55,y+(top?Math.cos(a.age*1.3+i)*rr*.55:-50+Math.cos(i+a.age)*28),36,top?36:22,0,0,7);c.fill();}}
  c.globalAlpha=.55;c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.ellipse(x,top?y:y,Math.min(a.radius,700),top?Math.min(a.radius,700):Math.min(a.radius,700)*.3,0,0,7);c.stroke();c.restore();
  if(a.visual==='music'||a.visual==='sound')for(let i=0;i<4;i++)glyph(c,a.visual,x+Math.cos(T*2+i*1.6)*80,y-(top?0:70)+Math.sin(T*2+i*1.6)*(top?80:25),1,T);
  if(a.visual==='fire')for(let i=0;i<9;i++){const fx=x+Math.cos(i*.7+T)*a.radius*.6,fy=y+(top?Math.sin(i*.7+T)*a.radius*.6:0);c.fillStyle=i%2?'#ef6859':'#1d1d1d';c.beginPath();c.moveTo(fx-8,fy);c.lineTo(fx,fy-28-((i*7+T*60)%18));c.lineTo(fx+8,fy);c.fill();}
 }
 for(const f of g.fx){const k=f.life/f.max,[x,y]=P(f.x||0,f.y||0,top?0:55);c.save();const col=VCOL[f.visual]||(f.color||'#ffdc82');
  if(f.type==='ring'){c.globalAlpha=k;c.strokeStyle=col;c.lineWidth=4;c.beginPath();c.ellipse(x,top?y:y+55,f.r*(1.1-k*.6),(top?f.r:f.r*.32)*(1.1-k*.6),0,0,7);c.stroke();if(f.visual==='flash'){c.globalAlpha=k*.35;c.fillStyle='#fff8d9';c.fillRect(0,0,view.width||1152,view.height||672);}}
  else if(f.type==='slash'){c.globalAlpha=k;c.strokeStyle=col;c.lineWidth=6;const ang=Math.atan2(f.fy,f.fx)+(f.back?Math.PI:0);if(f.visual==='tentacle'){for(let i=0;i<3;i++){c.strokeStyle='#5b3f73';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(ang)*f.r*.5,y+Math.sin(ang)*f.r*.5+(i-1)*30*(1-k),x+Math.cos(ang)*f.r,y+Math.sin(ang)*f.r+(i-1)*18);c.stroke();}}else if(f.visual==='flash'){c.globalAlpha=k*.5;c.fillStyle='#fff8d9';c.beginPath();c.moveTo(x,y);c.arc(x,y,f.r,ang-.45,ang+.45);c.fill();}else{c.beginPath();c.ellipse(x+Math.cos(ang)*f.r*.45,y+Math.sin(ang)*f.r*.45,f.r*.55,top?f.r*.4:f.r*.25,ang,-1.2,1.2);c.stroke();}}
  else if(f.type==='glow'){const o=f.owner;const [ox,oy]=P(o.x,o.y,top?0:60);c.globalAlpha=Math.min(1,k*2)*.35;c.fillStyle=f.color||'#fff2b0';c.beginPath();c.ellipse(ox,oy,f.r,top?f.r:f.r*1.3,0,0,7);c.fill();}
  else if(f.type==='flash'){c.globalAlpha=Math.min(.6,k);c.fillStyle=f.visual==='story'?'#3b2a1c':'#fff3c8';c.fillRect(0,0,view.width||1152,view.height||672);c.globalAlpha=1;c.font='bold 46px ui-monospace,monospace';c.textAlign='center';c.fillStyle=f.visual==='story'?'#f1d09c':'#2a2018';c.fillText(f.text||'',(view.width||1152)/2,(view.height||672)/2);
   if(f.visual==='crowd'&&r?.images){const ids=Object.keys(r.images).filter(k=>!/mural|animals|stage/.test(k));for(let i=0;i<14;i++){const id=ids[(i*7)%ids.length],img=r.images[id];if(!img)continue;const px=((i*97+(1-k)*900)%((view.width||1152)+200))-100;c.drawImage(img,(2+i%2)*img.width/4,0,img.width/4,img.height/4,px,(view.height||672)-230,170,170);}}}
  c.restore();}
 for(const s of g.summons){const [x,y]=P(s.x,s.y);drawSummon(c,r,s,x,y,top,T);}
 for(const s of g.shots){if(s.delay>0)continue;const [x,y]=P(s.x,s.y,s.z);if(!top){c.fillStyle='#0003';c.beginPath();c.ellipse(x,s.y,14*s.size,4,0,0,7);c.fill();}c.save();c.globalAlpha=.4;c.strokeStyle='#f6d396';c.lineWidth=4;c.beginPath();const sp=Math.hypot(s.vx,s.vy)||1;c.moveTo(x-s.vx/sp*30,y-s.vy/sp*30*(top?1:0));c.lineTo(x,y);c.stroke();c.restore();glyph(c,s.visual,x,y,s.size*(top?.9:1.2),s.age);}
 for(const w of g.sweeps){if(w.delay>0)continue;const [x,y]=P(w.x,w.y);vehicle(c,w.visual==='headlights'?'car':w.visual,x,y,Math.sign(w.vx),top?(w.vx>0?0:Math.PI):0);if(w.visual==='headlights'&&!top)vehicle(c,'headlights',x,y,Math.sign(w.vx));}
 for(const q of g.rains){const fall=Math.max(0,q.delay)*900;const [x,y]=P(q.target.x,q.target.y,top?0:60+fall);if(top){c.save();c.globalAlpha=.4;c.fillStyle='#000';c.beginPath();c.arc(x,y,10+fall*.02,0,7);c.fill();c.restore();glyph(c,q.visual,x-fall*.3,y-fall*.6,1.3,T);}else glyph(c,q.visual,x,y,1.5,T);}
}
function drawSummon(c,r,s,x,y,top,T){const img=r?.images;const bob=s.moving?Math.sin(T*18)*3:0;
 if(s.sprite==='sauron'||s.sprite==='threehead'){const atlas=s.sprite==='sauron'?img?.['animals-dogs']:img?.['animals-wild'];const row=s.sprite==='sauron'?2:3;if(atlas){c.save();c.translate(x,y+(top?14:0));c.scale(s.dir*(top?.8:1.25),top?.8:1.25);const fr=s.bite>0?3:1+Math.floor(T*8)%2;c.drawImage(atlas,fr*atlas.width/4,row*atlas.height/4,atlas.width/4,atlas.height/4,-48,-90,96,96);c.restore();}return;}
 if(s.sprite==='brother'&&img?.miguel){const a=img.miguel;c.save();c.translate(x,y);c.scale(s.dir*(top?.32:.78),top?.32:.78);c.globalAlpha=.92;const fr=s.bite>0?5:s.moving?2+Math.floor(T*8)%2:0;c.drawImage(a,fr%4*a.width/4,Math.floor(fr/4)*a.height/4,a.width/4,a.height/4,-95,-180,190,190);c.restore();return;}
 // scimmia
 c.save();c.translate(x,y+bob);if(!top)c.translate(0,-30);c.scale(s.dir,1);c.fillStyle='#755345';c.beginPath();c.ellipse(0,0,13,17,0,0,7);c.fill();c.fillStyle='#b18a65';c.beginPath();c.arc(4,-18,10,0,7);c.fill();c.fillStyle='#2a1d17';c.beginPath();c.arc(8,-20,2,0,7);c.fill();c.strokeStyle='#755345';c.lineWidth=4;c.beginPath();c.moveTo(-10,6);c.quadraticCurveTo(-26,0,-22,-16);c.stroke();if(s.bite>0){c.strokeStyle='#ffe08a';c.beginPath();c.moveTo(14,-6);c.lineTo(28,-10);c.stroke();}c.restore();}

root.ChurchPowers={P,kit,use,run,update,incoming,applyStatus,canMove,canAttack,speedMul,outMul,labelOf,armored,draw,vehicle,glyph,st};
if(typeof module!=='undefined')module.exports=root.ChurchPowers;
})(typeof window==='undefined'?globalThis:window);
