/* The Church — soprannomi: nel gioco compaiono solo nickname, mai cognomi.
 * Si applica a qualsiasi roster.js (anche quello completo del pacchetto Windows). */
(function(){'use strict';
const P=(window.CHURCH_DATA&&window.CHURCH_DATA.personaggi&&window.CHURCH_DATA.personaggi.personaggi)||[];
const N={
 ceravolo:{nome:'Benigno',soprannome:'il padrone di Sauron'},
 petrone:{nome:'Smartone',soprannome:'il picchiatore'},
 '4mani':{nome:'Spazzola',soprannome:'il parrucchiere'},
 max4mani:{nome:'Max Bianchino',soprannome:'il fratello di Spazzola'},
 loste:{nome:'Lo Ste',soprannome:'il prof di chimica'}
};
const swap=t=>typeof t==='string'?t.replace(/Giovanni Petrone|Petrone/g,'Smartone').replace(/Ceravolo/g,'Benigno').replace(/Lo Ste Vettese/g,'Lo Ste').replace(/\bMax 4mani\b/g,'Max Bianchino').replace(/\b4mani\b/g,'Spazzola'):t;
for(const p of P){const n=N[p.id];if(n)Object.assign(p,n);p.descrizione=swap(p.descrizione);p.vittoria=swap(p.vittoria);}
window.ChurchNames={swap};
})();
