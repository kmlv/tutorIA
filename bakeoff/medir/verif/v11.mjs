import {abrir} from './_lib.mjs';
import {dragTo} from './drv.mjs';
const {browser, page} = await abrir();
await page.evaluate(() => {
  window.__log=[];
  addEventListener('scroll', ()=>window.__log.push({t:Math.round(performance.now()), y:Math.round(scrollY),
    ae: document.activeElement?.tagName+'.'+(document.activeElement?.className?.baseVal ?? document.activeElement?.className)}), true);
  addEventListener('focusin', e=>window.__log.push({t:Math.round(performance.now()), foco:e.target.tagName+'.'+(e.target.className?.baseVal ?? e.target.className)}), true);
});
await page.evaluate(() => { window.__tutoria.media.seek(window.__tutoria.media.duration()-1.2); window.__tutoria.media.play(); });
await page.waitForTimeout(4000);
await page.getByRole('button', {name:'Se desplaza hacia afuera, paralela'}).click();
await page.waitForTimeout(3000);
await dragTo(page,1,62,56.625);
await dragTo(page,0,502.6,396);
await page.locator('.q-manip button.primario').last().click();
await page.waitForTimeout(3500);
await page.locator('.q-numeric .q-input').last().fill('150');
await page.locator('.q-numeric button[type=submit]').last().click();
await page.waitForTimeout(3500);
await page.evaluate(()=>{window.__log=[]; window.__t0=performance.now();});
await page.getByRole('button', {name:'Pivota: el intercepto del jugo no se mueve y la recta se empina'}).click();
await page.waitForTimeout(5000);
console.log('LOG:', JSON.stringify(await page.evaluate(()=>window.__log.map(e=>({...e,t:Math.round(e.t-window.__t0)}))),null,0));
const fin = await page.evaluate(()=>{
  const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{top:Math.round(b.top),bottom:Math.round(b.bottom)}};
  const qs=[...document.querySelectorAll('.q')];
  const db=document.querySelector('.dock-body');
  return {scrollY:Math.round(scrollY), docH:document.documentElement.scrollHeight, innerH:innerHeight,
    ultimaQ:r(qs.at(-1)), listo:r(document.querySelector('.q-manip button.primario')),
    play:r(document.getElementById('play')), lienzo:r(document.querySelector('.lienzo')),
    svg:r(document.querySelector('.lienzo svg')),
    dockBody:{sT:db.scrollTop, sH:db.scrollHeight, cH:db.clientHeight},
    ae: document.activeElement?.tagName+'.'+(document.activeElement?.className?.baseVal??document.activeElement?.className)};
});
console.log('FIN:', JSON.stringify(fin,null,1));
await browser.close();
