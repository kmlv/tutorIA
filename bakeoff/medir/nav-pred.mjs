import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(600);
await page.evaluate(()=>window.__tutoria.media.seek(84));
await page.waitForTimeout(400);
await page.click('#play');
// esperar a que aparezca la pregunta
try { await page.waitForSelector('.q', {timeout:20000}); } catch(e){ console.log('NO APARECIO .q'); }
await page.waitForTimeout(800);
let s = await page.evaluate(SNAP);
console.log('PREGUNTA VISIBLE:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, q:s.q, dock:s.dockEstado, cap:(s.caption||'').slice(0,60), eq:(s.eq||'').replace(/​/g,'').slice(0,50)},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/q-visible.png'});
// AHORA saltar hacia atras con la pregunta en pantalla
await page.evaluate(()=>window.__tutoria.media.seek(40));
await page.waitForTimeout(1500);
s = await page.evaluate(SNAP);
console.log('TRAS SEEK ATRAS A 40:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, q:s.q, dock:s.dockEstado, mostrar:s.estado.mostrar, cap:(s.caption||'').slice(0,60)},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/q-tras-seek40.png'});
// intentar reanudar
const hayQ = await page.$('.q');
console.log('¿sigue .q en el DOM?', !!hayQ);
if (hayQ) {
  const btns = await page.$$('.q-opciones button');
  console.log('opciones clicables:', btns.length);
}
await page.click('#play').catch(e=>console.log('no se pudo pulsar play', String(e).slice(0,120)));
await page.waitForTimeout(2500);
s = await page.evaluate(SNAP);
console.log('TRAS PULSAR PLAY:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, q:!!s.q, dock:s.dockEstado, cap:(s.caption||'').slice(0,60)}));
if(errores.length) console.log('ERRORES', errores);
await browser.close();
