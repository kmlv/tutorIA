import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(600);
await page.evaluate(()=>window.__tutoria.media.seek(84));
await page.waitForTimeout(400);
await page.click('#play');
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(600);
console.log('1) pregunta servida en t=', (await page.evaluate(()=>window.__tutoria.media.currentTime())).toFixed(2));
// saltar atras
await page.evaluate(()=>window.__tutoria.media.seek(80));
await page.waitForTimeout(1200);
let s = await page.evaluate(SNAP);
console.log('2) tras seek a 80:', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado}));
// reanudar y pasar de nuevo por 87
await page.click('#play');
await page.waitForTimeout(12000);
s = await page.evaluate(SNAP);
console.log('3) tras reproducir 12s (t≈92):', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,50):null, cap:(s.caption||'').slice(0,50)}));
await page.waitForTimeout(8000);
s = await page.evaluate(SNAP);
console.log('4) t≈100:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,50):null}));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/pred-repaso.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
