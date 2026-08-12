import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
// checkpoint cp1 en 144.761
await page.evaluate(()=>window.__tutoria.media.seek(142));
await page.waitForTimeout(400); await page.click('#play');
await page.waitForSelector('.q',{timeout:20000}); await page.waitForTimeout(1000);
let s = await page.evaluate(SNAP);
console.log('cp1:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, q:s.q, cap:(s.caption||'').slice(0,90)},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/cp1.png'});
// saltar atras durante el checkpoint
await page.evaluate(()=>window.__tutoria.media.seek(100));
await page.waitForTimeout(1200);
s = await page.evaluate(SNAP);
console.log('tras seek(100):', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,50):null, mostrar:Object.entries(s.estado.mostrar).filter(([,v])=>v).map(([k])=>k).join('+')}));
// volver adelante: ¿se vuelve a servir el checkpoint?
await page.click('#play');
await page.waitForTimeout(1000);
await page.evaluate(()=>window.__tutoria.media.seek(143));
await page.waitForTimeout(500);
if (await page.evaluate(()=>window.__tutoria.media.paused())) await page.click('#play');
await page.waitForTimeout(6000);
s = await page.evaluate(SNAP);
console.log('¿reaparece cp1?:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,60):null}));
if(errores.length) console.log('ERRORES', errores);
await browser.close();
