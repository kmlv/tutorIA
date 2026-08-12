import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
// 1) banda con "(unchanged)"
await page.evaluate(()=>window.__tutoria.media.seek(160));
await page.waitForTimeout(900);
console.log('banda t=160 (ES):', JSON.stringify(await page.evaluate(()=>document.querySelector('.eq-slot')?.innerText.replace(/\s+/g,' '))));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/unchanged.png'});
// 2) seek fuera de rango
for (const t of [500, -20, 232.692, 233]) {
  await page.evaluate(t=>window.__tutoria.media.seek(t), t);
  await page.waitForTimeout(700);
  const s = await page.evaluate(SNAP);
  console.log(`seek(${t}) ->`, JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, dock:s.dockEstado, mostrar:Object.entries(s.estado.mostrar).filter(([,v])=>v).map(([k])=>k).join('+')||'nada'}));
}
console.log('practice tras seek(233):', JSON.stringify(await page.evaluate(()=>({running:window.__tutoria.practice.running, served:window.__tutoria.practice.served}))));
// 3) estrés: 40 seeks aleatorios + pausas
console.log('--- estrés 40 seeks ---');
for (let i=0;i<40;i++){
  const t = Math.round(Math.random()*232);
  await page.evaluate(t=>window.__tutoria.media.seek(t), t);
  if (i%3===0) await page.click('#play').catch(()=>{});
  await page.waitForTimeout(90);
}
await page.waitForTimeout(1500);
const s = await page.evaluate(SNAP);
console.log('tras estrés:', JSON.stringify({t:s.t, reloj:s.reloj, paused:s.paused, play:s.play, coh:(s.paused&&['Seguir','Empezar'].includes(s.play))||(!s.paused&&s.play==='Pausa'), lag:s.desfase, dock:s.dockEstado}));
console.log('ERRORES JS:', errores.length, JSON.stringify(errores.slice(0,5)));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/estres.png'});
await browser.close();
