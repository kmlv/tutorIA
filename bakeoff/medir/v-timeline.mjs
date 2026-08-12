import {abrir} from './lib.mjs';
const {browser, page} = await abrir('http://localhost:57330/?lang=es&t=0');
await page.click('#play');
let prevBands = null, primero = null;
const eventos = [];
for (let i=0;i<600;i++){
  const m = await page.evaluate(() => {
    const svg = document.querySelector('.lienzo svg');
    const b = document.querySelector('.bands');
    // solo texto realmente visible (opacidad > 0 en la cadena)
    const vis = [...b.querySelectorAll('*')].filter(e=>{
      if (e.children.length) return false;
      const t = (e.textContent||'').trim(); if(!t) return false;
      let n=e, op=1; while(n && n!==document.body){ op *= parseFloat(getComputedStyle(n).opacity); n=n.parentElement; }
      return op > 0.05;
    }).map(e=>e.textContent.trim()).join(' ');
    return { t:+window.__tutoria.media.currentTime().toFixed(2),
             n: svg.querySelectorAll('g[class^="capa-"] *').length, vis };
  });
  if (m.n>0 && !primero){ primero = m.t; eventos.push(`${m.t}  >>> PRIMER TRAZO EN EL LIENZO (${m.n} nodos)`); }
  if (m.vis !== prevBands){ eventos.push(`${m.t}  fichas: "${m.vis}"`); prevBands = m.vis; }
  if (primero && m.t > primero + 1) break;
  await page.waitForTimeout(120);
}
eventos.forEach(e=>console.log(e));
await browser.close();
