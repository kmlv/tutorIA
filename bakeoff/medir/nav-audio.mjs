import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es&t=90', {errores});
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const els = [...document.querySelectorAll('audio,video')].map(e=>({tag:e.tagName, src:(e.currentSrc||e.src||'').slice(-60), ct:e.currentTime, dur:e.duration, readyState:e.readyState, paused:e.paused}));
  return {els, ct: window.__tutoria.media.currentTime(), owns: window.__tutoria.media.ownsStage};
});
console.log(JSON.stringify(info,null,1));
// ahora esperar más por si el audio tarda en cargar
await page.waitForTimeout(4000);
console.log('tras 6.5s:', JSON.stringify(await page.evaluate(()=>({ct:window.__tutoria.media.currentTime(), reloj:document.querySelector('#reloj')?.textContent}))));
// probar seek manual a 90 y ver si todo queda coherente
await page.evaluate(()=>window.__tutoria.media.seek(90));
await page.waitForTimeout(1500);
const s = await page.evaluate(SNAP);
console.log('TRAS seek(90):', JSON.stringify({t:s.t, reloj:s.reloj, mostrar:s.estado.mostrar, cap:(s.caption||'').slice(0,70), eq:(s.eq||'').slice(0,60), cards:s.cards.map(c=>c.nombre+' '+c.precio+' '+c.stationsOn.join(','))}));
await browser.close();
