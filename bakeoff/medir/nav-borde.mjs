import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
for (const t0 of [87.045, 86.9, 87.5]) {
  const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
  await page.evaluate(t=>window.__tutoria.media.seek(t), t0);
  await page.waitForTimeout(800);
  await page.click('#play');
  await page.waitForTimeout(7000);
  const s = await page.evaluate(SNAP);
  console.log(`seek(${t0}) + play 7s ->`, JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,45):null}));
  await browser.close();
}
if(errores.length) console.log('ERRORES', errores);
