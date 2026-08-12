import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.evaluate(()=>window.__tutoria.media.seek(230.5));
await page.waitForTimeout(400); await page.click('#play');
await page.waitForSelector('.q',{timeout:25000}); await page.waitForTimeout(1200);
console.log('práctica servida:', await page.evaluate(()=>document.querySelector('.q-enunciado')?.textContent));
// el alumno retrocede a repasar
await page.evaluate(()=>window.__tutoria.media.seek(150));
await page.waitForTimeout(1200);
console.log('tras retroceder a 150: dock =', await page.evaluate(()=>document.querySelector('.dock').dataset.estado));
// escucha el resto y vuelve al final
await page.evaluate(()=>window.__tutoria.media.seek(231.5));
await page.waitForTimeout(600);
if (await page.evaluate(()=>window.__tutoria.media.paused())) await page.click('#play');
await page.waitForTimeout(6000);
let s = await page.evaluate(SNAP);
console.log('FIN:', JSON.stringify({t:s.t, dur:s.dur, paused:s.paused, play:s.play, dock:s.dockEstado}));
// ¿qué hay clicable en pantalla?
const acciones = await page.evaluate(()=>{
  const vis = (e)=>{const r=e.getBoundingClientRect(); const st=getComputedStyle(e); return r.width>0&&r.height>0&&st.visibility!=='hidden'&&st.opacity!=='0'&&r.left<1280&&r.right>0;};
  return [...document.querySelectorAll('button,a,input,textarea,summary')].filter(vis).map(e=>e.tagName+':'+(e.id||e.className)+' “'+e.textContent.trim().slice(0,30)+'”');
});
console.log('ACCIONES VISIBLES:', JSON.stringify(acciones,null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/callejon.png'});
// pulsar Seguir
await page.click('#play'); await page.waitForTimeout(2500);
s = await page.evaluate(SNAP);
console.log('tras pulsar Seguir:', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado}));
await page.click('#play'); await page.waitForTimeout(2500);
s = await page.evaluate(SNAP);
console.log('tras pulsar otra vez:', JSON.stringify({t:s.t, paused:s.paused, play:s.play, dock:s.dockEstado}));
console.log('practice:', JSON.stringify(await page.evaluate(()=>({served:window.__tutoria.practice.served, running:window.__tutoria.practice.running}))));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/callejon2.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
