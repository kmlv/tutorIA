import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(600);
await page.evaluate(()=>window.__tutoria.media.seek(230.5));
await page.waitForTimeout(400);
await page.click('#play');
await page.waitForTimeout(5000);
let s = await page.evaluate(SNAP);
console.log('A) tras terminar la narración:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, dock:s.dockEstado, q:s.q, running:undefined}));
try { await page.waitForSelector('.q', {timeout:25000}); } catch(e){ console.log('  no apareció .q de práctica'); }
await page.waitForTimeout(1500);
s = await page.evaluate(SNAP);
console.log('B) práctica:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, dock:s.dockEstado, q:s.q},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/practica1.png'});
// SALTAR ATRAS DURANTE LA PRACTICA
await page.evaluate(()=>window.__tutoria.media.seek(120));
await page.waitForTimeout(2000);
s = await page.evaluate(SNAP);
console.log('C) tras seek(120) durante la práctica:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, dock:s.dockEstado, dockActual:s.dockActual, q:s.q?s.q.enunciado.slice(0,60):null, mostrar:Object.entries(s.estado.mostrar).filter(([,v])=>v).map(([k])=>k).join('+'), cap:(s.caption||'').slice(0,50)},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/practica-seek120.png'});
const prState = await page.evaluate(()=>({running:window.__tutoria.practice.running, served:window.__tutoria.practice.served, flow:!!window.__tutoria.practice.flow}));
console.log('   practice:', JSON.stringify(prState));
// reanudar
await page.click('#play');
await page.waitForTimeout(4000);
s = await page.evaluate(SNAP);
console.log('D) tras reanudar:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, q:s.q?s.q.enunciado.slice(0,60):null, cap:(s.caption||'').slice(0,50)}));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/practica-reanudar.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
