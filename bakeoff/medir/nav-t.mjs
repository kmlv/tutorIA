import {abrir, SNAP} from './nav-lib.mjs';
const vals = ['0','1','44','90','232','500','-5'];
for (const v of vals) {
  const errores = [];
  console.log('\n===== ?t=' + v + ' =====');
  let r;
  try { r = await abrir(`http://localhost:57330/?lang=es&t=${encodeURIComponent(v)}`, {errores}); }
  catch(e){ console.log('  FALLO AL CARGAR:', String(e).slice(0,300)); continue; }
  const {browser, page} = r;
  await page.waitForTimeout(1200);
  const s = await page.evaluate(SNAP);
  console.log(JSON.stringify({t:s.t, reloj:s.reloj, play:s.play, paused:s.paused, dur:s.dur,
    caption:(s.caption||'').slice(0,90), mostrar:s.estado.mostrar, destacar:s.estado.destacar,
    p1:s.estado.p1, m:s.estado.m, compact:s.ledgerCompact,
    cards:s.cards.map(c=>c.nombre+' '+c.precio+' ['+c.stationsOn.join(',')+']'),
    eq:(s.eq||'').slice(0,80), q:s.q, dock:s.dockEstado, url:s.url}, null, 1));
  if (errores.length) console.log('  ERRORES:', errores);
  await browser.close();
}
