import {abrir} from './lib.mjs';
for (const t of [0,3,10,25,35,44,46,60]) {
  const {browser, page} = await abrir(`http://localhost:57330/?lang=es&t=${t}`);
  const d = await page.evaluate(() => {
    const svg = document.querySelector('.lienzo svg');
    const capas = {};
    svg.querySelectorAll('g[class^="capa-"]').forEach(g=>{ capas[g.className.baseVal]=g.querySelectorAll('*').length; });
    return { t:+window.__tutoria.media.currentTime().toFixed(2),
             estado: window.__tutoria.estado(),
             n: svg.querySelectorAll('g[class^="capa-"] *').length,
             capas };
  });
  console.log(`t=${String(d.t).padEnd(6)} n=${String(d.n).padEnd(3)} etapa=${JSON.stringify(d.estado).slice(0,220)}`);
  await browser.close();
}
