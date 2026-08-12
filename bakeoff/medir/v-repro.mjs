import {abrir} from './lib.mjs';
const {browser, page, errs} = await abrir('http://localhost:57330/?lang=es&t=0');

const medir = () => page.evaluate(() => {
  const L = document.querySelector('.lienzo');
  const svg = L.querySelector('svg');
  const dibujables = [...svg.querySelectorAll('path,line,circle,rect,polygon,polyline,text,ellipse')]
    .filter(el => !el.closest('defs'));
  const visibles = dibujables.filter(el => {
    const cs = getComputedStyle(el);
    if (cs.display==='none' || cs.visibility==='hidden' || parseFloat(cs.opacity)===0) return false;
    const b = el.getBBox ? el.getBBox() : null;
    return true;
  });
  const capas = {};
  svg.querySelectorAll('g[class^="capa-"]').forEach(g=>{
    capas[g.getAttribute('class')] = g.querySelectorAll('*').length;
  });
  return {
    t: +window.__tutoria.media.currentTime().toFixed(2),
    paused: window.__tutoria.media.paused(),
    nDibujables: dibujables.length,
    nVisibles: visibles.length,
    capas,
    tipos: [...new Set(dibujables.map(e=>e.tagName))].join(','),
    caption: (document.querySelector('.captions-band')?.innerText||'').replace(/\n+/g,' ').slice(0,90)
  };
});

console.log('ANTES DE PULSAR:', JSON.stringify(await medir()));
await page.screenshot({path:'v-01-antes.png'});
await page.click('#play');
const t0 = Date.now();
const filas = [];
while (Date.now()-t0 < 62000) {
  const m = await medir();
  filas.push(m);
  console.log(`t=${String(m.t).padStart(6)}  dibujables=${m.nDibujables}  visibles=${m.nVisibles}  capas=${JSON.stringify(m.capas)}  cap="${m.caption}"`);
  if (m.nDibujables > 0 && filas.filter(f=>f.nDibujables>0).length >= 4) break;
  await page.waitForTimeout(900);
}
const primero = filas.find(f=>f.nDibujables>0);
console.log('\nPRIMER DIBUJO en t =', primero ? primero.t : 'NUNCA en 62s');
await page.screenshot({path:'v-02-primerdibujo.png'});
console.log('JS ERRORS:', errs.length);
await browser.close();
