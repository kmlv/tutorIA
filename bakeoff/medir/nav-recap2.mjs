import {abrir, SNAP} from './nav-lib.mjs';
const errores=[];
const {browser,page} = await abrir('http://localhost:57330/?lang=es&t=215', {errores});
await page.waitForTimeout(1500);
const s = await page.evaluate(SNAP);
console.log(JSON.stringify({t:s.t, reloj:s.reloj, cards:s.cards.map(c=>c.nombre+' '+c.precio), p1:s.estado.p1, m:s.estado.m,
  banda: null, cap:(s.caption||'').slice(0,80)},null,1));
console.log('BANDA:', JSON.stringify(await page.evaluate(()=>document.querySelector('.eq-slot')?.innerText.replace(/\s+/g,' '))));
console.log('intercepto x1 dibujado:', await page.evaluate(()=>[...document.querySelectorAll('.lienzo text, svg text')].map(t=>t.textContent).join(' | ')));
await page.screenshot({path:'/private/tmp/claude-502/-Users-klopezva-GithubRepos-tutorIA/1050f3d7-49f3-4d77-9e6b-99bd05c2d5ac/scratchpad/recap215.png'});
if(errores.length) console.log('ERRORES', errores);
await browser.close();
