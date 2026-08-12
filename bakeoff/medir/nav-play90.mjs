import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es&t=90', {errores});
await page.waitForTimeout(1200);
const s0 = await page.evaluate(SNAP);
console.log('ANTES DE PLAY:', JSON.stringify({t:s0.t, reloj:s0.reloj, play:s0.play, mostrar:s0.estado.mostrar, cap:(s0.caption||'').slice(0,70), eq:(s0.eq||'').slice(0,50)}));
await page.click('#play');
for (const ms of [300, 1000, 2000, 4000]) {
  await page.waitForTimeout(ms);
  const s = await page.evaluate(SNAP);
  console.log(`+${ms}ms acumulado:`, JSON.stringify({t:s.t, reloj:s.reloj, play:s.play, paused:s.paused, mostrar:s.estado.mostrar, cap:(s.caption||'').slice(0,70), eq:(s.eq||'').slice(0,50), cards:s.cards.map(c=>c.stationsOn.length)}));
}
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/t90-play.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
