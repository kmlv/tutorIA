import {abrir} from './lib.mjs';
const {browser, page} = await abrir('http://localhost:57330/?lang=es&t=0');
const geo = () => page.evaluate(() => {
  const r = s => { const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect();
    return {top:Math.round(b.top),bottom:Math.round(b.bottom),h:Math.round(b.height),w:Math.round(b.width)}; };
  const L = document.querySelector('.lienzo');
  // pintura real dentro del lienzo
  const svg = L.querySelector('svg');
  const bandas = document.querySelector('.bands');
  const fichas = [...document.querySelectorAll('.bands *')].filter(e=>e.children.length===0 && e.innerText?.trim());
  return {
    bands: r('.bands'), lienzo: r('.lienzo'), captions: r('.captions-band'), escenario: r('.escenario'),
    svgNodos: svg.querySelectorAll('g[class^="capa-"] *').length,
    bandsTxt: bandas ? bandas.innerText.replace(/\n+/g,' | ') : null,
    // colores de fondo
    bgLienzo: getComputedStyle(L).backgroundColor,
    bgEsc: getComputedStyle(document.querySelector('.escenario')).backgroundColor
  };
});
console.log('ANTES:', JSON.stringify(await geo(), null, 1));
await page.screenshot({path:'v-t0-antes.png'});
await page.click('#play');
for (const objetivo of [20, 43]) {
  await page.waitForFunction(t => window.__tutoria.media.currentTime() >= t, objetivo, {timeout:60000});
  await page.screenshot({path:`v-t${objetivo}.png`});
  const g = await geo();
  console.log(`t=${objetivo}  svgNodos=${g.svgNodos}  lienzo=${JSON.stringify(g.lienzo)}  bands=${JSON.stringify(g.bands)}`);
  console.log(`   bandsTxt="${g.bandsTxt}"`);
}
await page.waitForFunction('window.__tutoria.media.currentTime() >= 47', null, {timeout:60000});
await page.screenshot({path:'v-t47.png'});
console.log('t=47 svgNodos=', (await geo()).svgNodos);
await browser.close();
