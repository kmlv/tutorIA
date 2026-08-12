import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es', {errores});
await page.evaluate(()=>window.__tutoria.media.seek(230.5));
await page.waitForTimeout(400); await page.click('#play');
await page.waitForSelector('.q',{timeout:25000}); await page.waitForTimeout(1200);
await page.evaluate(()=>window.__tutoria.media.seek(121));
await page.waitForTimeout(1000);
await page.click('#play');
await page.waitForTimeout(6000);
const info = await page.evaluate(()=>{
  const qs = [...document.querySelectorAll('.q')].map(q=>({txt:q.querySelector('.q-enunciado')?.textContent.slice(0,55), rect:q.getBoundingClientRect().toJSON(), cls:q.className}));
  const db = document.querySelector('.dock-body');
  return {n:qs.length, qs, dockScroll:{h:db.scrollHeight, ch:db.clientHeight}, dockEstado:document.querySelector('.dock').dataset.estado};
});
console.log(JSON.stringify(info,null,1));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/dos-preguntas.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
