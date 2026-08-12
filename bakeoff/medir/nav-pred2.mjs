import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.waitForTimeout(600);
await page.evaluate(()=>window.__tutoria.media.seek(84));
await page.waitForTimeout(400);
await page.click('#play');
await page.waitForSelector('.q', {timeout:20000});
await page.waitForTimeout(800);
const donde = await page.evaluate(()=>{
  const q = document.querySelector('.q');
  const path = []; let e=q; while(e && e!==document.body){ path.push(e.tagName.toLowerCase()+(e.className?'.'+String(e.className).split(' ').join('.'):'')); e=e.parentElement; }
  return {path, rect:q.getBoundingClientRect().toJSON(), vis:getComputedStyle(q).visibility, disp:getComputedStyle(q).display, op:getComputedStyle(q).opacity};
});
console.log('DONDE VIVE .q (con pregunta activa):', JSON.stringify(donde));
await page.evaluate(()=>window.__tutoria.media.seek(40));
await page.waitForTimeout(1500);
const donde2 = await page.evaluate(()=>{
  const q = document.querySelector('.q');
  if(!q) return null;
  const dk = document.querySelector('.dock');
  return {rect:q.getBoundingClientRect().toJSON(), vis:getComputedStyle(q).visibility, disp:getComputedStyle(q).display, op:getComputedStyle(q).opacity,
    dockRect: dk.getBoundingClientRect().toJSON(), dockOp:getComputedStyle(dk).opacity, dockVis:getComputedStyle(dk).visibility, dockDisp:getComputedStyle(dk).display, dockEstado:dk.dataset.estado};
});
console.log('TRAS SEEK 40:', JSON.stringify(donde2));
const visible = await page.isVisible('.q');
console.log('playwright isVisible(.q):', visible);
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/q40.png'});
// intentar responder la pregunta huérfana
try {
  await page.click('.q-opciones button', {timeout:3000});
  console.log('CLIC en opción: aceptado');
} catch(e){ console.log('CLIC en opción falló:', String(e).slice(0,150)); }
await page.waitForTimeout(2500);
const s = await page.evaluate(SNAP);
console.log('TRAS CLIC:', JSON.stringify({t:s.t, paused:s.paused, dock:s.dockEstado, dockActual:s.dockActual, q:s.q, dockBody:(s.dockBody||'').slice(0,200)},null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/q40-clic.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
