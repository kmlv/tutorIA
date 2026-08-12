import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(800);
const puntos = [10, 44, 70, 90, 110, 130, 150, 160, 178, 180, 200, 210, 232];
for (const t of puntos) {
  await page.evaluate(t=>window.__tutoria.media.seek(t), t);
  await page.waitForTimeout(600);
  const s = await page.evaluate(SNAP);
  console.log(`t=${t}`.padEnd(7), JSON.stringify({reloj:s.reloj, p1:s.estado.p1, m:s.estado.m, destacar:s.estado.destacar, enfasis:s.estado.enfasis, fant:!!s.estado.fantasma,
    compact:s.ledgerCompact, cards:s.cards.map(c=>c.precio), eq:(s.eq||'').replace(/​/g,'').slice(0,60), cap:(s.caption||'').slice(0,50), q: s.q? s.q.enunciado.slice(0,40):null}));
}
if(errores.length) console.log('ERRORES', errores);
await browser.close();
