import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
for (const u of ['http://localhost:57330/?lang=es&variant=B&t=90','http://localhost:57330/?lang=es&variant=B']) {
  try {
    const {browser,page} = await abrir(u, {errores});
    await page.waitForTimeout(1500);
    const s = await page.evaluate(SNAP);
    console.log(u, '->', JSON.stringify({t:s.t, reloj:s.reloj, owns: await page.evaluate(()=>window.__tutoria.media.ownsStage), play:s.play, cap:(s.caption||'').slice(0,50), mostrar:Object.entries(s.estado.mostrar).filter(([,v])=>v).map(([k])=>k).join('+')||'nada'}));
    await browser.close();
  } catch(e){ console.log(u,'FALLO', String(e).slice(0,200)); }
}
if(errores.length) console.log('ERRORES', errores);
