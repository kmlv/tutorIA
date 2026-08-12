import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(600);
await page.evaluate(()=>window.__tutoria.media.seek(60));
await page.waitForTimeout(400);
console.log('--- 20 pulsaciones rápidas de #play (120ms) ---');
for (let i=0;i<20;i++){ await page.click('#play'); await page.waitForTimeout(120); }
await page.waitForTimeout(1000);
let s = await page.evaluate(SNAP);
console.log('estado tras 20 clics:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, coherente: (s.paused && s.play==='Seguir')||(!s.paused && s.play==='Pausa')}));
console.log('--- 30 pulsaciones muy rápidas (20ms) ---');
for (let i=0;i<30;i++){ await page.click('#play'); await page.waitForTimeout(20); }
await page.waitForTimeout(1200);
s = await page.evaluate(SNAP);
console.log('estado:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, coherente: (s.paused && s.play==='Seguir')||(!s.paused && s.play==='Pausa')}));
// dejarlo reproduciendo y comprobar que avanza
const antes = s.t;
await page.waitForTimeout(3000);
s = await page.evaluate(SNAP);
console.log('3s después:', JSON.stringify({t:s.t, avanzo:+(s.t-antes).toFixed(2), paused:s.paused, play:s.play, reloj:s.reloj}));
// pausar/reanudar alternando con seeks
console.log('--- pausa+seek intercalados ---');
for (const t of [100, 30, 150, 20, 200, 5]) {
  await page.click('#play'); await page.waitForTimeout(200);
  await page.evaluate(t=>window.__tutoria.media.seek(t), t);
  await page.waitForTimeout(400);
  const x = await page.evaluate(SNAP);
  console.log(` seek->${t}`.padEnd(12), JSON.stringify({t:x.t, reloj:x.reloj, paused:x.paused, play:x.play, coh:(x.paused&&x.play==='Seguir')||(!x.paused&&x.play==='Pausa'), mostrar:Object.entries(x.estado.mostrar).filter(([,v])=>v).map(([k])=>k).join('+')||'nada', cards:x.cards.map(c=>c.precio).join('/'), eq:(x.eq||'').replace(/​/g,'').slice(0,40)}));
}
if(errores.length) console.log('ERRORES', errores);
await browser.close();
