import {abrir} from './lib.mjs';
const {browser, page, errs} = await abrir('http://localhost:57330/?lang=es&t=0');
page.on('crash', ()=>console.log('  *** PAGE CRASH ***'));

const medir = () => page.evaluate(() => {
  const svg = document.querySelector('.lienzo svg');
  const n = svg ? svg.querySelectorAll('g[class^="capa-"] *').length : -1;
  const capas = {};
  svg && svg.querySelectorAll('g[class^="capa-"]').forEach(g=>{ capas[g.className.baseVal]=g.querySelectorAll('*').length; });
  return { t:+window.__tutoria.media.currentTime().toFixed(2), n, capas,
           cap:(document.querySelector('.captions-band')?.innerText||'').split('\n')[0].slice(0,80) };
});

await page.click('#play');
let primero = null;
for (let i=0;i<70;i++){
  let m;
  try { m = await medir(); } catch(e){ console.log('FALLO evaluate en iter',i,String(e).slice(0,120)); break; }
  if (m.n>0 && !primero) { primero = m; console.log('>>> PRIMER DIBUJO', JSON.stringify(m)); }
  if (i%3===0 || (m.n>0 && !primero)) console.log(`t=${m.t}  n=${m.n}  ${JSON.stringify(m.capas)}`);
  if (primero && m.t > primero.t + 3) break;
  await page.waitForTimeout(700).catch(()=>{});
}
console.log('PRIMER DIBUJO t=', primero? primero.t : 'ninguno');
console.log('errs', errs);
await browser.close().catch(()=>{});
