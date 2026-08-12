import {abrir} from './lib.mjs';
const {browser, page} = await abrir('http://localhost:57330/?lang=es&t=0');
await page.click('#play');
let prev=null, primero=null;
for (let i=0;i<600;i++){
  const m = await page.evaluate(() => {
    const svg = document.querySelector('.lienzo svg');
    const b = document.querySelector('.bands');
    const visibles = [...b.querySelectorAll('*')].filter(e=>{
      let n=e, op=1; while(n && n!==document.body){ op*=parseFloat(getComputedStyle(n).opacity); n=n.parentElement; }
      if (op<=0.05) return false;
      return e.children.length===0 || e.tagName==='svg' || e.tagName==='SVG';
    });
    return { t:+window.__tutoria.media.currentTime().toFixed(2),
             n: svg.querySelectorAll('g[class^="capa-"] *').length,
             k: visibles.length,
             firma: visibles.map(e=>e.tagName+':'+(e.textContent||'').trim().slice(0,12)).join('|') };
  });
  if (m.n>0 && !primero){ primero=m.t; console.log(`${m.t}  >>> PRIMER TRAZO EN EL LIENZO`); }
  if (m.firma!==prev){ console.log(`${String(m.t).padEnd(6)} elementos visibles en fichas = ${m.k}`); prev=m.firma; }
  if (primero && m.t>primero+0.5) break;
  await page.waitForTimeout(120);
}
await browser.close();
